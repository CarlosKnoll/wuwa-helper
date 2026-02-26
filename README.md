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


---

### Remaining To-Dos:
#### UI:
- Standardize alerts:
    - Errors should be displayed in react component, not as OS alerts
    - Success handles should be displayed in react component, not as OS alerts
    - Warnings should be displayed in react component, not as OS alerts

- Standardize alerts/errors/confirmation modals to use portal renders and module instead of relative positions and in-component spawn.

- **Endgame:** Add subtle alerts for all gamemodes missing rewards.

---

#### Functionalities:
- Research auto-update implementation.

- Properly handle differences in `echo_builds` table, mainly regarding echo sets. Study if data migration is possible.

- Modify edit fields to have immediate persistance instead of save button.

- **Endgame:** Adding a new team/Saving edits refreshes the whole page (which can be a bit disorientating)
---

#### Minor changes and bugs:
- Refresh button (should reload data from database) not working in pity tab (needs investigation on whether it works or not in other tabs)

- Check dropdown from both Add Characters/Weapons modals and adapt to new global portal version.

- **Dashboard:** Add account_info table data to dashboard.
- **Dashboard:** Endgame data not refreshing whith database refresh.

- **Character Talents:** Upper nodes of minor traces should not be toggleable if lower nodes aren't activated.

- **TeamManager:** Correctly handle different endgames edit styles (Works fine for ToA, but WhiWa and Matrix have save/cancel button rendering before they should.)
- **Endgame - WhiWa:** Add edit fields for Respawning Waters: Chasm progress.
- **Endgame - WhiWa:** Remove obsolete Side field input that is now automatically determined.

---

#### Cleanup:
- Sanity check for loose ends.
- Remove debug statments.

---
