mod db;
mod commands;
mod assets;

use commands::*;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();

            WebviewWindowBuilder::new(
                app,
                "splash",
                WebviewUrl::App("splash".into()),
            )
            .title("Launching Wuwa Helper")
            .inner_size(420.0, 220.0)
            .resizable(false)
            .decorations(false)
            .always_on_top(true)
            .build()?;

            tauri::async_runtime::spawn(async move {
                if let Err(err) = crate::assets::mappings_loader::ensure_runtime_assets_current(&app_handle).await {
                    eprintln!("Runtime asset update skipped: {}", err);
                }

                let asset_manager = match crate::assets::AssetManager::new(app_handle.clone()).await {
                    Ok(manager) => manager,
                    Err(err) => {
                        // Assets unavailable (no bundled metadata and no network).
                        // Fall back to an empty manager so State<AssetManager> is always
                        // satisfied — asset lookups will fail gracefully per-image.
                        eprintln!("AssetManager init failed, falling back to empty: {}", err);
                        crate::assets::AssetManager::empty()
                    }
                };
                app_handle.manage(asset_manager);

                let main_window = match WebviewWindowBuilder::new(
                    &app_handle,
                    "main",
                    WebviewUrl::App("index.html".into()),
                )
                .title("Wuthering Waves Assistant")
                .inner_size(1200.0, 800.0)
                .min_inner_size(800.0, 600.0)
                .build()
                {
                    Ok(window) => window,
                    Err(err) => {
                        eprintln!("Failed to create main window: {}", err);

                        if let Some(splash_window) = app_handle.get_webview_window("splash") {
                            let _ = splash_window.close();
                        }

                        return;
                    }
                };

                let _ = main_window.show();
                let _ = main_window.set_focus();

                if let Some(splash_window) = app_handle.get_webview_window("splash") {
                    let _ = splash_window.close();
                }
            });

            Ok(())
        })

        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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
            exploration::get_exploration_segments,
            exploration::get_exploration_regions,
            exploration::get_exploration_areas,
            exploration::update_exploration_area,
            exploration::update_exploration_segment_notes,
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
            commands::assets::get_asset,
            commands::assets::get_asset_path,
            commands::assets::sync_assets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}