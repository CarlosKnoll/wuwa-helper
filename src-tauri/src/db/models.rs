use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Character {
    pub id: i64,
    pub character_name: String,
    pub variant: Option<String>,
    pub resonance_date: Option<String>,
    pub rarity: i64,
    pub element: String,
    pub weapon_type: String,
    pub waveband: i64,
    pub level: i64,
    pub ascension: i64,
    pub build_status: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CharacterTalents {
    pub id: i64,
    pub character_id: i64,
    pub basic_level: Option<i64>,
    pub skill_level: Option<i64>,
    pub liberation_level: Option<i64>,
    pub forte_level: Option<i64>,
    pub intro_level: Option<i64>,
    pub notes: Option<String>,
    // Minor traces (2 per talent, except Forte which has major traces)
    pub basic_minor_1: Option<i64>,
    pub basic_minor_2: Option<i64>,
    pub skill_minor_1: Option<i64>,
    pub skill_minor_2: Option<i64>,
    pub liberation_minor_1: Option<i64>,
    pub liberation_minor_2: Option<i64>,
    pub intro_minor_1: Option<i64>,
    pub intro_minor_2: Option<i64>,
    // Major traces (2 for Forte)
    pub forte_major_1: Option<i64>,
    pub forte_major_2: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CharacterWeapon {
    pub id: i64,
    pub character_id: i64,
    pub weapon_name: String,
    pub rarity: Option<i64>,
    pub level: Option<i64>,
    pub rank: Option<i64>,
    pub notes: Option<String>,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct EchoBuild {
    pub id: i64,
    pub character_id: i64,
    pub primary_set_key: Option<String>,      // Primary echo set ('set_1', 'set_18', etc.)
    pub secondary_set_key: Option<String>,     // Secondary set for mixed builds (can be null)
    pub primary_set_pieces: i64,               // Number of pieces for primary set (5, 3, or 2)
    pub secondary_set_pieces: i64,             // Number of pieces for secondary set (0, 2, or 3)
    pub overall_quality: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Echo {
    pub id: i64,
    pub build_id: i64,
    pub echo_name: String,
    pub cost: Option<i64>,
    pub level: Option<i64>,
    pub rarity: Option<i64>,
    pub main_stat: Option<String>,
    pub main_stat_value: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EchoSubstat {
    pub id: i64,
    pub echo_id: i64,
    pub stat_name: String,
    pub stat_value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccountInfo {
    pub id: i64,
    pub last_updated: String,
    pub union_level: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Resources {
    pub id: i64,
    pub astrite: i64,
    pub lustrous_tide: i64,
    pub radiant_tide: i64,
    pub forged_tide: i64,
    pub afterglow_coral: i64,
    pub oscillated_coral: i64,
    pub shell_credits: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PityStatus {
    pub id: i64,
    pub banner_type: String,
    pub current_pity: i64,
    pub guaranteed_next_fivestar: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Weapon {
    pub id: i64,
    pub weapon_name: String,
    pub weapon_type: String,
    pub rarity: i64,
    pub rank: i64,
    pub level: i64,
    pub equipped_on: String,
    pub category: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExplorationRegion {
    pub id: i64,
    pub region_name: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExplorationMap {
    pub id: i64,
    pub region_id: i64,
    pub map_name: String,
    pub exploration_percent: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EndgameMode {
    pub id: i64,
    pub mode_name: String,
    pub difficulty: Option<String>,
    pub stars_earned: Option<i64>,
    pub max_stars: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Goal {
    pub id: i64,
    pub goal_text: String,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub notes: Option<String>,
    pub astrite_needed: Option<i64>,
    pub estimated_banner: Option<String>,
}