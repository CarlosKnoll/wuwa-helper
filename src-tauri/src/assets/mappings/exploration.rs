// src-tauri/src/assets/mappings/exploration.rs
//! Hardcoded exploration region and map data

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionMetadata {
    pub id: i64,
    pub region_name: String,
    pub display_order: i32,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapMetadata {
    pub id: i64,
    pub region_id: i64,
    pub map_name: String,
    pub display_order: i32,
}

/// Get all hardcoded exploration regions
pub fn get_exploration_regions() -> Vec<RegionMetadata> {
    vec![
        RegionMetadata {
            id: 1,
            region_name: "Huanglong".to_string(),
            display_order: 1,
            description: Some("The main starting region.".to_string()),
        },
        RegionMetadata {
            id: 2,
            region_name: "Black Shores".to_string(),
            display_order: 2,
            description: Some("Often for intermissions.".to_string()),
        },
        RegionMetadata {
            id: 3,
            region_name: "Rinascita".to_string(),
            display_order: 3,
            description: Some("Version 2.0".to_string()),
        },
        RegionMetadata {
            id: 4,
            region_name: "Roya Frostlands".to_string(),
            display_order: 4,
            description: Some("Version 3.0".to_string()),
        },
        ]
    }
    
    /// Get all hardcoded exploration maps
    pub fn get_exploration_maps() -> Vec<MapMetadata> {
    vec![
        // === Huanglong Region (id: 1) ===
        MapMetadata {
            id: 1,
            region_id: 1,
            map_name: "Gorges of Spirits".to_string(),
            display_order: 1,
        },
        MapMetadata {
            id: 2,
            region_id: 1,
            map_name: "Jinzhou".to_string(),
            display_order: 2,
        },
        MapMetadata {
            id: 3,
            region_id: 1,
            map_name: "Central Plains".to_string(),
            display_order: 3,
        },
        MapMetadata {
            id: 4,
            region_id: 1,
            map_name: "Desorock Highland".to_string(),
            display_order: 4,
        },
        MapMetadata {
            id: 5,
            region_id: 1,
            map_name: "Port City of Guixu".to_string(),
            display_order: 5,
        },
        MapMetadata {
            id: 6,
            region_id: 1,
            map_name: "Dim Forest".to_string(),
            display_order: 6,
        },
        MapMetadata {
            id: 7,
            region_id: 1,
            map_name: "Wuming Bay".to_string(),
            display_order: 7,
        },
        MapMetadata {
            id: 8,
            region_id: 1,
            map_name: "Norfall Barrens".to_string(),
            display_order: 8,
        },
        MapMetadata {
            id: 9,
            region_id: 1,
            map_name: "Whining Aix's Mire".to_string(),
            display_order: 9,
        },
        MapMetadata {
            id: 10,
            region_id: 1,
            map_name: "Tiger's Maw".to_string(),
            display_order: 10,
        },
        MapMetadata {
            id: 11,
            region_id: 1,
            map_name: "Mt. Firmament".to_string(),
            display_order: 11,
        },
        
        // === Black Shores Region (id: 2) ===
        MapMetadata {
            id: 12,
            region_id: 2,
            map_name: "Black Shores Archipelago".to_string(),
            display_order: 1,
        },
        MapMetadata {
            id: 13,
            region_id: 2,
            map_name: "Tethys Deep".to_string(),
            display_order: 2,
        },

        // === Rinascita Region (id: 3) ===
        MapMetadata {
            id: 14,
            region_id: 3,
            map_name: "Raguuna City".to_string(),
            display_order: 1,
        },
        MapMetadata {
            id: 15,
            region_id: 3,
            map_name: "Averardo Vault".to_string(),
            display_order: 2,
        },
        MapMetadata {
            id: 16,
            region_id: 3,
            map_name: "Penintent's End".to_string(),
            display_order: 3,
        },
        MapMetadata {
            id: 17,
            region_id: 3,
            map_name: "Hallowed Reach".to_string(),
            display_order: 4,
        },
        MapMetadata {
            id: 18,
            region_id: 3,
            map_name: "Whisperwind Haven".to_string(),
            display_order: 5,
        },
        MapMetadata {
            id: 19,
            region_id: 3,
            map_name: "Nimbus Sanctum".to_string(),
            display_order: 6,
        },
        MapMetadata {
            id: 20,
            region_id: 3,
            map_name: "Fagaceae Peninsula".to_string(),
            display_order: 7,
        },
        MapMetadata {
            id: 21,
            region_id: 3,
            map_name: "Thessaleo Fells".to_string(),
            display_order: 8,
        },
        MapMetadata {
            id: 22,
            region_id: 3,
            map_name: "Riccioli Islands".to_string(),
            display_order: 9,
        },
        MapMetadata {
            id: 23,
            region_id: 3,
            map_name: "Vault Underground".to_string(),
            display_order: 10,
        },
        MapMetadata {
            id: 24,
            region_id: 3,
            map_name: "Avinoleum".to_string(),
            display_order: 11,
        },   
        MapMetadata {
            id: 25,
            region_id: 3,
            map_name: "Beohr Waters".to_string(),
            display_order: 12,
        },   
        MapMetadata {
            id: 26,
            region_id: 3,
            map_name: "Septimont".to_string(),
            display_order: 13,
        },  
        MapMetadata {
            id: 27,
            region_id: 3,
            map_name: "Fabricatorium of the Deep".to_string(),
            display_order: 14,
        },  
        MapMetadata {
            id: 28,
            region_id: 3,
            map_name: "Sanguis Plateaus".to_string(),
            display_order: 15,
        },  

        // === Lahai-Roi Region (id: 4) ===
        MapMetadata {
            id: 29,
            region_id: 4,
            map_name: "Etching Plains".to_string(),
            display_order: 1,
        },  
        MapMetadata {
            id: 30,
            region_id: 4,
            map_name: "Startorch Academy".to_string(),
            display_order: 2,
        },  
        MapMetadata {
            id: 31,
            region_id: 4,
            map_name: "Starward Riseway".to_string(),
            display_order: 3,
        },  
        MapMetadata {
            id: 32,
            region_id: 4,
            map_name: "Fangspire Chasm".to_string(),
            display_order: 4,
        },  
        MapMetadata {
            id: 33,
            region_id: 4,
            map_name: "Bjartr Woods".to_string(),
            display_order: 5,
        },  
        MapMetadata {
            id: 34,
            region_id: 4,
            map_name: "Stagnant Run".to_string(),
            display_order: 6,
        },  
        MapMetadata {
            id: 35,
            region_id: 4,
            map_name: "Rebirth Uplands".to_string(),
            display_order: 7,
        },  
        MapMetadata {
            id: 36,
            region_id: 4,
            map_name: "Mawburrpw Desert".to_string(),
            display_order: 8,
        },  
        MapMetadata {
            id: 37,
            region_id: 4,
            map_name: "Giant's Gaze".to_string(),
            display_order: 9,
        },  
        MapMetadata {
            id: 38,
            region_id: 4,
            map_name: "Frostlands Transit Port".to_string(),
            display_order: 10,
        },  
        MapMetadata {
            id: 39,
            region_id: 4,
            map_name: "Mount Gjallar".to_string(),
            display_order: 11,
        },  
        MapMetadata {
            id: 40,
            region_id: 4,
            map_name: "Starblind Crashsite".to_string(),
            display_order: 12,
        },  
        MapMetadata {
            id: 41,
            region_id: 4,
            map_name: "Upphaf Forest Ruins".to_string(),
            display_order: 13,
        },  
        MapMetadata {
            id: 42,
            region_id: 4,
            map_name: "Tidelost Forest".to_string(),
            display_order: 14,
        },  

    ]
}

/// Get maps for a specific region
pub fn get_maps_by_region(region_id: i64) -> Vec<MapMetadata> {
    get_exploration_maps()
        .into_iter()
        .filter(|map| map.region_id == region_id)
        .collect()
}