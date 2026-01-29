use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get echo set mappings
/// Format: (filename, display_name, primary_tag)
fn get_echo_sets() -> Vec<(&'static str, &'static str, &'static str)> {
    vec![
        ("set_1.webp", "Freezing Frost", "glacio_dmg"),
        ("set_2.webp", "Molten Rift", "fusion_dmg"),
        ("set_3.webp", "Void Thunder", "electro_dmg"),
        ("set_4.webp", "Sierra Gale", "aero_dmg"),
        ("set_5.webp", "Celestial Light", "spectro_dmg"),
        ("set_6.webp", "Havoc Eclipse", "havoc_dmg"),

        ("set_7.webp", "Rejuvenating Glow", "healing"),
        ("set_8.webp", "Moonlit Clouds", "support"),
        ("set_9.webp", "Lingering Tunes", "atk"),

        ("set_10.webp", "Frosty Resolve", "glacio_dmg"),
        ("set_11.webp", "Eternal Radiance", "spectro_dmg"),
        ("set_12.webp", "Midnight Veil", "havoc_dmg"),

        ("set_13.webp", "Empyrean Anthem", "coordinated_atk"),
        ("set_14.webp", "Tidebreaking Courage", "energy"),

        ("set_15.webp", "Gusts of Welkin", "aero_dmg"),
        ("set_16.webp", "Flaming Clawprint", "fusion_dmg"),

        ("set_17.webp", "Windward Pilgrimage", "aero_dmg"),
        ("set_18.webp", "Dream of the Lost", "echo_dmg"),
        ("set_19.webp", "Crown of Valor", "shield"),

        ("set_20.webp", "Law of Harmony", "echo_dmg"),
        ("set_21.webp", "Flamewing's Shadow", "echo_dmg"),

        ("set_22.webp", "Thread of Severed Fate", "havoc_dmg"),

        ("set_23.webp", "Halo of Starry Radiance", "healing"),
        ("set_24.webp", "Pact of Neonlight Leap", "spectro_dmg"),
        ("set_25.webp", "Rite of Gilded Revelation", "spectro_dmg"),
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