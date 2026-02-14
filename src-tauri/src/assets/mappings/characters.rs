use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get character card mappings
/// Format: (filename, name, rarity, element, tags)
/// 
/// IMPORTANT: Filenames must match EXACTLY what's in resources/assets/characters/
fn get_character_cards() -> Vec<(&'static str, &'static str, u8, &'static str, Vec<&'static str>)> {
    vec![
        // ROVER - Three variants with unique keys but same image
        ("rover_aero", "Aero Rover", 5, "Aero", vec!["5star", "rover", "sub-dps", "sword"]),
        ("rover_havoc", "Havoc Rover", 5, "Havoc", vec!["5star", "rover", "dps", "sword"]),
        ("rover_spectro", "Spectro Rover", 5, "Spectro", vec!["5star", "rover", "sub-dps", "sword"]),
        
        // 5-STAR LIMITED CHARACTERS
        // Note: Some use numeric IDs (44.webp, 45.webp, etc.)
        // Others use descriptive names (card_cam.webp, jiyan_card.webp, etc.)
        ("44_card.webp", "Sigrika", 5, "Aero", vec!["5star", "limited", "dps", "gauntlets"]),
        ("45_card.webp", "Luuk Herssen", 5, "Spectro", vec!["5star", "limited", "dps","gauntlets"]),
        ("46_card.webp", "Mornye", 5, "Fusion", vec!["5star", "limited", "healer","broadblade"]),
        ("47_card.webp", "Lucilla", 5, "Unknown", vec!["5star", "limited", "unknown","unknown"]),
        ("48_card.webp", "Lynae", 5, "Spectro", vec!["5star", "limited", "sub_dps","pistols"]),
        ("aug_card.webp", "Augusta", 5, "Electro", vec!["5star", "limited", "dps","broadblade"]),
        ("card_brant.webp", "Brant", 5, "Fusion", vec!["5star", "limited", "support","sword"]),
        ("card_cam.webp", "Camellya", 5, "Havoc", vec!["5star", "limited", "dps","sword"]),
        ("card_canta.webp", "Cantarella", 5, "Havoc", vec!["5star", "limited", "sub_dps","rectifier"]),
        ("card_carlotta.webp", "Carlotta", 5, "Glacio", vec!["5star", "limited", "dps","pistols"]),
        ("card_changli.webp", "Changli", 5, "Fusion", vec!["5star", "limited", "sub_dps","sword"]),
        ("card_keeper.webp", "Shorekeeper", 5, "Spectro", vec!["5star", "limited", "healer","rectifier"]),
        ("card_phoebe.webp", "Phoebe", 5, "Spectro", vec!["5star", "limited", "sub_dps","rectifier"]),
        ("card_roccia.webp", "Roccia", 5, "Havoc", vec!["5star", "limited", "support","gauntlets"]),
        ("card_xiang.webp", "Xiangli Yao", 5, "Electro", vec!["5star", "limited", "dps","gauntlets"]),
        ("card_zani.webp", "Zani", 5, "Spectro", vec!["5star", "limited", "dps","gauntlets"]),
        ("card_zhe.webp", "Zhezhi", 5, "Glacio", vec!["5star", "limited", "sub_dps","rectifier"]),
        ("cart_card.webp", "Cartethyia", 5, "Aero", vec!["5star", "limited", "dps","sword"]),
        ("chisa_card.webp", "Chisa", 5, "Havoc", vec!["5star", "limited", "support","broadblade"]),
        ("cia_card.webp", "Ciaccona", 5, "Aero", vec!["5star", "limited", "support","pistols"]),
        ("gal_card.webp", "Galbrena", 5, "Fusion", vec!["5star", "limited", "dps","pistols"]),
        ("iuno_card.webp", "Iuno", 5, "Aero", vec!["5star", "limited", "sub-dps","gauntlets"]),
        ("jihni.webp", "Jinhsi", 5, "Spectro", vec!["5star", "limited", "dps","broadblade"]),
        ("jiyan_card.webp", "Jiyan", 5, "Aero", vec!["5star", "limited", "dps","broadblade"]),
        ("lupa_card.webp", "Lupa", 5, "Fusion", vec!["5star", "limited", "sub_dps","broadblade"]),
        ("math_card.webp", "Aemeath", 5, "Fusion", vec!["5star", "limited", "dps","sword"]),
        ("phr_card.webp", "Phrolova", 5, "Havoc", vec!["5star", "limited", "dps","rectifier"]),
        ("qiu_card.webp", "Qiuyuan", 5, "Aero", vec!["5star", "limited", "sub_dps","sword"]),
        ("yinglin_card.webp", "Yinlin", 5, "Electro", vec!["5star", "limited", "sub_dps","rectifier"]),

        // 5-STAR STANDARD CHARACTERS
        ("encore_card.webp", "Encore", 5, "Fusion", vec!["5star", "standard", "dps","rectifier"]),
        ("jiaxin_card.webp", "Jianxin", 5, "Aero", vec!["5star", "standard", "support","gauntlets"]),
        ("kakarot_card.webp", "Calcharo", 5, "Electro", vec!["5star", "standard", "dps","broadblade"]),
        ("ling_card.webp", "Lingyang", 5, "Glacio", vec!["5star", "standard", "dps","gauntlets"]),
        ("verina_card.webp", "Verina", 5, "Spectro", vec!["5star", "standard", "healer","rectifier"]),
        
        // 4-STAR CHARACTERS
        ("aalto_card.webp", "Aalto", 4, "Aero", vec!["4star", "sub_dps","pistols"]),
        ("baizhi_card.webp", "Baizhi", 4, "Glacio", vec!["4star", "healer","rectifier"]),
        ("buling_card.webp", "Buling", 4, "Electro", vec!["4star", "healer","rectifier"]),
        ("card_lumi.webp", "Lumi", 4, "Electro", vec!["4star", "sub_dps","broadblade"]),
        ("card_youhu.webp", "Youhu", 4, "Glacio", vec!["4star", "healer","gauntlets"]),
        ("chixia_card.webp", "Chixia", 4, "Fusion", vec!["4star", "dps","pistols"]),
        ("danjin_card.webp", "Danjin", 4, "Havoc", vec!["4star", "sub_dps","sword"]),
        ("mortefi_card.webp", "Mortefi", 4, "Fusion", vec!["4star", "sub_dps","pistols"]),
        ("senhua_card.webp", "Sanhua", 4, "Glacio", vec!["4star", "sub_dps","sword"]),
        ("taoqi_card.webp", "Taoqi", 4, "Havoc", vec!["4star", "support","broadblade"]),
        ("yang_card.webp", "Yangyang", 4, "Aero", vec!["4star", "support","sword"]),
        ("yuanwu_card.webp", "Yuanwu", 4, "Electro", vec!["4star", "support","gauntlets"])
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
            
            // Special handling for Rover variants - use actual image filename
            let actual_filename = if filename.starts_with("rover_") {
                "rover_card.webp".to_string()
            } else {
                filename.to_string()
            };

            map.insert(filename.to_string(), AssetMetadata {
                id,
                filename: actual_filename,
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