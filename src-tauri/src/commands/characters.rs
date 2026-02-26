use crate::db::{init_db, Character, CharacterTalents, CharacterWeapon};
use rusqlite::{OptionalExtension, Result};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CharacterListItem {
    pub name: String,
    pub rarity: u8,
    pub element: String,
    pub weapon_type: Option<String>,
}

/// Get list of all available characters from backend mappings
/// Excludes characters that have already been added to the database
/// Exception: Rover is always shown (users can have multiple Rover variants)
#[tauri::command]
pub fn get_available_characters(app: tauri::AppHandle) -> Result<Vec<CharacterListItem>, String> {
    let conn = init_db(&app)?;
    let mappings = crate::assets::mappings::characters::get_character_mappings();
    
    // Get all character names already in the database
    let mut stmt = conn
        .prepare("SELECT character_name FROM characters")
        .map_err(|e| e.to_string())?;
    
    let existing_names: std::collections::HashSet<String> = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<_, _>>()
        .map_err(|e| e.to_string())?;
    
    // ADDED: Weapon types to search for in tags
    let weapon_types = vec!["sword", "broadblade", "pistols", "gauntlets", "rectifier"];
    
    let mut characters: Vec<CharacterListItem> = mappings
        .values()
        .filter(|meta| {
            // Always show Rover (users can have multiple variants)
            if meta.display_name == "Rover" {
                return true;
            }
            // Otherwise, exclude if already added
            !existing_names.contains(&meta.display_name)
        })
        .map(|meta| {
            // ADDED: Extract weapon type from tags
            let weapon_type = meta.tags.iter()
                .find(|tag| weapon_types.contains(&tag.to_lowercase().as_str()))
                .map(|tag| {
                    // Capitalize first letter
                    let mut chars = tag.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                    }
                });

            CharacterListItem {
                name: meta.display_name.clone(),
                rarity: meta.rarity.unwrap_or(4),
                element: meta.element.clone().unwrap_or_else(|| "Unknown".to_string()),
                weapon_type, // ADDED: Include weapon type
            }
        })
        .collect();
    
    // Sort by rarity (5-star first), then by name
    characters.sort_by(|a, b| {
        b.rarity.cmp(&a.rarity)
            .then_with(|| a.name.cmp(&b.name))
    });
    
    Ok(characters)
}

#[tauri::command]
pub fn get_all_characters(app: tauri::AppHandle) -> Result<Vec<Character>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_name, variant, resonance_date, rarity, element, weapon_type, waveband, level, ascension, build_status, notes FROM characters ORDER BY character_name")
        .map_err(|e| e.to_string())?;
    
    let characters = stmt
        .query_map([], |row| {
            let char_name: String = row.get(1)?;
            let element: String = row.get(5)?;
            
            // For Rover, append element to make unique display name for dropdowns
            // Format: "Rover - Aero", "Rover - Havoc", "Rover - Spectro"
            let display_name = if char_name == "Rover" {
                format!("{} Rover", element)
            } else {
                char_name
            };
            
            Ok(Character {
                id: row.get(0)?,
                character_name: display_name,  // Use display name with element for Rover
                variant: row.get(2)?,
                resonance_date: row.get(3)?,
                rarity: row.get(4)?,
                element: element,
                weapon_type: row.get(6)?,
                waveband: row.get(7)?,
                level: row.get(8)?,
                ascension: row.get(9)?,
                build_status: row.get(10)?,
                notes: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(characters)
}

#[tauri::command]
pub fn get_character_talents(app: tauri::AppHandle, character_id: i64) -> Result<Option<CharacterTalents>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_id, basic_level, skill_level, liberation_level, forte_level, intro_level, notes,
                  basic_minor_1, basic_minor_2, skill_minor_1, skill_minor_2,
                  liberation_minor_1, liberation_minor_2, intro_minor_1, intro_minor_2,
                  forte_major_1, forte_major_2
                  FROM character_talents WHERE character_id = ?")
        .map_err(|e| e.to_string())?;
    
    let talent = stmt
        .query_row([character_id], |row| {
            Ok(CharacterTalents {
                id: row.get(0)?,
                character_id: row.get(1)?,
                basic_level: row.get(2)?,
                skill_level: row.get(3)?,
                liberation_level: row.get(4)?,
                forte_level: row.get(5)?,
                intro_level: row.get(6)?,
                notes: row.get(7)?,
                basic_minor_1: row.get(8)?,
                basic_minor_2: row.get(9)?,
                skill_minor_1: row.get(10)?,
                skill_minor_2: row.get(11)?,
                liberation_minor_1: row.get(12)?,
                liberation_minor_2: row.get(13)?,
                intro_minor_1: row.get(14)?,
                intro_minor_2: row.get(15)?,
                forte_major_1: row.get(16)?,
                forte_major_2: row.get(17)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(talent)
}

#[tauri::command]
pub fn get_character_weapon(app: tauri::AppHandle, character_id: i64) -> Result<Option<CharacterWeapon>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_id, weapon_name, rarity, level, rank, notes FROM character_weapons WHERE character_id = ?")
        .map_err(|e| e.to_string())?;
    
    let weapon = stmt
        .query_row([character_id], |row| {
            Ok(CharacterWeapon {
                id: row.get(0)?,
                character_id: row.get(1)?,
                weapon_name: row.get(2)?,
                rarity: row.get(3)?,
                level: row.get(4)?,
                rank: row.get(5)?,
                notes: row.get(6)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(weapon)
}

#[tauri::command]
pub fn update_character(
    app: tauri::AppHandle,
    id: i64,
    level: i64,
    ascension: i64,
    waveband: i64,
    rarity: i64,
    resonance_date: String,
    build_status: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE characters SET level = ?, ascension = ?, waveband = ?, rarity = ?, resonance_date = ?, build_status = ?, notes = ? WHERE id = ?",
        (level, ascension, waveband, rarity, resonance_date, build_status, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Character updated successfully".to_string())
}

#[tauri::command]
pub fn update_character_talents(
    app: tauri::AppHandle,
    character_id: i64,
    basic_level: Option<i64>,
    skill_level: Option<i64>,
    liberation_level: Option<i64>,
    forte_level: Option<i64>,
    intro_level: Option<i64>,
    notes: Option<String>,
    basic_minor_1: Option<i64>,
    basic_minor_2: Option<i64>,
    skill_minor_1: Option<i64>,
    skill_minor_2: Option<i64>,
    liberation_minor_1: Option<i64>,
    liberation_minor_2: Option<i64>,
    intro_minor_1: Option<i64>,
    intro_minor_2: Option<i64>,
    forte_major_1: Option<i64>,
    forte_major_2: Option<i64>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE character_talents SET 
         basic_level = ?1, skill_level = ?2, liberation_level = ?3, 
         forte_level = ?4, intro_level = ?5, notes = ?6,
         basic_minor_1 = ?7, basic_minor_2 = ?8, skill_minor_1 = ?9, skill_minor_2 = ?10,
         liberation_minor_1 = ?11, liberation_minor_2 = ?12, intro_minor_1 = ?13, intro_minor_2 = ?14,
         forte_major_1 = ?15, forte_major_2 = ?16
         WHERE character_id = ?17",
        rusqlite::params![
            basic_level, skill_level, liberation_level, forte_level, intro_level, notes,
            basic_minor_1, basic_minor_2, skill_minor_1, skill_minor_2,
            liberation_minor_1, liberation_minor_2, intro_minor_1, intro_minor_2,
            forte_major_1, forte_major_2, character_id
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Talents updated successfully".to_string())
}

#[tauri::command]
pub fn update_character_weapon(
    app: tauri::AppHandle,
    character_id: i64,
    weapon_name: String,
    rarity: Option<i64>,
    level: Option<i64>,
    rank: Option<i64>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Get character name
    let character_name: String = conn
        .query_row("SELECT character_name FROM characters WHERE id = ?", [character_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    // Get the old weapon name for this character
    let old_weapon_name: String = conn
        .query_row("SELECT weapon_name FROM character_weapons WHERE character_id = ?", [character_id], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())?
        .unwrap_or_else(|| "None".to_string());
    
    // If the new weapon is not "None", check if it's equipped on another character
    if weapon_name != "None" {
        // Find if this weapon is equipped on another character
        let other_character_result: rusqlite::Result<(i64, String)> = conn.query_row(
            "SELECT cw.character_id, c.character_name 
             FROM character_weapons cw 
             JOIN characters c ON c.id = cw.character_id 
             WHERE cw.weapon_name = ? AND cw.character_id != ?",
            (&weapon_name, character_id),
            |row| Ok((row.get(0)?, row.get(1)?))
        );
        
        // If weapon is equipped on another character, unequip it from them
        if let Ok((other_char_id, other_char_name)) = other_character_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_name = 'None', rarity = NULL, level = NULL, rank = NULL WHERE character_id = ?",
                [other_char_id]
            ).map_err(|e| e.to_string())?;
            
            // Also update weapons_inventory if the weapon exists there
            conn.execute(
                "UPDATE weapons_inventory SET equipped_on = 'Nobody' WHERE weapon_name = ? AND equipped_on = ?",
                (&weapon_name, &other_char_name)
            ).map_err(|e| e.to_string())?;
        }
    }
    
    // Update character_weapons table
    conn.execute(
        "INSERT INTO character_weapons (character_id, weapon_name, rarity, level, rank, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(character_id) DO UPDATE SET
            weapon_name = excluded.weapon_name,
            rarity = excluded.rarity,
            level = excluded.level,
            rank = excluded.rank,
            notes = excluded.notes",
        (&character_id, &weapon_name, rarity, level, rank, &notes),
    )
    .map_err(|e| e.to_string())?;
    
    // Sync with weapons_inventory table
    // First, unequip the old weapon if it exists in inventory
    if old_weapon_name != "None" && old_weapon_name != weapon_name {
        conn.execute(
            "UPDATE weapons_inventory SET equipped_on = 'Nobody' WHERE weapon_name = ? AND equipped_on = ?",
            (&old_weapon_name, &character_name)
        ).map_err(|e| e.to_string())?;
    }
    
    // Then, equip the new weapon if it exists in inventory
    if weapon_name != "None" {
        let weapon_exists: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM weapons_inventory WHERE weapon_name = ?",
            [&weapon_name],
            |row| row.get(0)
        );
        
        if let Ok(weapon_id) = weapon_exists {
            // Update the weapon's equipped_on field and sync its stats
            conn.execute(
                "UPDATE weapons_inventory SET equipped_on = ?, level = ?, rank = ? WHERE id = ?",
                (&character_name, level.unwrap_or(1), rank.unwrap_or(1), weapon_id)
            ).map_err(|e| e.to_string())?;
        }
    }
    
    Ok("Weapon updated successfully".to_string())
}

#[tauri::command]
pub fn add_character(
    app: tauri::AppHandle,
    character_name: String,
    variant: Option<String>,
    resonance_date: String,
    rarity: i64,
    element: String,
    weapon_type: String,
    waveband: i64,
    level: i64,
    ascension: i64,
    build_status: String,
    notes: Option<String>,
) -> Result<String, String> {
    let mut conn = init_db(&app)?;
    
    // Start a transaction
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Insert the character
    tx.execute(
        "INSERT INTO characters (character_name, variant, resonance_date, rarity, element, weapon_type, waveband, level, ascension, build_status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (&character_name, variant, resonance_date, rarity, element, weapon_type, waveband, level, ascension, build_status, notes),
    )
    .map_err(|e| e.to_string())?;
    
    // Get the newly inserted character's ID
    let character_id = tx.last_insert_rowid();
    
    // Initialize character_talents with level 1 and all traces set to 0
    tx.execute(
        "INSERT INTO character_talents (
            character_id, basic_level, skill_level, liberation_level, forte_level, intro_level, notes,
            basic_minor_1, basic_minor_2, skill_minor_1, skill_minor_2,
            liberation_minor_1, liberation_minor_2, intro_minor_1, intro_minor_2,
            forte_major_1, forte_major_2
         ) VALUES (?, 1, 1, 1, 1, 1, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)",
        [character_id],
    )
    .map_err(|e| e.to_string())?;
    
    // Initialize character_weapons with default values
    tx.execute(
        "INSERT INTO character_weapons (character_id, weapon_name, rarity, level, rank, notes) 
         VALUES (?, 'None', NULL, NULL, NULL, NULL)",
        [character_id],
    )
    .map_err(|e| e.to_string())?;
    
    // Initialize echo_builds with default values (5pc configuration by default)
    tx.execute(
        "INSERT INTO echo_builds (character_id, primary_set_key, secondary_set_key, primary_set_pieces, secondary_set_pieces, overall_quality, notes) 
         VALUES (?, NULL, NULL, 5, 0, NULL, NULL)",
        [character_id],
    )
    .map_err(|e| e.to_string())?;
    
    // Commit the transaction - if this fails or any above step failed, everything will be rolled back
    tx.commit().map_err(|e| e.to_string())?;
    
    Ok("Character added successfully".to_string())
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_character(app: tauri::AppHandle, id: i64) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Get character name before deletion to unequip weapons
    let character_name: String = conn
        .query_row("SELECT character_name FROM characters WHERE id = ?", [id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    // Unequip any weapons from this character in the weapons_inventory
    conn.execute(
        "UPDATE weapons_inventory SET equipped_on = 'Nobody' WHERE equipped_on = ?",
        [&character_name]
    ).map_err(|e| e.to_string())?;
    
    // Delete related data first (foreign key constraints)
    conn.execute("DELETE FROM character_talents WHERE character_id = ?", [id])
        .map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM character_weapons WHERE character_id = ?", [id])
        .map_err(|e| e.to_string())?;
    
    // Get echo build IDs to delete echoes
    let mut stmt = conn
        .prepare("SELECT id FROM echo_builds WHERE character_id = ?")
        .map_err(|e| e.to_string())?;
    let build_ids: Vec<i64> = stmt
        .query_map([id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    for build_id in build_ids {
        // Get echo IDs to delete substats
        let mut echo_stmt = conn
            .prepare("SELECT id FROM echoes WHERE build_id = ?")
            .map_err(|e| e.to_string())?;
        let echo_ids: Vec<i64> = echo_stmt
            .query_map([build_id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        
        for echo_id in echo_ids {
            conn.execute("DELETE FROM echo_substats WHERE echo_id = ?", [echo_id])
                .map_err(|e| e.to_string())?;
        }
        
        conn.execute("DELETE FROM echoes WHERE build_id = ?", [build_id])
            .map_err(|e| e.to_string())?;
    }
    
    conn.execute("DELETE FROM echo_builds WHERE character_id = ?", [id])
        .map_err(|e| e.to_string())?;
    
    // Finally delete the character
    conn.execute("DELETE FROM characters WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    
    Ok("Character deleted successfully".to_string())
}

/// Get display names of all characters tagged as "healer" in the asset mappings.
/// Used by the Troop Matrix vigor system — healers start with 2 vigor instead of 1.
/// Update the tag in assets/mappings/characters.rs to keep this in sync.
#[tauri::command]
pub fn get_healer_characters() -> Result<Vec<String>, String> {
    let mappings = crate::assets::mappings::characters::get_character_mappings();
    let mut healers: Vec<String> = mappings
        .values()
        .filter(|m| m.tags.iter().any(|t| t == "healer"))
        .map(|m| m.display_name.clone())
        .collect();
    healers.sort();
    Ok(healers)
}