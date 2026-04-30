/// Migration v4 -> v5: Remove unique constraint on weapons_inventory
///                    + Add weapon_id FK to character_weapons
///
/// Why this exists:
/// - The original schema had a UNIQUE constraint on weapon_name in weapons_inventory.
///   In-game, players can own multiple copies of the same weapon (e.g. two copies
///   of the same 4★ weapon for different characters). Without this migration,
///   adding a duplicate weapon fails with a constraint error.
/// - Now that weapon names are no longer unique, character_weapons can no longer
///   identify a specific inventory row by weapon_name alone. weapon_id
///   (FK -> weapons_inventory.id) gives each character slot a precise reference
///   to the exact inventory row it holds.
///
/// SQLite does not support DROP CONSTRAINT, so we use the standard
/// recreate-table pattern with FK constraints disabled during the swap.
/// The character_weapons ALTER TABLE and back-fill are done inside the same
/// FK-off window to keep everything atomic.

use rusqlite::{Connection, Result};

pub fn migrate_to_v5(conn: &Connection) -> Result<()> {
    conn.execute("PRAGMA foreign_keys = OFF", [])?;

    // -------------------------------------------------------------------------
    // Part 1: Recreate weapons_inventory without the UNIQUE constraint on
    // weapon_name so duplicate copies of the same weapon can be stored.
    // -------------------------------------------------------------------------
    conn.execute("DROP TABLE IF EXISTS weapons_inventory_v5_tmp", [])?;

    conn.execute(
        "CREATE TABLE weapons_inventory_v5_tmp (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            weapon_name TEXT    NOT NULL,
            weapon_type TEXT    NOT NULL DEFAULT 'Unknown',
            rarity      INTEGER NOT NULL DEFAULT 5,
            rank        INTEGER NOT NULL DEFAULT 1,
            level       INTEGER NOT NULL DEFAULT 1,
            equipped_on TEXT    NOT NULL DEFAULT 'Nobody',
            category    TEXT    NOT NULL DEFAULT 'owned',
            notes       TEXT
        )",
        [],
    )?;

    conn.execute(
        "INSERT INTO weapons_inventory_v5_tmp
             (id, weapon_name, weapon_type, rarity, rank, level, equipped_on, category, notes)
         SELECT id, weapon_name, weapon_type, rarity, rank, level, equipped_on, category, notes
         FROM weapons_inventory",
        [],
    )?;

    conn.execute("DROP TABLE weapons_inventory", [])?;
    conn.execute(
        "ALTER TABLE weapons_inventory_v5_tmp RENAME TO weapons_inventory",
        [],
    )?;

    // -------------------------------------------------------------------------
    // Part 2: Add weapon_id to character_weapons so each character slot holds a
    // precise FK reference to its inventory row rather than a name string that
    // could now match multiple rows.
    // Back-fill existing rows by joining through characters to match
    // equipped_on — LIMIT 1 is a safe fallback if duplicates already exist.
    // -------------------------------------------------------------------------
    let has_weapon_id: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM pragma_table_info('character_weapons') WHERE name = 'weapon_id'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !has_weapon_id {
        conn.execute(
            "ALTER TABLE character_weapons ADD COLUMN weapon_id INTEGER REFERENCES weapons_inventory(id)",
            [],
        )?;
    }

    conn.execute(
        "UPDATE character_weapons
         SET weapon_id = (
             SELECT wi.id
             FROM weapons_inventory wi
             INNER JOIN characters c ON c.id = character_weapons.character_id
             WHERE wi.weapon_name = character_weapons.weapon_name
               AND wi.equipped_on  = c.character_name
             LIMIT 1
         )
         WHERE weapon_name IS NOT NULL
           AND weapon_name != 'None'
           AND weapon_id IS NULL",
        [],
    )?;

    conn.execute("PRAGMA foreign_keys = ON", [])?;

    Ok(())
}