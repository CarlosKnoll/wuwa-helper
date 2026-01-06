use crate::db::{init_db, Weapon};
use rusqlite::Result;

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
    equipped_on: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE weapons_inventory SET level = ?, rank = ?, equipped_on = ?, notes = ? WHERE id = ?",
        (level, rank, equipped_on, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Weapon updated successfully".to_string())
}

#[tauri::command]
pub fn add_weapon(
    app: tauri::AppHandle,
    weapon_name: String,
    weapon_type: String,
    rarity: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO weapons_inventory (weapon_name, weapon_type, rarity, rank, level, equipped_on, category) 
         VALUES (?, ?, ?, 1, 1, 'Nobody', 'owned')",
        (weapon_name, weapon_type, rarity),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Weapon added successfully".to_string())
}