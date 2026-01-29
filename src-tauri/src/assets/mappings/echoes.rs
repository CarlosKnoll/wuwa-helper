// src-tauri/src/assets/mappings/echoes.rs
//! Echo (monster) icon mappings
//!
//! ## How to Add Echo Mappings
//!
//! This is the HARDEST category because there are SO MANY echoes!
//!
//! ### Recommended Approach:
//! 1. **Start small**: Only map echoes you actually use in builds
//! 2. **Visual matching**: Open image files and compare to Prydwen.gg
//! 3. **Gradual expansion**: Add more over time as needed
//!
//! ### Echo Patterns:
//! - `60XXXXXX.webp`: Echo icons (common pattern)
//! - `31XXXXXXX.webp`: Echo icons (alternate pattern)
//! - `32XXXXXXX.webp`: Possibly different class/rarity
//!
//! ### Echo Classes:
//! - **Common**: 2-cost echoes
//! - **Elite**: 1-cost or 3-cost echoes  
//! - **Overlord**: 4-cost echoes (bosses)
//! - **Calamity**: Special echoes
//!
//! ### Process:
//! 1. Run: `python ww_asset_manager.py`
//! 2. Open: `ww_assets/echoes/` folder
//! 3. Find an echo image you recognize
//! 4. Match it on Prydwen.gg
//! 5. Add to appropriate list below
//!
//! ### Example Entry:
//! ```rust
//! ("60010001.webp", "Crownless", "Havoc", "Overlord", 4, vec!["boss", "havoc"]),
//! ```
//!
//! ### Template:
//! ```
//! ("FILENAME.webp", "Echo Name", "Element", "Class", COST, vec!["tag1", "tag2"]),
//! ```

use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get 4-cost (Overlord/Calamity) echo mappings
/// Format: (filename, name, element, class, cost, tags)
fn get_overlord_echoes() -> Vec<(&'static str, &'static str, &'static str, &'static str, u8, Vec<&'static str>)> {
    vec![
        // TODO: Add 4-cost echoes here
        // These are boss echoes - prioritize mapping these first!
        //
        // Common 4-cost echoes:
        // ("60010001.webp", "Crownless", "Havoc", "Overlord", 4, vec!["boss", "havoc"]),
        // ("60010002.webp", "Dreamless", "Havoc", "Overlord", 4, vec!["boss", "havoc"]),
        // ("60010003.webp", "Impermanence Heron", "Havoc", "Overlord", 4, vec!["boss", "havoc"]),
        // ("60010004.webp", "Mourning Aix", "Spectro", "Overlord", 4, vec!["boss", "spectro"]),
        // ("60010005.webp", "Tempest Mephis", "Electro", "Overlord", 4, vec!["boss", "electro"]),
        // ("60010006.webp", "Feilian Beringal", "Aero", "Overlord", 4, vec!["boss", "aero"]),
        // ("60010007.webp", "Lampylumen Myriad", "Glacio", "Overlord", 4, vec!["boss", "glacio"]),
        // ("60010008.webp", "Mech Abomination", "Electro", "Overlord", 4, vec!["boss", "electro"]),
        // ("60010009.webp", "Thundering Mephis", "Fusion", "Overlord", 4, vec!["boss", "fusion"]),
    ]
}

/// Get 3-cost (Elite) echo mappings
fn get_elite_echoes() -> Vec<(&'static str, &'static str, &'static str, &'static str, u8, Vec<&'static str>)> {
    vec![
        // TODO: Add 3-cost echoes here
        // These are strong elite enemies
        //
        // Examples:
        // ("31000010.webp", "Chasm Guardian", "Havoc", "Elite", 3, vec!["elite", "havoc"]),
        // ("31000020.webp", "Rocksteady Guardian", "Spectro", "Elite", 3, vec!["elite", "spectro"]),
    ]
}

/// Get 1-cost (Common) echo mappings
fn get_common_echoes() -> Vec<(&'static str, &'static str, &'static str, &'static str, u8, Vec<&'static str>)> {
    vec![
        // TODO: Add 1-cost echoes here
        // These are common enemies - lower priority unless you need them
        //
        // Examples:
        // ("60020001.webp", "Tick Tack", "Havoc", "Common", 1, vec!["common", "havoc"]),
    ]
}

/// Get all echo mappings combined
pub fn get_echo_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    let all_echoes = vec![
        get_overlord_echoes(),
        get_elite_echoes(),
        get_common_echoes(),
    ];

    for echo_list in all_echoes {
        for (filename, name, element, class, cost, tags) in echo_list {
            map.insert(filename.to_string(), AssetMetadata {
                id: name.to_lowercase().replace(" ", "_").replace("'", ""),
                filename: filename.to_string(),
                display_name: name.to_string(),
                asset_type: "echo".to_string(),
                rarity: Some(cost), // Using cost as rarity for echoes
                element: Some(element.to_string()),
                weapon_type: None,
                echo_class: Some(class.to_string()),
                cost: Some(cost),
                tags: tags.iter().map(|s| s.to_string()).collect(),
            });
        }
    }

    map
}

// ==========================================
// QUICK REFERENCE: Priority Echoes
// ==========================================
//
// ## Start With These (Most Used 4-Cost Echoes):
//
// ### Havoc:
// - Crownless (coordinated attacks)
// - Dreamless (DMG boost)
// - Impermanence Heron (energy regen)
//
// ### Spectro:
// - Mourning Aix (coordinated attacks)
//
// ### Electro:
// - Tempest Mephis (ATK boost)
//
// ### Aero:
// - Feilian Beringal (coordinated attacks)
//
// ### Glacio:
// - Lampylumen Myriad (basic attack boost)
//
// ### Fusion:
// - Thundering Mephis (heavy attack boost)
//
// ## How to Find Echo IDs:
//
// 1. **Visual Matching** (Most Reliable):
//    - Open `ww_assets/echoes/` folder
//    - Open image files one by one
//    - Compare to Prydwen.gg echo list
//    - Match the icon visually
//
// 2. **Trial and Error**:
//    - Take a guess based on file position
//    - Test in your app
//    - Verify the correct name shows up
//
// 3. **Community Resources**:
//    - Check if anyone has documented the IDs
//    - GitHub, Discord, Reddit communities
//
// ## Pro Tips:
//
// - Focus on echoes you ACTUALLY use first
// - 4-cost echoes are most important (everyone uses these)
// - 3-cost echoes are second priority
// - 1-cost echoes are low priority (mostly for set completion)
// - You don't need to map ALL echoes - just the ones you care about!
//
// ## Testing Your Mappings:
//
// After adding echoes:
// 1. Rebuild: `cargo build`
// 2. Run app: `npm run tauri dev`
// 3. Use asset resolver to search for echo by name
// 4. Verify the correct icon appears