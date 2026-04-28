// Updated echoes.rs - Replace the EchoBuild-related parts with this code

use crate::db::init_db;
use crate::assets::AssetManager;
use rusqlite::{Result, OptionalExtension};
use serde::{Deserialize, Serialize};

// Updated Models
#[derive(Debug, Serialize, Deserialize)]
pub struct EchoBuild {
    pub id: i64,
    pub character_id: i64,
    pub primary_set_key: Option<String>,      // Primary echo set
    pub secondary_set_key: Option<String>,     // Secondary set for mixed builds
    pub primary_set_pieces: i64,               // Number of pieces for primary set
    pub secondary_set_pieces: i64,             // Number of pieces for secondary set
    pub overall_quality: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Echo {
    pub id: i64,
    pub build_id: i64,
    pub echo_name: Option<String>,
    pub echo_set: Option<String>,  // Which echo set this echo belongs to
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
pub struct EchoMetadataResponse {
    pub passive1: String,
    pub passive2: String,
    pub passive3: String,
    pub cooldown: u8,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EchoListItem {
    pub name: String,
    pub cost: u8,
    pub echo_class: String,
    pub available_sets: Vec<String>,
}

// ============================================
// Echo Set Commands (Updated with piece count info)
// ============================================

/// Returns all echo set definitions from the asset mappings
/// Includes information about available piece counts (2pc, 3pc, 5pc)
#[tauri::command]
pub fn get_all_echo_sets(
    manager: tauri::State<'_, AssetManager>
) -> Result<Vec<serde_json::Value>, String> {

    let mut sets: Vec<_> = manager
        .get_all_mappings()
        .values()
        .filter(|m| m.asset_type == "echo_set")
        .map(|m| {
            let two = m.tags.get(0).cloned().unwrap_or_default();
            let five = m.tags.get(1).cloned().unwrap_or_default();
            let is_three_piece_only = five.is_empty();

            serde_json::json!({
                "key": m.id,
                "name": m.display_name,
                "filename": m.filename,
                "two_piece_bonus": two,
                "five_piece_bonus": five,
                "has_2pc": two.contains("2 Set:"),
                "has_3pc": is_three_piece_only && two.contains("3 Set:"),
                "has_5pc": !five.is_empty(),
                "asset_type": m.asset_type,
            })
        })
        .collect();

        sets.sort_by(|a, b| {
            let extract_num = |v: &serde_json::Value| -> u32 {
                v["filename"]
                    .as_str()
                    .and_then(|s| s.trim_start_matches("set_").split('.').next())
                    .and_then(|n| n.parse().ok())
                    .unwrap_or(0)
            };
            extract_num(a).cmp(&extract_num(b))
        });

    Ok(sets)
}


/// Get a specific echo set by key
#[tauri::command]
pub fn get_echo_set_by_key(
    set_key: String,
    manager: tauri::State<'_, AssetManager>
) -> Result<Option<serde_json::Value>, String> {

    let metadata = manager
        .get_all_mappings()
        .values()
        .find(|m| m.asset_type == "echo_set" && m.id == set_key);

    if let Some(m) = metadata {
        let two = m.tags.get(0).cloned().unwrap_or_default();
        let five = m.tags.get(1).cloned().unwrap_or_default();

        let is_three_piece_only = five.is_empty();

        Ok(Some(serde_json::json!({
            "key": m.id,
            "name": m.display_name,
            "filename": m.filename,
            "two_piece_bonus": two,
            "five_piece_bonus": five,
            "has_2pc": two.contains("2 Set:"),
            "has_3pc": is_three_piece_only && two.contains("3 Set:"),
            "has_5pc": !five.is_empty(),
            "asset_type": m.asset_type,
        })))
    } else {
        Ok(None)
    }
}

// ============================================
// Echo Build Commands (Updated for mixed sets)
// ============================================

#[tauri::command]
pub fn get_echo_build(app: tauri::AppHandle, character_id: i64) -> Result<Option<EchoBuild>, String> {
    let conn = init_db(&app)?;
    
    let build = conn
        .query_row(
            "SELECT id, character_id, primary_set_key, secondary_set_key, 
                    primary_set_pieces, secondary_set_pieces, overall_quality, notes 
             FROM echo_builds 
             WHERE character_id = ?",
            [character_id],
            |row| {
                Ok(EchoBuild {
                    id: row.get(0)?,
                    character_id: row.get(1)?,
                    primary_set_key: row.get(2)?,
                    secondary_set_key: row.get(3)?,
                    primary_set_pieces: row.get(4)?,
                    secondary_set_pieces: row.get(5)?,
                    overall_quality: row.get(6)?,
                    notes: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(build)
}

#[tauri::command]
pub fn update_echo_build(
    app: tauri::AppHandle,
    build_id: i64,
    primary_set_key: Option<String>,
    secondary_set_key: Option<String>,
    primary_set_pieces: i64,
    secondary_set_pieces: i64,
    overall_quality: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Validate piece counts
    let total_pieces = primary_set_pieces + secondary_set_pieces;
    if total_pieces != 5 {
        return Err(format!(
            "Invalid piece count: {} + {} = {} (must equal 5)",
            primary_set_pieces, secondary_set_pieces, total_pieces
        ));
    }
    
    // Validate valid combinations (5+0, 3+2, 2+3)
    if !matches!((primary_set_pieces, secondary_set_pieces), (5, 0) | (3, 2) | (2, 3)) {
        return Err(format!(
            "Invalid set combination: {}pc + {}pc (valid: 5+0, 3+2, 2+3)",
            primary_set_pieces, secondary_set_pieces
        ));
    }
    
    // FIXED: Only validate secondary set requirements for mixed builds only if one is set.
    if secondary_set_pieces > 0 {
        if !primary_set_key.is_none() && secondary_set_key.is_none() {
            return Err("Secondary set key required when secondary_set_pieces > 0".to_string());
        }
        if primary_set_key.is_none() && !secondary_set_key.is_none() {
            return Err("Primary set key required for mixed builds".to_string());
        }
        if primary_set_key == secondary_set_key && !primary_set_key.is_none(){
            return Err("Primary and secondary sets must be different".to_string());
        }
    }
    
    conn.execute(
        "UPDATE echo_builds 
         SET primary_set_key = ?, secondary_set_key = ?, 
             primary_set_pieces = ?, secondary_set_pieces = ?,
             overall_quality = ?, notes = ? 
         WHERE id = ?",
        (
            primary_set_key,
            secondary_set_key,
            primary_set_pieces,
            secondary_set_pieces,
            overall_quality,
            notes,
            build_id
        ),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo build updated successfully".to_string())
}

// ============================================
// Echo Commands (Keep existing, no changes needed)
// ============================================

#[tauri::command]
pub fn get_echoes(app: tauri::AppHandle, build_id: i64) -> Result<Vec<Echo>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, build_id, echo_name, echo_set, cost, level, rarity, main_stat, main_stat_value, notes FROM echoes WHERE build_id = ?")
        .map_err(|e| e.to_string())?;
    
    let echoes = stmt
        .query_map([build_id], |row| {
            Ok(Echo {
                id: row.get(0)?,
                build_id: row.get(1)?,
                echo_name: row.get(2)?,
                echo_set: row.get(3)?,
                cost: row.get(4)?,
                level: row.get(5)?,
                rarity: row.get(6)?,
                main_stat: row.get(7)?,
                main_stat_value: row.get(8)?,
                notes: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(echoes)
}

#[tauri::command]
pub fn get_echo_substats(app: tauri::AppHandle, echo_id: i64) -> Result<Vec<EchoSubstat>, String> {
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
pub fn update_echo(
    app: tauri::AppHandle,
    id: i64,
    echo_name: Option<String>,
    echo_set: Option<String>,
    cost: Option<i64>,
    rarity: Option<i64>,
    level: Option<i64>,
    main_stat: Option<String>,
    main_stat_value: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE echoes SET echo_name = ?, echo_set = ?, cost = ?, rarity = ?, level = ?, main_stat = ?, main_stat_value = ?, notes = ? WHERE id = ?",
        (echo_name, echo_set, cost, rarity, level, main_stat, main_stat_value, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo updated successfully".to_string())
}

#[tauri::command]
pub fn add_echo(
    app: tauri::AppHandle,
    build_id: i64,
    echo_name: String,
    echo_set: Option<String>,
    cost: i64,
    level: i64,
    rarity: i64,
    main_stat: Option<String>,
    main_stat_value: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO echoes (build_id, echo_name, echo_set, cost, level, rarity, main_stat, main_stat_value, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (build_id, echo_name, echo_set, cost, level, rarity, main_stat, main_stat_value, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo added successfully".to_string())
}

#[tauri::command]
pub fn update_echo_substat(
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
pub fn add_echo_substat(
    app: tauri::AppHandle,
    echo_id: i64,
    stat_name: String,
    stat_value: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO echo_substats (echo_id, stat_name, stat_value) VALUES (?, ?, ?)",
        (echo_id, stat_name, stat_value),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo substat added successfully".to_string())
}

#[tauri::command]
pub fn delete_echo_substat(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "DELETE FROM echo_substats WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo substat deleted successfully".to_string())
}

#[tauri::command]
pub fn delete_echo(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Delete all substats for this echo first
    conn.execute(
        "DELETE FROM echo_substats WHERE echo_id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    // Delete the echo
    conn.execute(
        "DELETE FROM echoes WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Echo deleted successfully".to_string())
}

#[tauri::command]
pub fn get_echo_metadata_direct(
    echo_name: String,
    manager: tauri::State<'_, AssetManager>
) -> Result<Option<EchoMetadataResponse>, String> {

    let name = echo_name.to_lowercase();

    let metadata = manager
        .get_all_mappings()
        .values()
        .find(|m| m.asset_type == "echo"
            && m.display_name.to_lowercase() == name);

    if let Some(m) = metadata {
        // Find cooldown tag by content, regardless of position
        let cooldown = m.tags.iter()
            .find(|t| t.trim_start().starts_with("Cooldown:"))
            .and_then(|t| {
                t.replace("Cooldown:", "")
                 .replace("s", "")
                 .trim()
                 .parse::<u8>()
                 .ok()
            })
            .unwrap_or(0);

        // Collect all non-cooldown tags as description lines
        let desc_lines: Vec<&str> = m.tags.iter()
            .filter(|t| !t.trim_start().starts_with("Cooldown:"))
            .map(|t| t.as_str())
            .collect();

        return Ok(Some(EchoMetadataResponse {
            passive1: desc_lines.get(0).unwrap_or(&"").to_string(),
            passive2: desc_lines.get(1).unwrap_or(&"").to_string(),
            passive3: desc_lines.get(2).unwrap_or(&"").to_string(),
            cooldown,
        }));
    }

    Ok(None)
}
/// Get available echo sets for a specific echo name
/// Returns the list of set names this echo can belong to
#[tauri::command]
pub fn get_echo_available_sets(
    echo_name: String,
    manager: tauri::State<'_, AssetManager>
) -> Result<Vec<String>, String> {

    let name = echo_name.to_lowercase();

    let metadata = manager
        .get_all_mappings()
        .values()
        .find(|m| m.asset_type == "echo"
            && m.display_name.to_lowercase() == name);

    if let Some(m) = metadata {
        if let Some(sets) = &m.element {
            return Ok(
                sets.split(", ")
                    .map(|s| s.trim().to_string())
                    .collect()
            );
        }
    }

    Ok(vec![])
}

/// Get all available echoes for the echo name dropdown
/// Returns a list of echo names with their cost, class, and available sets
#[tauri::command]
pub fn get_available_echoes(
    manager: tauri::State<'_, AssetManager>
) -> Result<Vec<EchoListItem>, String> {

    let mut echoes: Vec<EchoListItem> = manager
        .get_all_mappings()
        .values()
        .filter(|m| m.asset_type == "echo")
        .map(|m| {
            let available_sets = m.element
                .as_ref()
                .map(|s| {
                    s.split(", ")
                        .map(|x| x.trim().to_string())
                        .collect()
                })
                .unwrap_or_default();

            EchoListItem {
                name: m.display_name.clone(),
                cost: m.cost.unwrap_or(0) as u8,
                echo_class: m.echo_class.clone().unwrap_or_default(),
                available_sets,
            }
        })
        .collect();

    echoes.sort_by(|a, b| {
        b.cost.cmp(&a.cost).then_with(|| a.name.cmp(&b.name))
    });

    Ok(echoes)
}