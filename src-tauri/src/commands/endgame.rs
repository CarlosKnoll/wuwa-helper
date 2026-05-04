use crate::db::init_db;
use rusqlite::{Result, OptionalExtension};
use serde::{Deserialize, Serialize};
use chrono;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerOfAdversity {
    pub id: i64,
    pub last_reset: String,
    pub total_stars: i64,
    pub astrite_earned: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerDetails {
    pub id: i64,
    pub tower_type: String,
    pub stars_achieved: i64,
    pub max_stars: i64,
    pub notes: Option<String>,
}

// NEW: Floor-level star tracking
#[derive(Debug, Serialize, Deserialize)]
pub struct TowerFloor {
    pub id: i64,
    pub tower_type: String,
    pub floor_number: i64,
    pub stars: i64,
    pub max_stars: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerAreaEffect {
    pub id: i64,
    pub tower_type: String,
    pub floor_range: String,
    pub effect_description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TowerTeam {
    pub id: i64,
    pub tower_type: String,
    pub floor_number: i64,
    pub character1: String,
    pub character2: String,
    pub character3: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhimperingWastes {
    pub id: i64,
    pub last_reset: String,
    pub chasm_highest_stage: i64,
    pub chasm_total_points: i64,
    pub chasm_astrite: i64,
    pub torrents_total_points: i64,
    pub torrents_astrite: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TorrentsStage {
    pub id: i64,
    pub stage_number: i64,
    pub character1: String,
    pub character2: String,
    pub character3: String,
    pub token: String,
    pub points: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TroopMatrix {
    pub id: i64,
    pub last_reset: String,
    pub stability_accords_points: i64,
    pub stability_accords_astrite: i64,
    pub singularity_expansion_points: i64,
    pub singularity_expansion_astrite: i64,
    pub singularity_expansion_highest_round: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatrixTeam {
    pub id: i64,
    pub mode: String, // "Stability Accords" or "Singularity Expansion"
    pub team_number: i64,
    pub character1: String,
    pub character2: String,
    pub character3: String,
    pub points: i64,
    pub round_number: Option<i64>, // Only for Singularity Expansion
}

#[tauri::command]
pub fn get_tower_of_adversity(app: tauri::AppHandle) -> Result<TowerOfAdversity, String> {
    let conn = init_db(&app)?;
    
    let tower = conn
        .query_row(
            "SELECT id, last_reset, total_stars, astrite_earned, notes FROM tower_of_adversity WHERE id = 1",
            [],
            |row| {
                Ok(TowerOfAdversity {
                    id: row.get(0)?,
                    last_reset: row.get(1)?,
                    total_stars: row.get(2)?,
                    astrite_earned: row.get(3)?,
                    notes: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(tower)
}

#[tauri::command]
pub fn get_tower_details(app: tauri::AppHandle) -> Result<Vec<TowerDetails>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, stars_achieved, max_stars, notes FROM tower_details")
        .map_err(|e| e.to_string())?;
    
    let details = stmt
        .query_map([], |row| {
            Ok(TowerDetails {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                stars_achieved: row.get(2)?,
                max_stars: row.get(3)?,
                notes: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(details)
}

// NEW: Get floor-level stars for a specific tower
#[tauri::command]
pub fn get_tower_floors(app: tauri::AppHandle, tower_type: String) -> Result<Vec<TowerFloor>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, floor_number, stars, max_stars FROM tower_floors WHERE tower_type = ? ORDER BY floor_number")
        .map_err(|e| e.to_string())?;
    
    let floors = stmt
        .query_map([&tower_type], |row| {
            Ok(TowerFloor {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                floor_number: row.get(2)?,
                stars: row.get(3)?,
                max_stars: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(floors)
}

// NEW: Update stars for a specific floor
#[tauri::command]
pub fn update_tower_floor_stars(
    app: tauri::AppHandle,
    id: i64,
    stars: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_floors SET stars = ? WHERE id = ?",
        (stars, id),
    )
    .map_err(|e| e.to_string())?;
    
    // Recalculate total stars for the tower type
    let tower_type: String = conn
        .query_row(
            "SELECT tower_type FROM tower_floors WHERE id = ?",
            [id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    let total_stars: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(stars), 0) FROM tower_floors WHERE tower_type = ?",
            [&tower_type],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    // Update the tower_details table
    conn.execute(
        "UPDATE tower_details SET stars_achieved = ? WHERE tower_type = ?",
        (total_stars, &tower_type),
    )
    .map_err(|e| e.to_string())?;
    
    // Update total stars in tower_of_adversity
    let overall_total: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(stars), 0) FROM tower_floors",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE tower_of_adversity SET total_stars = ? WHERE id = 1",
        [overall_total],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower floor stars updated successfully".to_string())
}

#[tauri::command]
pub fn get_tower_area_effects(app: tauri::AppHandle) -> Result<Vec<TowerAreaEffect>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, floor_range, effect_description FROM tower_area_effects")
        .map_err(|e| e.to_string())?;
    
    let effects = stmt
        .query_map([], |row| {
            Ok(TowerAreaEffect {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                floor_range: row.get(2)?,
                effect_description: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(effects)
}

#[tauri::command]
pub fn get_tower_teams(app: tauri::AppHandle) -> Result<Vec<TowerTeam>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, tower_type, floor_number, character1, character2, character3 FROM tower_teams")
        .map_err(|e| e.to_string())?;
    
    let teams = stmt
        .query_map([], |row| {
            Ok(TowerTeam {
                id: row.get(0)?,
                tower_type: row.get(1)?,
                floor_number: row.get(2)?,
                character1: row.get(3)?,
                character2: row.get(4)?,
                character3: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(teams)
}

#[tauri::command]
pub fn get_whimpering_wastes(app: tauri::AppHandle) -> Result<WhimperingWastes, String> {
    let conn = init_db(&app)?;
    
    let wastes = conn
        .query_row(
            "SELECT id, last_reset, chasm_highest_stage, chasm_total_points, chasm_astrite, torrents_total_points, torrents_astrite, notes FROM whimpering_wastes WHERE id = 1",
            [],
            |row| {
                Ok(WhimperingWastes {
                    id: row.get(0)?,
                    last_reset: row.get(1)?,
                    chasm_highest_stage: row.get(2)?,
                    chasm_total_points: row.get(3)?,
                    chasm_astrite: row.get(4)?,
                    torrents_total_points: row.get(5)?,
                    torrents_astrite: row.get(6)?,
                    notes: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    
    Ok(wastes)
}

#[tauri::command]
pub fn get_torrents_stages(app: tauri::AppHandle) -> Result<Vec<TorrentsStage>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, stage_number, character1, character2, character3, token, points FROM torrents_stages ORDER BY stage_number")
        .map_err(|e| e.to_string())?;
    
    let stages = stmt
        .query_map([], |row| {
            Ok(TorrentsStage {
                id: row.get(0)?,
                stage_number: row.get(1)?,
                character1: row.get(2)?,
                character2: row.get(3)?,
                character3: row.get(4)?,
                token: row.get(5)?,
                points: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(stages)
}

#[tauri::command]
pub fn get_troop_matrix(app: tauri::AppHandle) -> Result<Option<TroopMatrix>, String> {
    let conn = init_db(&app)?;
    
    let matrix = conn
        .query_row(
            "SELECT id, last_reset, stability_accords_points, stability_accords_astrite, 
             singularity_expansion_points, singularity_expansion_astrite, singularity_expansion_highest_round, notes 
             FROM troop_matrix WHERE id = 1",
            [],
            |row| {
                Ok(TroopMatrix {
                    id: row.get(0)?,
                    last_reset: row.get(1)?,
                    stability_accords_points: row.get(2)?,
                    stability_accords_astrite: row.get(3)?,
                    singularity_expansion_points: row.get(4)?,
                    singularity_expansion_astrite: row.get(5)?,
                    singularity_expansion_highest_round: row.get(6)?,
                    notes: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(matrix)
}

#[tauri::command]
pub fn get_matrix_teams(app: tauri::AppHandle) -> Result<Vec<MatrixTeam>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, mode, team_number, character1, character2, character3, points, round_number FROM matrix_teams ORDER BY mode, team_number")
        .map_err(|e| e.to_string())?;
    
    let teams = stmt
        .query_map([], |row| {
            Ok(MatrixTeam {
                id: row.get(0)?,
                mode: row.get(1)?,
                team_number: row.get(2)?,
                character1: row.get(3)?,
                character2: row.get(4)?,
                character3: row.get(5)?,
                points: row.get(6)?,
                round_number: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(teams)
}

// Update commands

#[tauri::command]
pub fn update_tower_of_adversity(
    app: tauri::AppHandle,
    total_stars: i64,
    astrite_earned: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_of_adversity SET total_stars = ?, astrite_earned = ?, notes = ? WHERE id = 1",
        (total_stars, astrite_earned, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower of Adversity updated successfully".to_string())
}

#[tauri::command]
pub fn update_tower_details(
    app: tauri::AppHandle,
    id: i64,
    stars_achieved: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_details SET stars_achieved = ?, notes = ? WHERE id = ?",
        (stars_achieved, notes, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower details updated successfully".to_string())
}

#[tauri::command]
pub fn update_whimpering_wastes(
    app: tauri::AppHandle,
    chasm_highest_stage: i64,
    chasm_total_points: i64,
    chasm_astrite: i64,
    torrents_total_points: i64,
    torrents_astrite: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE whimpering_wastes 
         SET chasm_highest_stage = ?, chasm_total_points = ?, chasm_astrite = ?, 
             torrents_total_points = ?, torrents_astrite = ?, notes = ? 
         WHERE id = 1",
        (chasm_highest_stage, chasm_total_points, chasm_astrite, torrents_total_points, torrents_astrite, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Whimpering Wastes updated successfully".to_string())
}

#[tauri::command]
pub fn update_troop_matrix(
    app: tauri::AppHandle,
    stability_accords_points: i64,
    stability_accords_astrite: i64,
    singularity_expansion_points: i64,
    singularity_expansion_astrite: i64,
    singularity_expansion_highest_round: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE troop_matrix 
         SET stability_accords_points = ?, stability_accords_astrite = ?, 
             singularity_expansion_points = ?, singularity_expansion_astrite = ?, 
             singularity_expansion_highest_round = ?, notes = ? 
         WHERE id = 1",
        (stability_accords_points, stability_accords_astrite, singularity_expansion_points, 
         singularity_expansion_astrite, singularity_expansion_highest_round, notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Troop Matrix updated successfully".to_string())
}

#[tauri::command]
pub fn update_matrix_last_reset(
    app: tauri::AppHandle,
    last_reset: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE troop_matrix SET last_reset = ? WHERE id = 1",
        [last_reset],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Last reset date updated successfully".to_string())
}

#[tauri::command]
pub fn update_matrix_team(
    app: tauri::AppHandle,
    id: i64,
    character1: String,
    character2: String,
    character3: String,
    points: i64,
    round_number: Option<i64>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE matrix_teams 
         SET character1 = ?, character2 = ?, character3 = ?, points = ?, round_number = ? 
         WHERE id = ?",
        (character1, character2, character3, points, round_number, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Matrix team updated successfully".to_string())
}

#[tauri::command]
pub fn add_matrix_team(
    app: tauri::AppHandle,
    mode: String,
    team_number: i64,
    character1: String,
    character2: String,
    character3: String,
    points: i64,
    round_number: Option<i64>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO matrix_teams (mode, team_number, character1, character2, character3, points, round_number)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        (mode, team_number, character1, character2, character3, points, round_number),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Matrix team added successfully".to_string())
}

#[tauri::command]
pub fn delete_matrix_team(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "DELETE FROM matrix_teams WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Matrix team deleted successfully".to_string())
}

#[tauri::command]
pub fn update_tower_team(
    app: tauri::AppHandle,
    id: i64,
    character1: String,
    character2: String,
    character3: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_teams SET character1 = ?, character2 = ?, character3 = ? WHERE id = ?",
        (character1, character2, character3, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower team updated successfully".to_string())
}

#[tauri::command]
pub fn update_torrents_stage(
    app: tauri::AppHandle,
    id: i64,
    character1: String,
    character2: String,
    character3: String,
    token: String,
    points: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE torrents_stages SET character1 = ?, character2 = ?, character3 = ?, token = ?, points = ? WHERE id = ?",
        (character1, character2, character3, token, points, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Torrents stage updated successfully".to_string())
}

#[tauri::command]
pub fn update_tower_last_reset(
    app: tauri::AppHandle,
    last_reset: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_of_adversity SET last_reset = ? WHERE id = 1",
        [last_reset],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Last reset date updated successfully".to_string())
}

#[tauri::command]
pub fn update_wastes_last_reset(
    app: tauri::AppHandle,
    last_reset: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE whimpering_wastes SET last_reset = ? WHERE id = 1",
        [last_reset],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Last reset date updated successfully".to_string())
}

#[tauri::command]
pub fn update_tower_area_effect(
    app: tauri::AppHandle,
    id: i64,
    tower_type: String,
    floor_range: String,
    effect_description: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE tower_area_effects 
         SET tower_type = ?, floor_range = ?, effect_description = ? 
         WHERE id = ?",
        (tower_type, floor_range, effect_description, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower area effect updated successfully".to_string())
}

#[tauri::command]
pub fn reset_tower_of_adversity(app: tauri::AppHandle) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Get today's date
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    
    // Reset tower overview
    conn.execute(
        "UPDATE tower_of_adversity 
         SET last_reset = ?, total_stars = 0, astrite_earned = 0, notes = NULL 
         WHERE id = 1",
        [&today],
    )
    .map_err(|e| e.to_string())?;
    
    // Reset all tower details
    conn.execute(
        "UPDATE tower_details 
         SET stars_achieved = 0, notes = NULL",
        [],
    )
    .map_err(|e| e.to_string())?;
    
    // Reset all floor stars
    conn.execute(
        "UPDATE tower_floors SET stars = 0",
        [],
    )
    .map_err(|e| e.to_string())?;
    
    // Clear area effect descriptions (keep floor_range, clear description)
    conn.execute(
        "UPDATE tower_area_effects 
         SET effect_description = ''",
        [],
    )
    .map_err(|e| e.to_string())?;
    
    // Delete all tower teams
    conn.execute(
        "DELETE FROM tower_teams",
        [],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower of Adversity reset successfully".to_string())
}

#[tauri::command]
pub fn reset_whimpering_wastes(app: tauri::AppHandle) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Get today's date
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    
    // Reset wastes data
    conn.execute(
        "UPDATE whimpering_wastes 
         SET last_reset = ?, 
             chasm_highest_stage = 0, 
             chasm_total_points = 0, 
             chasm_astrite = 0, 
             torrents_total_points = 0, 
             torrents_astrite = 0, 
             notes = NULL 
         WHERE id = 1",
        [&today],
    )
    .map_err(|e| e.to_string())?;
    
    // Delete all torrents stages
    conn.execute(
        "DELETE FROM torrents_stages",
        [],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Whimpering Wastes reset successfully".to_string())
}

#[tauri::command]
pub fn reset_troop_matrix(app: tauri::AppHandle) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Get today's date
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    
    // Reset matrix data (keep unlocked status)
    conn.execute(
        "UPDATE troop_matrix 
         SET last_reset = ?, 
             stability_accords_points = 0, 
             stability_accords_astrite = 0, 
             singularity_expansion_points = 0, 
             singularity_expansion_astrite = 0, 
             singularity_expansion_highest_round = 0, 
             notes = NULL 
         WHERE id = 1",
        [&today],
    )
    .map_err(|e| e.to_string())?;
    
    // Delete all matrix teams
    conn.execute(
        "DELETE FROM matrix_teams",
        [],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Troop Matrix reset successfully".to_string())
}

#[tauri::command]
pub fn add_tower_team(
    app: tauri::AppHandle,
    tower_type: String,
    floor_number: i64,
    character1: String,
    character2: String,
    character3: String,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO tower_teams (tower_type, floor_number, character1, character2, character3)
         VALUES (?, ?, ?, ?, ?)",
        (tower_type, floor_number, character1, character2, character3),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower team added successfully".to_string())
}

#[tauri::command]
pub fn delete_tower_team(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "DELETE FROM tower_teams WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Tower team deleted successfully".to_string())
}

#[tauri::command]
pub fn add_torrents_stage(
    app: tauri::AppHandle,
    stage_number: i64,
    character1: String,
    character2: String,
    character3: String,
    token: String,
    points: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO torrents_stages (stage_number, character1, character2, character3, token, points)
         VALUES (?, ?, ?, ?, ?, ?)",
        (stage_number, character1, character2, character3, token, points),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Torrents stage added successfully".to_string())
}

#[tauri::command]
pub fn delete_torrents_stage(
    app: tauri::AppHandle,
    id: i64,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "DELETE FROM torrents_stages WHERE id = ?",
        [id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Torrents stage deleted successfully".to_string())
}

#[tauri::command]
pub fn initialize_tower_floors(app: tauri::AppHandle) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Check if floors already exist
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM tower_floors", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    if count > 0 {
        return Ok(format!("Floors already initialized ({} floors exist)", count));
    }
    
    // Insert all floors for all three towers
    let tower_types = vec!["echoing", "resonant", "hazard"];
    
    for tower_type in tower_types {
        for floor_num in 1..=12 {
            conn.execute(
                "INSERT INTO tower_floors (tower_type, floor_number, stars, max_stars)
                 VALUES (?, ?, 0, 3)",
                (tower_type, floor_num),
            )
            .map_err(|e| e.to_string())?;
        }
    }
    
    Ok("Successfully initialized 36 tower floors (3 towers × 12 floors)".to_string())
}

// =============================================================================
// API Data Types — encore.moe endgame integration
// =============================================================================
 
/// One elemental resistance on a monster
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiElement {
    pub name: String,
    /// Element icon URL (webp). Empty string when no icon available (e.g. Physical).
    pub icon: String,
}
 
/// Monster info returned by the API (shared by TOA, Whiwa, and Matrix)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiMonster {
    pub name: String,
    pub icon: String,
    /// All elemental resistances. Empty vec for Physical enemies with no element icon.
    pub elements: Vec<ApiElement>,
}
 
/// A single area effect buff from the TOA API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiTowerBuff {
    pub id: i64,
    /// Raw description — may contain <span style="color:#..."> HTML
    pub desc: String,
}
 
/// One floor node in the TOA season detail
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiTowerFloorData {
    pub floor: i64,
    pub area_name: String,  // "Resonant Tower" | "Hazard Tower" | "Echoing Tower"
    pub monsters: Vec<ApiMonster>,
    pub buffs: Vec<ApiTowerBuff>,
}
 
/// Processed TOA season data stored in cache
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToaSeasonCache {
    pub season_id: i64,
    pub season_name: String,
    pub finish_date: String,
    /// Keyed by tower_type string ("resonant" | "hazard" | "echoing")
    pub floors_by_tower: std::collections::HashMap<String, Vec<ApiTowerFloorData>>,
}
 
/// A selectable token/buff item available in the Infinite Torrents level.
/// Sourced from BuffItems[].Item in the whiwa season detail response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiWhiwaToken {
    pub id: i64,
    pub name: String,
    /// Small icon URL (webp), suitable for display at 20-32px
    pub icon: String,
    /// QualityId: 4 = purple, 5 = gold
    pub quality: i64,
}
 
/// One stage inside the Infinite Torrents level (Whiwa)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiWhiwaStage {
    /// 1 = Concerto side, 2 = Resonance Energy side
    pub stage_index: i64,
    /// DungeonDesc — e.g. "When entering a Challenge, Concerto Energy is restored to 100%"
    pub dungeon_desc: String,
    pub monsters: Vec<ApiMonster>,
}
 
/// Processed Whiwa season data stored in cache
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhiwaSeasonCache {
    pub season_id: i64,
    pub season_name: String,
    pub finish_date: String,
    /// Two stages from the Infinite Torrents level (EndLess: true)
    pub torrents_stages: Vec<ApiWhiwaStage>,
    /// Selectable token/buff items for the season (from BuffItems[].Item)
    pub token_items: Vec<ApiWhiwaToken>,
}
 
/// One wave (boss fight) in the DPMatrix
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiMatrixWave {
    pub round: i64,
    pub wave: i64,
    pub name: String,
    pub icon: String,
    /// RES tags (e.g. [{name: "Aero RES", color: "55ffb5ff"}])
    pub tags: Vec<ApiMatrixTag>,
}
 
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiMatrixTag {
    pub name: String,
    pub color: String,
    /// Element icon URL (webp) for this resistance tag
    pub path: String,
}
 
/// One level (Stability Accords or Singularity Expansion)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiMatrixLevel {
    pub id: i64,
    pub name: String,  // "Stability Accords" | "Singularity Expansion"
    pub waves: Vec<ApiMatrixWave>,
    /// Global season buffs for this level
    pub season_buffs: Vec<ApiTowerBuff>,
}
 
/// Processed DPMatrix season data stored in cache
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrixSeasonCache {
    pub season_id: i64,
    pub season_name: String,
    pub levels: Vec<ApiMatrixLevel>,
}
 
// =============================================================================
// Cache helpers
// =============================================================================
 
fn get_data_dir(_app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe
        .parent()
        .ok_or_else(|| "Cannot determine executable directory".to_string())?;
    let data = dir.join("data");
    std::fs::create_dir_all(&data).map_err(|e| e.to_string())?;
    Ok(data)
}
 
fn read_cache<T: serde::de::DeserializeOwned>(path: &std::path::Path) -> Option<T> {
    let text = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&text).ok()
}
 
fn write_cache<T: serde::Serialize>(path: &std::path::Path, value: &T) -> Result<(), String> {
    let text = serde_json::to_string(value).map_err(|e| e.to_string())?;
    std::fs::write(path, text).map_err(|e| e.to_string())
}
 
/// Parse a hex color string like "E649A6FF" or "e649a6ff" into "#E649A6"
fn hex_to_css(hex: &str) -> String {
    // Strip alpha if 8 chars; keep 6
    let clean = hex.trim_start_matches('#');
    if clean.len() >= 6 {
        format!("#{}", &clean[..6].to_uppercase())
    } else {
        format!("#{}", clean.to_uppercase())
    }
}
 
// =============================================================================
// HTTP helpers (async reqwest — runs on Tauri's async runtime, never blocks UI)
// =============================================================================
 
async fn http_get(url: &str) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    resp.json::<serde_json::Value>().await.map_err(|e| e.to_string())
}
 
// =============================================================================
// areaName → tower_type key mapping
// =============================================================================
 
fn area_name_to_key(name: &str) -> &'static str {
    match name {
        "Resonant Tower"  => "resonant",
        "Hazard Tower"    => "hazard",
        "Echoing Tower"   => "echoing",
        _                 => "resonant",
    }
}
 
// =============================================================================
// TOA fetch command
// =============================================================================
 
/// Returns the current TOA season API data (cached by finish date).
/// Returns None if offline / API unavailable — frontend falls back to DB.
#[tauri::command]
pub async fn fetch_toa_season(app: tauri::AppHandle) -> Result<Option<ToaSeasonCache>, String> {
    let cache_path = get_data_dir(&app)?.join("endgame_cache_toa.json");
 
    // Check existing cache
    if let Some(cached) = read_cache::<ToaSeasonCache>(&cache_path) {
        let today = chrono::Local::now().date_naive();
        if let Ok(finish) = chrono::NaiveDate::parse_from_str(&cached.finish_date, "%Y-%m-%d") {
            if today <= finish {
                return Ok(Some(cached));
            }
        }
    }
 
    // Fetch season list
    let list = match http_get("https://api-v2.encore.moe/api/en/toa").await {
        Ok(v) => v,
        Err(_) => return Ok(None),
    };
 
    let seasons = match list.get("seasons").and_then(|s| s.as_array()) {
        Some(s) => s.clone(),
        None => return Ok(None),
    };
 
    // Find the current season (current: true)
    let current = match seasons.iter().find(|s| s.get("current").and_then(|c| c.as_bool()) == Some(true)) {
        Some(s) => s.clone(),
        None => return Ok(None),
    };
 
    let season_id = current.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let season_name = current.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let finish_date = current.get("finish").and_then(|v| v.as_str()).unwrap_or("").to_string();
 
    // Fetch season detail
    let detail = match http_get(&format!("https://api-v2.encore.moe/api/en/toa/{}", season_id)).await {
        Ok(v) => v,
        Err(_) => return Ok(None),
    };
 
    // Parse nested structure: { "35": { "1": { "1": { "1": [...] } } } }
    // Area keys: "1" = Resonant, "2" = Hazard, "3" = Echoing (in this season)
    let mut floors_by_tower: std::collections::HashMap<String, Vec<ApiTowerFloorData>> = std::collections::HashMap::new();
 
    if let Some(season_obj) = detail.get(season_id.to_string().as_str()).and_then(|v| v.as_object()) {
        for (_area_key, floor_map) in season_obj {
            if let Some(floor_obj) = floor_map.as_object() {
                for (_floor_key, cost_map) in floor_obj {
                    if let Some(cost_obj) = cost_map.as_object() {
                        for (_cost_key, nodes) in cost_obj {
                            if let Some(node_arr) = nodes.as_array() {
                                for node in node_arr {
                                    let area_name = node.get("areaName").and_then(|v| v.as_str()).unwrap_or("Resonant Tower");
                                    let tower_key = area_name_to_key(area_name).to_string();
                                    let floor_num = node.get("floor").and_then(|v| v.as_i64()).unwrap_or(0);
 
                                    let monsters: Vec<ApiMonster> = node
                                        .get("monsters")
                                        .and_then(|m| m.as_array())
                                        .unwrap_or(&vec![])
                                        .iter()
                                        .filter_map(|m| {
                                            let name = m.get("name")?.as_str()?.to_string();
                                            let icon = m.get("icon")?.as_str()?.to_string();
                                            // Collect all elements; skip entries without an icon URL (Physical)
                                            let elements: Vec<ApiElement> = m
                                                .get("elements")
                                                .and_then(|v| v.as_array())
                                                .unwrap_or(&vec![])
                                                .iter()
                                                .filter_map(|e| {
                                                    let ename = e.get("name")?.as_str()?.to_string();
                                                    let eicon = e.get("icon")
                                                        .and_then(|v| v.as_str())
                                                        .unwrap_or("")
                                                        .to_string();
                                                    if eicon.is_empty() { return None; }
                                                    Some(ApiElement { name: ename, icon: eicon })
                                                })
                                                .collect();
                                            Some(ApiMonster { name, icon, elements })
                                        })
                                        .collect();
 
                                    let buffs: Vec<ApiTowerBuff> = node
                                        .get("buffs")
                                        .and_then(|b| b.as_array())
                                        .unwrap_or(&vec![])
                                        .iter()
                                        .filter_map(|b| {
                                            let id = b.get("id")?.as_i64()?;
                                            let desc = b.get("desc")?.as_str()?.to_string();
                                            Some(ApiTowerBuff { id, desc })
                                        })
                                        .collect();
 
                                    let entry = floors_by_tower.entry(tower_key).or_default();
                                    // Deduplicate: only add if this floor_num not already present
                                    if !entry.iter().any(|f| f.floor == floor_num) {
                                        entry.push(ApiTowerFloorData {
                                            floor: floor_num,
                                            area_name: area_name.to_string(),
                                            monsters,
                                            buffs,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
 
    // Sort floors within each tower
    for floors in floors_by_tower.values_mut() {
        floors.sort_by_key(|f| f.floor);
    }
 
    let cache = ToaSeasonCache { season_id, season_name, finish_date, floors_by_tower };
    let _ = write_cache(&cache_path, &cache);
    Ok(Some(cache))
}
 
// =============================================================================
// Whiwa fetch command
// =============================================================================
 
#[tauri::command]
pub async fn fetch_whiwa_season(app: tauri::AppHandle) -> Result<Option<WhiwaSeasonCache>, String> {
    let cache_path = get_data_dir(&app)?.join("endgame_cache_whiwa.json");
 
    if let Some(cached) = read_cache::<WhiwaSeasonCache>(&cache_path) {
        let today = chrono::Local::now().date_naive();
        if let Ok(finish) = chrono::NaiveDate::parse_from_str(&cached.finish_date, "%Y-%m-%d") {
            if today <= finish {
                return Ok(Some(cached));
            }
        }
    }
 
    let list = match http_get("https://api-v2.encore.moe/api/en/whiwa").await {
        Ok(v) => v,
        Err(_) => return Ok(None),
    };
 
    let seasons = match list.as_array() {
        Some(s) => s.clone(),
        None => return Ok(None),
    };
 
    let current = match seasons.iter().find(|s| s.get("current").and_then(|c| c.as_bool()) == Some(true)) {
        Some(s) => s.clone(),
        None => return Ok(None),
    };
 
    let season_id = current.get("Season").and_then(|v| v.as_i64()).unwrap_or(0);
    let season_name = current.get("Name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let finish_date = current.get("finish").and_then(|v| v.as_str()).unwrap_or("").to_string();
 
    let detail = match http_get(&format!("https://api-v2.encore.moe/api/en/whiwa/{}", season_id)).await {
        Ok(v) => v,
        Err(_) => return Ok(None),
    };
 
    let mut torrents_stages: Vec<ApiWhiwaStage> = Vec::new();
 
    // Find the StageGroup with Name containing "Torrents" → find Level with EndLess: true
    if let Some(stage_groups) = detail.get("StageGroups").and_then(|v| v.as_array()) {
        'outer: for group in stage_groups {
            let group_name = group.get("Name").and_then(|v| v.as_str()).unwrap_or("");
            if !group_name.contains("Torrents") {
                continue;
            }
            if let Some(levels) = group.get("Levels").and_then(|v| v.as_array()) {
                for level in levels {
                    let endless = level.get("EndLess").and_then(|v| v.as_bool()).unwrap_or(false);
                    if !endless {
                        continue;
                    }
                    // Found Infinite Torrents level — extract its 2 stages
                    if let Some(stages) = level.get("Stages").and_then(|v| v.as_array()) {
                        for (idx, stage) in stages.iter().enumerate() {
                            let dungeon_desc = stage.get("DungeonDesc").and_then(|v| v.as_str()).unwrap_or("").to_string();
                            let monsters: Vec<ApiMonster> = stage
                                .get("Monsters")
                                .and_then(|m| m.as_array())
                                .unwrap_or(&vec![])
                                .iter()
                                .filter_map(|m| {
                                    let name = m.get("Name")?.as_str()?.to_string();
                                    let icon = m.get("Icon")?.as_str()?.to_string();
                                    // Collect all elements; skip entries without an icon (Physical)
                                    let elements: Vec<ApiElement> = m
                                        .get("Elements")
                                        .and_then(|v| v.as_array())
                                        .unwrap_or(&vec![])
                                        .iter()
                                        .filter_map(|e| {
                                            let ename = e.get("Name")?.as_str()?.to_string();
                                            let eicon = e.get("Icon")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or("")
                                                .to_string();
                                            if eicon.is_empty() { return None; }
                                            Some(ApiElement { name: ename, icon: eicon })
                                        })
                                        .collect();
                                    Some(ApiMonster { name, icon, elements })
                                })
                                .collect();
                            torrents_stages.push(ApiWhiwaStage {
                                stage_index: (idx + 1) as i64,
                                dungeon_desc,
                                monsters,
                            });
                        }
                    }
                    break 'outer;
                }
            }
        }
    }
 
    let token_items: Vec<ApiWhiwaToken> = detail
        .get("BuffItems")
        .and_then(|v| v.as_array())
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|b| {
            let id = b.get("Id")?.as_i64()?;
            let item = b.get("Item")?;
            let name = item.get("Name")?.as_str()?.to_string();
            let icon = item.get("IconSmall")
                .or_else(|| item.get("Icon"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let quality = item.get("QualityId")?.as_i64()?;
            Some(ApiWhiwaToken { id, name, icon, quality })
        })
        .collect();
 
    let cache = WhiwaSeasonCache { season_id, season_name, finish_date, torrents_stages, token_items };
    let _ = write_cache(&cache_path, &cache);
    Ok(Some(cache))
}
 
// =============================================================================
// DPMatrix fetch command
// =============================================================================
 
#[tauri::command]
pub async fn fetch_matrix_season(app: tauri::AppHandle) -> Result<Option<MatrixSeasonCache>, String> {
    let cache_path = get_data_dir(&app)?.join("endgame_cache_matrix.json");
 
    // For matrix: always fetch fresh when cached season_id is no longer the last in the list.
    // Otherwise use cache indefinitely (no finish date).
    let cached_opt: Option<MatrixSeasonCache> = read_cache(&cache_path);
 
    // Fetch list to check if cached season is still the last one
    let list = match http_get("https://api-v2.encore.moe/api/en/dpmatrix").await {
        Ok(v) => v,
        Err(_) => {
            // Offline — return whatever is cached
            return Ok(cached_opt);
        }
    };
 
    let seasons = match list.as_array() {
        Some(s) => s.clone(),
        None => return Ok(cached_opt),
    };
 
    let last_season_id = seasons
        .last()
        .and_then(|s| s.get("Season").and_then(|v| v.as_i64()))
        .unwrap_or(0);
 
    // If cache is still the latest, return it
    if let Some(ref cached) = cached_opt {
        if cached.season_id == last_season_id {
            return Ok(cached_opt);
        }
    }
 
    let last = match seasons.last() {
        Some(s) => s.clone(),
        None => return Ok(cached_opt),
    };
 
    let season_name = last.get("Name").and_then(|v| v.as_str()).unwrap_or("").to_string();
 
    let detail = match http_get(&format!("https://api-v2.encore.moe/api/en/dpmatrix/{}", last_season_id)).await {
        Ok(v) => v,
        Err(_) => return Ok(cached_opt),
    };
 
    let mut levels: Vec<ApiMatrixLevel> = Vec::new();
 
    if let Some(raw_levels) = detail.get("Levels").and_then(|v| v.as_array()) {
        for level in raw_levels {
            let id = level.get("Id").and_then(|v| v.as_i64()).unwrap_or(0);
            let name = level.get("Name").and_then(|v| v.as_str()).unwrap_or("").to_string();
 
            let season_buffs: Vec<ApiTowerBuff> = level
                .get("NewTowerBuffs")
                .and_then(|b| b.as_array())
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|b| {
                    let buff_id = b.get("Id")?.as_i64()?;
                    let desc = b.get("Desc")?.as_str()?.to_string();
                    Some(ApiTowerBuff { id: buff_id, desc })
                })
                .collect();
 
            let waves: Vec<ApiMatrixWave> = level
                .get("Waves")
                .and_then(|w| w.as_array())
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|w| {
                    let round = w.get("Round")?.as_i64()?;
                    let wave = w.get("Wave")?.as_i64()?;
                    let wave_name = w.get("Name")?.as_str()?.to_string();
                    let icon = w.get("SmallIconInModeView")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let tags: Vec<ApiMatrixTag> = w
                        .get("Tags")
                        .and_then(|t| t.as_array())
                        .unwrap_or(&vec![])
                        .iter()
                        .filter_map(|t| {
                            let tag_name = t.get("Name")?.as_str()?.to_string();
                            let color = t.get("Color")
                                .and_then(|c| c.as_str())
                                .map(|c| hex_to_css(c))
                                .unwrap_or_default();
                            let path = t.get("Path")
                                .and_then(|v| v.as_str())
                                .unwrap_or("")
                                .to_string();
                            Some(ApiMatrixTag { name: tag_name, color, path })
                        })
                        .collect();
                    Some(ApiMatrixWave { round, wave, name: wave_name, icon, tags })
                })
                .collect();
 
            levels.push(ApiMatrixLevel { id, name, waves, season_buffs });
        }
    }
 
    let cache = MatrixSeasonCache { season_id: last_season_id, season_name, levels };
    let _ = write_cache(&cache_path, &cache);
    Ok(Some(cache))
}
 
// =============================================================================
// Utility: element name → CSS color fallback
// =============================================================================
 
fn element_name_to_color(name: &str) -> String {
    match name {
        "Havoc"    => "#E649A6".to_string(),
        "Electro"  => "#B46BFF".to_string(),
        "Fusion"   => "#F0744E".to_string(),
        "Glacio"   => "#41AEFB".to_string(),
        "Aero"     => "#55FFB5".to_string(),
        "Spectro"  => "#F8E56C".to_string(),
        _          => "#AAAAAA".to_string(), // Physical / unknown
    }
}
