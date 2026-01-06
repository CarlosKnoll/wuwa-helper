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
  Implementation:
  • Double Pawns Matrix endgame proper implementation

  Issues:
  • Character deletion happens before dialog box (so confirm or cancel doesn't matter)
  • Echo Build main field does not populate initially (Set bonus, effect, overall quality, notes). If edit and cancel, it displays the data. Same behavior happens with the substatus: It does display the data initially, but upon enabling edit it show no substatus. If cancel and edit again, then it displays the option to edit the current substatus/add/remove.
  • Characters UI - Fix editing character main field (character info), which currently closes the entire modal character regardless of saving/discarding changes.
  • Characters UI - Make the Add Character button height smaller (equal to search bar)
  • Characters/Weapons UI - Move either: The stars rarity or the delete button (they are overlapping)
  • Weapons UI - No delete button 
  • Character UI - Newly added characters do not come with Talents, Echo Build and Weapons subfields (nor does add buttons for these subfields exist in already created characters that do not have them)
  • Dashboard UI - Under pull calculator, under "From Tides" it should only display Radiant Tides, not sum Lustrous, Forged and Radiant.
  • Dashboard UI - Integrate goals data into the page



Building with Tauri.