// src-tauri/src/commands/exploration.rs
use crate::db::init_db;
use crate::assets::AssetManager;
use rusqlite::Result;
use serde::{Deserialize, Serialize};
use tauri::State;

// ---------------------------------------------------------------------------
// Public response types (serialized to the frontend)
// ---------------------------------------------------------------------------

/// Top-level geographical zone with its asset filename for image loading.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplorationSegment {
    pub id: i64,
    pub segment_name: String,
    pub display_order: i32,
    pub description: Option<String>,
    pub notes: Option<String>,
    /// Filename inside exploration/ — the frontend passes this straight to get_asset.
    /// None when no image has been added yet for this segment.
    pub asset_filename: Option<String>,
    /// True when this segment has no region children and areas hang directly off it.
    pub is_flat: bool,
}

/// Middle-level named sub-group. No image; text-only in the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplorationRegion {
    pub id: i64,
    pub segment_id: i64,
    pub region_name: String,
    pub display_order: i32,
}

/// Individual explorable area with user progress and its asset filename.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplorationArea {
    pub id: i64,
    pub region_id: i64,
    pub area_name: String,
    pub display_order: i32,
    pub exploration_percent: f64,
    pub notes: Option<String>,
    /// Filename inside exploration/ — the frontend passes this straight to get_asset.
    /// None when no image has been added yet for this area.
    pub asset_filename: Option<String>,
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Returns all top-level segments, sorted by display_order.
/// Also sets `is_flat = true` for segments that have no region children
/// (i.e. their areas hang directly off the segment id).
#[tauri::command]
pub fn get_exploration_segments(
    app: tauri::AppHandle,
    asset_manager: State<'_, AssetManager>,
) -> Result<Vec<ExplorationSegment>, String> {
    let _conn = init_db(&app)?;

    let mapper = &asset_manager.mapper;

    // Collect all segment entries
    let segment_keys = mapper
        .by_type
        .get("exploration_segment")
        .cloned()
        .unwrap_or_default();

    // Collect all region entries so we can check which segment ids have children
    let region_keys = mapper
        .by_type
        .get("exploration_region")
        .cloned()
        .unwrap_or_default();

    let segment_ids_with_regions: std::collections::HashSet<i64> = region_keys
        .iter()
        .filter_map(|key| mapper.assets.get(key))
        .filter_map(|meta| meta.exploration_parent_id)
        .collect();

    let mut segments: Vec<ExplorationSegment> = segment_keys
        .iter()
        .filter_map(|key| mapper.assets.get(key))
        .map(|meta| {
            let exploration_id = meta.exploration_id.unwrap_or(0);
            ExplorationSegment {
                id: exploration_id,
                segment_name: meta.display_name.clone(),
                display_order: meta.exploration_display_order.unwrap_or(0),
                description: meta.description.clone(),
                notes: None,
                asset_filename: meta.filename.clone(),
                is_flat: !segment_ids_with_regions.contains(&exploration_id),
            }
        })
        .collect();

    segments.sort_by_key(|s| s.display_order);
    Ok(segments)
}

/// Returns all middle-level regions for a given segment, sorted by display_order.
#[tauri::command]
pub fn get_exploration_regions(
    app: tauri::AppHandle,
    asset_manager: State<'_, AssetManager>,
    segment_id: i64,
) -> Result<Vec<ExplorationRegion>, String> {
    let _conn = init_db(&app)?;

    let mapper = &asset_manager.mapper;

    let region_keys = mapper
        .by_type
        .get("exploration_region")
        .cloned()
        .unwrap_or_default();

    let mut regions: Vec<ExplorationRegion> = region_keys
        .iter()
        .filter_map(|key| mapper.assets.get(key))
        .filter(|meta| meta.exploration_parent_id == Some(segment_id))
        .map(|meta| ExplorationRegion {
            id: meta.exploration_id.unwrap_or(0),
            segment_id,
            region_name: meta.display_name.clone(),
            display_order: meta.exploration_display_order.unwrap_or(0),
        })
        .collect();

    regions.sort_by_key(|r| r.display_order);
    Ok(regions)
}

/// Returns all areas for a given parent (region or segment), merging user
/// progress from the DB. `parent_id` accepts either a region's exploration_id
/// (three-level case) or a segment's exploration_id (flat two-level case).
/// Defaults to 0% exploration when the user has no saved progress for an area.
#[tauri::command]
pub fn get_exploration_areas(
    app: tauri::AppHandle,
    asset_manager: State<'_, AssetManager>,
    parent_id: i64,
) -> Result<Vec<ExplorationArea>, String> {
    let conn = init_db(&app)?;

    let mapper = &asset_manager.mapper;

    let area_keys = mapper
        .by_type
        .get("exploration_area")
        .cloned()
        .unwrap_or_default();

    let area_metas: Vec<_> = area_keys
        .iter()
        .filter_map(|key| mapper.assets.get(key))
        .filter(|meta| meta.exploration_parent_id == Some(parent_id))
        .collect();

    let mut areas = Vec::new();

    for meta in area_metas {
        let area_id = meta.exploration_id.unwrap_or(0);

        // Reuses the existing exploration_progress table keyed by map_id.
        // The column name is unchanged so existing saved data is preserved.
        let (exploration_percent, user_notes): (f64, Option<String>) = conn
            .query_row(
                "SELECT exploration_percent, notes FROM exploration_progress WHERE map_id = ?",
                [area_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or((0.0, None));

        areas.push(ExplorationArea {
            id: area_id,
            region_id: meta.exploration_parent_id.unwrap_or(0),
            area_name: meta.display_name.clone(),
            display_order: meta.exploration_display_order.unwrap_or(0),
            exploration_percent,
            notes: user_notes,
            asset_filename: meta.filename.clone(),
        });
    }

    areas.sort_by_key(|a| a.display_order);
    Ok(areas)
}

/// Saves or updates the exploration percentage and notes for a single area.
/// Uses the same `exploration_progress` table as before (map_id column).
#[tauri::command]
pub fn update_exploration_area(
    app: tauri::AppHandle,
    id: i64,
    exploration_percent: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;

    conn.execute(
        "INSERT INTO exploration_progress (map_id, exploration_percent, notes)
         VALUES (?, ?, ?)
         ON CONFLICT(map_id)
         DO UPDATE SET exploration_percent = ?, notes = ?",
        (id, exploration_percent, &notes, exploration_percent, &notes),
    )
    .map_err(|e| e.to_string())?;

    Ok("Area exploration updated successfully".to_string())
}

/// Saves or updates free-form notes for a segment (stored against the old region_id column).
#[tauri::command]
pub fn update_exploration_segment_notes(
    app: tauri::AppHandle,
    segment_id: i64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;

    conn.execute(
        "INSERT INTO exploration_region_progress (region_id, notes)
         VALUES (?, ?)
         ON CONFLICT(region_id)
         DO UPDATE SET notes = ?",
        (segment_id, &notes, &notes),
    )
    .map_err(|e| e.to_string())?;

    Ok("Segment notes updated successfully".to_string())
}