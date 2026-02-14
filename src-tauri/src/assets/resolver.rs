// src-tauri/src/assets/resolver.rs
//! Unified asset resolver with enhanced element support

use super::mapper::{AssetMapper, AssetMetadata};
use super::mappings;
use std::collections::HashMap;

pub struct AssetResolver {
    mapper: AssetMapper,
    hardcoded: HashMap<String, AssetMetadata>,
}

impl AssetResolver {
    /// Create a new resolver with combined mappings
    pub fn new(mapper: AssetMapper) -> Self {
        let hardcoded = mappings::get_all_mappings();      
        Self {
            mapper,
            hardcoded,
        }
    }

    /// Resolve asset by display name with flexible element matching
    pub fn resolve_by_name(&self, name: &str) -> Option<&AssetMetadata> {
        
        // Try exact match first
        if let Some(meta) = self.mapper.get_by_name(name) {
            return Some(meta);
        }

        // Try case-insensitive in mapper
        let name_lower = name.to_lowercase();
        for meta in self.mapper.assets.values() {
            if meta.display_name.to_lowercase() == name_lower {
                return Some(meta);
            }
        }

        // Check hardcoded mappings with exact key
        if let Some(meta) = self.hardcoded.get(name) {
            return Some(meta);
        }

        // Try case-insensitive in hardcoded
        for (_key, meta) in &self.hardcoded {
            if meta.display_name.to_lowercase() == name_lower {
                return Some(meta);
            }
        }

        // For elements, try with "element_" prefix
        if !name_lower.starts_with("element_") {
            let element_key = format!("element_{}", name_lower);
            if let Some(meta) = self.hardcoded.get(&element_key) {
                return Some(meta);
            }
        }

        None
    }

    /// Resolve asset by filename
    pub fn resolve_by_filename(&self, filename: &str) -> Option<&AssetMetadata> {
        self.mapper.get_by_filename(filename)
            .or_else(|| self.hardcoded.get(filename))
    }

    /// Get asset filename for use in the frontend
    /// Enhanced to handle element lookups better
    pub fn get_asset_filename(&self, identifier: &str) -> Option<String> {
        
        // Try direct filename first
        if self.resolve_by_filename(identifier).is_some() {
            return Some(identifier.to_string());
        }

        // Try by display name (works for elements like "Aero", "Spectro")
        if let Some(meta) = self.resolve_by_name(identifier) {
            return Some(meta.filename.clone());
        }
        None
    }
}