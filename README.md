# Wuthering Waves Assistant

# Still in development.

Wuthering Waves Assistant is a cross-platform desktop companion for Wuthering Waves, built with Tauri (Rust) + React (TypeScript). It provides tools to manage characters, weapons, echoes, gacha/pity tracking, exploration progress, resources, and endgame content. All data is stored locally, allowing offline usage and full user control.

#### Key Features

- Character management with weapons, echoes, talents, and builds
- Weapon tracking and inventory organization
- Echo management with detailed build sections
- Gacha & pity tracking
- Exploration progress tracking
- Endgame tools (Tower, Troop Matrix, Whimpering Wastes)
- Resource and goal tracking
- Local backups & data persistence
- Offline design with assets bundled

#### Data structure:
| Table / View        |
|---------------------|
| account_info        |
| resources           |
| pity_status         |
| characters          |
| character_talents   |
| character_weapons   |
| echo_substats       |
| weapons_inventory   |
| tower_of_adversity  |
| tower_details       |
| tower_area_effects  |
| tower_teams         |
| whimpering_wastes   |
| torrents_stages     |
| goals               |
| troop_matrix        |
| sqlite_sequence     |
| matrix_teams        |
| tower_floors        |
| pull_history        |
| echo_builds         |
| echoes              |
| schema_version      |
| exploration_progress|

