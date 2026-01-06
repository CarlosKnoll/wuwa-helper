use crate::db::init_db;
use rusqlite::{Result, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerOfAdversity {
    pub id: i64,
    pub last_reset: String,
    pub total_stars: i64,
    pub astrite_earned: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerDetails {
    pub id: i64,
    pub tower_type: String,
    pub stars_achieved: i64,
    pub max_stars: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerAreaEffect {
    pub id: i64,
    pub tower_type: String,
    pub floor_range: String,
    pub effect_description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerTeam {
    pub id: i64,
    pub tower_type: String,
    pub floor_number: i64,
    pub character1: String,
    pub character2: String,
    pub character3: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhimperingWastes {
    pub id: i64,
    pub last_reset: String,
    pub chasm_highest_stage: i64,
    pub chasm_total_points: i64,
    pub chasm_astrite: i64,
    pub torrents_total_points: i64,
    pub torrents_astrite: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TorrentsStage {
    pub id: i64,
    pub stage_number: i64,
    pub character1: String,
    pub character2: String,
    pub character3: String,
    pub token: String,
    pub points: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TroopMatrix {
    pub id: i64,
    pub unlocked: bool,
    pub progress: String,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn get_tower_of_adversity(app: tauri::AppHandle) -> Result<TowerOfAdversity, String> {
    let conn = init_db(&app)?;
    
    let tower = conn
        .query_row(
            "SELECT id, last_reset, total_stars, astrite_earned, notes FROM tower_of_adversity WHERE id = 1",
            [],
            |row| {
                Ok(TowerOfAdversity {
                    id: row.get(0)?,
                    last_reset: row.get(1)?,
                    total_stars: row.get(2)?,
                    astrite_earned: row.get(3)?,
                    notes: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(tower)
}

#[tauri::command]
pub fn get_tower_details(app: tauri::AppHandle) -> Result<Vec<TowerDetails>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, stars_achieved, max_stars, notes FROM tower_details")
        .map_err(|e| e.to_string())?;
    
    let details = stmt
        .query_map([], |row| {
            Ok(TowerDetails {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                stars_achieved: row.get(2)?,
                max_stars: row.get(3)?,
                notes: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(details)
}

#[tauri::command]
pub fn get_tower_area_effects(app: tauri::AppHandle) -> Result<Vec<TowerAreaEffect>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, floor_range, effect_description FROM tower_area_effects")
        .map_err(|e| e.to_string())?;
    
    let effects = stmt
        .query_map([], |row| {
            Ok(TowerAreaEffect {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                floor_range: row.get(2)?,
                effect_description: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(effects)
}

#[tauri::command]
pub fn get_tower_teams(app: tauri::AppHandle) -> Result<Vec<TowerTeam>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, floor_number, character1, character2, character3 FROM tower_teams")
        .map_err(|e| e.to_string())?;
    
    let teams = stmt
        .query_map([], |row| {
            Ok(TowerTeam {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                floor_number: row.get(2)?,
                character1: row.get(3)?,
                character2: row.get(4)?,
                character3: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(teams)
}

#[tauri::command]
pub fn get_whimpering_wastes(app: tauri::AppHandle) -> Result<WhimperingWastes, String> {
    let conn = init_db(&app)?;
    
    let wastes = conn
        .query_row(
            "SELECT id, last_reset, chasm_highest_stage, chasm_total_points, chasm_astrite, torrents_total_points, torrents_astrite, notes FROM whimpering_wastes WHERE id = 1",
            [],
            |row| {
                Ok(WhimperingWastes {
                    id: row.get(0)?,
                    last_reset: row.get(1)?,
                    chasm_highest_stage: row.get(2)?,
                    chasm_total_points: row.get(3)?,
                    chasm_astrite: row.get(4)?,
                    torrents_total_points: row.get(5)?,
                    torrents_astrite: row.get(6)?,
                    notes: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(wastes)
}

#[tauri::command]
pub fn get_torrents_stages(app: tauri::AppHandle) -> Result<Vec<TorrentsStage>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, stage_number, character1, character2, character3, token, points FROM torrents_stages ORDER BY stage_number")
        .map_err(|e| e.to_string())?;
    
    let stages = stmt
        .query_map([], |row| {
            Ok(TorrentsStage {
                id: row.get(0)?,
                stage_number: row.get(1)?,
                character1: row.get(2)?,
                character2: row.get(3)?,
                character3: row.get(4)?,
                token: row.get(5)?,
                points: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(stages)
}

#[tauri::command]
pub fn get_troop_matrix(app: tauri::AppHandle) -> Result<Option<TroopMatrix>, String> {
    let conn = init_db(&app)?;
    
    let matrix = conn
        .query_row(
            "SELECT id, unlocked, progress, notes FROM troop_matrix WHERE id = 1",
            [],
            |row| {
                Ok(TroopMatrix {
                    id: row.get(0)?,
                    unlocked: row.get(1)?,
                    progress: row.get(2)?,
                    notes: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(matrix)
}

// Update commands

#[tauri::command]
pub fn update_tower_of_adversity(
    app: tauri::AppHandle,
    total_stars: i64,
    astrite_earned: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_of_adversity SET total_stars = ?, astrite_earned = ?, notes = ? WHERE id = 1",
        (total_stars, astrite_earned, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower of Adversity updated successfully".to_string())
}

#[tauri::command]
pub fn update_tower_details(
    app: tauri::AppHandle,
    id: i64,
    stars_achieved: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_details SET stars_achieved = ?, notes = ? WHERE id = ?",
        (stars_achieved, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower details updated successfully".to_string())
}

#[tauri::command]
pub fn update_whimpering_wastes(
    app: tauri::AppHandle,
    chasm_highest_stage: i64,
    chasm_total_points: i64,
    chasm_astrite: i64,
    torrents_total_points: i64,
    torrents_astrite: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE whimpering_wastes SET chasm_highest_stage = ?, chasm_total_points = ?, chasm_astrite = ?, 
         torrents_total_points = ?, torrents_astrite = ?, notes = ? WHERE id = 1",
        (chasm_highest_stage, chasm_total_points, chasm_astrite, torrents_total_points, torrents_astrite, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Whimpering Wastes updated successfully".to_string())
}

#[tauri::command]
pub fn update_troop_matrix(
    app: tauri::AppHandle,
    progress: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE troop_matrix SET progress = ?, notes = ? WHERE id = 1",
        (progress, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Troop Matrix updated successfully".to_string())
}

#[tauri::command]
pub fn update_tower_team(
    app: tauri::AppHandle,
    id: i64,
    character1: String,
    character2: String,
    character3: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_teams SET character1 = ?, character2 = ?, character3 = ? WHERE id = ?",
        (character1, character2, character3, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower team updated successfully".to_string())
}

#[tauri::command]
pub fn update_torrents_stage(
    app: tauri::AppHandle,
    id: i64,
    character1: String,
    character2: String,
    character3: String,
    token: String,
    points: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE torrents_stages SET character1 = ?, character2 = ?, character3 = ?, token = ?, points = ? WHERE id = ?",
        (character1, character2, character3, token, points, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Torrents stage updated successfully".to_string())
}

#[tauri::command]
pub fn update_tower_last_reset(
    app: tauri::AppHandle,
    last_reset: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_of_adversity SET last_reset = ? WHERE id = 1",
        [last_reset],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Last reset date updated successfully".to_string())
}

#[tauri::command]
pub fn update_wastes_last_reset(
    app: tauri::AppHandle,
    last_reset: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE whimpering_wastes SET last_reset = ? WHERE id = 1",
        [last_reset],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Last reset date updated successfully".to_string())
}