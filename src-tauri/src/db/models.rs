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
    pub weapon_id: Option<i64>, // New FK reference to weapons_inventory.id, added in v5
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
pub struct Goal {
    pub id: i64,
    pub goal_text: String,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub notes: Option<String>,
    pub astrite_needed: Option<i64>,
    pub estimated_banner: Option<String>,
}