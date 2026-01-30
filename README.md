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


### To-Do (Assets):
Since this branch is focused on slowly and granullarly implement assets loading into the existing tabs, these are the goals before pulling into main.

#### Pity Counter:
- Load assets for pull history (either limit pull history table or make the icons lazy load to prevent multiple assets loading at one time)

#### Build modals:
Complete revamp of build modal, of course with assets.
- Show character card on modal.
- Show weapon icon on modal.
- Show echoes sets and echoes icons on modal.

### Remaining To-Dos (Unrelated to assets):
#### Dashboard:
- Editing notes not showing time category (longterm, immediate, so on). 

#### Characters:
- Clicking delete icon also opens build modal (functionality works, if I close the build modal I can see the delete confimation modal)
- Allow editing of rarity (for user error cases)
- Make it so Rover display concatenates with its element before (so instead of three rover entries differentiated by their element icons we have actually display names of Aero Rover, Spectro Rover and Havoc Rover)

#### Add Characters:
- Add dropdown menu with hardcoded characters, allow refining dropdown list as user is typing. (still allow to add custom characters that are not matching with any of the list)

#### Weapons:
- Allow editing of rarity (for user error cases)

#### Add Weapons:
- Add dropdown menu with hardcoded weapons, allow refining dropdown list as user is typing. (still allow to add custom weapons that are not matching with any of the list)

#### Builds:
- Remove the ability to add echoes to a build if there are already 5 echoes.
- Modify new characters talents field generation to start at level 1 (currently starts at 0).
- Add clickable fields to represent traces upgrades.
- Stardardize echoes data (stats/substats edit/add through selection from dropdown menus with preset possibilites)
- Change the talents order to reflect ingame order (swap forte and liberation)

#### Pity/Tracker:
- Add calculation to display pity at which the 5 star was pulled.

#### Endgame:
- Add functionailty to automatically calculate endgame progress based on individual user input of progress (and, in turn, remove ability to directly edit those fields), so:
    - In Tower of Adversity, calculate the stars earned.
    - In Whimpering Wastes and Troop Matrix, calculate the points.

- Add subtle alerts for troop matrix missing rewards that do not reward astrite: The breakpoints are in Total Singularity Expansion Score (sum of all teams scores): 29000, 37000, 45000 and 58000, and reaching 5000 points with 6 teams.