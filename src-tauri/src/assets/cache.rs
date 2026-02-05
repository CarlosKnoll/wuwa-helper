// src-tauri/src/assets/cache.rs
//! Asset caching system

use super::models::*;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const CACHE_FILE: &str = "asset_cache.json";
const UPDATE_INTERVAL_HOURS: i64 = 24;

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

    /// Save cache to disk
    pub fn save(&self, base_path: &Path) -> Result<(), std::io::Error> {
        let cache_path = base_path.join(CACHE_FILE);
        let contents = serde_json::to_string_pretty(&self)?;
        fs::write(cache_path, contents)?;
        Ok(())
    }

    /// Check if an asset is cached
    pub fn has_asset(&self, url: &str) -> bool {
        let hash = Self::hash_url(url);
        self.assets.contains_key(&hash)
    }

    /// Get cached asset entry
    pub fn get_asset(&self, url: &str) -> Option<&AssetEntry> {
        let hash = Self::hash_url(url);
        self.assets.get(&hash)
    }

    /// Add an asset to cache
    pub fn add_asset(&mut self, entry: AssetEntry) {
        let hash = Self::hash_url(&entry.url);
        
        // Update type count
        *self.metadata.assets_by_type.entry(entry.asset_type).or_insert(0) += 1;
        
        self.assets.insert(hash, entry);
        self.metadata.total_assets = self.assets.len();
        self.metadata.last_update = Some(Utc::now());
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

    /// Check if assets should be updated
    pub fn should_update(&self) -> bool {
        match self.metadata.last_update {
            Some(last_update) => {
                let now = Utc::now();
                let diff = now.signed_duration_since(last_update);
                diff > Duration::hours(UPDATE_INTERVAL_HOURS)
            }
            None => true, // Never updated, should update
        }
    }

    /// Get cache statistics
    pub fn get_stats(&self) -> CacheStats {
        let cache_size_mb = self.assets.values()
            .map(|entry| entry.size_bytes)
            .sum::<u64>() as f64 / (1024.0 * 1024.0);

        CacheStats {
            total_assets: self.metadata.total_assets,
            assets_by_type: self.metadata.assets_by_type.clone(),
            last_update: self.metadata.last_update,
            cache_size_mb,
        }
    }

    /// Cleanup cache - remove entries for missing files
    pub fn cleanup(&mut self, _base_path: &Path) -> usize {
        let before = self.assets.len();
        
        self.assets.retain(|_, entry| {
            PathBuf::from(&entry.local_path).exists()
        });

        let removed = before - self.assets.len();
        
        if removed > 0 {
            // Recalculate metadata
            self.metadata.total_assets = self.assets.len();
            self.metadata.assets_by_type.clear();
            
            for entry in self.assets.values() {
                *self.metadata.assets_by_type.entry(entry.asset_type).or_insert(0) += 1;
            }
        }

        removed
    }

    /// Hash a URL for use as cache key
    fn hash_url(url: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        url.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }
}

impl Default for AssetCache {
    fn default() -> Self {
        Self::new()
    }
}