// src-tauri/src/assets/cache.rs
//! Asset caching system

use super::models::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const CACHE_FILE: &str = "asset_cache.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetCache {
    /// Map of URL hash to asset entry
    assets: HashMap<String, AssetEntry>,
    /// Metadata about the cache
    metadata: CacheMetadata,
}

impl AssetCache {
    /// Create a new empty cache
    pub fn new() -> Self {
        Self {
            assets: HashMap::new(),
            metadata: CacheMetadata::default(),
        }
    }

    /// Load cache from disk
    pub fn load(base_path: &Path) -> Result<Self, std::io::Error> {
        let cache_path = base_path.join(CACHE_FILE);
        
        if cache_path.exists() {
            let contents = fs::read_to_string(&cache_path)?;
            let cache: AssetCache = serde_json::from_str(&contents)
                .unwrap_or_else(|_| AssetCache::new());
            Ok(cache)
        } else {
            Ok(AssetCache::new())
        }
    }

    /// Get path to an asset by type and name (exact filename or display name match)
    pub fn get_asset_path(&self, asset_type: AssetType, name: &str) -> Option<PathBuf> {
        let name_lower = name.to_lowercase();
        
        self.assets.values()
            .find(|entry| {
                // Must match asset type
                if entry.asset_type != asset_type {
                    return false;
                }
                
                let filename_lower = entry.filename.to_lowercase();
                
                // Exact filename match (highest priority)
                if filename_lower == name_lower {
                    return true;
                }
                
                // Filename without extension match
                if let Some(stem) = entry.filename.split('.').next() {
                    if stem.to_lowercase() == name_lower {
                        return true;
                    }
                }
                
                // Contains match as fallback (for partial matches)
                filename_lower.contains(&name_lower)
            })
            .map(|entry| PathBuf::from(&entry.local_path))
    }
}

impl Default for AssetCache {
    fn default() -> Self {
        Self::new()
    }
}