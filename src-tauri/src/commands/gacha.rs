use crate::db::{init_db, PityStatus};
use rusqlite::Result;

#[tauri::command]
pub fn get_pity_status(app: tauri::AppHandle) -> Result<Vec<PityStatus>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, banner_type, current_pity, guaranteed_next_fivestar, notes FROM pity_status")
        .map_err(|e| e.to_string())?;
    
    let pity = stmt
        .query_map([], |row| {
            Ok(PityStatus {
                id: row.get(0)?,
                banner_type: row.get(1)?,
                current_pity: row.get(2)?,
                guaranteed_next_fivestar: row.get(3)?,
                notes: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(pity)
}

#[tauri::command]
pub fn update_pity(
    app: tauri::AppHandle,
    id: i64,
    current_pity: i64,
    guaranteed_next_fivestar: Option<bool>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE pity_status SET current_pity = ?, guaranteed_next_fivestar = ?, notes = ? WHERE id = ?",
        (current_pity, guaranteed_next_fivestar, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Pity updated successfully".to_string())
}