// src-tauri/src/assets/mappings/mod.rs
//! Hardcoded asset mappings for character, weapon, echo, and echo set data

use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

pub mod characters;
pub mod weapons;
pub mod echoes;
pub mod echo_sets;
pub mod elements;
pub mod materials;

/// Get all hardcoded mappings combined
pub fn get_all_mappings() -> HashMap<String, AssetMetadata> {
    let mut all_mappings = HashMap::new();
    
    // Merge all mapping sources
    all_mappings.extend(characters::get_character_mappings());
    all_mappings.extend(weapons::get_weapon_mappings());
    all_mappings.extend(echoes::get_echo_mappings());
    all_mappings.extend(echo_sets::get_echo_set_mappings());
    all_mappings.extend(elements::get_element_mappings());
    all_mappings.extend(materials::get_material_mappings());
    
    all_mappings
}

/// Categorize a numeric asset ID to determine its type
pub fn categorize_numeric_id(filename: &str) -> Option<String> {
    // Remove extension
    let base = filename.trim_end_matches(".webp").trim_end_matches(".png");
    
    // Try to parse as number
    if let Ok(id) = base.parse::<u64>() {
        // Echo IDs are typically in these ranges:
        // 4-cost: 60010xxx
        // 3-cost: 31000xxx or 6000xxx
        // 1-cost: smaller numbers
        if id >= 60000000 && id < 70000000 {
            return Some("echo".to_string());
        }
        if id >= 31000000 && id < 32000000 {
            return Some("echo".to_string());
        }
        if id >= 21000000 && id < 22000000 {
            return Some("weapon".to_string());
        }
    }
    
    None
}