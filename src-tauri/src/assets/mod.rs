// src-tauri/src/assets/mod.rs
//! Asset management module for Wuthering Waves assets from Prydwen.gg

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub mod cache;
pub mod downloader;
pub mod models;
pub mod mapper;
pub mod resolver;
pub mod mappings;

pub use mapper::{AssetMapper, AssetMetadata};
pub use resolver::{AssetResolver, AssetFilters};
pub use cache::AssetCache;
pub use downloader::AssetDownloader;
pub use models::*;

pub struct AssetManager {
    app_handle: AppHandle,
    cache: AssetCache,
    downloader: AssetDownloader,
    resolver: AssetResolver,
    base_path: PathBuf,
}

impl AssetManager {
    pub fn new(app_handle: AppHandle) -> Result<Self, AssetError> {
        // Use resource_dir for bundled assets
        // In dev: points to src-tauri/target/debug/resources/
        // In prod: points to the bundled resources folder next to the exe
        let base_path = app_handle
            .path()
            .resource_dir()
            .map_err(|e| AssetError::PathError(format!("Failed to get resource dir: {}", e)))?
            .join("resources")
            .join("assets");

        // Verify the base path exists
        if !base_path.exists() {
            return Err(AssetError::PathError(format!(
                "Assets directory not found at: {}. Make sure resources are bundled correctly.",
                base_path.display()
            )));
        }

        let cache = AssetCache::load(&base_path)?;
        let downloader = AssetDownloader::new();
        
        // Initialize mapper and resolver with hardcoded mappings
        let mapper = AssetMapper::new();
        let resolver = AssetResolver::new(mapper);

        Ok(Self {
            app_handle,
            cache,
            downloader,
            resolver,
            base_path,
        })
    }

    /// Get path to asset - uses resolver for character lookups, filesystem for elements
    pub fn get_asset_path(&self, asset_type: AssetType, name: &str) -> Option<PathBuf> {
        // For characters, use the resolver to find the correct filename
        if matches!(asset_type, AssetType::Character) {
            if let Some(filename) = self.resolver.get_asset_filename(name) {
                let path = self.base_path
                    .join(asset_type.as_str())
                    .join(&filename);
                
                if path.exists() {
                    return Some(path);
                }
            }
            // If resolver doesn't find it, fall through to cache lookup
        }
        
        // For elements, try direct filesystem access
        if matches!(asset_type, AssetType::Element) {
            let direct_path = self.base_path
                .join(asset_type.as_str())
                .join(name);
            
            if direct_path.exists() {
                return Some(direct_path);
            }
            
            // Try with .png if not present
            if !name.ends_with(".png") {
                let with_png = self.base_path
                    .join(asset_type.as_str())
                    .join(format!("{}.png", name));
                
                if with_png.exists() {
                    return Some(with_png);
                }
            }
        }
        
        // Cache lookup for other types or as fallback
        self.cache.get_asset_path(asset_type, name)
    }

    pub fn get_asset_base64(&self, asset_type: AssetType, name: &str) -> Result<String, AssetError> {
        let path = self.get_asset_path(asset_type, name)
            .ok_or(AssetError::NotFound(format!("{}/{}", asset_type, name)))?;
        
        let bytes = fs::read(&path)?;
        use base64::Engine;
        Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
    }

    pub async fn update_assets(&mut self, progress_callback: Option<Box<dyn Fn(UpdateProgress) + Send + Sync>>) -> Result<UpdateSummary, AssetError> {
        // Note: In production, the resources folder is read-only
        // This function is primarily for development or if you implement
        // a writable cache location (e.g., app_data_dir)
        let summary = self.downloader.download_all(&self.base_path, &mut self.cache, progress_callback).await?;
        self.cache.save(&self.base_path)?;
        Ok(summary)
    }

    pub fn should_update(&self) -> bool {
        self.cache.should_update()
    }

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
    
    #[error("Generic error: {0}")]
    Generic(String),
}

impl From<Box<dyn std::error::Error + Send + Sync>> for AssetError {
    fn from(err: Box<dyn std::error::Error + Send + Sync>) -> Self {
        AssetError::Generic(err.to_string())
    }
}