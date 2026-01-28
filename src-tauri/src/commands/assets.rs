// src-tauri/src/commands/assets.rs
//! Tauri commands for asset management

use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;

// Import from the ROOT assets module (not commands::assets)
use crate::assets::{AssetManager, AssetType, CacheStats, UpdateProgress, UpdateSummary};

pub type AssetManagerState = Mutex<AssetManager>;

/// Initialize the asset manager
#[tauri::command]
pub async fn init_assets(app: AppHandle) -> Result<(), String> {
    let manager = AssetManager::new(app.clone())
        .map_err(|e| format!("Failed to initialize asset manager: {}", e))?;
    
    app.manage(Mutex::new(manager));
    Ok(())
}

/// Get asset as base64 encoded string
#[tauri::command]
pub async fn get_asset(
    asset_type: String,
    name: String,
    state: State<'_, AssetManagerState>,
) -> Result<String, String> {
    let manager = state.lock().await;
    let asset_type = parse_asset_type(&asset_type)?;
    
    manager
        .get_asset_base64(asset_type, &name)
        .map_err(|e| format!("Failed to get asset: {}", e))
}

/// Get local path to an asset
#[tauri::command]
pub async fn get_asset_path(
    asset_type: String,
    name: String,
    state: State<'_, AssetManagerState>,
) -> Result<String, String> {
    let manager = state.lock().await;
    let asset_type = parse_asset_type(&asset_type)?;
    
    manager
        .get_asset_path(asset_type, &name)
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| format!("Asset not found: {:?}/{}", asset_type, name))
}

/// Update all assets from Prydwen
#[tauri::command]
pub async fn update_assets(
    app: AppHandle,
    state: State<'_, AssetManagerState>,
) -> Result<UpdateSummary, String> {
    // Clone app handle for use in callback
    let app_clone = app.clone();
    
    let mut manager = state.lock().await;
    
    manager
        .update_assets(Some(Box::new(move |progress: UpdateProgress| {
            // Emit progress event to frontend using Tauri v2 Emitter trait
            let _ = app_clone.emit("asset-update-progress", &progress);
        })))
        .await
        .map_err(|e| format!("Failed to update assets: {}", e))
}

/// Check if assets should be updated
#[tauri::command]
pub async fn should_update_assets(state: State<'_, AssetManagerState>) -> Result<bool, String> {
    let manager = state.lock().await;
    Ok(manager.should_update())
}

/// Get cache statistics
#[tauri::command]
pub async fn get_asset_stats(state: State<'_, AssetManagerState>) -> Result<CacheStats, String> {
    let manager = state.lock().await;
    Ok(manager.get_stats())
}

/// Helper to parse asset type from string
fn parse_asset_type(s: &str) -> Result<AssetType, String> {
    match s.to_lowercase().as_str() {
        "character" | "characters" => Ok(AssetType::Character),
        "weapon" | "weapons" => Ok(AssetType::Weapon),
        "echo" | "echoes" => Ok(AssetType::Echo),
        "element" | "elements" => Ok(AssetType::Element),
        "misc" => Ok(AssetType::Misc),
        _ => Err(format!("Invalid asset type: {}", s)),
    }
}