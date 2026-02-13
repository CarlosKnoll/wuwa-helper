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

- Migrate database entries to hardcoded regions and maps for exploration tab.

-**Add Characters: ** Create a backend field in hardcoded map to weapon type for each character and make it populate automatically in the add modal when selected.

---

#### Minor changes and bugs:
- Refresh button (should reload data from database) not working in pity tab (needs investigation on whether it works or not in other tabs)

- Use the `SectionHeader.tsx` component wherever it fits.
- Check dropdown from both Add Characters/Weapons modals and adapt to new global portal version.

- **Dashboard:** Add account_info table data to dashboard.
- **Dashboard:** Endgame data not refreshing whith database refresh.

- **Character Info:** Display and allow edit of Resonance Date.
- **Character Talents:** Upper nodes of minor traces should not be toggleable if lower nodes aren't activated.
- **Character Modal Overview Tab:** Weapon swap warning does not clear if selecting the weapon currently equipped.
- **Character Modal Overview Tab:** Max level display is wrong. It works as intended in Characters' Tab Info section.

- **Endgame:** Adding a new team/Saving edits refreshes the whole page (which can be a bit disorientating)

- **Endgame - WhiWa:** Implement logic check to prevent adding two teams to the same side.
- **Endgame - WhiWa:** Adding a second team spawns the add form on the left instead of the right.


---

#### Cleanup:
- Sanity check for loose ends.
- Remove debug statments.
