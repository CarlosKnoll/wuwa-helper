// src-tauri/src/assets/mappings/elements.rs
//! Element icon mappings

use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get element icon mappings
/// Returns HashMap with multiple key formats for easy lookup
pub fn get_element_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    let elements = vec![
        ("Aero", "green"),
        ("Electro", "purple"),
        ("Fusion", "red"),
        ("Glacio", "blue"),
        ("Havoc", "dark"),
        ("Spectro", "yellow"),
    ];

    for (element, color) in elements {
        let filename = format!("element_{}.png", element.to_lowercase());
        let element_lower = element.to_lowercase();
        
        let metadata = AssetMetadata {
            id: format!("element_{}", element_lower),
            filename: filename.clone(),
            display_name: element.to_string(),
            asset_type: "element".to_string(),
            rarity: None,
            element: Some(element.to_string()),
            weapon_type: None,
            echo_class: None,
            cost: None,
            tags: vec!["element".to_string(), "icon".to_string(), color.to_string()],
        };

        // Add multiple lookup keys for flexibility
        map.insert(filename.clone(), metadata.clone());                    // "element_aero.png"
        map.insert(element.to_string(), metadata.clone());                 // "Aero"
        map.insert(element_lower.clone(), metadata.clone());               // "aero"
        map.insert(format!("element_{}", element_lower), metadata.clone()); // "element_aero"
    }

    map
}