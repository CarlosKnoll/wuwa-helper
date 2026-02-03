// src-tauri/src/commands/asset_resolver.rs
//! Tauri commands for advanced asset resolution

use tauri::{AppHandle, State, Manager}; // Add Manager trait
use tokio::sync::Mutex;
use serde::Deserialize; // Remove unused Serialize

use crate::assets::{AssetResolver, AssetMetadata, AssetFilters};

pub type AssetResolverState = Mutex<Option<AssetResolver>>;

/// Initialize the asset resolver (should be called after assets are downloaded)
#[tauri::command]
pub async fn init_asset_resolver(
    app: AppHandle,
    state: State<'_, AssetResolverState>,
) -> Result<(), String> {
    // Load or build the asset mapper
    // Use resource_dir to stay relative to the executable (portable)
    let base_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .join("resources")
        .join("assets");

    let mapper_path = base_path.join("asset_mapping.json");
    
    let mapper = if mapper_path.exists() {
        // Load from cache
        crate::assets::AssetMapper::load_from_file(&mapper_path)
            .map_err(|e| format!("Failed to load asset mapping: {}", e))?
    } else {
        // Build from scratch (this should happen during first download)
        let client = reqwest::Client::new();
        let mapper = crate::assets::AssetMapper::build_from_prydwen(&client)
            .await
            .map_err(|e| format!("Failed to build asset mapping: {}", e))?;
        
        // Ensure the directory exists before saving
        if let Some(parent) = mapper_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory for asset mapping: {}", e))?;
        }
        
        // Save for future use
        mapper.save_to_file(&mapper_path)
            .map_err(|e| format!("Failed to save asset mapping: {}", e))?;
        
        mapper
    };

    let resolver = AssetResolver::new(mapper);
    let mut state_guard = state.lock().await;
    *state_guard = Some(resolver);
    
    Ok(())
}

/// Resolve an asset by its display name
#[tauri::command]
pub async fn resolve_asset_by_name(
    name: String,
    state: State<'_, AssetResolverState>,
) -> Result<Option<AssetMetadata>, String> {
    let state_guard = state.lock().await;
    let resolver = state_guard.as_ref()
        .ok_or("Asset resolver not initialized")?;
    
    Ok(resolver.resolve_by_name(&name).cloned())
}

/// Get the filename for an asset (by name or filename)
#[tauri::command]
pub async fn get_asset_filename(
    identifier: String,
    state: State<'_, AssetResolverState>,
) -> Result<Option<String>, String> {
    let state_guard = state.lock().await;
    let resolver = state_guard.as_ref()
        .ok_or("Asset resolver not initialized")?;
    
    Ok(resolver.get_asset_filename(&identifier))
}

/// Fuzzy search for assets
#[tauri::command]
pub async fn search_assets(
    query: String,
    state: State<'_, AssetResolverState>,
) -> Result<Vec<AssetMetadata>, String> {
    let state_guard = state.lock().await;
    let resolver = state_guard.as_ref()
        .ok_or("Asset resolver not initialized")?;
    
    Ok(resolver.fuzzy_search(&query).into_iter().cloned().collect())
}

/// Get all assets of a specific type
#[tauri::command]
pub async fn get_assets_by_type(
    asset_type: String,
    state: State<'_, AssetResolverState>,
) -> Result<Vec<AssetMetadata>, String> {
    let state_guard = state.lock().await;
    let resolver = state_guard.as_ref()
        .ok_or("Asset resolver not initialized")?;
    
    Ok(resolver.get_by_type(&asset_type).into_iter().cloned().collect())
}

/// Filter assets by criteria
#[tauri::command]
pub async fn filter_assets(
    filters: FilterRequest,
    state: State<'_, AssetResolverState>,
) -> Result<Vec<AssetMetadata>, String> {
    let state_guard = state.lock().await;
    let resolver = state_guard.as_ref()
        .ok_or("Asset resolver not initialized")?;
    
    let asset_filters = AssetFilters {
        asset_type: filters.asset_type,
        rarity: filters.rarity,
        element: filters.element,
        weapon_type: filters.weapon_type,
        tags: filters.tags,
    };
    
    Ok(resolver.filter(asset_filters).into_iter().cloned().collect())
}

/// Categorize an unknown numeric asset ID
#[tauri::command]
pub async fn categorize_asset(
    filename: String,
    state: State<'_, AssetResolverState>,
) -> Result<Option<String>, String> {
    let state_guard = state.lock().await;
    let resolver = state_guard.as_ref()
        .ok_or("Asset resolver not initialized")?;
    
    Ok(resolver.categorize_unknown(&filename))
}

#[derive(Debug, Deserialize)]
pub struct FilterRequest {
    pub asset_type: Option<String>,
    pub rarity: Option<u8>,
    pub element: Option<String>,
    pub weapon_type: Option<String>,
    pub tags: Vec<String>,
}