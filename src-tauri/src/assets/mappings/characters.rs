use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get character card mappings
/// Format: (filename, name, rarity, element, tags)
/// 
/// IMPORTANT: Filenames must match EXACTLY what's in resources/assets/characters/
fn get_character_cards() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        // ROVER - Special case with generic filename
        ("rover_card.webp", "Rover", 5, "Any", vec!["5star"]),
        
        // 5-STAR LIMITED CHARACTERS
        // Note: Some use numeric IDs (44.webp, 45.webp, etc.)
        // Others use descriptive names (card_cam.webp, jiyan_card.webp, etc.)
        ("44_card.webp", "Sigrika", 5, "Unknown", vec!["5star", "limited", "unknown"]),
        ("45_card.webp", "Luuk Herssen", 5, "Spectro", vec!["5star", "limited", "dps"]),
        ("46_card.webp", "Mornye", 5, "Fusion", vec!["5star", "limited", "healer"]),
        ("47_card.webp", "Lucilla", 5, "Unknown", vec!["5star", "limited", "unknown"]),
        ("48_card.webp", "Lynae", 5, "Spectro", vec!["5star", "limited", "sub_dps"]),
        ("aug_card.webp", "Augusta", 5, "Electro", vec!["5star", "limited", "dps"]),
        ("card_brant.webp", "Brant", 5, "Fusion", vec!["5star", "limited", "support"]),
        ("card_cam.webp", "Camellya", 5, "Havoc", vec!["5star", "limited", "dps"]),
        ("card_canta.webp", "Cantarella", 5, "Havoc", vec!["5star", "limited", "sub_dps"]),
        ("card_carlotta.webp", "Carlotta", 5, "Glacio", vec!["5star", "limited", "dps"]),
        ("card_changli.webp", "Changli", 5, "Fusion", vec!["5star", "limited", "sub_dps"]),
        ("card_keeper.webp", "Shorekeeper", 5, "Spectro", vec!["5star", "limited", "healer"]),
        ("card_phoebe.webp", "Phoebe", 5, "Spectro", vec!["5star", "limited", "sub_dps"]),
        ("card_roccia.webp", "Roccia", 5, "Havoc", vec!["5star", "limited", "support"]),
        ("card_xiang.webp", "Xiangli Yao", 5, "Electro", vec!["5star", "limited", "dps"]),
        ("card_zani.webp", "Zani", 5, "Spectro", vec!["5star", "limited", "dps"]),
        ("card_zhe.webp", "Zhezhi", 5, "Glacio", vec!["5star", "limited", "sub_dps"]),
        ("cart_card.webp", "Cartethyia", 5, "Aero", vec!["5star", "limited", "dps"]),
        ("chisa_card.webp", "Chisa", 5, "Havoc", vec!["5star", "limited", "support"]),
        ("cia_card.webp", "Ciaccona", 5, "Aero", vec!["5star", "limited", "support"]),
        ("gal_card.webp", "Galbrena", 5, "Fusion", vec!["5star", "limited", "dps"]),
        ("iuno_card.webp", "Iuno", 5, "Aero", vec!["5star", "limited", "sub-dps"]),
        ("jihni.webp", "Jinhsi", 5, "Spectro", vec!["5star", "limited", "dps"]),
        ("jiyan_card.webp", "Jiyan", 5, "Aero", vec!["5star", "limited", "dps"]),
        ("lupa_card.webp", "Lupa", 5, "Fusion", vec!["5star", "limited", "sub_dps"]),
        ("math_card.webp", "Aemeath", 5, "Fusion", vec!["5star", "limited", "dps"]),
        ("phr_card.webp", "Phrolova", 5, "Havoc", vec!["5star", "limited", "dps"]),
        ("qiu_card.webp", "Qiuyuan", 5, "Aero", vec!["5star", "limited", "sub_dps"]),
        ("yinglin_card.webp", "Yinlin", 5, "Electro", vec!["5star", "limited", "sub_dps"]),

        // 5-STAR STANDARD CHARACTERS
        ("encore_card.webp", "Encore", 5, "Fusion", vec!["5star", "standard", "dps"]),
        ("jiaxin_card.webp", "Jianxin", 5, "Aero", vec!["5star", "standard", "support"]),
        ("kakarot_card.webp", "Calcharo", 5, "Electro", vec!["5star", "standard", "dps"]),
        ("ling_card.webp", "Lingyang", 5, "Glacio", vec!["5star", "standard", "dps"]),
        ("verina_card.webp", "Verina", 5, "Spectro", vec!["5star", "standard", "healer"]),
        
        // 4-STAR CHARACTERS
        ("aalto_card.webp", "Aalto", 4, "Aero", vec!["4star", "sub_dps"]),
        ("baizhi_card.webp", "Baizhi", 4, "Glacio", vec!["4star", "healer"]),
        ("buling_card.webp", "Buling", 4, "Electro", vec!["4star", "healer"]),
        ("card_lumi.webp", "Lumi", 4, "Electro", vec!["4star", "sub_dps"]),
        ("card_youhu.webp", "Youhu", 4, "Glacio", vec!["4star", "healer"]),
        ("chixia_card.webp", "Chixia", 4, "Fusion", vec!["4star", "dps"]),
        ("danjin_card.webp", "Danjin", 4, "Havoc", vec!["4star", "sub_dps"]),
        ("mortefi_card.webp", "Mortefi", 4, "Fusion", vec!["4star", "sub_dps"]),
        ("senhua_card.webp", "Sanhua", 4, "Glacio", vec!["4star", "sub_dps"]),
        ("taoqi_card.webp", "Taoqi", 4, "Havoc", vec!["4star", "support"]),
        ("yang_card.webp", "Yangyang", 4, "Aero", vec!["4star", "support"]),
        ("yuanwu_card.webp", "Yuanwu", 4, "Electro", vec!["4star", "support"])
    ]
}

/// Get all character mappings combined
/// Creates a HashMap where:
/// - Key: filename (e.g., "46.webp", "card_cam.webp")  
/// - Value: AssetMetadata with display_name, rarity, element, etc.
pub fn get_character_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    let all_characters = vec![
        get_character_cards()
    ];

    for char_list in all_characters {
        for (filename, name, rarity, element, tags) in char_list {
            // Create a normalized ID from the character name
            let id = name.to_lowercase()
                .replace(" ", "_")
                .replace("'", "")
                .replace("-", "_");
            
            map.insert(filename.to_string(), AssetMetadata {
                id,
                filename: filename.to_string(),
                display_name: name.to_string(),
                asset_type: "character".to_string(),
                rarity: Some(rarity),
                element: Some(element.to_string()),
                weapon_type: None,
                echo_class: None,
                cost: None,
                tags: tags.iter().map(|s| s.to_string()).collect(),
            });
        }
    }

    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_character_mappings_created() {
        let mappings = get_character_mappings();
        assert!(mappings.len() > 0, "Should have character mappings");
    }

    #[test]
    fn test_mornye_mapping_exists() {
        let mappings = get_character_mappings();
        
        // Check if Mornye is mapped
        let mornye = mappings.values()
            .find(|m| m.display_name == "Mornye");
        
        assert!(mornye.is_some(), "Mornye should be in mappings");
        assert_eq!(mornye.unwrap().filename, "46.webp");
    }

    #[test]
    fn test_lynae_mapping_exists() {
        let mappings = get_character_mappings();
        
        let lynae = mappings.values()
            .find(|m| m.display_name == "Lynae");
        
        assert!(lynae.is_some(), "Lynae should be in mappings");
        assert_eq!(lynae.unwrap().filename, "48.webp");
    }
}