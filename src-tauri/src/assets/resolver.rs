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
        
        // DEBUG: Check if Mornye is actually in the hardcoded mappings
        eprintln!("DEBUG [AssetResolver::new]: Loaded {} hardcoded mappings", hardcoded.len());
        
        // Check for Mornye specifically
        let mornye_found = hardcoded.values().find(|m| m.display_name == "Mornye");
        if let Some(meta) = mornye_found {
            eprintln!("DEBUG [AssetResolver::new]: ✅ Mornye found! Filename: {}", meta.filename);
        } else {
            eprintln!("DEBUG [AssetResolver::new]: ❌ Mornye NOT found in hardcoded mappings!");
        }
        
        // Check for Lynae specifically
        let lynae_found = hardcoded.values().find(|m| m.display_name == "Lynae");
        if let Some(meta) = lynae_found {
            eprintln!("DEBUG [AssetResolver::new]: ✅ Lynae found! Filename: {}", meta.filename);
        } else {
            eprintln!("DEBUG [AssetResolver::new]: ❌ Lynae NOT found in hardcoded mappings!");
        }
        
        Self {
            mapper,
            hardcoded,
        }
    }

    /// Resolve asset by display name with flexible element matching
    pub fn resolve_by_name(&self, name: &str) -> Option<&AssetMetadata> {
        eprintln!("DEBUG [resolve_by_name]: Looking for '{}'", name);
        
        // Try exact match first
        if let Some(meta) = self.mapper.get_by_name(name) {
            eprintln!("DEBUG [resolve_by_name]: Found in mapper");
            return Some(meta);
        }

        // Try case-insensitive in mapper
        let name_lower = name.to_lowercase();
        for meta in self.mapper.assets.values() {
            if meta.display_name.to_lowercase() == name_lower {
                eprintln!("DEBUG [resolve_by_name]: Found in mapper (case-insensitive)");
                return Some(meta);
            }
        }

        // Check hardcoded mappings with exact key
        if let Some(meta) = self.hardcoded.get(name) {
            eprintln!("DEBUG [resolve_by_name]: Found in hardcoded by exact key");
            return Some(meta);
        }

        // Try case-insensitive in hardcoded
        eprintln!("DEBUG [resolve_by_name]: Searching {} hardcoded entries...", self.hardcoded.len());
        for (key, meta) in &self.hardcoded {
            if meta.display_name.to_lowercase() == name_lower {
                eprintln!("DEBUG [resolve_by_name]: ✅ FOUND '{}' in hardcoded! Key: {}, Filename: {}", 
                    meta.display_name, key, meta.filename);
                return Some(meta);
            }
        }
        
        eprintln!("DEBUG [resolve_by_name]: ❌ NOT FOUND after checking all hardcoded entries");

        // For elements, try with "element_" prefix
        if !name_lower.starts_with("element_") {
            let element_key = format!("element_{}", name_lower);
            if let Some(meta) = self.hardcoded.get(&element_key) {
                eprintln!("DEBUG [resolve_by_name]: Found as element with prefix");
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

    /// Fuzzy search for assets
    pub fn fuzzy_search(&self, query: &str) -> Vec<&AssetMetadata> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();

        for meta in self.mapper.assets.values() {
            if meta.display_name.to_lowercase().contains(&query_lower) 
                || meta.id.contains(&query_lower)
                || meta.filename.contains(&query_lower) {
                results.push(meta);
            }
        }

        for meta in self.hardcoded.values() {
            if meta.display_name.to_lowercase().contains(&query_lower) 
                || meta.id.contains(&query_lower)
                || meta.filename.contains(&query_lower) {
                results.push(meta);
            }
        }

        // Sort by relevance
        results.sort_by(|a, b| {
            let a_name = a.display_name.to_lowercase();
            let b_name = b.display_name.to_lowercase();
            
            let a_score = if a_name == query_lower { 0 }
                else if a_name.starts_with(&query_lower) { 1 }
                else { 2 };
            
            let b_score = if b_name == query_lower { 0 }
                else if b_name.starts_with(&query_lower) { 1 }
                else { 2 };
            
            a_score.cmp(&b_score)
        });

        results
    }

    /// Get all assets by type
    pub fn get_by_type(&self, asset_type: &str) -> Vec<&AssetMetadata> {
        let mut results = self.mapper.get_by_type(asset_type);
        
        for meta in self.hardcoded.values() {
            if meta.asset_type == asset_type {
                results.push(meta);
            }
        }
        
        results
    }

    /// Filter assets by criteria
    pub fn filter(&self, filters: AssetFilters) -> Vec<&AssetMetadata> {
        let mut all_assets: Vec<&AssetMetadata> = self.mapper.assets.values().collect();
        all_assets.extend(self.hardcoded.values());

        all_assets.into_iter()
            .filter(|meta| {
                if let Some(ref asset_type) = filters.asset_type {
                    if &meta.asset_type != asset_type {
                        return false;
                    }
                }

                if let Some(rarity) = filters.rarity {
                    if meta.rarity != Some(rarity) {
                        return false;
                    }
                }

                if let Some(ref element) = filters.element {
                    if meta.element.as_ref() != Some(element) {
                        return false;
                    }
                }

                if !filters.tags.is_empty() {
                    let has_any_tag = filters.tags.iter()
                        .any(|tag| meta.tags.contains(tag));
                    if !has_any_tag {
                        return false;
                    }
                }

                true
            })
            .collect()
    }

    /// Get asset filename for use in the frontend
    /// Enhanced to handle element lookups better
    pub fn get_asset_filename(&self, identifier: &str) -> Option<String> {
        eprintln!("DEBUG [get_asset_filename]: Called with '{}'", identifier);
        
        // Try direct filename first
        if self.resolve_by_filename(identifier).is_some() {
            eprintln!("DEBUG [get_asset_filename]: Found as direct filename");
            return Some(identifier.to_string());
        }

        // Try by display name (works for elements like "Aero", "Spectro")
        if let Some(meta) = self.resolve_by_name(identifier) {
            eprintln!("DEBUG [get_asset_filename]: ✅ Resolved to filename: {}", meta.filename);
            return Some(meta.filename.clone());
        }

        eprintln!("DEBUG [get_asset_filename]: ❌ Could not resolve '{}'", identifier);
        None
    }

    /// Categorize an unknown numeric ID
    pub fn categorize_unknown(&self, filename: &str) -> Option<String> {
        mappings::categorize_numeric_id(filename)
    }
}

/// Filter criteria for asset search
#[derive(Debug, Clone, Default)]
pub struct AssetFilters {
    pub asset_type: Option<String>,
    pub rarity: Option<u8>,
    pub element: Option<String>,
    pub weapon_type: Option<String>,
    pub tags: Vec<String>,
}

impl AssetFilters {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_type(mut self, asset_type: impl Into<String>) -> Self {
        self.asset_type = Some(asset_type.into());
        self
    }

    pub fn with_rarity(mut self, rarity: u8) -> Self {
        self.rarity = Some(rarity);
        self
    }

    pub fn with_element(mut self, element: impl Into<String>) -> Self {
        self.element = Some(element.into());
        self
    }

    pub fn with_tag(mut self, tag: impl Into<String>) -> Self {
        self.tags.push(tag.into());
        self
    }
}