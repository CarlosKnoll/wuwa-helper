use crate::db::{init_db, Weapon};
use rusqlite::Result;
use serde::Serialize;
use crate::assets::AssetManager;

#[derive(Debug, Serialize)]
pub struct WeaponListItem {
    pub name: String,
    pub weapon_type: String,
    pub rarity: u8,
}

/// Normalize weapon type strings to their canonical singular form.
/// The metadata uses singular ("Pistol", "Gauntlet") but old DB rows
/// may have the plural form — always normalise on the way in and out.
fn normalize_weapon_type(weapon_type: &str) -> String {
    match weapon_type.trim() {
        "Pistols"   => "Pistol".to_string(),
        "Gauntlets" => "Gauntlet".to_string(),
        other       => other.to_string(),
    }
}

/// Get list of all available weapons from backend mappings
#[tauri::command]
pub fn get_available_weapons(
    _app: tauri::AppHandle,
    manager: tauri::State<'_, AssetManager>
) -> Result<Vec<WeaponListItem>, String> {

    let mappings = manager.inner().get_all_mappings();

    let mut seen_names = std::collections::HashSet::new();

    let mut weapons: Vec<WeaponListItem> = mappings
        .values()
        // ✅ filter only weapons
        .filter(|meta| meta.asset_type == "weapon")
        // ✅ deduplicate by display_name
        .filter(|meta| seen_names.insert(meta.display_name.clone()))
        .map(|meta| WeaponListItem {
            name: meta.display_name.clone(),
            weapon_type: normalize_weapon_type(
                &meta.weapon_type.clone().unwrap_or_else(|| "Unknown".to_string())
            ),
            rarity: meta.rarity.unwrap_or(3) as u8,
        })
        .collect();

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
                weapon_type: normalize_weapon_type(&row.get::<_, String>(2)?),
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

    // Fetch the current row by id — the only safe key with duplicates allowed.
    let (old_equipped_on, weapon_name): (String, String) = conn
        .query_row(
            "SELECT equipped_on, weapon_name FROM weapons_inventory WHERE id = ?",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    // If moving to a new character, evict whatever weapon that character currently holds.
    if equipped_on != "Nobody" && equipped_on != old_equipped_on {
        let char_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0),
        );

        if let Ok(char_id) = char_id_result {
            // Look up the existing slot by character_id — weapon_id is now the FK.
            let prev_weapon_id_result: rusqlite::Result<Option<i64>> = conn.query_row(
                "SELECT weapon_id FROM character_weapons WHERE character_id = ?",
                [char_id],
                |row| row.get(0),
            );

            if let Ok(Some(prev_weapon_id)) = prev_weapon_id_result {
                // Unequip the previous weapon row by its own id, not by name.
                conn.execute(
                    "UPDATE weapons_inventory SET equipped_on = 'Nobody' WHERE id = ?",
                    [prev_weapon_id],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }

    // Write the updated stats + new equipped_on to this specific weapon row.
    conn.execute(
        "UPDATE weapons_inventory SET level = ?, rank = ?, rarity = ?, equipped_on = ?, category = ?, notes = ? WHERE id = ?",
        (level, rank, rarity, &equipped_on, category, notes, id),
    )
    .map_err(|e| e.to_string())?;

    // Keep character_weapons in sync.
    if old_equipped_on != equipped_on {
        // Vacate the slot for the character we just unequipped from.
        if old_equipped_on != "Nobody" {
            let old_char_id_result: rusqlite::Result<i64> = conn.query_row(
                "SELECT id FROM characters WHERE character_name = ?",
                [&old_equipped_on],
                |row| row.get(0),
            );
            if let Ok(old_char_id) = old_char_id_result {
                conn.execute(
                    "UPDATE character_weapons SET weapon_id = NULL, weapon_name = 'None', rarity = NULL, level = NULL, rank = NULL WHERE character_id = ?",
                    [old_char_id],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        // Fill the slot for the character we are equipping to.
        if equipped_on != "Nobody" {
            let new_char_id_result: rusqlite::Result<i64> = conn.query_row(
                "SELECT id FROM characters WHERE character_name = ?",
                [&equipped_on],
                |row| row.get(0),
            );
            if let Ok(new_char_id) = new_char_id_result {
                conn.execute(
                    "UPDATE character_weapons SET weapon_id = ?, weapon_name = ?, rarity = ?, level = ?, rank = ? WHERE character_id = ?",
                    (id, &weapon_name, rarity, level, rank, new_char_id),
                )
                .map_err(|e| e.to_string())?;
            }
        }
    } else if equipped_on != "Nobody" {
        // equipped_on unchanged — just sync the stats in the character slot.
        let char_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0),
        );
        if let Ok(char_id) = char_id_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_id = ?, weapon_name = ?, rarity = ?, level = ?, rank = ? WHERE character_id = ?",
                (id, &weapon_name, rarity, level, rank, char_id),
            )
            .map_err(|e| e.to_string())?;
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
    let weapon_type = normalize_weapon_type(&weapon_type);

    conn.execute(
        "INSERT INTO weapons_inventory (weapon_name, weapon_type, rarity, rank, level, equipped_on, category, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (&weapon_name, &weapon_type, rarity, rank, level, &equipped_on, category, &notes),
    )
    .map_err(|e| e.to_string())?;

    // Capture the id of the row we just inserted.
    let new_id = conn.last_insert_rowid();

    // If equipping to a character, update character_weapons using the real id.
    if equipped_on != "Nobody" {
        let char_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0),
        );
        if let Ok(char_id) = char_id_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_id = ?, weapon_name = ?, rarity = ?, level = ?, rank = ? WHERE character_id = ?",
                (new_id, &weapon_name, rarity, level, rank, char_id),
            )
            .map_err(|e| e.to_string())?;
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

    // Fetch equipped_on before deletion so we can clean up the character slot.
    let equipped_on: String = conn
        .query_row(
            "SELECT equipped_on FROM weapons_inventory WHERE id = ?",
            [id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // If the weapon was equipped, clear the character slot identified by weapon_id,
    // not by name, so a duplicate copy on another character is left untouched.
    if equipped_on != "Nobody" {
        let char_id_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT id FROM characters WHERE character_name = ?",
            [&equipped_on],
            |row| row.get(0),
        );
        if let Ok(char_id) = char_id_result {
            conn.execute(
                "UPDATE character_weapons SET weapon_id = NULL, weapon_name = 'None', rarity = NULL, level = NULL, rank = NULL WHERE character_id = ? AND weapon_id = ?",
                (char_id, id),
            )
            .map_err(|e| e.to_string())?;
        }
    }

    conn.execute("DELETE FROM weapons_inventory WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok("Weapon deleted successfully".to_string())
}