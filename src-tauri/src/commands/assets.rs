// src-tauri/src/commands/assets.rs
//! Tauri commands for asset management

use tauri::{AppHandle, Manager, State};
use tokio::sync::RwLock;
use crate::assets::{AssetManager, AssetType};

pub type AssetManagerState = RwLock<AssetManager>;

/// Initialize the asset manager
#[tauri::command]
pub async fn init_assets(app: AppHandle) -> Result<(), String> {
    let manager = AssetManager::new(app.clone())
        .map_err(|e| format!("Failed to initialize asset manager: {}", e))?;
    
    app.manage(RwLock::new(manager));
    Ok(())
}

/// Get asset as base64 encoded string
#[tauri::command]
pub async fn get_asset(
    asset_type: String,
    name: String,
    weapon_type: Option<String>,
    state: State<'_, AssetManagerState>,
) -> Result<String, String> {
    let manager = state.read().await;
    let asset_type_enum = parse_asset_type(&asset_type)?;
    
    // For elements, resolve the display name to the actual filename
    let resolved_name = if matches!(asset_type_enum, AssetType::Element) {
        resolve_element_filename(&name)
    } else {
        name.clone()
    };
    
    // Step 1: Try cache first (no subdirectory)
    if let Ok(result) = manager.get_asset_base64(asset_type_enum, &resolved_name) {
        return Ok(result);
    }
    
    // Step 2: If cache failed and this is a weapon, resolve display name to filename and try subdirectory
    //if matches!(asset_type_enum, AssetType::Weapon) {
   
    // Use the resolved filename if available, otherwise use the original name
    let filename = resolved_name.clone();
    let subdir_path = if matches!(asset_type_enum, AssetType::Weapon) {
        if let Some(wtype) = &weapon_type {
            format!("{}/{}", wtype, filename)
        } else {
            format!("{}", filename)
        }
    } else {
        format!("{}", filename)
    };

    if let Ok(result) = manager.get_asset_base64(asset_type_enum, &subdir_path) {
        return Ok(result);
    }

    // Both attempts failed
    Err(format!("Failed to get asset: Asset not found: {}/{} (weapon_type: {:?})", asset_type, resolved_name, weapon_type))
}

/// Get local path to an asset
#[tauri::command]
pub async fn get_asset_path(
    asset_type: String,
    name: String,
    weapon_type: Option<String>,
    state: State<'_, AssetManagerState>,
) -> Result<String, String> {
    let manager = state.read().await;
    let asset_type_enum = parse_asset_type(&asset_type)?;
    
    let resolved_name = if matches!(asset_type_enum, AssetType::Element) {
        resolve_element_filename(&name)
    } else {
        name.clone()
    };
    
    // Step 1: Try cache first (no subdirectory)
    if let Some(path) = manager.get_asset_path(asset_type_enum, &resolved_name) {
        return Ok(path.to_string_lossy().to_string());
    }
    
    // Step 2: If cache failed and this is a weapon, resolve display name to filename and try subdirectory
    if matches!(asset_type_enum, AssetType::Weapon) {
        // Use the resolved filename if available, otherwise use the original name
        let filename = resolved_name.clone();
        
        if let Some(wtype) = &weapon_type {
            let subdir_path = format!("{}/{}", wtype, filename);
            if let Some(path) = manager.get_asset_path(asset_type_enum, &subdir_path) {
                return Ok(path.to_string_lossy().to_string());
            }
        } else {
        }
    }
    
    // Both attempts failed
    Err(format!("Asset not found: {:?}/{} (weapon_type: {:?})", asset_type_enum, resolved_name, weapon_type))
}

/// Resolve element display name to filename WITH extension
fn resolve_element_filename(name: &str) -> String {
    let lower = name.to_lowercase();
    
    if lower.ends_with(".png") {
        if lower.starts_with("element_") {
            return lower;
        } else {
            let without_ext = lower.trim_end_matches(".png");
            return format!("element_{}.png", without_ext);
        }
    }
    
    if lower.starts_with("element_") {
        return format!("{}.png", lower);
    }
    
    format!("element_{}.png", lower)
}

/// Helper to parse asset type from string
fn parse_asset_type(s: &str) -> Result<AssetType, String> {
    match s.to_lowercase().as_str() {
        "character" | "characters" => Ok(AssetType::Character),
        "weapon" | "weapons" => Ok(AssetType::Weapon),
        "echo" | "echoes" => Ok(AssetType::Echo),
        "echo_set" | "echoset" | "echo_sets" => Ok(AssetType::EchoSet),
        "element" | "elements" => Ok(AssetType::Element),
        "misc" => Ok(AssetType::Misc),
        _ => Err(format!("Invalid asset type: {}", s)),
    }
}


