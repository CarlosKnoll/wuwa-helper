// src-tauri/src/commands/exploration.rs
use crate::db::init_db;
use crate::assets::mappings::exploration::{
    get_exploration_regions as get_regions_metadata,
    get_exploration_maps as get_maps_metadata,
    RegionMetadata, MapMetadata
};
use rusqlite::Result;
use serde::{Deserialize, Serialize};

/// Combined region data with user progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplorationRegion {
    pub id: i64,
    pub region_name: String,
    pub display_order: i32,
    pub description: Option<String>,
    pub notes: Option<String>,
}

/// Combined map data with user progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplorationMap {
    pub id: i64,
    pub region_id: i64,
    pub map_name: String,
    pub display_order: i32,
    pub exploration_percent: f64,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn get_exploration_regions(app: tauri::AppHandle) -> Result<Vec<ExplorationRegion>, String> {
    let _conn = init_db(&app)?;
    let hardcoded_regions = get_regions_metadata();
    
    let regions: Vec<ExplorationRegion> = hardcoded_regions
        .into_iter()
        .map(|region_meta| ExplorationRegion {
            id: region_meta.id,
            region_name: region_meta.region_name,
            display_order: region_meta.display_order,
            description: region_meta.description,
            notes: None, // Region notes are now in description field from backend
        })
        .collect();
    
    let mut sorted_regions = regions;
    sorted_regions.sort_by_key(|r| r.display_order);
    Ok(sorted_regions)
}

#[tauri::command]
pub fn get_exploration_maps(app: tauri::AppHandle, region_id: i64) -> Result<Vec<ExplorationMap>, String> {
    let conn = init_db(&app)?;
    let hardcoded_maps = get_maps_metadata();
    
    let mut maps = Vec::new();
    
    for map_meta in hardcoded_maps.into_iter().filter(|m| m.region_id == region_id) {
        // Get user progress for this map (defaults to 0% if not found)
        let (exploration_percent, user_notes): (f64, Option<String>) = conn
            .query_row(
                "SELECT exploration_percent, notes FROM exploration_progress WHERE map_id = ?",
                [map_meta.id],
                |row| Ok((row.get(0)?, row.get(1)?))
            )
            .unwrap_or((0.0, None));
        
        maps.push(ExplorationMap {
            id: map_meta.id,
            region_id: map_meta.region_id,
            map_name: map_meta.map_name,
            display_order: map_meta.display_order,
            exploration_percent,
            notes: user_notes,
        });
    }
    
    maps.sort_by_key(|m| m.display_order);
    Ok(maps)
}

#[tauri::command]
pub fn update_exploration_map(
    app: tauri::AppHandle,
    id: i64,
    exploration_percent: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    // Insert or update the user progress
    conn.execute(
        "INSERT INTO exploration_progress (map_id, exploration_percent, notes) 
         VALUES (?, ?, ?)
         ON CONFLICT(map_id) 
         DO UPDATE SET exploration_percent = ?, notes = ?",
        (id, exploration_percent, &notes, exploration_percent, &notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Exploration updated successfully".to_string())
}

#[tauri::command]
pub fn update_exploration_region_notes(
    app: tauri::AppHandle,
    region_id: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO exploration_region_progress (region_id, notes) 
         VALUES (?, ?)
         ON CONFLICT(region_id) 
         DO UPDATE SET notes = ?",
        (region_id, &notes, &notes),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Region notes updated successfully".to_string())
}