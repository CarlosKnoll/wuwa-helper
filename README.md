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

#### General:
- Black background instead of dark blue.
- Expand talents background visuals to other areas:
    - [ ] Dashboard
    - [ ] Characters
        - [ ] Overview 
        - [x] Forte
        - [x] Echoes
    - [ ] Weapons
    - [ ] Pity Counter
    - [ ] Exploration
    - [ ] Endgame
    - [ ] Settings

- Modify edit fields to have immediate persistance instead of save button
- Rename any "pull" mention to Convene.
- Add support for the upcoming echo sets (v3.1):
    - [ ] Trailblazing Star
    - [ ] Chromatic Foam
    - [ ] Sound of True Name

#### Add Characters:
- Add dropdown menu with hardcoded characters, allow refining dropdown list as user is typing. (still allow to add custom characters that are not matching with any of the list)

#### Add Weapons:
- Add dropdown menu with hardcoded weapons, allow refining dropdown list as user is typing. (still allow to add custom weapons that are not matching with any of the list)

#### Weapons:
- Remove outline on hover.
- Add level to the mix with the sorted display. (So it still should sort by building/leveld, but on top of that it should also sort by rarity, and then by level)

#### Pity/Tracker:
- Change `How to get your Convene URL →` to, instead of open a url to the github, just expand a hardcoded text instruction.
- If JSON import fails, subsequent attempts are ignored.

#### Endgame:
- Add functionailty to automatically calculate endgame progress based on individual user input of progress (and, in turn, remove ability to directly edit those fields), so:
    - In Tower of Adversity, remove the ability to edit the total stars achieved manually.
    - In Whimpering Wastes and Troop Matrix, calculate the points.
- Fix astrite auto-calc not recalculating if changing the stars achieved in the subcards under ToA gamemode.
- Add subtle alerts for troop matrix missing rewards that do not reward astrite: The breakpoints are in Total Singularity Expansion Score (sum of all teams scores): 29000, 37000, 45000 and 58000, and reaching 5000 points with 6 teams.
- Allow editing of last reset date.
- Implement smart vigor system for ToA and Troop Matrix and dropdown menu for selectable characters for teams based on vigor avalable/consumed.

### Cleanup:
- Sanity check for loose ends.
- Remove debug statments.
