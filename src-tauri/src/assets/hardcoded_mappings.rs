// src-tauri/src/assets/hardcoded_mappings.rs
//! Hardcoded asset ID mappings
//! 
//! This file contains manually maintained mappings for numeric asset IDs
//! that can't be easily scraped. Built from game data files and community resources.
//!
//! ## HOW TO ADD NEW MAPPINGS
//!
//! ### Step 1: Identify the asset pattern
//! Run the Python asset downloader and check the downloaded files in each category:
//! - characters/: Character cards (should be XXXX_card.webp)
//! - weapons/broadblade/: Broadblade weapons (2101XXXX.webp)
//! - weapons/sword/: Sword weapons (2102XXXX.webp)
//! - weapons/pistol/: Pistol weapons (2103XXXX.webp)
//! - weapons/gauntlet/: Gauntlet weapons (2104XXXX.webp)
//! - weapons/rectifier/: Rectifier weapons (2105XXXX.webp)
//! - echoes/: Echo icons (60XXXXX.webp or 31XXXXXXX.webp)
//! - echo_sets/: Echo set icons (set_XX.webp)
//! - misc/: Other materials and items
//!
//! ### Step 2: Determine what the asset represents
//! Cross-reference with:
//! - Prydwen.gg website
//! - Game data (if you have access)
//! - Community wiki
//! - In-game observation
//!
//! ### Step 3: Add to the appropriate function below
//! Each function handles a different category of assets
//!
//! ### Step 4: Test
//! Build and run your app, use the asset resolver to verify the mapping works

use super::mapper::AssetMetadata;
use std::collections::HashMap;

/// Initialize hardcoded weapon mappings
/// 
/// ## Adding Weapon Mappings:
/// 
/// Pattern: Weapons follow the ID pattern 21[TYPE]XXXX
/// - 2101XXXX = Broadblade
/// - 2102XXXX = Sword  
/// - 2103XXXX = Pistols
/// - 2104XXXX = Gauntlets
/// - 2105XXXX = Rectifier
///
/// Example workflow:
/// 1. Check `ww_assets/weapons/broadblade/` folder
/// 2. See file `21010001.webp`
/// 3. Look up weapon on Prydwen or in-game
/// 4. Find it's "Lustrous Razor" - a 5-star broadblade
/// 5. Add entry below:
///
/// ```rust
/// map.insert("21010001.webp".to_string(), AssetMetadata {
///     id: "lustrous_razor".to_string(),
///     filename: "21010001.webp".to_string(),
///     display_name: "Lustrous Razor".to_string(),
///     asset_type: "weapon".to_string(),
///     rarity: Some(5),
///     element: Some("Spectro".to_string()),
///     weapon_type: Some("Broadblade".to_string()),
///     echo_class: None,
///     cost: None,
///     tags: vec!["5star".to_string(), "spectro".to_string()],
/// });
/// ```
pub fn get_weapon_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    // ==========================================
    // WEAPON TYPE ICONS (Keep these as-is)
    // ==========================================
    
    map.insert("weapon_sword.png".to_string(), AssetMetadata {
        id: "weapon_type_sword".to_string(),
        filename: "weapon_sword.png".to_string(),
        display_name: "Sword".to_string(),
        asset_type: "weapon_type".to_string(),
        rarity: None,
        element: None,
        weapon_type: Some("Sword".to_string()),
        echo_class: None,
        cost: None,
        tags: vec!["icon".to_string()],
    });

    map.insert("weapon_broadblade.png".to_string(), AssetMetadata {
        id: "weapon_type_broadblade".to_string(),
        filename: "weapon_broadblade.png".to_string(),
        display_name: "Broadblade".to_string(),
        asset_type: "weapon_type".to_string(),
        rarity: None,
        element: None,
        weapon_type: Some("Broadblade".to_string()),
        echo_class: None,
        cost: None,
        tags: vec!["icon".to_string()],
    });

    map.insert("weapon_pistols.png".to_string(), AssetMetadata {
        id: "weapon_type_pistols".to_string(),
        filename: "weapon_pistols.png".to_string(),
        display_name: "Pistols".to_string(),
        asset_type: "weapon_type".to_string(),
        rarity: None,
        element: None,
        weapon_type: Some("Pistols".to_string()),
        echo_class: None,
        cost: None,
        tags: vec!["icon".to_string()],
    });

    map.insert("weapon_gauntlets.png".to_string(), AssetMetadata {
        id: "weapon_type_gauntlets".to_string(),
        filename: "weapon_gauntlets.png".to_string(),
        display_name: "Gauntlets".to_string(),
        asset_type: "weapon_type".to_string(),
        rarity: None,
        element: None,
        weapon_type: Some("Gauntlets".to_string()),
        echo_class: None,
        cost: None,
        tags: vec!["icon".to_string()],
    });

    map.insert("weapon_rectifier.png".to_string(), AssetMetadata {
        id: "weapon_type_rectifier".to_string(),
        filename: "weapon_rectifier.png".to_string(),
        display_name: "Rectifier".to_string(),
        asset_type: "weapon_type".to_string(),
        rarity: None,
        element: None,
        weapon_type: Some("Rectifier".to_string()),
        echo_class: None,
        cost: None,
        tags: vec!["icon".to_string()],
    });

    // ==========================================
    // ACTUAL WEAPON ITEMS (21XXXXXX pattern)
    // ==========================================
    // TODO: Add your weapon mappings here
    // Check your downloaded files in:
    // - ww_assets/weapons/broadblade/
    // - ww_assets/weapons/sword/
    // - ww_assets/weapons/pistol/
    // - ww_assets/weapons/gauntlet/
    // - ww_assets/weapons/rectifier/
    //
    // Example for a 5-star weapon:
    // map.insert("21010001.webp".to_string(), AssetMetadata {
    //     id: "weapon_name_slug".to_string(),
    //     filename: "21010001.webp".to_string(),
    //     display_name: "Weapon Name".to_string(),
    //     asset_type: "weapon".to_string(),
    //     rarity: Some(5),
    //     element: Some("Spectro".to_string()), // or None if no element
    //     weapon_type: Some("Broadblade".to_string()),
    //     echo_class: None,
    //     cost: None,
    //     tags: vec!["5star".to_string(), "limited".to_string()],
    // });

    map
}

/// Initialize hardcoded echo set mappings
///
/// ## Adding Echo Set Mappings:
///
/// Echo sets are easier - they follow the pattern `set_XX.webp` where XX is a number.
/// These are the bonus set icons that appear in the echo menu.
///
/// How to find the name:
/// 1. Check `ww_assets/echo_sets/` folder
/// 2. See file like `set_01.webp`, `set_02.webp`, etc.
/// 3. Look up on Prydwen.gg under Echo Sets
/// 4. Match the icon visually or by position
/// 5. Add entry below
///
/// Current sets are already mapped, but if new sets are added in updates:
/// 1. Download new assets with `python ww_asset_manager.py`
/// 2. Check for new `set_XX.webp` files
/// 3. Look up the new set name
/// 4. Add to the list below
pub fn get_echo_set_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    // Echo sets - these are confirmed and should be stable
    // Format: (filename, display_name, primary_tag)
    let echo_sets = vec![
        ("set_1.webp", "Sierra Gale", "wind_dmg"),
        ("set_2.webp", "Frosty Resolve", "ice_dmg"),
        ("set_3.webp", "Molten Rift", "fire_dmg"),
        ("set_4.webp", "Void Thunder", "electric_dmg"),
        ("set_5.webp", "Sun-sinking Eclipse", "havoc_dmg"),
        ("set_6.webp", "Celestial Light", "spectro_dmg"),
        ("set_7.webp", "Freezing Frost", "basic_dmg"),
        ("set_8.webp", "Molten Rift", "heavy_dmg"),
        ("set_9.webp", "Void Thunder", "skill_dmg"),
        ("set_10.webp", "Rejuvenating Glow", "healing"),
        ("set_11.webp", "Moonlit Clouds", "energy_regen"),
        ("set_12.webp", "Lingering Tunes", "atk"),
        ("set_13.webp", "Empyrean Anthem", "coordinated_atk"),
        ("set_14.webp", "Tidebreaking Courage", "basic_dmg"),
        ("set_15.webp", "Midnight Veil", "havoc_dmg"),
        ("set_16.webp", "Eternal Radiance", "spectro_dmg"),
        ("set_17.webp", "Howling Storm", "aero_dmg"),
        ("set_18.webp", "Icy Embrace", "glacio_dmg"),
        ("set_19.webp", "Inferno Rider", "fusion_dmg"),
        ("set_20.webp", "Electroshock", "electro_dmg"),
        // TODO: Add new echo sets here when they're released
        // ("set_21.webp", "New Set Name", "new_tag"),
    ];

    for (filename, name, tag) in echo_sets {
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

/// Initialize mappings for numeric material IDs
///
/// ## Adding Material Mappings:
///
/// Materials are TRICKY. They don't follow a super clear pattern, but generally:
/// - Character ascension materials
/// - Weapon ascension materials  
/// - Skill upgrade materials
/// - Currency items
/// - Boss drops
///
/// These typically have numeric IDs that don't obviously correlate to names.
///
/// ### How to identify materials:
///
/// 1. **Download and organize assets first**
///    ```bash
///    python ww_asset_manager.py
///    ```
///
/// 2. **Check the misc/ folder** for unidentified numeric files
///
/// 3. **Cross-reference with game/wiki**
///    - Play the game and screenshot materials
///    - Compare with downloaded assets visually
///    - Match icons to names
///
/// 4. **Pattern recognition hints:**
///    - Files starting with `21` are often materials
///    - Check file size - materials are usually smaller icons
///    - Some materials share visual themes (color schemes)
///
/// 5. **Add to the materials list below**
///
/// ### Example:
/// You find `21020011.webp` in misc/, it looks like a purple crystal.
/// Check Prydwen or wiki, find it's "Whisperin Core".
/// Add it below.
pub fn get_material_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    // NOTE: The tags Vec needs to contain Strings, not &str
    // Use .to_string() for each tag
    let materials: Vec<(&str, &str, &str, Vec<&str>)> = vec![
        // ==========================================
        // CURRENCY / CREDITS
        // ==========================================
        // ("21010011.webp", "Basic Shell Credit", "currency", vec!["common", "currency"]),
        // ("21010012.webp", "Medium Shell Credit", "currency", vec!["uncommon", "currency"]),
        // ("21010013.webp", "Advanced Shell Credit", "currency", vec!["rare", "currency"]),
        // ("21010015.webp", "Premium Shell Credit", "currency", vec!["epic", "currency"]),
        
        // ==========================================
        // CHARACTER ASCENSION MATERIALS
        // ==========================================
        // Pattern: Usually element-themed
        // Look for materials that match character elements
        //
        // Example:
        // ("21020011.webp", "LF Whisperin Core", "ascension", vec!["common", "havoc"]),
        // ("21020012.webp", "MF Whisperin Core", "ascension", vec!["uncommon", "havoc"]),
        // ("21020013.webp", "HF Whisperin Core", "ascension", vec!["rare", "havoc"]),
        
        // ==========================================
        // WEAPON ASCENSION MATERIALS
        // ==========================================
        // Usually dropped from specific enemy types or bosses
        //
        // Example:
        // ("21030001.webp", "Crude Ring", "weapon_ascension", vec!["common"]),
        // ("21030002.webp", "Basic Ring", "weapon_ascension", vec!["uncommon"]),
        // ("21030003.webwebp", "Improved Ring", "weapon_ascension", vec!["rare"]),
        
        // ==========================================
        // SKILL MATERIALS / WEEKLY BOSS DROPS
        // ==========================================
        // These are usually from weekly bosses
        //
        // Example:
        // ("21040001.webp", "Rage Tacet Core", "weekly_boss", vec!["boss", "skill"]),
        
        // ==========================================
        // TODO: ADD YOUR MATERIALS HERE
        // ==========================================
        // 
        // Step-by-step process:
        // 1. Run: python ww_asset_manager.py
        // 2. Check ww_assets/misc/ folder
        // 3. Find numeric .webp files
        // 4. Open them to see what they look like
        // 5. Match them to in-game materials
        // 6. Add entries here
        //
        // Template:
        // ("FILENAME.webp", "Display Name", "material_type", vec!["tag1", "tag2"]),
    ];

    // Convert the materials vec to HashMap with proper String types
    for (filename, name, asset_type, tags) in materials {
        map.insert(filename.to_string(), AssetMetadata {
            id: filename.replace(".webp", ""),
            filename: filename.to_string(),
            display_name: name.to_string(),
            asset_type: asset_type.to_string(),
            rarity: None,
            element: None,
            weapon_type: None,
            echo_class: None,
            cost: None,
            tags: tags.iter().map(|s| s.to_string()).collect(), // Fixed: Convert &str to String
        });
    }

    map
}

/// Get mappings for echo icons (60XXXXX and 31XXXXXXX pattern)
///
/// ## Adding Echo Icon Mappings:
///
/// Echoes are the equippable enemy souls in Wuthering Waves.
/// They follow specific numeric patterns:
///
/// ### Pattern Recognition:
/// - **60XXXXX**: Likely echo items/icons
/// - **31XXXXXXX**: Also echo-related (might be different quality/type)
///
/// ### Rarity/Class System:
/// Echoes have different classes (Common, Elite, Overlord, Calamity)
/// The ID pattern MIGHT encode this, but it varies.
///
/// ### How to Map Echoes:
///
/// 1. **Visual matching is BEST for echoes**
///    - Download assets
///    - Open ww_assets/echoes/ folder
///    - Compare icons to in-game or Prydwen.gg
///
/// 2. **Check Prydwen.gg Echo database**
///    - Lists all echoes with their bonuses
///    - Match icons visually
///
/// 3. **Pattern hints:**
///    - Similar-looking echoes often have sequential IDs
///    - Boss echoes (Overlord/Calamity) are usually higher IDs
///
/// 4. **Add mappings below**
///
/// ### Example:
/// ```rust
/// map.insert("60010001.webp".to_string(), AssetMetadata {
///     id: "echo_crownless".to_string(),
///     filename: "60010001.webp".to_string(),
///     display_name: "Crownless".to_string(),
///     asset_type: "echo".to_string(),
///     rarity: Some(4), // Cost in game
///     element: Some("Havoc".to_string()),
///     weapon_type: None,
///     echo_class: Some("Overlord".to_string()),
///     cost: Some(4),
///     tags: vec!["overlord".to_string(), "havoc".to_string()],
/// });
/// ```
pub fn get_echo_icon_mappings() -> HashMap<String, AssetMetadata> {
    let map = HashMap::new();

    // TODO: Add echo mappings here
    // This is the HARDEST category to map because there are SO MANY echoes
    //
    // Recommended approach:
    // 1. Start with just the echoes YOU use in your builds
    // 2. Add more as needed
    // 3. Contribute back to community if you map them all!
    //
    // Pattern examples:
    // 60XXXXX = Some type of echo
    // 31XXXXXXX = Another type
    // 32XXXXXXX = Yet another type
    //
    // You can also check the categorize_numeric_id() function below
    // to see if the automatic categorization is working for your needs

    map
}

/// Get all hardcoded mappings combined
pub fn get_all_hardcoded_mappings() -> HashMap<String, AssetMetadata> {
    let mut all_mappings = HashMap::new();
    
    all_mappings.extend(get_weapon_mappings());
    all_mappings.extend(get_echo_set_mappings());
    all_mappings.extend(get_material_mappings());
    all_mappings.extend(get_echo_icon_mappings());
    
    all_mappings
}

/// Helper to categorize numeric IDs based on pattern
///
/// This is a FALLBACK for when you haven't hardcoded a specific asset.
/// It tries to guess the category from the ID pattern.
///
/// ## Pattern Reference:
/// Based on observations from downloaded assets:
/// - `21XXXXXX`: Materials, currencies, upgrade items
/// - `31XXXXXXX`: Echo icons (Common/Elite class?)
/// - `32XXXXXXX`: Echo icons (different class?)
/// - `60XXXXXX`: Echo icons or items
/// - `44/45/46/47/48XXXX`: Character portraits/avatars
///
/// ## Customization:
/// If you discover new patterns, add them here!
/// This helps the app automatically categorize unknown assets.
pub fn categorize_numeric_id(filename: &str) -> Option<String> {
    let id = filename.replace(".webp", "").replace(".png", "").replace(".jpg", "");
    
    // Try to get first 2 characters
    if let Some(first_two) = id.get(0..2) {
        match first_two {
            "21" => {
                // Weapons are 21[TYPE]XXXX where TYPE is:
                // 01=broadblade, 02=sword, 03=pistol, 04=gauntlet, 05=rectifier
                // Everything else is materials
                if let Some(weapon_type) = id.get(2..4) {
                    match weapon_type {
                        "01" => Some("weapon".to_string()),
                        "02" => Some("weapon".to_string()),
                        "03" => Some("weapon".to_string()),
                        "04" => Some("weapon".to_string()),
                        "05" => Some("weapon".to_string()),
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
            "60" => Some("echo".to_string()), // or could be "item"
            _ => None,
        }
    } else {
        None
    }
}

// ==========================================
// QUICK REFERENCE GUIDE
// ==========================================
//
// ## Workflow for Mapping New Assets:
//
// 1. **Download Assets**
//    ```bash
//    python ww_asset_manager.py
//    ```
//
// 2. **Organize Your Workspace**
//    - Open `ww_assets/` folder
//    - Open Prydwen.gg in browser
//    - Open this file in editor
//
// 3. **Start with Easy Ones**
//    - Echo sets (visual matching, limited number)
//    - Weapons you use (check in-game)
//    - Common materials (most frequently seen)
//
// 4. **Visual Matching Process**
//    - Open image file
//    - Search Prydwen.gg for matching icon
//    - Note the name and properties
//    - Add entry to appropriate function
//
// 5. **Test Your Mappings**
//    ```bash
//    cargo build
//    npm run tauri dev
//    ```
//    - Use the asset resolver in your app
//    - Verify names show up correctly
//
// 6. **Iterate**
//    - Don't try to map everything at once
//    - Start with what you need
//    - Add more over time
//
// ## Common Mistakes:
//
// ❌ Using &str in tags vec (use .to_string())
// ❌ Wrong filename extension (.png vs .webp)
// ❌ Forgetting to add to get_all_hardcoded_mappings()
// ❌ Typos in display names
// ❌ Wrong asset_type category
//
// ## Testing Checklist:
//
// - [ ] File compiles without errors
// - [ ] Assets appear in app
// - [ ] Names are correct
// - [ ] Search finds the assets
// - [ ] Filters work correctly
//