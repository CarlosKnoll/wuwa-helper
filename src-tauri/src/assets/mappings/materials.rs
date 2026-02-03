use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Currency materials
fn get_currencies() -> Vec<(&'static str, &'static str, &'static str, Vec<&'static str>)> {
    vec![
        ("shell_icon.png", "Shell Credit", "misc", vec!["currency"]),
        ("astrite_icon.png", "Astrite", "misc", vec!["currency"]),
        ("lustrous_icon.png", "Lustrous Tide", "misc", vec!["currency"]),
        ("radiant_icon.png", "Radiant Tide", "misc", vec!["currency"]),
        ("oscillated_icon.png", "Oscillated Coral", "misc", vec!["currency"]),
        ("afterglow_icon.png", "Afterflow Coral", "misc", vec!["currency"]),
    ]
}


/// Get all material mappings combined
pub fn get_material_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    let all_materials = vec![
        get_currencies()
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