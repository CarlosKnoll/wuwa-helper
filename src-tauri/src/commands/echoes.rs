// Updated echoes.rs - Replace the EchoBuild-related parts with this code

use crate::db::init_db;
use crate::assets::mappings::echo_sets::get_echo_set_mappings;
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

// ============================================
// Echo Set Commands (Updated with piece count info)
// ============================================

/// Returns all echo set definitions from the asset mappings
/// Includes information about available piece counts (2pc, 3pc, 5pc)
#[tauri::command]
pub fn get_all_echo_sets() -> Result<Vec<serde_json::Value>, String> {
    let mappings = get_echo_set_mappings();
    
    let mut sets: Vec<_> = mappings
        .iter()
        .map(|(filename, metadata)| {
            let set_key = filename.replace(".webp", "");
            let two_piece = metadata.tags.get(0).cloned().unwrap_or_default();
            let five_piece = metadata.tags.get(1).cloned().unwrap_or_default();
            
            // Determine if this is a 3pc-only set (no 5pc effect)
            let is_three_piece_only = five_piece.is_empty();
            
            serde_json::json!({
                "key": set_key,
                "name": metadata.display_name,
                "filename": metadata.filename,
                "two_piece_bonus": two_piece,
                "five_piece_bonus": five_piece,
                "has_2pc": !two_piece.is_empty() && two_piece.contains("2 Set:"),
                "has_3pc": is_three_piece_only && two_piece.contains("3 Set:"),
                "has_5pc": !five_piece.is_empty(),
                "asset_type": metadata.asset_type,
            })
        })
        .collect();
    
    // Sort by key (set_1, set_2, etc.)
    sets.sort_by(|a, b| {
        let key_a = a["key"].as_str().unwrap_or("");
        let key_b = b["key"].as_str().unwrap_or("");
        
        let num_a: i32 = key_a.replace("set_", "").parse().unwrap_or(999);
        let num_b: i32 = key_b.replace("set_", "").parse().unwrap_or(999);
        
        num_a.cmp(&num_b)
    });
    
    Ok(sets)
}

/// Get a specific echo set by key
#[tauri::command]
pub fn get_echo_set_by_key(set_key: String) -> Result<Option<serde_json::Value>, String> {
    let mappings = get_echo_set_mappings();
    let filename = format!("{}.webp", set_key);
    
    if let Some(metadata) = mappings.get(&filename) {
        let two_piece = metadata.tags.get(0).cloned().unwrap_or_default();
        let five_piece = metadata.tags.get(1).cloned().unwrap_or_default();
        let is_three_piece_only = five_piece.is_empty();
        
        Ok(Some(serde_json::json!({
            "key": set_key,
            "name": metadata.display_name,
            "filename": metadata.filename,
            "two_piece_bonus": two_piece,
            "five_piece_bonus": five_piece,
            "has_2pc": !two_piece.is_empty() && two_piece.contains("2 Set:"),
            "has_3pc": is_three_piece_only && two_piece.contains("3 Set:"),
            "has_5pc": !five_piece.is_empty(),
            "asset_type": metadata.asset_type,
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
    
    // If using secondary set, ensure both set keys are provided and different
    if secondary_set_pieces > 0 {
        if secondary_set_key.is_none() {
            return Err("Secondary set key required when secondary_set_pieces > 0".to_string());
        }
        if primary_set_key == secondary_set_key {
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
pub fn get_echo_metadata_direct(echo_name: String) -> Result<Option<EchoMetadataResponse>, String> {
    // Import the echo mappings function
    use crate::assets::mappings::echoes::get_echo_mappings;
    
    let mappings = get_echo_mappings();
    
    // Search by display name (case-insensitive)
    let echo_name_lower = echo_name.to_lowercase();
    
    for (_filename, metadata) in mappings.iter() {
        if metadata.display_name.to_lowercase() == echo_name_lower {
            // Tags are in order: [passive1, passive2, "Cooldown: Xs"]
            if metadata.tags.len() >= 3 {
                let passive1 = metadata.tags[0].clone();
                let passive2 = metadata.tags[1].clone();
                let passive3 = metadata.tags[2].clone();
                
                // Parse cooldown from "Cooldown: 20s" format
                let cooldown_str = &metadata.tags[2];
                let cooldown = cooldown_str
                    .replace("Cooldown:", "")
                    .replace("s", "")
                    .trim()
                    .parse::<u8>()
                    .unwrap_or(0);
                
                return Ok(Some(EchoMetadataResponse {
                    passive1,
                    passive2,
                    passive3,
                    cooldown,
                }));
            }
        }
    }
    
    // Not found
    Ok(None)
}

/// Get available echo sets for a specific echo name
/// Returns the list of set names this echo can belong to
#[tauri::command]
pub fn get_echo_available_sets(echo_name: String) -> Result<Vec<String>, String> {
    use crate::assets::mappings::echoes::get_echo_mappings;
    
    let mappings = get_echo_mappings();
    let echo_name_lower = echo_name.to_lowercase();
    
    for (_filename, metadata) in mappings.iter() {
        if metadata.display_name.to_lowercase() == echo_name_lower {
            // The element field contains the comma-separated list of sets
            if let Some(sets_str) = &metadata.element {
                let sets: Vec<String> = sets_str
                    .split(", ")
                    .map(|s| s.trim().to_string())
                    .collect();
                return Ok(sets);
            }
        }
    }
    
    Ok(vec![])
}