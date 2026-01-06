use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::Manager;

pub fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?
        .parent()
        .ok_or_else(|| "Failed to get executable directory".to_string())?
        .to_path_buf();
    let data_dir = exe_dir.join("data");
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;
    Ok(data_dir.join("wuwa_data.db"))
}

pub fn init_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let db_path = get_db_path(app)?;
    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}