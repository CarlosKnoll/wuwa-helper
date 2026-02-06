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
- Offline-first design with asset caching

#### Data structure:
| Table / View        | Children | Parents | Columns | Type  |
|---------------------|----------|---------|---------|-------|
| account_info        | 0        | 0       | 4       | Table |
| character_talents   | 0        | 1       | 8       | Table |
| character_weapons   | 0        | 1       | 7       | Table |
| characters          | 3        | 0       | 12      | Table |
| echo_builds         | 1        | 1       | 6       | Table |
| echo_substats       | 0        | 1       | 4       | Table |
| echoes              | 1        | 1       | 9       | Table |
| exploration_maps    | 0        | 1       | 5       | Table |
| exploration_regions | 1        | 0       | 3       | Table |
| goals               | 0        | 0       | 7       | Table |
| matrix_teams        | 0        | 0       | 8       | Table |
| pity_status         | 0        | 0       | 5       | Table |
| pull_history        | 0        | 0       | 9       | Table |
| resources           | 0        | 0       | 9       | Table |
| torrents_stages     | 0        | 0       | 7       | Table |
| tower_area_effects  | 0        | 0       | 4       | Table |
| tower_details       | 0        | 0       | 5       | Table |
| tower_floors        | 0        | 0       | 5       | Table |
| tower_of_adversity  | 0        | 0       | 5       | Table |
| tower_teams         | 0        | 0       | 6       | Table |
| troop_matrix        | 0        | 0       | 9       | Table |
| weapons_inventory   | 0        | 0       | 9       | Table |
| whimpering_wastes   | 0        | 0       | 8       | Table |

---

### Remaining To-Dos:
#### UI:
- Standardize countours and selections to be white.
    - [ ] White outline for every section in the dashboard
    - [ ] White outline for search bar in CharactersTab and WeaponsTab
    - [ ] White outline for filters field in WeaponsTab
    - [ ] White outline for every section in PityTab
    - [ ] White outline for every field in ExplorationTab
    - [ ] White outline for every field in EndgameTab
    - [ ] White outline for every field in SettingsTab
- **Endgame:** Add subtle alerts for all gamemodes missing rewards.

---

#### Functionalities:
- Research auto-update implementation.
- Study a way to handle differences in database tables/entries between versions.
- Modify edit fields to have immediate persistance instead of save button
- **Exploration Tab:** Add support to 3.1 new maps.
- Study a way to hardcode maps for exploration tab.
- **Pity Tab:** Add run option to automatically run powershell command that fetches URL

---

#### Minor changes and bugs:
- **Dashboard:** Add account_info table data to dashboard.
- Refresh button (should reload data from database) not working in pity tab (needs investigation on whether it works or not in other tabs)
- Blank database creation does not have the tables needed;
- **Character Info:** Display and allow edit of Resonance Date.
- **Echoes:** Add entries and assets for all Phantom echoes.
- **Echoes:** Fix needing to save an echo with a valid name before showing the select echo set field. (Maybe needs to be implemented/will be fixed upon changing the edit fields to have immediate persistance).
- **Echoes:** Add dropdown menu when inserting name of echo, which allows user input for refining the dropdown entries
- **Add Characters/Weapons:** Add dropdown menu with hardcoded characters, allow refining dropdown list as user is typing. (Still allow to add custom characters that are not matching with any of the list)
- **Endgame:** Remove the ability to edit the total stars achieved manually in Toa, and in Whimpering Wastes and Troop Matrix, Remove the ability to edit the points. (not the points achieved in each stage/teams, but the total sum)
- **Endgame:** Fix stars counting under ToA gamemode.
- **Endgame:** Allow editing of last reset date.
- **Endgame:** Implement smart vigor system for ToA and Troop Matrix and dropdown menu for selectable characters for teams based on vigor avalable/consumed.
- **Pity Tab:** Add copy button to automatically copy to clipboard the powershell command.

---

#### Cleanup:
- Sanity check for loose ends.
- Remove debug statments.
