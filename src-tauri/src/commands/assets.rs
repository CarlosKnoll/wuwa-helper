// src-tauri/src/commands/assets.rs
//! Tauri commands for asset management

use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::RwLock;
use std::sync::Mutex;

use crate::assets::{AssetManager, AssetType, CacheStats, UpdateProgress, UpdateSummary};
use crate::commands::asset_resolver::AssetResolverState;

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
    resolver_state: State<'_, AssetResolverState>,
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
        // Try to resolve the display name to get the actual filename
    let actual_filename = if let Ok(resolver_guard) = resolver_state.try_lock() {
        if let Some(resolver) = resolver_guard.as_ref() {
            if let Some(metadata) = resolver.resolve_by_name(&resolved_name) {
                Some(metadata.filename.clone())
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };
    
    // Use the resolved filename if available, otherwise use the original name
    let filename = actual_filename.unwrap_or_else(|| resolved_name.clone());
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
    resolver_state: State<'_, AssetResolverState>,
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
        // Try to resolve the display name to get the actual filename
        let actual_filename = if let Ok(resolver_guard) = resolver_state.try_lock() {
            if let Some(resolver) = resolver_guard.as_ref() {
                if let Some(metadata) = resolver.resolve_by_name(&resolved_name) {
                    Some(metadata.filename.clone())
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };
        
        // Use the resolved filename if available, otherwise use the original name
        let filename = actual_filename.unwrap_or_else(|| resolved_name.clone());
        
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

/// Update all assets from Prydwen
#[tauri::command]
pub async fn update_assets(
    app: AppHandle,
    state: State<'_, AssetManagerState>,
) -> Result<UpdateSummary, String> {
    let app_clone = app.clone();
    let mut manager = state.write().await;
    
    manager
        .update_assets(Some(Box::new(move |progress: UpdateProgress| {
            let _ = app_clone.emit("asset-update-progress", &progress);
        })))
        .await
        .map_err(|e| format!("Failed to update assets: {}", e))
}

/// Check if assets should be updated
#[tauri::command]
pub async fn should_update_assets(state: State<'_, AssetManagerState>) -> Result<bool, String> {
    let manager = state.read().await;
    Ok(manager.should_update())
}

/// Get cache statistics
#[tauri::command]
pub async fn get_asset_stats(state: State<'_, AssetManagerState>) -> Result<CacheStats, String> {
    let manager = state.read().await;
    Ok(manager.get_stats())
}

/// Rebuild the asset cache by rescanning all asset files
#[tauri::command]
pub fn rebuild_asset_cache(
    asset_manager: State<'_, Mutex<AssetManager>>
) -> Result<String, String> {
    let mut manager = asset_manager.lock()
        .map_err(|e| format!("Failed to lock asset manager: {}", e))?;
    
    // Get stats before rebuild
    let stats_before = manager.get_stats();
    
    // Perform the rebuild (this is now synchronous)
    let summary = manager.rebuild_cache()
        .map_err(|e| format!("Failed to rebuild cache: {}", e))?;
    
    let stats_after = manager.get_stats();
    
    Ok(format!(
        "Asset cache rebuilt successfully!\n\n\
        Before: {} assets\n\
        After: {} assets\n\
        Cached: {} assets\n\
        Failed: {}",
        stats_before.total_assets,
        stats_after.total_assets,
        summary.cached,
        summary.failed
    ))
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


