use crate::db::init_db;
use rusqlite::{Result, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct EchoBuild {
    pub id: i64,
    pub character_id: i64,
    pub set_bonus: Option<String>,
    pub set_effect: Option<String>,
    pub overall_quality: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Echo {
    pub id: i64,
    pub build_id: i64,
    pub echo_name: Option<String>,
    pub cost: Option<i64>,
    pub level: Option<i64>,
    pub rarity: Option<i64>,
    pub main_stat: Option<String>,
    pub main_stat_value: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EchoSubstat {
    pub id: i64,
    pub echo_id: i64,
    pub stat_name: String,
    pub stat_value: String,
}

#[tauri::command]
pub fn get_echo_build(app: tauri::AppHandle, character_id: i64) -> Result<Option<EchoBuild>, String> {
    let conn = init_db(&app)?;
    
    let build = conn
        .query_row(
            "SELECT id, character_id, set_bonus, set_effect, overall_quality, notes FROM echo_builds WHERE character_id = ?",
            [character_id],
            |row| {
                Ok(EchoBuild {
                    id: row.get(0)?,
                    character_id: row.get(1)?,
                    set_bonus: row.get(2)?,
                    set_effect: row.get(3)?,
                    overall_quality: row.get(4)?,
                    notes: row.get(5)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(build)
}

#[tauri::command]
pub fn get_echoes(app: tauri::AppHandle, build_id: i64) -> Result<Vec<Echo>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, build_id, echo_name, cost, level, rarity, main_stat, main_stat_value, notes FROM echoes WHERE build_id = ?")
        .map_err(|e| e.to_string())?;
    
    let echoes = stmt
        .query_map([build_id], |row| {
            Ok(Echo {
                id: row.get(0)?,
                build_id: row.get(1)?,
                echo_name: row.get(2)?,
                cost: row.get(3)?,
                level: row.get(4)?,
                rarity: row.get(5)?,
                main_stat: row.get(6)?,
                main_stat_value: row.get(7)?,
                notes: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(echoes)
}

#[tauri::command]
pub fn get_echo_substats(app: tauri::AppHandle, echo_id: i64) -> Result<Vec<EchoSubstat>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, echo_id, stat_name, stat_value FROM echo_substats WHERE echo_id = ?")
        .map_err(|e| e.to_string())?;
    
    let substats = stmt
        .query_map([echo_id], |row| {
            Ok(EchoSubstat {
                id: row.get(0)?,
                echo_id: row.get(1)?,
                stat_name: row.get(2)?,
                stat_value: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(substats)
}

#[tauri::command]
pub fn update_echo_build(
    app: tauri::AppHandle,
    build_id: i64,
    set_bonus: Option<String>,
    set_effect: Option<String>,
    overall_quality: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echo_builds SET set_bonus = ?, set_effect = ?, overall_quality = ?, notes = ? WHERE id = ?",
        (set_bonus, set_effect, overall_quality, notes, build_id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo build updated successfully".to_string())
}

#[tauri::command]
pub fn update_echo(
    app: tauri::AppHandle,
    id: i64,
    echo_name: Option<String>,
    cost: Option<i64>,
    rarity: Option<i64>,
    level: Option<i64>,
    main_stat: Option<String>,
    main_stat_value: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echoes SET echo_name = ?, cost = ?, rarity = ?, level = ?, main_stat = ?, main_stat_value = ?, notes = ? WHERE id = ?",
        (echo_name, cost, rarity, level, main_stat, main_stat_value, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo updated successfully".to_string())
}

#[tauri::command]
pub fn add_echo(
    app: tauri::AppHandle,
    build_id: i64,
    echo_name: String,
    cost: i64,
    level: i64,
    rarity: i64,
    main_stat: Option<String>,
    main_stat_value: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO echoes (build_id, echo_name, cost, level, rarity, main_stat, main_stat_value, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (build_id, echo_name, cost, level, rarity, main_stat, main_stat_value, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo added successfully".to_string())
}

#[tauri::command]
pub fn update_echo_substat(
    app: tauri::AppHandle,
    id: i64,
    stat_name: String,
    stat_value: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echo_substats SET stat_name = ?, stat_value = ? WHERE id = ?",
        (stat_name, stat_value, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo substat updated successfully".to_string())
}

#[tauri::command]
pub fn add_echo_substat(
    app: tauri::AppHandle,
    echo_id: i64,
    stat_name: String,
    stat_value: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO echo_substats (echo_id, stat_name, stat_value) VALUES (?, ?, ?)",
        (echo_id, stat_name, stat_value),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo substat added successfully".to_string())
}

#[tauri::command]
pub fn delete_echo_substat(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "DELETE FROM echo_substats WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo substat deleted successfully".to_string())
}

#[tauri::command]
pub fn delete_echo(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Delete all substats for this echo first
    conn.execute(
        "DELETE FROM echo_substats WHERE echo_id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    // Delete the echo
    conn.execute(
        "DELETE FROM echoes WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo deleted successfully".to_string())
}