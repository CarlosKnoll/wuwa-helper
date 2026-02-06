/// Migration v0 -> v1: Old database structure
/// This creates the initial database schema with all base tables

use rusqlite::{Connection, Result};

pub fn migrate_to_v1(conn: &Connection) -> Result<()> {
    // Account Info
    conn.execute(
        "CREATE TABLE IF NOT EXISTS account_info (
            id INTEGER PRIMARY KEY,
            last_updated TEXT,
            union_level INTEGER,
            notes TEXT
        )",
        [],
    )?;

    // Resources
    conn.execute(
        "CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY,
            astrite INTEGER,
            lustrous_tide INTEGER,
            radiant_tide INTEGER,
            forged_tide INTEGER,
            afterglow_coral INTEGER,
            oscillated_coral INTEGER,
            shell_credits INTEGER,
            notes TEXT
        )",
        [],
    )?;

    // Pity Status
    conn.execute(
        "CREATE TABLE IF NOT EXISTS pity_status (
            id INTEGER PRIMARY KEY,
            banner_type TEXT UNIQUE,
            current_pity INTEGER,
            guaranteed_next_fivestar BOOLEAN,
            notes TEXT
        )",
        [],
    )?;

    // Exploration Regions
    conn.execute(
        "CREATE TABLE IF NOT EXISTS exploration_regions (
            id INTEGER PRIMARY KEY,
            region_name TEXT UNIQUE,
            notes TEXT
        )",
        [],
    )?;

    // Exploration Maps
    conn.execute(
        "CREATE TABLE IF NOT EXISTS exploration_maps (
            id INTEGER PRIMARY KEY,
            region_id INTEGER,
            map_name TEXT,
            exploration_percent REAL,
            notes TEXT,
            FOREIGN KEY (region_id) REFERENCES exploration_regions(id)
        )",
        [],
    )?;

    // Characters
    conn.execute(
        "CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY,
            character_name TEXT,
            variant TEXT,
            resonance_date TEXT,
            rarity INTEGER,
            element TEXT,
            weapon_type TEXT,
            waveband INTEGER,
            level INTEGER,
            ascension INTEGER,
            build_status TEXT,
            notes TEXT,
            UNIQUE(character_name, variant)
        )",
        [],
    )?;

    // Character Talents (OLD SCHEMA - without minor/major traces)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS character_talents (
            id INTEGER PRIMARY KEY,
            character_id INTEGER,
            basic_level INTEGER,
            skill_level INTEGER,
            liberation_level INTEGER,
            forte_level INTEGER,
            intro_level INTEGER,
            notes TEXT,
            FOREIGN KEY (character_id) REFERENCES characters(id)
        )",
        [],
    )?;

    // Character Weapons
    conn.execute(
        "CREATE TABLE IF NOT EXISTS character_weapons (
            id INTEGER PRIMARY KEY,
            character_id INTEGER,
            weapon_name TEXT,
            rarity INTEGER,
            level INTEGER,
            rank INTEGER,
            notes TEXT,
            FOREIGN KEY (character_id) REFERENCES characters(id)
        )",
        [],
    )?;

    // Echo Builds (OLD SCHEMA - with set_bonus and set_effect)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS echo_builds (
            id INTEGER PRIMARY KEY,
            character_id INTEGER,
            set_bonus TEXT,
            set_effect TEXT,
            overall_quality TEXT,
            notes TEXT,
            FOREIGN KEY (character_id) REFERENCES characters(id)
        )",
        [],
    )?;

    // Echoes (without echo_set column)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS echoes (
            id INTEGER PRIMARY KEY,
            build_id INTEGER,
            echo_name TEXT,
            cost INTEGER,
            level INTEGER,
            rarity INTEGER,
            main_stat TEXT,
            main_stat_value TEXT,
            notes TEXT,
            FOREIGN KEY (build_id) REFERENCES echo_builds(id)
        )",
        [],
    )?;

    // Echo Substats
    conn.execute(
        "CREATE TABLE IF NOT EXISTS echo_substats (
            id INTEGER PRIMARY KEY,
            echo_id INTEGER,
            stat_name TEXT,
            stat_value TEXT,
            FOREIGN KEY (echo_id) REFERENCES echoes(id)
        )",
        [],
    )?;

    // Weapons Inventory
    conn.execute(
        "CREATE TABLE IF NOT EXISTS weapons_inventory (
            id INTEGER PRIMARY KEY,
            weapon_name TEXT UNIQUE,
            weapon_type TEXT,
            rarity INTEGER,
            rank INTEGER,
            level INTEGER,
            equipped_on TEXT,
            category TEXT,
            notes TEXT
        )",
        [],
    )?;

    // Tower of Adversity
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tower_of_adversity (
            id INTEGER PRIMARY KEY,
            last_reset TEXT,
            total_stars INTEGER,
            astrite_earned INTEGER,
            notes TEXT
        )",
        [],
    )?;

    // Tower Details
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tower_details (
            id INTEGER PRIMARY KEY,
            tower_type TEXT,
            stars_achieved INTEGER,
            max_stars INTEGER,
            notes TEXT
        )",
        [],
    )?;

    // Tower Area Effects
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tower_area_effects (
            id INTEGER PRIMARY KEY,
            tower_type TEXT,
            floor_range TEXT,
            effect_description TEXT
        )",
        [],
    )?;

    // Tower Teams
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tower_teams (
            id INTEGER PRIMARY KEY,
            tower_type TEXT,
            floor_number INTEGER,
            character1 TEXT,
            character2 TEXT,
            character3 TEXT
        )",
        [],
    )?;

    // Whimpering Wastes
    conn.execute(
        "CREATE TABLE IF NOT EXISTS whimpering_wastes (
            id INTEGER PRIMARY KEY,
            last_reset TEXT,
            chasm_highest_stage INTEGER,
            chasm_total_points INTEGER,
            chasm_astrite INTEGER,
            torrents_total_points INTEGER,
            torrents_astrite INTEGER,
            notes TEXT
        )",
        [],
    )?;

    // Torrents Stages
    conn.execute(
        "CREATE TABLE IF NOT EXISTS torrents_stages (
            id INTEGER PRIMARY KEY,
            stage_number INTEGER,
            character1 TEXT,
            character2 TEXT,
            character3 TEXT,
            token TEXT,
            points INTEGER
        )",
        [],
    )?;

    // Troop Matrix (OLD SCHEMA - with progress instead of detailed fields)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS troop_matrix (
            id INTEGER PRIMARY KEY,
            unlocked BOOLEAN,
            progress TEXT,
            notes TEXT
        )",
        [],
    )?;

    // Goals
    conn.execute(
        "CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY,
            goal_text TEXT,
            priority TEXT,
            category TEXT,
            notes TEXT,
            astrite_needed INTEGER,
            estimated_banner TEXT
        )",
        [],
    )?;

    // ========================================
    // Initialize default data for singleton tables
    // ONLY if they don't already have data
    // ========================================
    
    // Check and insert account_info
    let account_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM account_info WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !account_exists {
        conn.execute(
            "INSERT INTO account_info (id, last_updated, union_level, notes) 
             VALUES (1, datetime('now'), 1, NULL)",
            [],
        )?;
    }
    
    // Check and insert resources
    let resources_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM resources WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !resources_exists {
        conn.execute(
            "INSERT INTO resources (id, astrite, lustrous_tide, radiant_tide, forged_tide, 
                                    afterglow_coral, oscillated_coral, shell_credits, notes) 
             VALUES (1, 0, 0, 0, 0, 0, 0, 0, NULL)",
            [],
        )?;
    }
    
    // Check and insert tower_of_adversity
    let tower_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM tower_of_adversity WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !tower_exists {
        conn.execute(
            "INSERT INTO tower_of_adversity (id, last_reset, total_stars, astrite_earned, notes) 
             VALUES (1, date('now'), 0, 0, NULL)",
            [],
        )?;
    }

    // Check and insert tower_area_effects
    let tower_details_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM tower_area_effects",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !tower_details_exists {
        for tower_type in &["echoing", "resonant"] {
            for _floor_num in 1..=2 {
                conn.execute(
                    "INSERT INTO tower_area_effects (tower_type, floor_range, effect_description) 
                    VALUES (?, '1 to 4', ' ')",
                    [tower_type],
                )?;
            }
        }

        for _floor_num in 1..=2 {
                conn.execute(
                    "INSERT INTO tower_area_effects (tower_type, floor_range, effect_description) 
                    VALUES ('hazard', '1 and 2', ' ')",
                    [],
                )?;
        }
        
        for _floor_num in 1..=3 {
                conn.execute(
                    "INSERT INTO tower_area_effects (tower_type, floor_range, effect_description) 
                    VALUES ('hazard', '3 and 4', ' ')", 
                    [],
                )?;
        }

    }

    // Check and insert tower_details
    let tower_details_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM tower_details",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !tower_details_exists {
        conn.execute(
            "INSERT INTO tower_details (tower_type, stars_achieved, max_stars, notes) 
             VALUES ('echoing', 0, 12, NULL), 
                    ('resonant', 0, 12, NULL), 
                    ('hazard', 0, 12, NULL)",
            [],
        )?;
    }
    
    // Check and insert whimpering_wastes
    let wastes_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM whimpering_wastes WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !wastes_exists {
        conn.execute(
            "INSERT INTO whimpering_wastes (id, last_reset, chasm_highest_stage, chasm_total_points, 
                                            chasm_astrite, torrents_total_points, torrents_astrite, notes) 
             VALUES (1, date('now'), 0, 0, 0, 0, 0, NULL)",
            [],
        )?;
    }
    
    // Check and insert troop_matrix
    let matrix_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM troop_matrix WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !matrix_exists {
        conn.execute(
            "INSERT INTO troop_matrix (id, unlocked, progress, notes) 
             VALUES (1, 0, '', NULL)",
            [],
        )?;
    }

    Ok(())
}
