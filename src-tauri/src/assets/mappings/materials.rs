// src-tauri/src/assets/mappings/materials.rs
//! Material and item mappings
//!
//! ## How to Add Material Mappings
//!
//! Materials are tricky because they use numeric IDs without obvious patterns.
//!
//! ### Categories of Materials:
//! 1. **Currencies**: Shell Credits, Astrites, etc.
//! 2. **Character Ascension**: Element-specific materials
//! 3. **Weapon Ascension**: Enemy drops, crafted materials
//! 4. **Skill Materials**: Weekly boss drops, common enemy drops
//! 5. **Forgery Materials**: Weapon enhancement materials
//!
//! ### How to Identify Materials:
//!
//! 1. **Run the asset downloader**
//!    ```bash
//!    python ww_asset_manager.py
//!    ```
//!
//! 2. **Check misc/ folder**
//!    Look for numeric files that weren't categorized elsewhere
//!
//! 3. **Visual matching**
//!    - Open image files
//!    - Match to in-game inventory
//!    - Or match to Prydwen.gg database
//!
//! 4. **Screenshot comparison**
//!    - Take screenshots of materials in-game
//!    - Compare to downloaded assets
//!    - Match them up
//!
//! ### Pattern Hints:
//! - Materials often start with `21`
//! - First 4 digits might indicate category
//! - Last digits might indicate tier/rarity
//!
//! ### Example Entry:
//! ```rust
//! ("21010011.webp", "Basic Shell Credit", "currency", vec!["common", "currency"]),
//! ```

use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Currency materials
fn get_currencies() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add currency materials here
        //
        // Common currencies you might find:
        // ("21010011.webp", "Basic Shell Credit", "currency", vec!["common", "currency"]),
        // ("21010012.webp", "Medium Shell Credit", "currency", vec!["uncommon", "currency"]),
        // ("21010013.webp", "Advanced Shell Credit", "currency", vec!["rare", "currency"]),
        // ("21010015.webp", "Premium Shell Credit", "currency", vec!["epic", "currency"]),
        //
        // Other currencies:
        // - Astrite
        // - Lustrous Tide
        // - Radiant Tide
        // - Union EXP
        // - etc.
    ]
}

/// Character ascension materials (element-specific)
fn get_ascension_materials() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add character ascension materials
        //
        // These are typically element-themed materials:
        //
        // Havoc materials:
        // ("21020011.webp", "LF Whisperin Core", "ascension", vec!["common", "havoc"]),
        // ("21020012.webp", "MF Whisperin Core", "ascension", vec!["uncommon", "havoc"]),
        // ("21020013.webp", "HF Whisperin Core", "ascension", vec!["rare", "havoc"]),
        // ("21020014.webp", "FF Whisperin Core", "ascension", vec!["epic", "havoc"]),
        //
        // Spectro materials:
        // Glacio materials:
        // Fusion materials:
        // Electro materials:
        // Aero materials:
        //
        // Pattern: Each element has 4 tiers (LF, MF, HF, FF)
    ]
}

/// Weapon ascension materials
fn get_weapon_materials() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add weapon ascension materials
        //
        // These are enemy drops or forgery materials
        //
        // Examples:
        // ("21030001.webp", "Crude Ring", "weapon_ascension", vec!["common", "ring"]),
        // ("21030002.webp", "Basic Ring", "weapon_ascension", vec!["uncommon", "ring"]),
        // ("21030003.webp", "Improved Ring", "weapon_ascension", vec!["rare", "ring"]),
        // ("21030004.webp", "Tailored Ring", "weapon_ascension", vec!["epic", "ring"]),
        //
        // Other series: Masks, Cores, etc.
    ]
}

/// Weekly boss drops (for character talents/skills)
fn get_weekly_boss_materials() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add weekly boss materials
        //
        // These are high-value materials from weekly bosses
        //
        // Examples:
        // ("21040001.webp", "Rage Tacet Core", "weekly_boss", vec!["boss", "skill"]),
        // ("21040002.webp", "Roaring Rock Fist", "weekly_boss", vec!["boss", "skill"]),
        //
        // Check which weekly bosses exist in game and add their drops
    ]
}

/// Forgery materials (for weapon enhancement)
fn get_forgery_materials() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add forgery materials
        //
        // These are crafted at the forgery for weapon upgrades
        //
        // Different types for different days of the week
    ]
}

/// Character talent/skill materials
fn get_skill_materials() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add skill materials
        //
        // Common enemy drops used for leveling character skills
    ]
}

/// Food and consumables
fn get_consumables() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        // TODO: Add consumable items if needed
        //
        // Healing items, food, potions, etc.
        // Lower priority unless you're building a full database
    ]
}

/// Get all material mappings combined
pub fn get_material_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    let all_materials = vec![
        get_currencies(),
        get_ascension_materials(),
        get_weapon_materials(),
        get_weekly_boss_materials(),
        get_forgery_materials(),
        get_skill_materials(),
        get_consumables(),
    ];

    for material_list in all_materials {
        for (filename, name, asset_type, tags) in material_list {
            map.insert(filename.to_string(), AssetMetadata {
                id: name.to_lowercase().replace(" ", "_").replace("'", ""),
                filename: filename.to_string(),
                display_name: name.to_string(),
                asset_type: asset_type.to_string(),
                rarity: None,
                element: None,
                weapon_type: None,
                echo_class: None,
                cost: None,
                tags: tags.iter().map(|s| s.to_string()).collect(),
            });
        }
    }

    map
}

// ==========================================
// MATERIAL MAPPING STRATEGY
// ==========================================
//
// ## Priority Order:
//
// 1. **Weekly Boss Materials** (HIGHEST PRIORITY)
//    - Limited quantity, needed for talents
//    - Everyone needs these
//    - Small number, easy to map
//
// 2. **Character Ascension Materials**
//    - Needed for all characters
//    - Organized by element (6 elements × 4 tiers = 24 items)
//
// 3. **Weapon Ascension Materials**
//    - Multiple series (rings, masks, cores, etc.)
//    - Each series has 4 tiers
//
// 4. **Currencies**
//    - Shell Credits (4 tiers)
//    - Special currencies (Astrite, etc.)
//
// 5. **Skill/Forgery Materials** (LOWER PRIORITY)
//    - Many items but less critical for app functionality
//
// 6. **Consumables** (LOWEST PRIORITY)
//    - Only if building complete database
//
// ## Recommended Workflow:
//
// 1. Start with just the materials YOU need for YOUR characters
// 2. Map only what you're currently using
// 3. Expand gradually as you build more characters
// 4. Don't try to map everything at once!
//
// ## How to Find Material IDs:
//
// ### Method 1: In-Game Screenshot Match
// 1. Open game, go to inventory
// 2. Screenshot each material type
// 3. Open `ww_assets/misc/` folder
// 4. Match screenshots to image files
// 5. Add mappings here
//
// ### Method 2: Prydwen Database
// 1. Go to Prydwen.gg materials page
// 2. Right-click material icons, inspect image URL
// 3. Match filenames to your downloaded assets
// 4. Add mappings here
//
// ### Method 3: Community Data
// 1. Check if anyone has documented material IDs
// 2. Search: "wuthering waves material ids"
// 3. Import verified data
//
// ## Testing Materials:
//
// After adding materials:
// 1. Rebuild app
// 2. Search for material by name in app
// 3. Verify correct icon appears
// 4. Check that element/tier tags are correct