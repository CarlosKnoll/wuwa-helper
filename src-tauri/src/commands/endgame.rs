use crate::db::init_db;
use rusqlite::{Result, OptionalExtension};
use serde::{Deserialize, Serialize};
use chrono;

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
    pub unlocked: bool,
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
            "SELECT id, unlocked, last_reset, stability_accords_points, stability_accords_astrite, 
             singularity_expansion_points, singularity_expansion_astrite, singularity_expansion_highest_round, notes 
             FROM troop_matrix WHERE id = 1",
            [],
            |row| {
                Ok(TroopMatrix {
                    id: row.get(0)?,
                    unlocked: row.get(1)?,
                    last_reset: row.get(2)?,
                    stability_accords_points: row.get(3)?,
                    stability_accords_astrite: row.get(4)?,
                    singularity_expansion_points: row.get(5)?,
                    singularity_expansion_astrite: row.get(6)?,
                    singularity_expansion_highest_round: row.get(7)?,
                    notes: row.get(8)?,
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