// src-tauri/src/assets/mappings/mod.rs
//! Hardcoded asset mappings organized by category
//! 
//! This module provides manually curated mappings for assets that can't be
//! automatically scraped from Prydwen. Each category has its own file for
//! easier maintenance.

mod weapons;
mod echoes;
mod echo_sets;
mod materials;
mod characters;
mod elements;

pub use weapons::get_weapon_mappings;
pub use echoes::get_echo_mappings;
pub use echo_sets::get_echo_set_mappings;
pub use materials::get_material_mappings;
pub use characters::get_character_mappings;
pub use elements::get_element_mappings;

use super::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get all hardcoded mappings combined from all categories
pub fn get_all_mappings() -> HashMap<String, AssetMetadata> {
    let mut all_mappings = HashMap::new();
    
    all_mappings.extend(get_weapon_mappings());
    all_mappings.extend(get_echo_mappings());
    all_mappings.extend(get_echo_set_mappings());
    all_mappings.extend(get_material_mappings());
    all_mappings.extend(get_character_mappings());
    all_mappings.extend(get_element_mappings());
    
    all_mappings
}

/// Helper to categorize numeric IDs based on pattern
/// 
/// This is a FALLBACK for when you haven't hardcoded a specific asset.
/// It tries to guess the category from the ID pattern.
///
/// ## Pattern Reference:
/// Based on observations from downloaded assets:
/// - `21XXXXXX`: Materials, currencies, upgrade items, OR weapons
///   - `2101XXXX`: Broadblade weapons
///   - `2102XXXX`: Sword weapons
///   - `2103XXXX`: Pistol weapons
///   - `2104XXXX`: Gauntlet weapons
///   - `2105XXXX`: Rectifier weapons
///   - `210[6-9]XXXX` or `21[1-9]XXXXX`: Materials
/// - `31XXXXXXX`: Echo icons
/// - `32XXXXXXX`: Echo icons (different class?)
/// - `60XXXXXX`: Echo icons or items
/// - `44/45/46/47/48XXXX`: Character portraits/avatars
///
/// ## Customization:
/// If you discover new patterns, add them here!
pub fn categorize_numeric_id(filename: &str) -> Option<String> {
    let id = filename
        .replace(".webp", "")
        .replace(".png", "")
        .replace(".jpg", "");
    
    // Try to get first 2 characters
    if let Some(first_two) = id.get(0..2) {
        match first_two {
            "21" => {
                // Check if it's a weapon (2101-2105) or material (everything else)
                if let Some(weapon_type) = id.get(2..4) {
                    match weapon_type {
                        "01" => Some("weapon_broadblade".to_string()),
                        "02" => Some("weapon_sword".to_string()),
                        "03" => Some("weapon_pistol".to_string()),
                        "04" => Some("weapon_gauntlet".to_string()),
                        "05" => Some("weapon_rectifier".to_string()),
                        _ => Some("material".to_string()),
                    }
                } else {
                    Some("material".to_string())
                }
            },
            "31" => Some("echo".to_string()),
            "32" => Some("echo".to_string()),
            "33" => Some("echo".to_string()),
            "34" => Some("echo".to_string()),
            "44" | "45" | "46" | "47" | "48" => Some("character_portrait".to_string()),
            "60" => Some("echo".to_string()),
            _ => None,
        }
    } else {
        None
    }
}