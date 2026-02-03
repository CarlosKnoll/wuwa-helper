use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get 4-cost (Overlord/Calamity) echo mappings
/// Format: (filename, name, element, class, cost, tags)
fn get_overlord_echoes() -> Vec<(&'static str, &'static str, &'static [&'static str], &'static str, u8, &'static str, &'static str, &'static str, u8)> {
    vec![

        ("6000167.webp", "Reminiscence: Threnodian - Leviathan", &["Flamewing's Shadow, Thread of Severed Fate"], "Calamity", 4, "Summon a Collapsing Horizon, dealing two instances of 131.04% Havoc DMG to the nearby enemies and obtaining the Core of Collapse for 15s. While it lasts, Core of Collapse deals 24.57% Havoc DMG when the active Resonator in the team deals damage. This effect can be triggered once every 0.5s, up to 8. Enemies with Havoc Bane take 100% more DMG from this effect. The Resonator with this Echo equipped in the main slot gains 12% Havoc DMG Bonus and 12% Resonance Liberation DMG Bonus.", "", "", 25),
        ("6000190.webp", "Reactor Husk", &["Halo of Starry Radiance"], "Overlord", 4, "Transform into Reactor Husk, jumping into the air and unleashing a heavy slash that deals 351% Fusion DMG to enemies.", "The Resonator with this Echo equipped in their main slot gain 10.00% Energy Regen.", "", 20),
        ("6000189.webp", "Hyvatia", &["Pact of Neonlight Leap", "Rite of Gilded Revelation"], "Overlord", 4, "Summon Hyvatia in mid-air to fire lasers at enemies, dealing 27.36% Spectro DMG 10 times.", "Casting Outro Skill within 15s after summoning Hyvatia grants 10.00% All-Attribute DMG Bonus to the Intro Skill of the incoming Resonator for 15s.", "", 20),

    ]
}

/// Get 3-cost (Elite) echo mappings
fn get_elite_echoes() -> Vec<(&'static str, &'static str, &'static [&'static str], &'static str, u8, &'static str, &'static str, &'static str, u8)> {
    vec![
        ("320000260.webp", "Abyssal Gladius", &["Midnight Veil","Tidebreaking Courage","Thread of Severed Fate"], "Elite", 3, "Transform into Abyssal Gladius and attack enemies in front of you with the sword, dealing 268.20% Glacio DMG.", "Hold the Echo Skill to maintain the Echo form for a while to slash enemies and cast a ranged attack forward, dealing 268.20% and 670.50% Glacio DMG respectively.", "", 15),
        ("6000173.webp", "Nightmare: Roseshroom", &["Thread of Severed Fate"], "Elite", 3, "Summon a Roseshroom that fires a laser, dealing 57.07% Havoc DMG up to 3 times.", "", "", 15),
        ("6000187.webp", "Frostbite Coleoid", &["Halo of Starry Radiance"], "Elite", 3, "Summon a Frostbite Coleoid to punch enemies, dealing 192.6% Glacio DMG.", "", "", 15),
        ("6000184.webp", "Spacetrek Explorer", &["Halo of Starry Radiance"], "Elite", 3, "Summon a Spacetrek Explorer to grant nearby active Resonators in the team a Shield equal to 10% of the summoner's Max HP for 4s.", "", "", 20),
        ("6000186.webp", "Sabercat Prowler", &["Halo of Starry Radiance", "Pact of Neonlight Leap"], "Elite", 3, "Summon a Sabercat Prowler to fire beams at enemies, dealing 192.6% Havoc DMG.", "", "", 15),
        ("6000185.webp", "Sabercat Reaver", &["Halo of Starry Radiance", "Pact of Neonlight Leap"], "Elite", 3, "Summon a Sabercat Reaver to attack enemies, dealing 192.6% Fusion DMG.", "", "", 15),
        ("6000183.webp", "Ironhoof", &["Pact of Neonlight Leap"], "Elite", 3, "Transform into an Ironhoof to charge at enemies, dealing 53.64% Fusion DMG. At the end of the charge, unleash a goring attack that deals 13.41% Fusion DMG 3 times and 174.33% Fusion DMG once.", "", "", 15),
        ("6000182.webp", "Mining Reindeer", &["Pact of Neonlight Leap"], "Elite", 3, "Summon a Mining Reindeer to launch a charged attack at enemies, dealing 237.6% Electro DMG.", "", "", 20),
        ("6000181.webp", "Flora Reindeer", &["Rite of Gilded Revelation"], "Elite", 3, "Summon a Flora Reindeer to attack enemies within a large range, dealing 192.6% Aero DMG.", "", "", 15),
        ("6000180.webp", "Twin Nova: Collapsar Blade", &["Rite of Gilded Revelation"], "Elite", 3, "Transform into Twin Nova: Collapsar Blade to rapidly fire at enemies for 5s, with each attack dealing 2.01% Electro DMG.", "The Resonator with this Echo equipped in the main slot gains 12.00% Electro DMG Bonus and 12.00% Basic Attack DMG Bonus.", "If Twin Nova: Nebulous Cannon is equipped in another slot on the Resonator: Casting Echo Skill unleashes both Nebulous Cannon and Collapsar Blade skills in quick succession, but is still considered performing the same Echo Skill. DMG dealt by Twin Nova: Collapsar Blade becomes Spectro DMG. The Electro DMG Bonus gained from equipping it in the main slot is turned into Spectro DMG Bonus. Casting Basic Attacks grants 1 stack of Dyad Origins. Casting Resonance Skill grants 3 stacks of Dyad Origins. Dyad Origins can stack up to 6 times and lasts for 8s. Each stack increases Echo Skill DMG by 10%, and all stacks are cleared after this Echo Skill ends. This skill is capped at 2 uses. Initially, this skill can be used 2 times, with 1 use added every 8s.", 8),
        ("6000179.webp", "Twin Nova: Nebulous Cannon", &["Rite of Gilded Revelation"], "Elite", 3, "Transform into a Twin Nova: Nebulous Cannon to slash enemies twice, with each attack dealing 80.51% Spectro DMG.", "The Resonator with this Echo equipped in the main slot gains 12.00% Spectro DMG Bonus and 12.00% Basic Attack DMG Bonus.", "If Twin Nova: Collapsar Blade is equipped in another slot on the Resonator: Casting Echo Skill unleashes both Nebulous Cannon and Collapsar Blade skills in quick succession, but the DMG Bonus from the Echo in the main slot remains unchanged. DMG dealt by Twin Nova: Collapsar Blade becomes Spectro DMG. Casting Basic Attacks grants 1 stack of Dyad Origins. Casting Resonance Skill grants 3 stacks of Dyad Origins. Dyad Origins can stack up to 6 times and lasts for 8s. Each stack increases Echo Skill DMG by 10%, and all stacks are cleared after this Echo Skill ends. This skill is capped at 2 uses. Initially, this skill can be used 2 times, with 1 use added every 8s.", 8),
        ("6000188.webp", "Windlash Coleoid", &["Rite of Gilded Revelation"], "Elite", 3, "Transform into a Windlash Coleoid to kick enemies, dealing 268.2% Aero DMG.", "", "", 15),

    ]
}

/// Get 1-cost (Common) echo mappings
fn get_common_echoes() -> Vec<(&'static str, &'static str, &'static [&'static str], &'static str, u8, &'static str, &'static str, &'static str, u8)> {
    vec![
        ("6000109.webp", "Havoc Drake", &["Flaming Clawprint", "Windward Pilgrimage", "Thread of Severed Fate"], "Common", 1, "Summon a Havoc Drake to attack enemies, dealing 129.60% Havoc DMG 3 times.", "", "", 8),
        ("6000172.webp", "Nightmare: Dwarf Cassowary", &["Thread of Severed Fate"], "Common", 1, "Summon a Dwarf Cassowary that tracks and attacks the enemy, dealing 38.40% Physical DMG 3 time(s).", "", "", 8),
        ("6000171.webp", "Nightmare: Tick Tack", &["Thread of Severed Fate"], "Common", 1, "Summon a Tick Tack that charges and bites the enemy. The charge from Tick Tack will deal 68.48% Havoc DMG to the enemy, and the bite will deal 102.72% Havoc DMG to the enemy. Reduces enemy Vibration Strength by up to 5% during 5s. ", "", "", 15),
        ("6000177.webp", "Geospider S4", &["Halo of Starry Radiance", "Pact of Neonlight Leap"], "Common", 1, "Summon a Geospider S4 to attack enemies, dealing an instance of 51.84% Spectro DMG and an instance of 77.76% Spectro DMG.", "", "", 8),
        ("6000174.webp", "Tremor Warrior", &["Halo of Starry Radiance", "Rite of Gilded Revelation"], "Common", 1, "Transform into a Tremor Warrior and viciously attack enemies in the front, dealing 205.2% Electro DMG.", "", "", 8),
        ("6000176.webp", "Mining Drone", &["Halo of Starry Radiance", "Rite of Gilded Revelation"], "Common", 1, "Transform into a Mining Drone to attack enemies, dealing 102.6% Havoc DMG twice.", "", "", 8),
        ("6000175.webp", "Flora Drone", &["Pact of Neonlight Leap", "Rite of Gilded Revelation"], "Common", 1, "Summon a Flora Drone, dealing 64.8% Aero DMG to enemies and healing Resonators within range by 3.6% of their Max HP plus an additional 160 HP.", "", "", 8),
        ("6000178.webp", "Zip Zap", &["Pact of Neonlight Leap", "Rite of Gilded Revelation"], "Common", 1, "Summon a Zip Zap to launch spinning attacks at enemies, dealing 25.92% Electro DMG 5 times.", "", "", 8),

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
        for (filename, name, sets, class, cost, passive1, passive2, passive3, cooldown) in echo_list {
            map.insert(filename.to_string(), AssetMetadata {
                id: name.to_lowercase().replace(" ", "_").replace("'", ""),
                filename: filename.to_string(),
                display_name: name.to_string(),
                asset_type: "echo".to_string(),
                rarity: Some(cost), // Using cost as rarity for echoes
                element: Some(sets.join(", ")), // Using sets as element for echoes
                weapon_type: None,
                echo_class: Some(class.to_string()),
                cost: Some(cost),
                tags: vec![passive1.to_string(), passive2.to_string(), passive3.to_string(), format!("Cooldown: {}s", cooldown)],
            });
        }
    }

    map
}