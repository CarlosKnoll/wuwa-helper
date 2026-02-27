mod db;
mod commands;
mod assets;

use commands::*;
use tauri::Manager; // Add this import for .manage() method

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize AssetManager
            let asset_manager = crate::assets::AssetManager::new(app.handle().clone())
                .expect("Failed to initialize AssetManager");
            app.manage(std::sync::Mutex::new(asset_manager));
            
            // Initialize asset resolver state
            app.manage(tokio::sync::Mutex::new(None::<crate::assets::AssetResolver>));
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            characters::get_all_characters,
            characters::get_character_talents,
            characters::get_character_weapon,
            characters::update_character,
            characters::update_character_talents,
            characters::update_character_weapon,
            characters::add_character,
            characters::delete_character,
            characters::get_available_characters,
            characters::get_healer_characters,
            echo_stats::get_echo_stats_options,
            echoes::get_echo_available_sets,
            echoes::get_echo_build,
            echoes::get_echoes,
            echoes::get_echo_metadata_direct,
            echoes::get_echo_substats,
            echoes::update_echo_build,
            echoes::update_echo,
            echoes::add_echo,
            echoes::delete_echo,
            echoes::get_all_echo_sets,
            echoes::get_echo_set_by_key,
            echoes::update_echo_substat,
            echoes::add_echo_substat,
            echoes::delete_echo_substat,
            echoes::get_available_echoes,
            account::get_account_info,
            account::get_resources,
            account::update_account_info,
            account::update_resources,
            gacha::get_pity_status,
            gacha::get_pull_count,
            gacha::get_pull_history,
            gacha::check_pull_exists,
            gacha::add_pull,
            gacha::delete_pull,
            gacha::import_pulls_from_url,
            goals::get_goals,           
            goals::update_goal,        
            goals::add_goal,            
            goals::delete_goal,         
            weapons::get_all_weapons,
            weapons::update_weapon,
            weapons::add_weapon,
            weapons::delete_weapon,
            weapons::get_available_weapons,
            exploration::get_exploration_regions,
            exploration::get_exploration_maps,
            exploration::update_exploration_map,
            exploration::update_exploration_region_notes,
            endgame::get_tower_of_adversity,
            endgame::get_tower_details,
            endgame::get_tower_floors,
            endgame::update_tower_floor_stars,
            endgame::get_tower_area_effects,
            endgame::get_tower_teams,
            endgame::get_whimpering_wastes,
            endgame::get_torrents_stages,
            endgame::get_troop_matrix,
            endgame::get_matrix_teams,
            endgame::update_tower_of_adversity,
            endgame::update_tower_details,
            endgame::update_whimpering_wastes,
            endgame::update_troop_matrix,
            endgame::update_tower_area_effect,
            endgame::update_tower_team,
            endgame::update_torrents_stage,
            endgame::update_tower_last_reset,
            endgame::update_wastes_last_reset,
            endgame::update_matrix_last_reset,
            endgame::update_matrix_team,
            endgame::add_matrix_team,
            endgame::delete_matrix_team,
            endgame::reset_tower_of_adversity,
            endgame::reset_whimpering_wastes,
            endgame::reset_troop_matrix,
            endgame::add_tower_team,              
            endgame::delete_tower_team,           
            endgame::add_torrents_stage,          
            endgame::delete_torrents_stage,
            endgame::initialize_tower_floors,
            database::import_database,
            database::export_database,
            commands::assets::init_assets,
            commands::assets::get_asset,
            commands::assets::get_asset_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}