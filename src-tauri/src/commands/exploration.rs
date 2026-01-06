use crate::db::{init_db, ExplorationRegion, ExplorationMap};
use rusqlite::Result;

#[tauri::command]
pub fn get_exploration_regions(app: tauri::AppHandle) -> Result<Vec<ExplorationRegion>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, region_name, notes FROM exploration_regions")
        .map_err(|e| e.to_string())?;
    
    let regions = stmt
        .query_map([], |row| {
            Ok(ExplorationRegion {
                id: row.get(0)?,
                region_name: row.get(1)?,
                notes: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(regions)
}

#[tauri::command]
pub fn get_exploration_maps(app: tauri::AppHandle, region_id: i64) -> Result<Vec<ExplorationMap>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, region_id, map_name, exploration_percent, notes FROM exploration_maps WHERE region_id = ?")
        .map_err(|e| e.to_string())?;
    
    let maps = stmt
        .query_map([region_id], |row| {
            Ok(ExplorationMap {
                id: row.get(0)?,
                region_id: row.get(1)?,
                map_name: row.get(2)?,
                exploration_percent: row.get(3)?,
                notes: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(maps)
}

#[tauri::command]
pub fn update_exploration_map(
    app: tauri::AppHandle,
    id: i64,
    exploration_percent: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE exploration_maps SET exploration_percent = ?, notes = ? WHERE id = ?",
        (exploration_percent, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Exploration updated successfully".to_string())
}