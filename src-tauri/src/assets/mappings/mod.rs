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
pub mod exploration;

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