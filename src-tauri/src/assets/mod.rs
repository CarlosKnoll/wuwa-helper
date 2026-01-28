// src-tauri/src/assets/mod.rs
//! Asset management module for Wuthering Waves assets from Prydwen.gg
//! 
//! This module handles:
//! - Downloading assets from Prydwen
//! - Caching assets locally
//! - Serving assets to the frontend
//! - Auto-updating on app launch

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub mod cache;
pub mod downloader;
pub mod models;
pub mod mapper;
pub mod resolver;
pub mod hardcoded_mappings;

pub use mapper::{AssetMapper, AssetMetadata};
pub use resolver::{AssetResolver, AssetFilters};
pub use cache::AssetCache;
pub use downloader::AssetDownloader;
pub use models::*;

/// Asset manager that coordinates downloads and caching
pub struct AssetManager {
    app_handle: AppHandle,
    cache: AssetCache,
    downloader: AssetDownloader,
    base_path: PathBuf,
}

impl AssetManager {
    /// Create a new asset manager
    pub fn new(app_handle: AppHandle) -> Result<Self, AssetError> {
        // Fixed for Tauri v2: use path() instead of path_resolver()
        let base_path = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| AssetError::PathError(format!("Failed to get app data dir: {}", e)))?
            .join("assets");

        // Create assets directory if it doesn't exist
        fs::create_dir_all(&base_path)?;

        let cache = AssetCache::load(&base_path)?;
        let downloader = AssetDownloader::new();

        Ok(Self {
            app_handle,
            cache,
            downloader,
            base_path,
        })
    }

    /// Get path to a specific asset
    pub fn get_asset_path(&self, asset_type: AssetType, name: &str) -> Option<PathBuf> {
        self.cache.get_asset_path(asset_type, name)
    }

    /// Get asset as base64 (for serving to frontend)
    pub fn get_asset_base64(&self, asset_type: AssetType, name: &str) -> Result<String, AssetError> {
        let path = self.get_asset_path(asset_type, name)
            .ok_or(AssetError::NotFound(format!("{}/{}", asset_type, name)))?;
        
        let bytes = fs::read(&path)?;
        // Fixed: use base64::Engine::encode instead of deprecated base64::encode
        use base64::Engine;
        Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
    }

    /// Update all assets from Prydwen
    pub async fn update_assets(&mut self, progress_callback: Option<Box<dyn Fn(UpdateProgress) + Send + Sync>>) -> Result<UpdateSummary, AssetError> {
        let summary = self.downloader.download_all(&self.base_path, &mut self.cache, progress_callback).await?;
        self.cache.save(&self.base_path)?;
        Ok(summary)
    }

    /// Check if assets need updating (e.g., haven't been updated in 24 hours)
    pub fn should_update(&self) -> bool {
        self.cache.should_update()
    }

    /// Get cache statistics
    pub fn get_stats(&self) -> CacheStats {
        self.cache.get_stats()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AssetError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    
    #[error("Path error: {0}")]
    PathError(String),
    
    #[error("Asset not found: {0}")]
    NotFound(String),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    // Fixed: Add From implementation for Box<dyn Error>
    #[error("Generic error: {0}")]
    Generic(String),
}

// Implement From for Box<dyn Error + Send + Sync>
impl From<Box<dyn std::error::Error + Send + Sync>> for AssetError {
    fn from(err: Box<dyn std::error::Error + Send + Sync>) -> Self {
        AssetError::Generic(err.to_string())
    }
}