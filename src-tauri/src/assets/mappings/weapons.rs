// src-tauri/src/assets/mappings/weapons.rs
//! Weapon asset mappings
//!
//! ## How to Add Weapon Mappings
//!
//! ### Step 1: Download assets
//! ```bash
//! python ww_asset_manager.py
//! ```
//!
//! ### Step 2: Check weapon folders
//! Look in these directories:
//! - `ww_assets/weapons/broadblade/` (2101XXXX pattern)
//! - `ww_assets/weapons/sword/` (2102XXXX pattern)
//! - `ww_assets/weapons/pistol/` (2103XXXX pattern)
//! - `ww_assets/weapons/gauntlet/` (2104XXXX pattern)
//! - `ww_assets/weapons/rectifier/` (2105XXXX pattern)
//!
//! ### Step 3: Identify the weapon
//! - Open the image file
//! - Match it to Prydwen.gg or in-game
//! - Note: name, rarity, element (if any), weapon type
//!
//! ### Step 4: Add to the appropriate list below
//!
//! ### Example Entry
//! ```rust
//! ("21010001.webp", "Lustrous Razor", 5, Some("Spectro"), "Broadblade", vec!["5star", "limited"]),
//! ```
//!
//! ### Template
//! Copy and modify this:
//! ```
//! ("FILENAME.webp", "Display Name", RARITY, Some("Element") or None, "WeaponType", vec!["tag1", "tag2"]),
//! ```

use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get weapon type icon mappings
fn get_weapon_type_icons() -> Vec<(&'static str, &'static str, &'static str)> {
    vec![
        ("weapon_sword.png", "Sword", "sword"),
        ("weapon_broadblade.png", "Broadblade", "broadblade"),
        ("weapon_pistols.png", "Pistols", "pistol"),
        ("weapon_gauntlets.png", "Gauntlets", "gauntlet"),
        ("weapon_rectifier.png", "Rectifier", "rectifier"),
    ]
}

/// Get broadblade weapon mappings (2101XXXX)
/// Format: (filename, display_name, rarity, element, weapon_type, tags)
fn get_broadblades() -> Vec<(&'static str, &'static str, u8, Option<&'static str>, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add your broadblade weapons here
        // Example:
        // ("21010001.webp", "Lustrous Razor", 5, Some("Spectro"), "Broadblade", vec!["5star", "limited"]),
        // ("21010002.webp", "Sword of Night", 5, Some("Havoc"), "Broadblade", vec!["5star", "standard"]),
    ]
}

/// Get sword weapon mappings (2102XXXX)
fn get_swords() -> Vec<(&'static str, &'static str, u8, Option<&'static str>, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add your sword weapons here
        // Example:
        // ("21020001.webp", "Emerald of Genesis", 5, Some("Spectro"), "Sword", vec!["5star", "limited"]),
    ]
}

/// Get pistol weapon mappings (2103XXXX)
fn get_pistols() -> Vec<(&'static str, &'static str, u8, Option<&'static str>, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add your pistol weapons here
    ]
}

/// Get gauntlet weapon mappings (2104XXXX)
fn get_gauntlets() -> Vec<(&'static str, &'static str, u8, Option<&'static str>, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add your gauntlet weapons here
    ]
}

/// Get rectifier weapon mappings (2105XXXX)
fn get_rectifiers() -> Vec<(&'static str, &'static str, u8, Option<&'static str>, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add your rectifier weapons here
    ]
}

/// Get all weapon mappings combined
pub fn get_weapon_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    // Add weapon type icons
    for (filename, display_name, weapon_type) in get_weapon_type_icons() {
        map.insert(filename.to_string(), AssetMetadata {
            id: format!("weapon_type_{}", weapon_type),
            filename: filename.to_string(),
            display_name: display_name.to_string(),
            asset_type: "weapon_type".to_string(),
            rarity: None,
            element: None,
            weapon_type: Some(weapon_type.to_string()),
            echo_class: None,
            cost: None,
            tags: vec!["icon".to_string()],
        });
    }

    // Combine all weapon types
    let all_weapons = vec![
        get_broadblades(),
        get_swords(),
        get_pistols(),
        get_gauntlets(),
        get_rectifiers(),
    ];

    // Convert to HashMap
    for weapon_list in all_weapons {
        for (filename, name, rarity, element, weapon_type, tags) in weapon_list {
            map.insert(filename.to_string(), AssetMetadata {
                id: name.to_lowercase().replace(" ", "_").replace("'", ""),
                filename: filename.to_string(),
                display_name: name.to_string(),
                asset_type: "weapon".to_string(),
                rarity: Some(rarity),
                element: element.map(|s| s.to_string()),
                weapon_type: Some(weapon_type.to_string()),
                echo_class: None,
                cost: None,
                tags: tags.iter().map(|s| s.to_string()).collect(),
            });
        }
    }

    map
}

// ==========================================
// REFERENCE: Common Weapons to Get Started
// ==========================================
//
// Here are some common weapons you might want to add:
//
// 5-STAR WEAPONS (Limited/Signature):
// - Broadblade: Lustrous Razor (Jiyan's weapon)
// - Sword: Emerald of Genesis (Jinhsi's weapon)
// - Pistols: Static Mist (Yinlin's weapon)
// - Gauntlets: Abyss Surges (Calcharo's weapon)
// - Rectifier: Stringmaster (Zhezhi's weapon)
//
// 5-STAR WEAPONS (Standard):
// - Check Prydwen.gg for the standard 5-star pool
//
// 4-STAR WEAPONS:
// - There are many 4-star options
// - Start with ones you actually use/own
//
// 3-STAR WEAPONS:
// - Usually not needed unless you're completionist
//
// TIP: Focus on 5-star and 4-star weapons you use first!