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

### To-Do (Assets):
Since this branch is focused on slowly and granullarly implement assets loading into the existing tabs, these are the goals before pulling into main.

#### Forte modal:
- Improve aesthetics. (Not set on whether scrape assets from the game or just offer better UI).

---

### Characters modal revamp:
- Reorder tabs (info > talents > echoes) - Swap talents and echoes order.

#### Talents:
- Fix traces not saving if toggled (workaround right now is to toggle, then edit comment and save).

#### Echoes:
- Stardardize echoes data (stats/substats edit/add through selection from dropdown menus with preset possibilites)
- Backend mapping of echoes assets.
- Fix assets loading noticeable slowly.
- Remove title label of the echoes passives and make the area scrollable (so the middle column does not grows to a bigger height than the echo set (right) column).
- Add top right icon of the echo set for each echo in the echoes list. Also add the same icon in the middle column, right side of the echo name.

---

### Remaining To-Dos (Not the focus of the branch):
#### Dashboard:
- Editing notes not showing time category (longterm, immediate, so on). 

#### Characters:
- Clicking delete icon also opens build modal (functionality works, if I close the build modal I can see the delete confimation modal)
- Allow editing of rarity (for user error cases)
- Make it so Rover display concatenates with its element before (so instead of three rover entries differentiated by their element icons we have actually display names of Aero Rover, Spectro Rover and Havoc Rover)
- Display character notes in the card.
- Change "Seq" string to Resonance Chain

#### Add Characters:
- Add dropdown menu with hardcoded characters, allow refining dropdown list as user is typing. (still allow to add custom characters that are not matching with any of the list)

#### Weapons:
- Allow editing of rarity (for user error cases)
- Colored outline according to rarity.

#### Add Weapons:
- Add dropdown menu with hardcoded weapons, allow refining dropdown list as user is typing. (still allow to add custom weapons that are not matching with any of the list)

#### Pity/Tracker:
- Change `How to get your Convene URL →` to, instead of open a url to the github, just expand a hardcoded text instruction.
- If JSON import fails, subsequent attempts are ignored.
- Rename any "pull" mention to Convene.

#### Pity/Tracker & Dashboard:
- Remove the 50/50 or guarantee tag for the featured weapon (In wuwa, featured weapons are guaranted always)

#### Endgame:
- Add functionailty to automatically calculate endgame progress based on individual user input of progress (and, in turn, remove ability to directly edit those fields), so:
    - In Tower of Adversity, remove the ability to edit the total stars achieved manually.
    - In Whimpering Wastes and Troop Matrix, calculate the points.
- Fix astrite auto-calc not recalculating if changing the stars achieved in the subcards under ToA gamemode.
- Add subtle alerts for troop matrix missing rewards that do not reward astrite: The breakpoints are in Total Singularity Expansion Score (sum of all teams scores): 29000, 37000, 45000 and 58000, and reaching 5000 points with 6 teams.
- Allow editing of last reset date.
- Implement smart vigor system for ToA and Troop Matrix and dropdown menu for selectable characters for teams based on vigor avalable/consumed.

#### Exploration:
- Add collpasing for the region cards.

### Cleanup:
- Sanity check for loose ends.
- Remove any remainder debug statments.