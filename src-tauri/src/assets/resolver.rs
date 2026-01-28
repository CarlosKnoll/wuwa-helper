// src-tauri/src/assets/resolver.rs
//! Unified asset resolver
//! 
//! Provides a single interface for resolving assets by various methods:
//! - By display name (e.g., "Jiyan", "Emerald of Genesis")
//! - By filename (e.g., "jiyan_card.webp")
//! - By category and filters (e.g., all 5-star Spectro characters)
//! - By fuzzy search

use super::mapper::{AssetMapper, AssetMetadata};
use super::hardcoded_mappings;
use std::collections::HashMap;

pub struct AssetResolver {
    mapper: AssetMapper,
    hardcoded: HashMap<String, AssetMetadata>,
}

impl AssetResolver {
    /// Create a new resolver with combined mappings
    pub fn new(mapper: AssetMapper) -> Self {
        Self {
            mapper,
            hardcoded: hardcoded_mappings::get_all_hardcoded_mappings(),
        }
    }

    /// Resolve asset by display name
    /// Example: resolve("Jiyan") -> AssetMetadata
    pub fn resolve_by_name(&self, name: &str) -> Option<&AssetMetadata> {
        // Try exact match first
        if let Some(meta) = self.mapper.get_by_name(name) {
            return Some(meta);
        }

        // Try case-insensitive
        let name_lower = name.to_lowercase();
        for (_key, meta) in &self.mapper.assets {
            if meta.display_name.to_lowercase() == name_lower {
                return Some(meta);
            }
        }

        // Check hardcoded
        for meta in self.hardcoded.values() {
            if meta.display_name.to_lowercase() == name_lower {
                return Some(meta);
            }
        }

        None
    }

    /// Resolve asset by filename
    /// Example: resolve_by_filename("jiyan_card.webp") -> AssetMetadata
    pub fn resolve_by_filename(&self, filename: &str) -> Option<&AssetMetadata> {
        self.mapper.get_by_filename(filename)
            .or_else(|| self.hardcoded.get(filename))
    }

    /// Fuzzy search for assets
    /// Example: fuzzy_search("jiy") -> ["Jiyan"]
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

        // Sort by relevance (exact match > starts with > contains)
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
    /// Example: get_by_type("character") -> [all characters]
    pub fn get_by_type(&self, asset_type: &str) -> Vec<&AssetMetadata> {
        let mut results = self.mapper.get_by_type(asset_type);
        
        // Add hardcoded matches
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
                // Filter by type
                if let Some(ref asset_type) = filters.asset_type {
                    if &meta.asset_type != asset_type {
                        return false;
                    }
                }

                // Filter by rarity
                if let Some(rarity) = filters.rarity {
                    if meta.rarity != Some(rarity) {
                        return false;
                    }
                }

                // Filter by element
                if let Some(ref element) = filters.element {
                    if meta.element.as_ref() != Some(element) {
                        return false;
                    }
                }

                // Filter by tags
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
    /// This is the main method components should use
    pub fn get_asset_filename(&self, identifier: &str) -> Option<String> {
        // Try direct filename first
        if self.resolve_by_filename(identifier).is_some() {
            return Some(identifier.to_string());
        }

        // Try by display name
        if let Some(meta) = self.resolve_by_name(identifier) {
            return Some(meta.filename.clone());
        }

        None
    }

    /// Categorize an unknown numeric ID
    pub fn categorize_unknown(&self, filename: &str) -> Option<String> {
        hardcoded_mappings::categorize_numeric_id(filename)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fuzzy_search() {
        let mapper = AssetMapper::new();
        let resolver = AssetResolver::new(mapper);
        
        // Add test cases here
    }

    #[test]
    fn test_filter() {
        let mapper = AssetMapper::new();
        let resolver = AssetResolver::new(mapper);
        
        let filters = AssetFilters::new()
            .with_type("character")
            .with_rarity(5)
            .with_element("Spectro");
        
        let results = resolver.filter(filters);
        // Should return only 5-star Spectro characters
    }
}