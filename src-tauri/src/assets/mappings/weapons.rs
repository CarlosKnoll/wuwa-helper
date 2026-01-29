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
        ("weapon_pistols.png", "Pistol", "pistol"),
        ("weapon_gauntlets.png", "Gauntlet", "gauntlet"),
        ("weapon_rectifier.png", "Rectifier", "rectifier"),
    ]
}

/// Get broadblade weapon mappings (2101XXXX)
/// Format: (filename, display_name, rarity, weapon_type, tags)
fn get_broadblades() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        //5-STARS LIMITED WEAPONS
        ("21010016.webp", "Verdant Summit", 5, "Broadblade", vec!["5stars"]),
        ("21010026.webp", "Ages of Harvest", 5, "Broadblade", vec!["5stars"]),
        ("21010036.webp", "Wildfire Mark", 5, "Broadblade", vec!["5stars"]),
        ("21010046.webp", "Thunderflare Dominion", 5, "Broadblade", vec!["5stars"]),
        ("21010056.webp", "Kumokiri", 5, "Broadblade", vec!["5stars"]),
        ("21010066.webp", "Starfield Calibrator", 5, "Broadblade", vec!["5stars"]),

        //5-STARS STANDARD WEAPONS
        ("21010015.webp", "Lustrous Razor", 5, "Broadblade", vec!["5stars"]),
        ("21010045.webp", "Radiance Cleaver", 5, "Broadblade", vec!["5stars"]),

        //4-STARS WEAPONS
        ("21010024.webp", "Discord", 4, "Broadblade", vec!["4stars"]),
        ("21010034.webp", "Broadblade#41", 4, "Broadblade", vec!["4stars"]),
        ("21010044.webp", "Dauntless Evernight", 4, "Broadblade", vec!["4stars"]),
        ("21010064.webp", "Helios Cleaver", 4, "Broadblade", vec!["4stars"]),
        ("21010074.webp", "Autumntrace", 4, "Broadblade", vec!["4stars"]),
        ("21010084.webp", "Waning Redshift", 4, "Broadblade", vec!["4stars"]),
        ("21010094.webp", "Meditations on Mercy", 4, "Broadblade", vec!["4stars"]),
        ("21010104.webp", "Aureate Zenith", 4, "Broadblade", vec!["4stars"]),

        //3-STARS WEAPONS
        ("21010013.webp", "Broadblade of Night", 3, "Broadblade", vec!["3stars"]),
        ("21010023.webp", "Originite: Type I", 3, "Broadblade", vec!["3stars"]),
        ("21010043.webp", "Broadblade of Voyager", 3, "Broadblade", vec!["3stars"]),
        ("21010053.webp", "Guardian Broadblade", 3, "Broadblade", vec!["3stars"]),
        ("21010063.webp", "Beguiling Melody", 3, "Broadblade", vec!["3stars"]),

        //2-STARS WEAPONS
        ("21010012.webp", "Tyro Broadblade", 2, "Broadblade", vec!["2stars"]),

        //1-STAR WEAPONS
        ("21010011.webp", "Training Broadblade", 1, "Broadblade", vec!["1star"]),
    ]
}

/// Get sword weapon mappings (2102XXXX)
fn get_swords() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        //5-STARS LIMITED WEAPONS
        ("21020016.webp", "Blazing Brilliance", 5, "Sword", vec!["5stars"]),
        ("21020026.webp", "Red Spring", 5, "Sword", vec!["5stars"]),
        ("21020036.webp", "Unflickering Valor", 5, "Sword", vec!["5stars"]),
        ("21020046.webp", "Bloodpact's Pledge", 5, "Sword", vec!["5stars"]),
        ("21020056.webp", "Defier's Thorn", 5, "Sword", vec!["5stars"]),
        ("21020066.webp", "Emerald Sentence", 5, "Sword", vec!["5stars"]),

        //5-STARS STANDARD WEAPONS
        ("21020015.webp", "Lustrous Razor", 5, "Sword", vec!["5stars"]),
        ("21020045.webp", "Laser Shearer", 5, "Sword", vec!["5stars"]),

        //4-STARS WEAPONS
        ("21020017.webp", "Somnoire Anchor", 4, "Sword", vec!["4stars"]),
        ("21020024.webp", "Overture", 4, "Sword", vec!["4stars"]),
        ("21020034.webp", "Sword#18", 4, "Sword", vec!["4stars"]),
        ("21020044.webp", "Commando of Conviction", 4, "Sword", vec!["4stars"]),
        ("21020064.webp", "Lunar Cutter", 4, "Sword", vec!["4stars"]),
        ("21020074.webp", "Lumingloss", 4, "Sword", vec!["4stars"]),
        ("21020084.webp", "Endless Collapse", 4, "Sword", vec!["4stars"]),
        ("21020094.webp", "Fables of Wisdom", 4, "Sword", vec!["4stars"]),
        ("21020104.webp", "Feather Edge", 4, "Sword", vec!["4stars"]),

        //3-STARS WEAPONS
        ("21020013.webp", "Sword of Night", 3, "Sword", vec!["3stars"]),
        ("21020023.webp", "Originite: Type II", 3, "Sword", vec!["3stars"]),
        ("21020043.webp", "Sword of Voyager", 3, "Sword", vec!["3stars"]),
        ("21020053.webp", "Guardian Sword", 3, "Sword", vec!["3stars"]),

        //2-STARS WEAPONS
        ("21020012.webp", "Tyro Sword", 2, "Sword", vec!["2stars"]),

        //1-STAR WEAPONS
        ("21020011.webp", "Training Sword", 1, "Sword", vec!["1star"]),
    ]
}

/// Get pistol weapon mappings (2103XXXX)
fn get_pistols() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        //5-STARS LIMITED WEAPONS
        ("21030016.webp", "The Last Dance", 5, "Pistol", vec!["5stars"]),
        ("21030026.webp", "Woodland Aria", 5, "Pistol", vec!["5stars"]),
        ("21030036.webp", "Lux & Umbra", 5, "Pistol", vec!["5stars"]),
        ("21030046.webp", "Spectrum Blaster", 5, "Pistol", vec!["5stars"]),

        //5-STARS STANDARD WEAPONS
        ("21030015.webp", "Static Mist", 5, "Pistol", vec!["5stars"]),
        ("21030045.webp", "Phasic Homogenizer", 5, "Pistol", vec!["5stars"]),

        //4-STARS WEAPONS
        ("21030024.webp", "Cadenza", 4, "Pistol", vec!["4stars"]),
        ("21030034.webp", "Pistols#26", 4, "Pistol", vec!["4stars"]),
        ("21030044.webp", "Undying Flame", 4, "Pistol", vec!["4stars"]),
        ("21030064.webp", "Novaburst", 4, "Pistol", vec!["4stars"]),
        ("21030074.webp", "Thunderbolt", 4, "Pistol", vec!["4stars"]),
        ("21030084.webp", "Relativistic Jet", 4, "Pistol", vec!["4stars"]),
        ("21030094.webp", "Romance in Farewell", 4, "Pistol", vec!["4stars"]),
        ("21030104.webp", "Solar Flame", 4, "Pistol", vec!["4stars"]),

        //3-STARS WEAPONS
        ("21030013.webp", "Pistol of Night", 3, "Pistol", vec!["3stars"]),
        ("21030023.webp", "Originite: Type III", 3, "Pistol", vec!["3stars"]),
        ("21030043.webp", "Pistols of Voyager", 3, "Pistol", vec!["3stars"]),
        ("21030053.webp", "Guardian Pistols", 3, "Pistol", vec!["3stars"]),

        //2-STARS WEAPONS
        ("21030012.webp", "Tyro Pistols", 2, "Pistol", vec!["2stars"]),

        //1-STAR WEAPONS
        ("21030011.webp", "Training Pistols", 1, "Pistol", vec!["1star"]),
    ]
}

/// Get gauntlet weapon mappings (2104XXXX)
fn get_gauntlets() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        //5-STARS LIMITED WEAPONS
        ("21040016.webp", "Verity's Handle", 5, "Gauntlet", vec!["5stars"]),
        ("21040026.webp", "Tragicomedy", 5, "Gauntlet", vec!["5stars"]),
        ("21040036.webp", "Blazing Justice", 5, "Gauntlet", vec!["5stars"]),
        ("21040046.webp", "Moongazer's Sigil", 5, "Gauntlet", vec!["5stars"]),

        //5-STARS STANDARD WEAPONS
        ("21040015.webp", "Abyss Surges", 5, "Gauntlet", vec!["5stars"]),
        ("21040045.webp", "Pulsation Bracer", 5, "Gauntlet", vec!["5stars"]),

        //4-STARS WEAPONS
        ("21040024.webp", "Marcato", 4, "Gauntlet", vec!["4stars"]),
        ("21040034.webp", "Gauntlets#21D", 4, "Gauntlet", vec!["4stars"]),
        ("21040044.webp", "Amity Accord", 4, "Gauntlet", vec!["4stars"]),
        ("21040064.webp", "Hollow Mirage", 4, "Gauntlet", vec!["4stars"]),
        ("21040074.webp", "Stonard", 4, "Gauntlet", vec!["4stars"]),
        ("21040084.webp", "Celestial Spiral", 4, "Gauntlet", vec!["4stars"]),
        ("21040094.webp", "Legend of Drunken Hero", 4, "Gauntlet", vec!["4stars"]),
        ("21040104.webp", "Aether Strike", 4, "Gauntlet", vec!["4stars"]),

        //3-STARS WEAPONS
        ("21040013.webp", "Gauntlets of Night", 3, "Gauntlet", vec!["3stars"]),
        ("21040023.webp", "Originite: Type IV", 3, "Gauntlet", vec!["3stars"]),
        ("21040043.webp", "Gauntlets of Voyager", 3, "Gauntlet", vec!["3stars"]),
        ("21040053.webp", "Guardian Gauntlets", 3, "Gauntlet", vec!["3stars"]),

        //2-STARS WEAPONS
        ("21040012.webp", "Tyro Gauntlets", 2, "Gauntlet", vec!["2stars"]),

        //1-STAR WEAPONS
        ("21040011.webp", "Training Gauntlets", 1, "Gauntlet", vec!["1star"]),
    ]
}

/// Get rectifier weapon mappings (2105XXXX)
fn get_rectifiers() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        //5-STARS LIMITED WEAPONS
        ("21050016.webp", "Stringmaster", 5, "Rectifier", vec!["5stars"]),
        ("21050026.webp", "Rime-Drapped Sprouts", 5, "Rectifier", vec!["5stars"]),
        ("21050036.webp", "Stellar Symphony", 5, "Rectifier", vec!["5stars"]),
        ("21050046.webp", "Luminous Hymn", 5, "Rectifier", vec!["5stars"]),
        ("21050056.webp", "Whispers of Sirens", 5, "Rectifier", vec!["5stars"]),
        ("21050066.webp", "Lethean Elegy", 5, "Rectifier", vec!["5stars"]),

        //5-STARS STANDARD WEAPONS
        ("21050015.webp", "Cosmic Ripples", 5, "Rectifier", vec!["5stars"]),
        ("21050045.webp", "Boson Astrolabe", 5, "Rectifier", vec!["5stars"]),

        //4-STARS WEAPONS
        ("21050017.webp", "Call of the Abyss", 4, "Rectifier", vec!["4stars"]),
        ("21050024.webp", "Variation", 4, "Rectifier", vec!["4stars"]),
        ("21050027.webp", "Ocean's Gift", 4, "Rectifier", vec!["4stars"]),
        ("21050034.webp", "Rectifier#25", 4, "Rectifier", vec!["4stars"]),
        ("21050044.webp", "Jinzhou Keeper", 4, "Rectifier", vec!["4stars"]),
        ("21050064.webp", "Comet Flare", 4, "Rectifier", vec!["4stars"]),
        ("21050074.webp", "Augment", 4, "Rectifier", vec!["4stars"]),
        ("21050084.webp", "Fusion Accretion", 4, "Rectifier", vec!["4stars"]),
        ("21050094.webp", "Waltz in Masquerade", 4, "Rectifier", vec!["4stars"]),
        ("21050104.webp", "Radiant Dawn", 4, "Rectifier", vec!["4stars"]),

        //3-STARS WEAPONS
        ("21050013.webp", "Rectifier of Night", 3, "Rectifier", vec!["3stars"]),
        ("21050023.webp", "Originite: Type V", 3, "Rectifier", vec!["3stars"]),
        ("21050043.webp", "Rectifier of Voyager", 3, "Rectifier", vec!["3stars"]),
        ("21050053.webp", "Guardian Rectifier", 3, "Rectifier", vec!["3stars"]),

        //2-STARS WEAPONS
        ("21050012.webp", "Tyro Rectifier", 2, "Rectifier", vec!["2stars"]),

        //1-STAR WEAPONS
        ("21050011.webp", "Training Rectifier", 1, "Rectifier", vec!["1star"]),
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
        for (filename, name, rarity, weapon_type, tags) in weapon_list {
            map.insert(filename.to_string(), AssetMetadata {
                id: name.to_lowercase().replace(" ", "_").replace("'", ""),
                filename: filename.to_string(),
                display_name: name.to_string(),
                asset_type: "weapon".to_string(),
                rarity: Some(rarity),
                element: None,
                weapon_type: Some(weapon_type.to_string()),
                echo_class: None,
                cost: None,
                tags: tags.iter().map(|s| s.to_string()).collect(),
            });
        }
    }

    map
}