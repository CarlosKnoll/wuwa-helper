// src-tauri/src/assets/mappings/echo_sets.rs
//! Echo set icon mappings
//!
//! ## How to Add Echo Set Mappings
//!
//! Echo sets are the easiest to map because:
//! 1. They follow a simple `set_XX.webp` pattern
//! 2. There's a limited number of them
//! 3. They're visually distinct
//!
//! ### Process:
//! 1. Run: `python ww_asset_manager.py`
//! 2. Check: `ww_assets/echo_sets/` folder
//! 3. Compare icons with Prydwen.gg echo set list
//! 4. Add new sets below if game updates add them
//!
//! ### Format:
//! ```rust
//! ("set_XX.webp", "Set Name", "primary_tag"),
//! ```
//!
//! Tags typically indicate the set bonus:
//! - Element damage: "aero_dmg", "glacio_dmg", "fusion_dmg", "electro_dmg", "havoc_dmg", "spectro_dmg"
//! - Other bonuses: "atk", "healing", "energy_regen", "basic_dmg", "skill_dmg", "coordinated_atk"

use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get echo set mappings
/// Format: (filename, display_name, primary_tag)
fn get_echo_sets() -> Vec<(&'static str, &'static str, &'static str)> {
    vec![
        // Element-focused sets
        ("set_1.webp", "Sierra Gale", "aero_dmg"),
        ("set_2.webp", "Frosty Resolve", "glacio_dmg"),
        ("set_3.webp", "Molten Rift", "fusion_dmg"),
        ("set_4.webp", "Void Thunder", "electro_dmg"),
        ("set_5.webp", "Sun-sinking Eclipse", "havoc_dmg"),
        ("set_6.webp", "Celestial Light", "spectro_dmg"),
        
        // Damage type sets
        ("set_7.webp", "Freezing Frost", "basic_dmg"),
        ("set_8.webp", "Molten Rift", "heavy_dmg"),
        ("set_9.webp", "Void Thunder", "skill_dmg"),
        
        // Support sets
        ("set_10.webp", "Rejuvenating Glow", "healing"),
        ("set_11.webp", "Moonlit Clouds", "energy_regen"),
        ("set_12.webp", "Lingering Tunes", "atk"),
        ("set_13.webp", "Empyrean Anthem", "coordinated_atk"),
        
        // Version 1.1+ sets (if applicable)
        ("set_14.webp", "Tidebreaking Courage", "basic_dmg"),
        ("set_15.webp", "Midnight Veil", "havoc_dmg"),
        ("set_16.webp", "Eternal Radiance", "spectro_dmg"),
        
        // Version 1.2+ sets (if applicable)
        ("set_17.webp", "Howling Storm", "aero_dmg"),
        ("set_18.webp", "Icy Embrace", "glacio_dmg"),
        ("set_19.webp", "Inferno Rider", "fusion_dmg"),
        ("set_20.webp", "Electroshock", "electro_dmg"),
        
        // TODO: Add new echo sets here when game updates release them
        // ("set_21.webp", "New Set Name", "tag"),
    ]
}

/// Get all echo set mappings
pub fn get_echo_set_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    for (filename, name, tag) in get_echo_sets() {
        map.insert(filename.to_string(), AssetMetadata {
            id: format!("echo_set_{}", name.to_lowercase().replace(" ", "_").replace("-", "_")),
            filename: filename.to_string(),
            display_name: name.to_string(),
            asset_type: "echo_set".to_string(),
            rarity: None,
            element: None,
            weapon_type: None,
            echo_class: None,
            cost: None,
            tags: vec![tag.to_string()],
        });
    }

    map
}

// ==========================================
// NOTES ON ECHO SETS
// ==========================================
//
// ## Current Echo Sets (as of version 1.X):
//
// ### Elemental Sets (5-piece bonus = element DMG):
// - Sierra Gale (Aero)
// - Frosty Resolve / Icy Embrace (Glacio)
// - Molten Rift / Inferno Rider (Fusion)
// - Void Thunder / Electroshock (Electro)
// - Sun-sinking Eclipse / Midnight Veil (Havoc)
// - Celestial Light / Eternal Radiance (Spectro)
//
// ### Damage Type Sets:
// - Freezing Frost (Basic Attack DMG)
// - Molten Rift (Heavy Attack DMG)
// - Void Thunder (Skill DMG)
// - Tidebreaking Courage (Basic Attack DMG)
//
// ### Support Sets:
// - Rejuvenating Glow (Healing)
// - Moonlit Clouds (Energy Regen)
// - Lingering Tunes (ATK%)
// - Empyrean Anthem (Coordinated Attack DMG)
//
// ## When to Update This File:
// - New game version releases
// - New echo sets are added
// - You notice missing sets in your assets folder
//
// ## How to Verify:
// Check Prydwen.gg's echo sets page and compare with your set_XX.webp files