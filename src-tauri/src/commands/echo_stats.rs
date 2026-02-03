// src-tauri/src/commands/echo_stats.rs
//! Echo statistics names only - values are user-inputted

use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize)]
pub struct StatInfo {
    pub name: String,
    pub is_percentage: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct EchoStatsData {
    pub main_stats_by_cost: HashMap<u8, Vec<StatInfo>>,
    pub substats: Vec<StatInfo>,
}

/// Get all echo statistics options (stat names only)
pub fn get_echo_stats_data() -> EchoStatsData {
    EchoStatsData {
        main_stats_by_cost: get_main_stats_by_cost(),
        substats: get_substat_names(),
    }
}

/// Get main stat names organized by echo cost
fn get_main_stats_by_cost() -> HashMap<u8, Vec<StatInfo>> {
    let mut map = HashMap::new();
    
    // 4-cost echoes (Overlord/Calamity class)
    map.insert(4, vec![
        StatInfo { name: "ATK%".to_string(), is_percentage: true },
        StatInfo { name: "HP%".to_string(), is_percentage: true },
        StatInfo { name: "DEF%".to_string(), is_percentage: true },
        StatInfo { name: "Crit Rate".to_string(), is_percentage: true },
        StatInfo { name: "Crit DMG".to_string(), is_percentage: true },
        StatInfo { name: "Healing Bonus".to_string(), is_percentage: true },
    ]);
    
    // 3-cost echoes (Elite class)
    map.insert(3, vec![
        StatInfo { name: "ATK%".to_string(), is_percentage: true },
        StatInfo { name: "HP%".to_string(), is_percentage: true },
        StatInfo { name: "DEF%".to_string(), is_percentage: true },
        StatInfo { name: "Energy Regen".to_string(), is_percentage: true },
        StatInfo { name: "Aero DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Glacio DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Fusion DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Electro DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Spectro DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Havoc DMG%".to_string(), is_percentage: true },
    ]);
    
    // 1-cost echoes (Common class)
    map.insert(1, vec![
        StatInfo { name: "ATK%".to_string(), is_percentage: true },
        StatInfo { name: "HP%".to_string(), is_percentage: true },
        StatInfo { name: "DEF%".to_string(), is_percentage: true },
    ]);
    
    map
}

/// Get all possible substat names
fn get_substat_names() -> Vec<StatInfo> {
    vec![
        StatInfo { name: "ATK".to_string(), is_percentage: false },
        StatInfo { name: "ATK%".to_string(), is_percentage: true },
        StatInfo { name: "HP".to_string(), is_percentage: false },
        StatInfo { name: "HP%".to_string(), is_percentage: true },
        StatInfo { name: "DEF".to_string(), is_percentage: false },
        StatInfo { name: "DEF%".to_string(), is_percentage: true },
        StatInfo { name: "Crit Rate".to_string(), is_percentage: true },
        StatInfo { name: "Crit DMG".to_string(), is_percentage: true },
        StatInfo { name: "Energy Regen".to_string(), is_percentage: true },
        StatInfo { name: "Basic Attack DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Heavy Attack DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Resonance Skill DMG%".to_string(), is_percentage: true },
        StatInfo { name: "Resonance Liberation DMG%".to_string(), is_percentage: true },
    ]
}

/// Tauri command to get echo stats options
#[tauri::command]
pub fn get_echo_stats_options() -> EchoStatsData {
    get_echo_stats_data()
}