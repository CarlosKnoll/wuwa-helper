use rusqlite::{Connection, Result, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

// Character struct matching your database
#[derive(Debug, Serialize, Deserialize)]
struct Character {
    id: i64,
    character_name: String,
    variant: Option<String>,
    resonance_date: Option<String>,
    rarity: i64,
    element: String,
    weapon_type: String,
    waveband: i64,
    level: i64,
    ascension: i64,
    build_status: String,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CharacterTalents {
    id: i64,
    character_id: i64,
    basic_level: Option<i64>,
    skill_level: Option<i64>,
    liberation_level: Option<i64>,
    forte_level: Option<i64>,
    intro_level: Option<i64>,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CharacterWeapon {
    id: i64,
    character_id: i64,
    weapon_name: String,
    rarity: Option<i64>,
    level: Option<i64>,
    rank: Option<i64>,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct EchoBuild {
    id: i64,
    character_id: i64,
    set_bonus: Option<String>,
    set_effect: Option<String>,
    overall_quality: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Echo {
    id: i64,
    build_id: i64,
    echo_name: String,
    cost: Option<i64>,
    level: Option<i64>,
    rarity: Option<i64>,
    main_stat: Option<String>,
    main_stat_value: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct EchoSubstat {
    id: i64,
    echo_id: i64,
    stat_name: String,
    stat_value: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AccountInfo {
    id: i64,
    last_updated: String,
    union_level: i64,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Resources {
    id: i64,
    astrite: i64,
    lustrous_tide: i64,
    radiant_tide: i64,
    forged_tide: i64,
    afterglow_coral: i64,
    oscillated_coral: i64,
    shell_credits: i64,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PityStatus {
    id: i64,
    banner_type: String,
    current_pity: i64,
    guaranteed_next_fivestar: Option<bool>,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Weapon {
    id: i64,
    weapon_name: String,
    weapon_type: String,
    rarity: i64,
    rank: i64,
    level: i64,
    equipped_on: String,
    category: String,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExplorationRegion {
    id: i64,
    region_name: String,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExplorationMap {
    id: i64,
    region_id: i64,
    map_name: String,
    exploration_percent: f64,
    notes: Option<String>,
}

// Helper function to get database path
fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("wuwa_data.db"))
}

// Initialize database connection
fn init_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let db_path = get_db_path(app)?;
    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}

// Tauri commands
#[tauri::command]
fn get_all_characters(app: tauri::AppHandle) -> Result<Vec<Character>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_name, variant, resonance_date, rarity, element, weapon_type, waveband, level, ascension, build_status, notes FROM characters ORDER BY character_name")
        .map_err(|e| e.to_string())?;
    
    let characters = stmt
        .query_map([], |row| {
            Ok(Character {
                id: row.get(0)?,
                character_name: row.get(1)?,
                variant: row.get(2)?,
                resonance_date: row.get(3)?,
                rarity: row.get(4)?,
                element: row.get(5)?,
                weapon_type: row.get(6)?,
                waveband: row.get(7)?,
                level: row.get(8)?,
                ascension: row.get(9)?,
                build_status: row.get(10)?,
                notes: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(characters)
}

#[tauri::command]
fn get_character_talents(app: tauri::AppHandle, character_id: i64) -> Result<Option<CharacterTalents>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_id, basic_level, skill_level, liberation_level, forte_level, intro_level, notes FROM character_talents WHERE character_id = ?")
        .map_err(|e| e.to_string())?;
    
    let talent = stmt
        .query_row([character_id], |row| {
            Ok(CharacterTalents {
                id: row.get(0)?,
                character_id: row.get(1)?,
                basic_level: row.get(2)?,
                skill_level: row.get(3)?,
                liberation_level: row.get(4)?,
                forte_level: row.get(5)?,
                intro_level: row.get(6)?,
                notes: row.get(7)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(talent)
}

#[tauri::command]
fn get_character_weapon(app: tauri::AppHandle, character_id: i64) -> Result<Option<CharacterWeapon>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_id, weapon_name, rarity, level, rank, notes FROM character_weapons WHERE character_id = ?")
        .map_err(|e| e.to_string())?;
    
    let weapon = stmt
        .query_row([character_id], |row| {
            Ok(CharacterWeapon {
                id: row.get(0)?,
                character_id: row.get(1)?,
                weapon_name: row.get(2)?,
                rarity: row.get(3)?,
                level: row.get(4)?,
                rank: row.get(5)?,
                notes: row.get(6)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(weapon)
}

#[tauri::command]
fn get_echo_build(app: tauri::AppHandle, character_id: i64) -> Result<Option<EchoBuild>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, character_id, set_bonus, set_effect, overall_quality, notes FROM echo_builds WHERE character_id = ?")
        .map_err(|e| e.to_string())?;
    
    let build = stmt
        .query_row([character_id], |row| {
            Ok(EchoBuild {
                id: row.get(0)?,
                character_id: row.get(1)?,
                set_bonus: row.get(2)?,
                set_effect: row.get(3)?,
                overall_quality: row.get(4)?,
                notes: row.get(5)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(build)
}

#[tauri::command]
fn get_echoes(app: tauri::AppHandle, build_id: i64) -> Result<Vec<Echo>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, build_id, echo_name, cost, level, rarity, main_stat, main_stat_value, notes FROM echoes WHERE build_id = ? ORDER BY cost DESC")
        .map_err(|e| e.to_string())?;
    
    let echoes = stmt
        .query_map([build_id], |row| {
            Ok(Echo {
                id: row.get(0)?,
                build_id: row.get(1)?,
                echo_name: row.get(2)?,
                cost: row.get(3)?,
                level: row.get(4)?,
                rarity: row.get(5)?,
                main_stat: row.get(6)?,
                main_stat_value: row.get(7)?,
                notes: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(echoes)
}

#[tauri::command]
fn get_echo_substats(app: tauri::AppHandle, echo_id: i64) -> Result<Vec<EchoSubstat>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, echo_id, stat_name, stat_value FROM echo_substats WHERE echo_id = ?")
        .map_err(|e| e.to_string())?;
    
    let substats = stmt
        .query_map([echo_id], |row| {
            Ok(EchoSubstat {
                id: row.get(0)?,
                echo_id: row.get(1)?,
                stat_name: row.get(2)?,
                stat_value: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(substats)
}

#[tauri::command]
fn get_account_info(app: tauri::AppHandle) -> Result<AccountInfo, String> {
    let conn = init_db(&app)?;
    
    let info = conn
        .query_row(
            "SELECT id, last_updated, union_level, notes FROM account_info WHERE id = 1",
            [],
            |row| {
                Ok(AccountInfo {
                    id: row.get(0)?,
                    last_updated: row.get(1)?,
                    union_level: row.get(2)?,
                    notes: row.get(3)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(info)
}

#[tauri::command]
fn get_resources(app: tauri::AppHandle) -> Result<Resources, String> {
    let conn = init_db(&app)?;
    
    let resources = conn
        .query_row(
            "SELECT id, astrite, lustrous_tide, radiant_tide, forged_tide, afterglow_coral, oscillated_coral, shell_credits, notes FROM resources WHERE id = 1",
            [],
            |row| {
                Ok(Resources {
                    id: row.get(0)?,
                    astrite: row.get(1)?,
                    lustrous_tide: row.get(2)?,
                    radiant_tide: row.get(3)?,
                    forged_tide: row.get(4)?,
                    afterglow_coral: row.get(5)?,
                    oscillated_coral: row.get(6)?,
                    shell_credits: row.get(7)?,
                    notes: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(resources)
}

#[tauri::command]
fn get_pity_status(app: tauri::AppHandle) -> Result<Vec<PityStatus>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, banner_type, current_pity, guaranteed_next_fivestar, notes FROM pity_status")
        .map_err(|e| e.to_string())?;
    
    let pity = stmt
        .query_map([], |row| {
            Ok(PityStatus {
                id: row.get(0)?,
                banner_type: row.get(1)?,
                current_pity: row.get(2)?,
                guaranteed_next_fivestar: row.get(3)?,
                notes: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(pity)
}

#[tauri::command]
fn get_all_weapons(app: tauri::AppHandle) -> Result<Vec<Weapon>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, weapon_name, weapon_type, rarity, rank, level, equipped_on, category, notes FROM weapons_inventory ORDER BY rarity DESC, weapon_name")
        .map_err(|e| e.to_string())?;
    
    let weapons = stmt
        .query_map([], |row| {
            Ok(Weapon {
                id: row.get(0)?,
                weapon_name: row.get(1)?,
                weapon_type: row.get(2)?,
                rarity: row.get(3)?,
                rank: row.get(4)?,
                level: row.get(5)?,
                equipped_on: row.get(6)?,
                category: row.get(7)?,
                notes: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(weapons)
}

#[tauri::command]
fn get_exploration_regions(app: tauri::AppHandle) -> Result<Vec<ExplorationRegion>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, region_name, notes FROM exploration_regions")
        .map_err(|e| e.to_string())?;
    
    let regions = stmt
        .query_map([], |row| {
            Ok(ExplorationRegion {
                id: row.get(0)?,
                region_name: row.get(1)?,
                notes: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(regions)
}

#[tauri::command]
fn get_exploration_maps(app: tauri::AppHandle, region_id: i64) -> Result<Vec<ExplorationMap>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, region_id, map_name, exploration_percent, notes FROM exploration_maps WHERE region_id = ?")
        .map_err(|e| e.to_string())?;
    
    let maps = stmt
        .query_map([region_id], |row| {
            Ok(ExplorationMap {
                id: row.get(0)?,
                region_id: row.get(1)?,
                map_name: row.get(2)?,
                exploration_percent: row.get(3)?,
                notes: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(maps)
}

// Database import/export using Tauri 2 plugins
#[tauri::command]
async fn import_database(app: tauri::AppHandle, source_path: String) -> Result<String, String> {
    let dest_path = get_db_path(&app)?;
    
    std::fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to import database: {}", e))?;
    
    Ok("Database imported successfully".to_string())
}

#[tauri::command]
async fn export_database(app: tauri::AppHandle, dest_path: String) -> Result<String, String> {
    let source_path = get_db_path(&app)?;
    
    std::fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to export database: {}", e))?;
    
    Ok("Database exported successfully".to_string())
}

// Update commands
#[tauri::command]
fn update_resources(
    app: tauri::AppHandle,
    astrite: i64,
    lustrous_tide: i64,
    radiant_tide: i64,
    forged_tide: i64,
    afterglow_coral: i64,
    oscillated_coral: i64,
    shell_credits: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE resources SET astrite = ?, lustrous_tide = ?, radiant_tide = ?, forged_tide = ?, 
         afterglow_coral = ?, oscillated_coral = ?, shell_credits = ?, notes = ? WHERE id = 1",
        (astrite, lustrous_tide, radiant_tide, forged_tide, afterglow_coral, oscillated_coral, shell_credits, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Resources updated successfully".to_string())
}

#[tauri::command]
fn update_pity(
    app: tauri::AppHandle,
    id: i64,
    current_pity: i64,
    guaranteed_next_fivestar: Option<bool>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE pity_status SET current_pity = ?, guaranteed_next_fivestar = ?, notes = ? WHERE id = ?",
        (current_pity, guaranteed_next_fivestar, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Pity updated successfully".to_string())
}

#[tauri::command]
fn update_character(
    app: tauri::AppHandle,
    id: i64,
    level: i64,
    ascension: i64,
    waveband: i64,
    build_status: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE characters SET level = ?, ascension = ?, waveband = ?, build_status = ?, notes = ? WHERE id = ?",
        (level, ascension, waveband, build_status, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Character updated successfully".to_string())
}

#[tauri::command]
fn update_character_talents(
    app: tauri::AppHandle,
    character_id: i64,
    basic_level: Option<i64>,
    skill_level: Option<i64>,
    liberation_level: Option<i64>,
    forte_level: Option<i64>,
    intro_level: Option<i64>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE character_talents SET basic_level = ?, skill_level = ?, liberation_level = ?, 
         forte_level = ?, intro_level = ?, notes = ? WHERE character_id = ?",
        (basic_level, skill_level, liberation_level, forte_level, intro_level, notes, character_id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Talents updated successfully".to_string())
}

#[tauri::command]
fn update_character_weapon(
    app: tauri::AppHandle,
    character_id: i64,
    weapon_name: String,
    rarity: Option<i64>,
    level: Option<i64>,
    rank: Option<i64>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE character_weapons SET weapon_name = ?, rarity = ?, level = ?, rank = ?, notes = ? WHERE character_id = ?",
        (weapon_name, rarity, level, rank, notes, character_id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Weapon updated successfully".to_string())
}

#[tauri::command]
fn update_echo_build(
    app: tauri::AppHandle,
    id: i64,
    set_bonus: Option<String>,
    set_effect: Option<String>,
    overall_quality: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echo_builds SET set_bonus = ?, set_effect = ?, overall_quality = ?, notes = ? WHERE id = ?",
        (set_bonus, set_effect, overall_quality, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo build updated successfully".to_string())
}

#[tauri::command]
fn update_echo(
    app: tauri::AppHandle,
    id: i64,
    level: Option<i64>,
    main_stat: Option<String>,
    main_stat_value: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echoes SET level = ?, main_stat = ?, main_stat_value = ?, notes = ? WHERE id = ?",
        (level, main_stat, main_stat_value, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo updated successfully".to_string())
}

#[tauri::command]
fn update_weapon(
    app: tauri::AppHandle,
    id: i64,
    level: i64,
    rank: i64,
    equipped_on: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE weapons_inventory SET level = ?, rank = ?, equipped_on = ?, notes = ? WHERE id = ?",
        (level, rank, equipped_on, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Weapon updated successfully".to_string())
}

#[tauri::command]
fn update_exploration_map(
    app: tauri::AppHandle,
    id: i64,
    exploration_percent: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE exploration_maps SET exploration_percent = ?, notes = ? WHERE id = ?",
        (exploration_percent, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Exploration updated successfully".to_string())
}

#[tauri::command]
fn update_echo_substat(
    app: tauri::AppHandle,
    id: i64,
    stat_name: String,
    stat_value: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echo_substats SET stat_name = ?, stat_value = ? WHERE id = ?",
        (stat_name, stat_value, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo substat updated successfully".to_string())
}

#[tauri::command]
fn add_character(
    app: tauri::AppHandle,
    character_name: String,
    variant: Option<String>,
    rarity: i64,
    element: String,
    weapon_type: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO characters (character_name, variant, rarity, element, weapon_type, waveband, level, ascension, build_status) 
         VALUES (?, ?, ?, ?, ?, 0, 1, 0, 'Not built')",
        (character_name, variant, rarity, element, weapon_type),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Character added successfully".to_string())
}

#[tauri::command]
fn add_weapon(
    app: tauri::AppHandle,
    weapon_name: String,
    weapon_type: String,
    rarity: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO weapons_inventory (weapon_name, weapon_type, rarity, rank, level, equipped_on, category) 
         VALUES (?, ?, ?, 1, 1, 'Nobody', 'owned')",
        (weapon_name, weapon_type, rarity),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Weapon added successfully".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_all_characters,
            get_character_talents,
            get_character_weapon,
            get_echo_build,
            get_echoes,
            get_echo_substats,
            get_account_info,
            get_resources,
            get_pity_status,
            get_all_weapons,
            get_exploration_regions,
            get_exploration_maps,
            import_database,
            export_database,
            update_resources,
            update_pity,
            update_character,
            update_character_talents,
            update_character_weapon,
            update_echo_build,
            update_echo,
            update_weapon,
            update_exploration_map,
            update_echo_substat,
            add_character,
            add_weapon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}