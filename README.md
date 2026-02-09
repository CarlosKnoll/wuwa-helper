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
- Standardize alerts:
    - [ ] Errors should be displayed in react component, not as OS alerts
    - [ ] Success handles should be displayed in react component, not as OS alerts
    - [ ] Warnings should be displayed in react component, not as OS alerts

- **Endgame:** Add subtle alerts for all gamemodes missing rewards.

---

#### Functionalities:
- Research auto-update implementation.

- Properly handle differences in `echo_builds` table, mainly regarding echo sets. Study if data migration is possible.

- Modify edit fields to have immediate persistance instead of save button.

- Migrate database entries to hardcode regions and maps for exploration tab.

- **Endgame:** Implement smart vigor system for ToA and Troop Matrix and dropdown menu for selectable characters for teams based on vigor avalable/consumed.

---

#### Minor changes and bugs:
- Refresh button (should reload data from database) not working in pity tab (needs investigation on whether it works or not in other tabs)

- **Dashboard:** Add account_info table data to dashboard.
- **Dashboard:** Endgame data not refreshing whith database refresh.

- **Character Info:** Display and allow edit of Resonance Date.
- **Character Modal Overview Tab:** Weapon swap warning does not clear if selecting the weapon currently equipped.
- **Character Modal Overview Tab:** Max level display is wrong. It works as intended in Characters' Tab Info section.

- **Echoes:** Fix deletion confirmation modal on first new echo rendering under header.
- **Echoes:** Fix error on saving with no set selected if Sonata Effect is set to 3pc/2pc (default behavior should be saving as if is set to 5pc with no sonata effect).
- **Echoes:** Add entries and assets for all Phantom echoes.
- **Echoes:** Fix needing to save an echo with a valid name before showing the select echo set field. (Maybe needs to be implemented/will be fixed upon changing the edit fields to have immediate persistance).

- **Endgame:** Move last reset date editing to parent gamemodes card
- **Endgame:** Removing a team goes through before confirmation dialog.
- **Endgame - ToA:** Move Progress X/12 stars to header area, on the right side.
- **Endgame - ToA:** If a team is set with less than 3 characters, don't render slate bg for empty slots.
- **Endgame - ToA:** Implement logic check to prevent adding two teams to the same side.
- **Endgame - Troop Matrix:** Removing a team out of order and attempt to add it again errors with `Failed to add team: UNIQUE constraint failed: matrix_teams.mode, matrix_teams.team_number` (to replicate: Add a couple o teams on either stability/singularity accord, remove first team and attempt to add again).

---

#### Cleanup:
- Sanity check for loose ends.
- Remove debug statments.
