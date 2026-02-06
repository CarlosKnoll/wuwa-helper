/// Migration v1 -> v2: Add new features and update existing tables
/// This migration adds: pull history tracking, matrix teams, tower floors, 
/// expanded echo builds system, and character talent traces
use rusqlite::{Connection, Result};

pub fn migrate_to_v2(conn: &Connection) -> Result<()> {
    // ========================================
    // 1. Recreate echo_builds with new schema
    // ========================================
    
    // Temporarily disable foreign key constraints for table recreation
    conn.execute("PRAGMA foreign_keys = OFF", [])?;
    
    // Drop the temporary table if it exists from a previous failed migration
    conn.execute("DROP TABLE IF EXISTS echo_builds_new", [])?;
    
    // Create new table with updated schema
    conn.execute(
        "CREATE TABLE echo_builds_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_id INTEGER NOT NULL,
            primary_set_key TEXT,
            secondary_set_key TEXT,
            primary_set_pieces INTEGER DEFAULT 5,
            secondary_set_pieces INTEGER DEFAULT 0,
            overall_quality TEXT,
            notes TEXT,
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Copy data from old table (mapping old columns to new where possible)
    conn.execute(
        "INSERT INTO echo_builds_new (id, character_id, primary_set_key, overall_quality, notes)
         SELECT id, character_id, set_bonus, overall_quality, notes FROM echo_builds",
        [],
    )?;
    
    // Drop old table
    conn.execute("DROP TABLE echo_builds", [])?;
    
    // Rename new table
    conn.execute("ALTER TABLE echo_builds_new RENAME TO echo_builds", [])?;
    
    // Re-enable foreign key constraints
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // ========================================
    // 2. Add echo_set column to echoes table
    // ========================================
    
    // Check if column already exists before adding
    let has_echo_set: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('echoes') WHERE name='echo_set'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !has_echo_set {
        conn.execute(
            "ALTER TABLE echoes ADD COLUMN echo_set TEXT",
            [],
        )?;
    }

    // ========================================
    // 3. Add minor/major trace columns to character_talents
    // ========================================
    
    // Helper function to add column if it doesn't exist
    let add_column_if_not_exists = |column_name: &str| -> Result<()> {
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM pragma_table_info('character_talents') WHERE name=?1",
            [column_name],
            |row| row.get(0),
        ).unwrap_or(false);
        
        if !exists {
            conn.execute(
                &format!("ALTER TABLE character_talents ADD COLUMN {} INTEGER DEFAULT 0", column_name),
                [],
            )?;
        }
        Ok(())
    };
    
    add_column_if_not_exists("basic_minor_1")?;
    add_column_if_not_exists("basic_minor_2")?;
    add_column_if_not_exists("skill_minor_1")?;
    add_column_if_not_exists("skill_minor_2")?;
    add_column_if_not_exists("liberation_minor_1")?;
    add_column_if_not_exists("liberation_minor_2")?;
    add_column_if_not_exists("intro_minor_1")?;
    add_column_if_not_exists("intro_minor_2")?;
    add_column_if_not_exists("forte_major_1")?;
    add_column_if_not_exists("forte_major_2")?;

    // ========================================
    // 4. Recreate troop_matrix with new schema
    // ========================================

    // Temporarily disable foreign key constraints for table recreation
    conn.execute("PRAGMA foreign_keys = OFF", [])?;

    // Drop the temporary table if it exists from a previous failed migration
    conn.execute("DROP TABLE IF EXISTS troop_matrix_new", [])?;

    conn.execute(
        "CREATE TABLE troop_matrix_new (
            id INTEGER PRIMARY KEY,
            last_reset TEXT NOT NULL DEFAULT '2025-01-01',
            stability_accords_points INTEGER NOT NULL DEFAULT 0,
            stability_accords_astrite INTEGER NOT NULL DEFAULT 0,
            singularity_expansion_points INTEGER NOT NULL DEFAULT 0,
            singularity_expansion_astrite INTEGER NOT NULL DEFAULT 0,
            singularity_expansion_highest_round INTEGER NOT NULL DEFAULT 0,
            notes TEXT
        )",
        [],
    )?;

    // Copy data from old table with default values for new fields
    // Note: unlocked column is intentionally omitted from the new schema
    conn.execute(
        "INSERT INTO troop_matrix_new (
            id, 
            last_reset, 
            stability_accords_points, 
            stability_accords_astrite, 
            singularity_expansion_points, 
            singularity_expansion_astrite, 
            singularity_expansion_highest_round, 
            notes
        )
        SELECT 
            id, 
            '2025-01-01',  -- last_reset default
            0,             -- stability_accords_points default
            0,             -- stability_accords_astrite default
            0,             -- singularity_expansion_points default
            0,             -- singularity_expansion_astrite default
            0,             -- singularity_expansion_highest_round default
            notes 
        FROM troop_matrix",
        [],
    )?;

    // Drop old table
    conn.execute("DROP TABLE troop_matrix", [])?;

    // Rename new table
    conn.execute("ALTER TABLE troop_matrix_new RENAME TO troop_matrix", [])?;

    // Re-enable foreign key constraints
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Ensure default row exists (in case old table was empty)
    let row_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM troop_matrix WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    if !row_exists {
        conn.execute(
            "INSERT INTO troop_matrix (
                id, last_reset, 
                stability_accords_points, stability_accords_astrite,
                singularity_expansion_points, singularity_expansion_astrite,
                singularity_expansion_highest_round, notes
            ) VALUES (1, '2025-01-01', 0, 0, 0, 0, 0, NULL)",
            [],
        )?;
    }

    // ========================================
    // 5. Create new tables (only if they don't exist)
    // ========================================
    
    // Tower Floors
    let has_tower_floors: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='tower_floors'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !has_tower_floors {
        conn.execute(
            "CREATE TABLE tower_floors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tower_type TEXT NOT NULL,
                floor_number INTEGER NOT NULL,
                stars INTEGER DEFAULT 0,
                max_stars INTEGER DEFAULT 3,
                UNIQUE(tower_type, floor_number)
            )",
            [],
        )?;
        
        // Initialize tower floors (3 towers × 4 floors = 12 rows)
        for tower_type in &["echoing", "resonant", "hazard"] {
            for floor_num in 1..=4 {
                conn.execute(
                    "INSERT INTO tower_floors (tower_type, floor_number, stars, max_stars) 
                     VALUES (?, ?, 0, 3)",
                    (*tower_type, floor_num),
                )?;
            }
        }
    }
    
    // Pull History
    let has_pull_history: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='pull_history'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !has_pull_history {
        conn.execute(
            "CREATE TABLE pull_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                banner_type TEXT NOT NULL,
                pull_number INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                rarity INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                is_guaranteed BOOLEAN NOT NULL DEFAULT 0,
                pull_date TEXT NOT NULL,
                notes TEXT,
                group_order INTEGER
            )",
            [],
        )?;
    }
    
    // Matrix Teams
    let has_matrix_teams: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='matrix_teams'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !has_matrix_teams {
        conn.execute(
            "CREATE TABLE matrix_teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mode TEXT NOT NULL CHECK(mode IN ('Stability Accords', 'Singularity Expansion')),
                team_number INTEGER NOT NULL,
                character1 TEXT NOT NULL DEFAULT 'None',
                character2 TEXT NOT NULL DEFAULT 'None',
                character3 TEXT NOT NULL DEFAULT 'None',
                points INTEGER NOT NULL DEFAULT 0,
                round_number INTEGER,
                UNIQUE(mode, team_number)
            )",
            [],
        )?;
    }

    // ========================================
    // 6. Create indexes (with IF NOT EXISTS protection)
    // ========================================
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_matrix_teams_mode ON matrix_teams(mode)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_matrix_teams_team_number ON matrix_teams(team_number)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_pull_history_group_order ON pull_history(pull_date, group_order)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_echo_builds_character ON echo_builds(character_id)",
        [],
    )?;

    Ok(())
}
