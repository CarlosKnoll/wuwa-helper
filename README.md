# Wuthering Waves Assistant

Assistant app for Wuthering Waves. It shall:
* Have a tab for characters where the user can add/remove/edit their characters and build. Look-wise it should resemble the echoes screen of the game (can provide images later if needed)
* Have a general tab where it displays data from accountInfo, resources, pityStatus, exploration and goals, with edit buttons for all of them
* Have a tab to look at the endgame progress and its data, with editable fields.
* Have a tab for weapons, like the characters.
* Of course, allow exports/imports

Data expected:
* account_info
* character_talents
* character_weapons
* characters
* echo_builds
* echo_substats
* echoes
* exploration_maps
* exploration_regions
* goals
* pity_status
* resources
* torrents_stages
* tower_area_effects
* tower_details
* tower_of_adversity
* tower_teams
* troop_matrix
* weapons_inventory
* whimpering_wastes

Still in development.

Stuff to do:
- Implementation: Double Pawns Matrix endgame proper implementation
- Visuals: Find an API/Scraping method to have some game icons instead of the placeholder ones.

Building with Tauri.