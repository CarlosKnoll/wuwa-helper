use crate::db::{init_db, Weapon};
use rusqlite::Result;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct WeaponListItem {
    pub name: String,
    pub weapon_type: String,
    pub rarity: u8,
}

/// Get list of all available weapons from backend mappings
#[tauri::command]
pub fn get_available_weapons(_app: tauri::AppHandle) -> Result<Vec<WeaponListItem>, String> {
    let mappings = crate::assets::mappings::weapons::get_weapon_mappings();
    
    // Map has dual indexing (filename + display_name), so deduplicate by display_name
    let mut seen_names = std::collections::HashSet::new();
    
    let mut weapons: Vec<WeaponListItem> = mappings
        .values()
        .filter(|meta| {
            meta.asset_type == "weapon" && seen_names.insert(meta.display_name.clone())
        })
        .map(|meta| WeaponListItem {
            name: meta.display_name.clone(),
            weapon_type: meta.weapon_type.clone().unwrap_or_else(|| "Unknown".to_string()),
            rarity: meta.rarity.unwrap_or(3),
        })
        .collect();
    
    // Sort by rarity (5-star first), then weapon type, then name
    weapons.sort_by(|a, b| {
        b.rarity.cmp(&a.rarity)
            .then_with(|| a.weapon_type.cmp(&b.weapon_type))
            .then_with(|| a.name.cmp(&b.name))
    });
    
    Ok(weapons)
}

#[tauri::command]
pub fn get_all_weapons(app: tauri::AppHandle) -> Result<Vec<Weapon>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, weapon_name, weapon_type, rarity, rank, level, equipped_on, category, notes FROM weapons_inventory ORDER BY rarity DESC, weapon_name")
        .map_err(|e| e.to_string())?;
    
    let weapons = stmt
        .query_map([], |row| {
            Ok(Weapon {
                id: row.get(0)?,
                weapon_name: row.get(1)?,
                weapon_type: row.get(2)?,
                rarity: row.get(3)?,
                rank: row.get(4)?,
                level: row.get(5)?,
                equipped_on: row.get(6)?,
                category: row.get(7)?,
                notes: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(weapons)
}

#[tauri::command]
pub fn update_weapon(
    app: tauri::AppHandle,
    id: i64,
    level: i64,
    rank: i64,
    rarity: i64,
    equipped_on: String,
    category: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Validate rarity
    let rarity = if (1..=5).contains(&rarity) { rarity } else { 5 };
    
    // Get the old equipped_on value and weapon details
    let (old_equipped_on, weapon_name): (String, String) = conn
        .query_row(
            "SELECT equipped_on, weapon_name FROM weapons_inventory WHERE id = ?", 
            [id], 
            |row| Ok((row.get(0)?, row.get(1)?))
        )
        .map_err(|e| e.to_string())?;
    
    // If equipping to a new character (not "Nobody"), check if that character already has a weapon
    if equipped_on != "Nobody" && equipped_on != old_equipped_on {
        let character_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0)
        );
        
        if let Ok(char_id) = character_id_result {
            // Get the character's current weapon
            let current_weapon_result: rusqlite::Result<String> = conn.query_row(
                "SELECT weapon_name FROM character_weapons WHERE character_id = ?",
                [char_id],
                |row| row.get(0)
            );
            
            // If character has a weapon that's not "None", unequip it
            if let Ok(current_weapon_name) = current_weapon_result {
                if current_weapon_name != "None" && current_weapon_name != weapon_name {
                    // Set the old weapon to "Nobody" in weapons_inventory
                    conn.execute(
                        "UPDATE weapons_inventory SET equipped_on = 'Nobody' WHERE weapon_name = ? AND equipped_on = ?",
                        (&current_weapon_name, &equipped_on)
                    ).map_err(|e| e.to_string())?;
                }
            }
        }
    }
    
    // Update the weapon
    conn.execute(
        "UPDATE weapons_inventory SET level = ?, rank = ?, rarity = ?, equipped_on = ?, category = ?, notes = ? WHERE id = ?",
        (level, rank, rarity, &equipped_on, category, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    // If equipped_on changed, update the character_weapons table
    if old_equipped_on != equipped_on {
        // If unequipping from old character
        if old_equipped_on != "Nobody" {
            // Try to find the character by name and unequip
            let character_id_result: rusqlite::Result<i64> = conn.query_row(
                "SELECT id FROM characters WHERE character_name = ?",
                [&old_equipped_on],
                |row| row.get(0)
            );
            
            if let Ok(old_char_id) = character_id_result {
                conn.execute(
                    "UPDATE character_weapons SET weapon_name = 'None', rarity = NULL, level = NULL, rank = NULL WHERE character_id = ?",
                    [old_char_id]
                ).map_err(|e| e.to_string())?;
            }
        }
        
        // If equipping to new character
        if equipped_on != "Nobody" {
            let character_id_result: rusqlite::Result<i64> = conn.query_row(
                "SELECT id FROM characters WHERE character_name = ?",
                [&equipped_on],
                |row| row.get(0)
            );
            
            if let Ok(new_char_id) = character_id_result {
                conn.execute(
                    "UPDATE character_weapons SET weapon_name = ?, rarity = ?, level = ?, rank = ? WHERE character_id = ?",
                    (&weapon_name, rarity, level, rank, new_char_id)
                ).map_err(|e| e.to_string())?;
            }
        }
    } else if equipped_on != "Nobody" {
        // Even if equipped_on didn't change, sync the weapon stats
        let character_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0)
        );
        
        if let Ok(char_id) = character_id_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_name = ?, rarity = ?, level = ?, rank = ? WHERE character_id = ?",
                (weapon_name, rarity, level, rank, char_id)
            ).map_err(|e| e.to_string())?;
        }
    }
    
    Ok("Weapon updated successfully".to_string())
}

#[tauri::command]
pub fn add_weapon(
    app: tauri::AppHandle,
    weapon_name: String,
    weapon_type: String,
    rarity: i64,
    level: i64,
    rank: i64,
    equipped_on: String,
    category: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO weapons_inventory (weapon_name, weapon_type, rarity, rank, level, equipped_on, category, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (&weapon_name, &weapon_type, rarity, rank, level, &equipped_on, category, &notes),
    )
    .map_err(|e| e.to_string())?;
    
    // If equipping to a character, update character_weapons
    if equipped_on != "Nobody" {
        let character_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0)
        );
        
        if let Ok(char_id) = character_id_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_name = ?, rarity = ?, level = ?, rank = ? WHERE character_id = ?",
                (&weapon_name, rarity, level, rank, char_id)
            ).map_err(|e| e.to_string())?;
        }
    }
    
    Ok("Weapon added successfully".to_string())
}

#[tauri::command]
pub fn delete_weapon(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Get equipped_on before deleting
    let equipped_on: String = conn
        .query_row("SELECT equipped_on FROM weapons_inventory WHERE id = ?", [id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    // If weapon was equipped, unequip from character
    if equipped_on != "Nobody" {
        let character_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0)
        );
        
        if let Ok(char_id) = character_id_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_name = 'None', rarity = NULL, level = NULL, rank = NULL WHERE character_id = ?",
                [char_id]
            ).map_err(|e| e.to_string())?;
        }
    }
    
    // Delete the weapon
    conn.execute(
        "DELETE FROM weapons_inventory WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Weapon deleted successfully".to_string())
}