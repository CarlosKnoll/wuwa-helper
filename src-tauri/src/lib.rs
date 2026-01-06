mod db;
mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            echoes::get_echo_build,
            echoes::get_echoes,
            echoes::get_echo_substats,
            echoes::update_echo_build,
            echoes::update_echo,
            echoes::update_echo_substat,
            echoes::add_echo_substat,
            echoes::delete_echo_substat,
            account::get_account_info,
            account::get_resources,
            account::update_resources,
            gacha::get_pity_status,
            gacha::update_pity,
            weapons::get_all_weapons,
            weapons::update_weapon,
            weapons::add_weapon,
            exploration::get_exploration_regions,
            exploration::get_exploration_maps,
            exploration::update_exploration_map,
            endgame::get_tower_of_adversity,
            endgame::get_tower_details,
            endgame::get_tower_area_effects,
            endgame::get_tower_teams,
            endgame::get_whimpering_wastes,
            endgame::get_torrents_stages,
            endgame::get_troop_matrix,
            endgame::update_tower_of_adversity,
            endgame::update_tower_details,
            endgame::update_whimpering_wastes,
            endgame::update_troop_matrix,
            endgame::update_tower_team,
            endgame::update_torrents_stage,
            endgame::update_tower_last_reset,
            endgame::update_wastes_last_reset,
            database::import_database,
            database::export_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}