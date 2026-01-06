use crate::db::get_db_path;

#[tauri::command]
pub async fn import_database(app: tauri::AppHandle, source_path: String) -> Result<String, String> {
    let dest_path = get_db_path(&app)?;
    
    std::fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to import database: {}", e))?;
    
    Ok("Database imported successfully".to_string())
}

#[tauri::command]
pub async fn export_database(app: tauri::AppHandle, dest_path: String) -> Result<String, String> {
    let source_path = get_db_path(&app)?;
    
    std::fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to export database: {}", e))?;
    
    Ok("Database exported successfully".to_string())
}