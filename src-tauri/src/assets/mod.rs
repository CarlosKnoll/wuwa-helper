// src-tauri/src/assets/mod.rs
//! Asset management module for Wuthering Waves assets from Prydwen.gg

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub mod cache;
pub mod models;
pub mod mapper;
pub mod resolver;
pub mod mappings;

pub use mapper::{AssetMapper};
pub use resolver::{AssetResolver};
pub use cache::AssetCache;
pub use models::*;

pub struct AssetManager {
    cache: AssetCache,
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
            .join("assets");

        // Verify the base path exists
        if !base_path.exists() {
            return Err(AssetError::PathError(format!(
                "Assets directory not found at: {}. Make sure resources are bundled correctly.",
                base_path.display()
            )));
        }

        let cache = AssetCache::load(&base_path)?;
        
        // Initialize mapper and resolver with hardcoded mappings
        let mapper = AssetMapper::new();
        let resolver = AssetResolver::new(mapper);

        Ok(Self {
            cache,
            resolver,
            base_path,
        })
    }

    /// Get path to asset - uses resolver for lookups and handles nested weapon directories
    pub fn get_asset_path(&self, asset_type: AssetType, name: &str) -> Option<PathBuf> {
        
        // For echoes, try multiple strategies
        if matches!(asset_type, AssetType::Echo) {
            // Strategy 1: Try to resolve by display name first
            if let Some(metadata) = self.resolver.resolve_by_name(name) {
                let path = self.base_path
                    .join(asset_type.as_str())
                    .join(&metadata.filename);
                
                if path.exists() {
                    return Some(path);
                }
            }
            
            // Strategy 2: Try the name as filename directly
            let direct_path = self.base_path
                .join(asset_type.as_str())
                .join(name);
            
            if direct_path.exists() {
                return Some(direct_path);
            }
            
            // Strategy 3: Try with .webp extension if not present
            if !name.ends_with(".webp") && !name.ends_with(".png") {
                let with_webp = self.base_path
                    .join(asset_type.as_str())
                    .join(format!("{}.webp", name));
                
                if with_webp.exists() {
                    return Some(with_webp);
                }
            }
            
            // Strategy 4: Try converting name to ID format (lowercase, underscores)
            let name_id = name.to_lowercase().replace(" ", "_").replace("'", "");
            if let Some(metadata) = self.resolver.resolve_by_name(&name_id) {
                let path = self.base_path
                    .join(asset_type.as_str())
                    .join(&metadata.filename);
                
                if path.exists() {
                    return Some(path);
                }
            }
        }
        
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
        }
        
        
        // For weapons, CHECK CACHE FIRST, then use resolver/filesystem fallbacks
        if matches!(asset_type, AssetType::Weapon) {
            
            // Strategy 1: CHECK CACHE FIRST (highest priority)
            if let Some(cached_path) = self.cache.get_asset_path(asset_type, name) {
                if cached_path.exists() {
                    return Some(cached_path);
                } else {
                }
            }
            
            // Strategy 2: Try to resolve by display name using hardcoded mappings
            if let Some(metadata) = self.resolver.resolve_by_name(name) {
                
                // Check if it's a weapon type icon (starts with "weapon_")
                if metadata.filename.starts_with("weapon_") {
                    let path = self.base_path
                        .join("weapons")
                        .join(&metadata.filename);
                    
                    if path.exists() {
                        return Some(path);
                    }
                }
                // Check if it's a numeric weapon ID (starts with digit)
                else if metadata.filename.chars().next().unwrap_or('a').is_numeric() {
                    if let Some(ref weapon_type) = metadata.weapon_type {
                        let weapon_type_lower = weapon_type.to_lowercase();
                        let path = self.base_path
                            .join("weapons")
                            .join(&weapon_type_lower)
                            .join(&metadata.filename);
                        
                        if path.exists() {
                            return Some(path);
                        } else {
                        }
                    }
                }
                // Otherwise it's a special filename (like T_IconWeapon21020076_UI.webp)
                else {
                    if let Some(ref weapon_type) = metadata.weapon_type {
                        let weapon_type_lower = weapon_type.to_lowercase();
                        let path = self.base_path
                            .join("weapons")
                            .join(&weapon_type_lower)
                            .join(&metadata.filename);
                        
                        if path.exists() {
                            return Some(path);
                        }
                    }
                }
            } else {
            }
            
            // Strategy 3: Try to resolve by filename (in case name is already a filename)
            if let Some(metadata) = self.resolver.resolve_by_filename(name) {
                
                if metadata.filename.starts_with("weapon_") {
                    let path = self.base_path
                        .join("weapons")
                        .join(&metadata.filename);
                    
                    if path.exists() {
                        return Some(path);
                    }
                } else if let Some(ref weapon_type) = metadata.weapon_type {
                    let weapon_type_lower = weapon_type.to_lowercase();
                    let path = self.base_path
                        .join("weapons")
                        .join(&weapon_type_lower)
                        .join(&metadata.filename);
                    
                    if path.exists() {
                        return Some(path);
                    }
                }
            }
            
            // Strategy 4: If name looks like a weapon type icon, try directly
            if name.starts_with("weapon_") {
                let path = self.base_path
                    .join("weapons")
                    .join(name);
                
                if path.exists() {
                    return Some(path);
                }
                
                // Try with .png extension if not present
                if !name.ends_with(".png") {
                    let path = self.base_path
                        .join("weapons")
                        .join(format!("{}.png", name));
                    
                    if path.exists() {
                        return Some(path);
                    }
                }
            }
            
            // Strategy 5: Brute force - try as filename directly in all weapon subdirectories
            for weapon_type in &["broadblade", "sword", "pistol", "gauntlet", "rectifier"] {
                let path = self.base_path
                    .join("weapons")
                    .join(weapon_type)
                    .join(name);
                
                if path.exists() {
                    return Some(path);
                }
                
                // Try with .webp extension if not present
                if !name.ends_with(".webp") && !name.ends_with(".png") {
                    let path = self.base_path
                        .join("weapons")
                        .join(weapon_type)
                        .join(format!("{}.webp", name));
                    
                    if path.exists() {
                        return Some(path);
                    }
                }
            }
            
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
        
        // For echo_sets, try direct filesystem access
        if matches!(asset_type, AssetType::EchoSet) {
            let direct_path = self.base_path
                .join(asset_type.as_str())
                .join(name);
            
            if direct_path.exists() {
                return Some(direct_path);
            }
            
            // Try with .webp if not present
            if !name.ends_with(".webp") {
                let with_webp = self.base_path
                    .join(asset_type.as_str())
                    .join(format!("{}.webp", name));
                
                if with_webp.exists() {
                    return Some(with_webp);
                }
            }
        }
        
        // For misc assets (currency icons, etc.), try direct filesystem access
        if matches!(asset_type, AssetType::Misc) {
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
        
        // Cache lookup as final fallback for other types
        self.cache.get_asset_path(asset_type, name)
    }

    pub fn get_asset_base64(&self, asset_type: AssetType, name: &str) -> Result<String, AssetError> {
        let path = self.get_asset_path(asset_type, name)
            .ok_or(AssetError::NotFound(format!("{}/{}", asset_type, name)))?;
        
        let bytes = fs::read(&path)?;
        use base64::Engine;
        Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
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