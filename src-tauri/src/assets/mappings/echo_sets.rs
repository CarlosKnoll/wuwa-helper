use crate::assets::mapper::AssetMetadata;
use std::collections::HashMap;

/// Get echo set mappings
/// Format: (filename, display_name, primary_buff, secondary_buff)
pub fn get_echo_sets() -> Vec<(&'static str, &'static str, &'static str, &'static str)> {
    vec![
        ("set_1.webp", "Freezing Frost", "2 Set: Glacio DMG +10%.", "5 Set: Upon using Basic Attack or Heavy Attack, Glacio DMG increases by 10%, stacking up to three times, lasting for 15s."),
        ("set_2.webp", "Molten Rift", "2 Set: Fusion DMG% +10%.", "5 Set: Upon using Resonance Skill, Fusion DMG increases by 30% for 15s."),
        ("set_3.webp", "Void Thunder", "2 Set: Electro DMG +10%.", "5 Set: Upon using Heavy Attack or Resonance Skill, Electro DMG increases by 15%, stacking up to 2 times, each stack lasting for 15s."),
        ("set_4.webp", "Sierra Gale", "2 Set: Aero DMG +10%.", "5 Set: Upon using Intro Skill, Aero DMG increases by 30% for 15s."),
        ("set_5.webp", "Celestial Light", "2 Set: Spectro DMG +10%.", "5 Set: Upon using Intro Skill, Spectro DMG increases by 30% for 15s."),
        ("set_6.webp", "Havoc Eclipse", "2 Set: Havoc DMG +10%.", "5 Set: Upon using Basic Attack or Heavy Attack, Havoc DMG increases by 7.5%, stacking up to four times for 15s."),

        ("set_7.webp", "Rejuvenating Glow", "2 Set: Healing Bonus +10%.", "5 Set: Upon healing allies, increase ATK of the entire team by 15%, lasting 30s."),
        ("set_8.webp", "Moonlit Clouds", "2 Set: Energy Regen +10%.", "5 Set: Upon using Outro Skill, ATK of the next Resonator increases by 22.5% for 15s."),
        ("set_9.webp", "Lingering Tunes", "2 Set: ATK +10%.", "5 Set: While on the field, ATK increases by 5% every 1.5s, stacking up to 4 times. Outro Skill DMG increases by 60%."),

        ("set_10.webp", "Frosty Resolve", "2 Set: Resonance Skill DMG +12%.", "5 Set: Casting Resonance Skill grants 22.5% Glacio DMG Bonus for 15s and casting Resonance Liberation increases Resonance Skill DMG by 18%, lasting for 5s. This effect stacks up to 2 times."),
        ("set_11.webp", "Eternal Radiance", "2 Set: Spectro DMG +10%.", "5 Set: Inflicting enemies with Spectro Frazzleincreases Crit. Rate by 20% for 15s. Attacking enemies with 10 stacks of Spectro Frazzle grants 15% Spectro DMG Bonus for 15s."),
        ("set_12.webp", "Midnight Veil", "2 Set: Havoc DMG +10%.", "5 Set: When Outro Skill is triggered, deal additional 480% Havoc DMG to surrounding enemies, considered Outro Skill DMG, and grant the incoming Resonator 15% Havoc DMG Bonus for 15s."),

        ("set_13.webp", "Empyrean Anthem", "2 Set: Energy Regen +10%.", "5 Set: Increase the Resonator's Coordinated Attack DMG by 80%. Upon a critical hit of Coordinated Attack, increase the active Resonator's ATK by 20% for 4s."),
        ("set_14.webp", "Tidebreaking Courage", "2 Set: Energy Regen +10%.", "5 Set: Increase the Resonator's ATK by 15%. Reaching 250% Energy Regen increases all Attribute DMG by 30% for the Resonator."),

        ("set_15.webp", "Gusts of Welkin", "2 Set: Aero DMG +10%.", "5 Set: Inflicting Aero Erosion upon enemies increases Aero DMG for all Resonators in the team by 15%, and for the Resonator triggering this effect by an additional 15%, lasting for 20s."),
        ("set_16.webp", "Flaming Clawprint", "2 Set: Fusion DMG +10%.", "5 Set: Casting Resonance Liberation grants all Resonators in the team 15% Fusion DMG Bonus and the caster 20% Resonance Liberation DMG Bonus, lasting for 35s."),
        ("set_17.webp", "Windward Pilgrimage", "2 Set: Aero DMG +10%.", "5 Set: Hitting a target with Aero Erosion increases Crit. Rate by 10% and grants 30% Aero DMG Bonus, lasting for 10s."),

        ("set_18.webp", "Dream of the Lost", "3 Set: Holding 0 Resonance Energy increases Crit. Rate by 20% and grants 35% Echo Skill DMG Bonus.", ""),
        ("set_19.webp", "Crown of Valor", "3 Set: Upon gaining a Shield, increase the Resonator's ATK by 6% and Crit. DMG by 4% for 4s. This effect can be triggered once every 0.5s and stacks up to 5 times.", ""),

        ("set_20.webp", "Law of Harmony", "3 Set: Casting Echo Skill grants 30% Heavy Attack DMG Bonus to the caster for 4s. Additionally, all Resonators in the team gain 4% Echo Skill DMG Bonus for 30s, stacking up to 4 times. Echoes of the same name can only trigger this effect once. The record of Echo triggering this effect is cleared along with this effect. At 4 stacks, casting Echo Skill again resets the duration of this effect.", ""),
        ("set_21.webp", "Flamewing's Shadow", "3 Set: Dealing Echo Skill DMG increases Heavy Attack Crit. Rate by 20% for 6s. Dealing Heavy Attack DMG increases Echo Skill Crit. Rate by 20% for 6s. While both effects are active, gain 16% Fusion DMG Bonus.", ""),

        ("set_22.webp", "Thread of Severed Fate", "3 Set: Inflicting Havoc Bane increases the Resonator's ATK by 20% and grants 30% Resonance Liberation DMG Bonus for 5s.", ""),

        ("set_23.webp", "Halo of Starry Radiance", "2 Set: Healing Bonus +10%.", "5 Set: When healing a Resonator in the team, every 1% of Off-Tune Buildup Rate grants a 0.2% ATK increase to all Resonators in the team for 4s, up to 25%. Effects of the same name cannot be stacked."),
        ("set_24.webp", "Pact of Neonlight Leap", "2 Set: Spectro DMG +10%.", "5 Set: Casting Outro Skill increases the ATK of the incoming Resonator by 15%, with each point of Tune Break Boost additionally increasing ATK by 0.3%, up to 15%. This effect lasts for 15s, or until the Resonator is switched out."),
        ("set_25.webp", "Rite of Gilded Revelation", "2 Set: Spectro DMG +10%.", "5 Set: Dealing Basic Attack DMG increases Spectro DMG by 10% for 5s, stacking up to 3 times. With 3 stacks, casting Resonance Liberation grants 40% Basic Attack DMG Bonus."),
    ]
}

/// Get all echo set mappings
pub fn get_echo_set_mappings() -> HashMap<String, AssetMetadata> {
    let mut map = HashMap::new();

    for (filename, name, buff1, buff2) in get_echo_sets() {
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
            tags: vec![buff1.to_string(), buff2.to_string()],
        });
    }

    map
}