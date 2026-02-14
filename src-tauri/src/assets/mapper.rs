// src-tauri/src/assets/mapper.rs
//! Asset mapping and metadata management
//! 
//! This module creates a mapping between asset filenames and their
//! semantic meaning by scraping Prydwen and building a lookup table

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Metadata about a game asset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMetadata {
    pub id: String,
    pub filename: String,
    pub display_name: String,
    pub asset_type: String,
    pub rarity: Option<u8>,
    pub element: Option<String>,
    pub weapon_type: Option<String>,
    pub echo_class: Option<String>,
    pub cost: Option<u8>,
    pub tags: Vec<String>,
}

/// Asset mapping database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMapper {
    /// Map from filename to metadata
    pub assets: HashMap<String, AssetMetadata>,
    /// Map from display name to filename (for easy lookup)
    pub name_to_file: HashMap<String, String>,
    /// Grouped by type
    pub by_type: HashMap<String, Vec<String>>,
}

impl AssetMapper {
    pub fn new() -> Self {
        Self {
            assets: HashMap::new(),
            name_to_file: HashMap::new(),
            by_type: HashMap::new(),
        }
    }

    /// Get asset by filename
    pub fn get_by_filename(&self, filename: &str) -> Option<&AssetMetadata> {
        self.assets.get(filename)
    }

    /// Get asset by display name
    pub fn get_by_name(&self, name: &str) -> Option<&AssetMetadata> {
        self.name_to_file.get(name)
            .and_then(|filename| self.assets.get(filename))
    }
}

impl Default for AssetMapper {
    fn default() -> Self {
        Self::new()
    }
}