use rusqlite::{Connection, Result};
use super::versions;

/// Get the current schema version from the database
fn get_schema_version(conn: &Connection) -> Result<i32> {
    // Create schema_version table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY
        )",
        [],
    )?;

    // Try to get the current version
    let version: Result<i32> = conn.query_row(
        "SELECT version FROM schema_version LIMIT 1",
        [],
        |row| row.get(0),
    );

    match version {
        Ok(v) => Ok(v),
        Err(_) => {
            // No version exists, need to detect if this is a new or existing database
            let existing_version = detect_existing_schema_version(conn)?;
            conn.execute("INSERT INTO schema_version (version) VALUES (?1)", [existing_version])?;
            Ok(existing_version)
        }
    }
}

/// Detect the schema version of an existing database that doesn't have schema_version table
/// This only needs to detect versions that existed BEFORE we added schema_version tracking
fn detect_existing_schema_version(conn: &Connection) -> Result<i32> {
    // Check if database has any tables at all (excluding sqlite internal tables)
    let table_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        [],
        |row| row.get(0),
    )?;

    // If no tables exist, this is a brand new database
    if table_count == 0 {
        return Ok(0);
    }

    // Check for v2 specific features
    // We check v2 first since it's the most recent pre-versioned schema
    
    // Check if echo_builds has the new schema (primary_set_key instead of set_bonus)
    let has_primary_set_key: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('echo_builds') WHERE name='primary_set_key'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    // Check if character_talents has minor/major trace columns
    let has_basic_minor_1: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('character_talents') WHERE name='basic_minor_1'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    // Check if new tables exist
    let has_pull_history: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='pull_history'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    let has_matrix_teams: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='matrix_teams'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    // If has v2 features, it's v2
    if has_primary_set_key && has_basic_minor_1 && has_pull_history && has_matrix_teams {
        return Ok(2);
    }

    // Check for v1 specific features (the original schema)
    let has_echo_builds: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='echo_builds'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    let has_set_bonus: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('echo_builds') WHERE name='set_bonus'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    let has_characters: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='characters'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    // If has v1 tables with old schema, it's v1
    if has_echo_builds && has_set_bonus && has_characters {
        return Ok(1);
    }

    // If we have tables but can't identify the version, log a warning and default to 0
    // This forces a full migration which is safer than assuming a version
    eprintln!("Warning: Could not detect schema version of existing database. Defaulting to version 0.");
    Ok(0)
}

/// Update the schema version
fn set_schema_version(conn: &Connection, version: i32) -> Result<()> {
    conn.execute(
        "UPDATE schema_version SET version = ?1",
        [version],
    )?;
    Ok(())
}

/// Run all migrations from current version to latest
pub fn run_migrations(conn: &Connection) -> Result<()> {
    let current_version = get_schema_version(conn)?;
    const LATEST_VERSION: i32 = 2; // Update this when you add new migrations

    if current_version >= LATEST_VERSION {
        return Ok(());
    }

    // Run migrations in order
    // Each migration is ONLY responsible for changes from version N to N+1
    for version in (current_version + 1)..=LATEST_VERSION {
        match version {
            1 => versions::v1::migrate_to_v1(conn)?,
            2 => versions::v2::migrate_to_v2(conn)?,
            // Add new migrations here:
            // 3 => migrate_to_v3(conn)?,
            // 4 => migrate_to_v4(conn)?,
            _ => {
                return Err(rusqlite::Error::InvalidParameterName(
                    format!("Unknown migration version: {}", version)
                ));
            }
        }
        set_schema_version(conn, version)?;
    }

    Ok(())
}



/* 
 * TEMPLATE FOR FUTURE MIGRATIONS
 * 
 * When you need to add v3, copy this template:
 * 
 * /// Migration v2 -> v3: [Brief description of what this migration does]
 * fn migrate_to_v3(conn: &Connection) -> Result<()> {
 *     // 1. Add new columns to existing tables
 *     let add_column_if_not_exists = |table: &str, column: &str, definition: &str| -> Result<()> {
 *         let exists: bool = conn.query_row(
 *             &format!("SELECT COUNT(*) > 0 FROM pragma_table_info('{}') WHERE name=?1", table),
 *             [column],
 *             |row| row.get(0),
 *         ).unwrap_or(false);
 *         
 *         if !exists {
 *             conn.execute(
 *                 &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, definition),
 *                 [],
 *             )?;
 *         }
 *         Ok(())
 *     };
 *     
 *     add_column_if_not_exists("table_name", "new_column", "INTEGER DEFAULT 0")?;
 *     
 *     // 2. Create new tables
 *     let has_new_table: bool = conn.query_row(
 *         "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='new_table'",
 *         [],
 *         |row| row.get(0),
 *     ).unwrap_or(false);
 *     
 *     if !has_new_table {
 *         conn.execute("CREATE TABLE new_table (...)", [])?;
 *     }
 *     
 *     // 3. Modify existing tables (if needed, recreate pattern)
 *     // IMPORTANT: Disable FK constraints when recreating tables!
 *     conn.execute("PRAGMA foreign_keys = OFF", [])?;
 *     conn.execute("DROP TABLE IF EXISTS table_temp", [])?;
 *     conn.execute("CREATE TABLE table_temp (...)", [])?;
 *     conn.execute("INSERT INTO table_temp SELECT ... FROM old_table", [])?;
 *     conn.execute("DROP TABLE old_table", [])?;
 *     conn.execute("ALTER TABLE table_temp RENAME TO old_table", [])?;
 *     conn.execute("PRAGMA foreign_keys = ON", [])?;
 *     
 *     Ok(())
 * }
 * 
 * Then:
 * 1. Update LATEST_VERSION constant to 3
 * 2. Add case in the match statement: 3 => migrate_to_v3(conn)?,
 * 3. Do NOT modify detect_existing_schema_version() - it only needs to detect pre-versioned schemas
 */