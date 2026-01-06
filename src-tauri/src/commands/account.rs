use crate::db::{init_db, AccountInfo, Resources};
use rusqlite::Result;

#[tauri::command]
pub fn get_account_info(app: tauri::AppHandle) -> Result<AccountInfo, String> {
    let conn = init_db(&app)?;
    
    let info = conn
        .query_row(
            "SELECT id, last_updated, union_level, notes FROM account_info WHERE id = 1",
            [],
            |row| {
                Ok(AccountInfo {
                    id: row.get(0)?,
                    last_updated: row.get(1)?,
                    union_level: row.get(2)?,
                    notes: row.get(3)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(info)
}

#[tauri::command]
pub fn get_resources(app: tauri::AppHandle) -> Result<Resources, String> {
    let conn = init_db(&app)?;
    
    let resources = conn
        .query_row(
            "SELECT id, astrite, lustrous_tide, radiant_tide, forged_tide, afterglow_coral, oscillated_coral, shell_credits, notes FROM resources WHERE id = 1",
            [],
            |row| {
                Ok(Resources {
                    id: row.get(0)?,
                    astrite: row.get(1)?,
                    lustrous_tide: row.get(2)?,
                    radiant_tide: row.get(3)?,
                    forged_tide: row.get(4)?,
                    afterglow_coral: row.get(5)?,
                    oscillated_coral: row.get(6)?,
                    shell_credits: row.get(7)?,
                    notes: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(resources)
}

#[tauri::command]
pub fn update_resources(
    app: tauri::AppHandle,
    astrite: i64,
    lustrous_tide: i64,
    radiant_tide: i64,
    forged_tide: i64,
    afterglow_coral: i64,
    oscillated_coral: i64,
    shell_credits: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE resources SET astrite = ?, lustrous_tide = ?, radiant_tide = ?, forged_tide = ?, 
         afterglow_coral = ?, oscillated_coral = ?, shell_credits = ?, notes = ? WHERE id = 1",
        (astrite, lustrous_tide, radiant_tide, forged_tide, afterglow_coral, oscillated_coral, shell_credits, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Resources updated successfully".to_string())
}