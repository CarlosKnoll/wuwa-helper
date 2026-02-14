import { AssetType } from "./hooks/useAssets";

/* =======================
Dashboard
======================= */

export interface Resources {
  id: number;
  astrite: number;
  lustrous_tide: number;
  radiant_tide: number;
  forged_tide: number;
  afterglow_coral: number;
  oscillated_coral: number;
  shell_credits: number;
  notes: string | null;
}

export interface PityStatus {
  banner_type: string;
  current_pity_5star: number;
  current_pity_4star: number;
  guaranteed_next_fivestar: boolean;
  total_pulls: number;
  last_5star_pull: number | null;
  last_4star_pull: number | null;
}

export interface Goal {
  id: number;
  goal_text: string;
  priority: string | null;
  category: string | null;
  notes: string | null;
  astrite_needed: number | null;
  estimated_banner: string | null;
}


/* =======================
Character
======================= */

export type BuildStatus =
  | 'Unbuilt'
  | 'WIP'
  | 'Functional'
  | 'Optimized'
  | 'Finished';

export interface Character {
  id: number;
  character_name: string;
  variant: string | null;
  resonance_date: string;
  rarity: number;
  element: string;
  weapon_type: string;
  waveband: number;
  level: number;
  ascension: number;
  build_status: BuildStatus;
  notes: string | null;
}

export interface CharacterWeapon {
  id: number;
  character_id: number;
  weapon_name: string;
  rarity: number;
  level: number;
  rank: number;
  notes: string | null;
}

export interface CharacterTalents {
  id: number;
  character_id: number;
  basic_level: number;
  skill_level: number;
  liberation_level: number;
  forte_level: number;
  intro_level: number;
  notes: string | null;
  // Minor traces (2 per talent, except Forte which has major traces)
  basic_minor_1: number;
  basic_minor_2: number;
  skill_minor_1: number;
  skill_minor_2: number;
  liberation_minor_1: number;
  liberation_minor_2: number;
  intro_minor_1: number;
  intro_minor_2: number;
  // Major traces (2 for Forte)
  forte_major_1: number;
  forte_major_2: number;
}

export interface CharacterListItem {
  name: string;
  rarity: number;
  element: string;
  weapon_type?: string;
}

/* =======================
   Weapon
   ======================= */

export interface Weapon {
  id: number;
  weapon_name: string;
  weapon_type: string;
  rarity: number;
  rank: number;
  level: number;
  equipped_on: string;
  category: string;
  notes: string | null;
}

export interface WeaponListItem {
  name: string;
  weapon_type: string;
  rarity: number;
}

/* =======================
   Echo System
   ======================= */

export interface Echo {
  id: number;
  build_id: number;
  echo_name: string | null;
  echo_set: string | null;  // Which echo set this echo belongs to
  cost: number;
  level: number;
  rarity: number;
  main_stat: string;
  main_stat_value: string;
  notes: string | null;
}

export interface EchoSetData {
  key: string; // 'set_1', 'set_2', etc.
  name: string;
  filename: string;
  two_piece_bonus: string;
  five_piece_bonus: string;
  has_2pc: boolean;  // True if set has a 2pc effect
  has_3pc: boolean;  // True if set has a 3pc effect (3pc-only sets)
  has_5pc: boolean;  // True if set has a 5pc effect
  asset_type: string;
}

export interface EchoBuild {
  id: number;
  character_id: number;
  primary_set_key: string | null;      // Primary echo set ('set_1', 'set_18', etc.)
  secondary_set_key: string | null;     // Secondary set for mixed builds (null if using 5pc)
  primary_set_pieces: number;           // Number of pieces for primary set (5, 3, or 2)
  secondary_set_pieces: number;         // Number of pieces for secondary set (0, 2, or 3)
  overall_quality: string | null;
  notes: string | null;
}

export interface EchoSubstat {
  id: number;
  echo_id: number;
  stat_name: string;
  stat_value: string;
}

export interface EchoListItem {
  name: string;
  cost: number;
  echo_class: string;
  available_sets: string[];
}

export interface StatInfo {
  name: string;
  is_percentage: boolean;
}

export interface EchoStatsOptions {
  main_stats_by_cost: Record<number, StatInfo[]>;
  substats: StatInfo[];
}

export interface EchoListItem {
  name: string;
  cost: number;
  echo_class: string;
  available_sets: string[];
}

/* =======================
Exploration
======================= */

export interface ExplorationRegion {
  id: number;
  region_name: string;
  display_order: number;
  description: string | null;
  notes: string | null;
}

export interface ExplorationMap {
  id: number;
  region_id: number;
  map_name: string;
  display_order: number;
  exploration_percent: number;
  notes: string | null;
}


/* =======================
   Pull History - WuwaTracker Compatible Format
   ======================= */

// Internal database format (for compatibility with existing code)
export interface PullHistory {
  id: number;
  banner_type: string;
  pull_number: number;
  item_name: string;
  rarity: number;
  item_type: 'character' | 'weapon';
  is_guaranteed: boolean;
  pull_date: string;
  notes: string | null;
  group_order: number | null;
}

// WuwaTracker export/import format
export interface WuwaTrackerPull {
  cardPoolType: number; // 1=Featured Char, 2=Featured Weapon, 3=Std Char, 4=Std Weapon, 5=Beginner, 6=Selector, 7=Std Permanent
  resourceId: number | null;
  qualityLevel: number; // 3, 4, or 5 stars
  name: string;
  time: string; // ISO 8601 format
  isSorted: boolean;
  group: number; // For 10-pulls
}

export interface WuwaTrackerExport {
  version: string; // e.g., "0.0.2"
  date: string; // ISO 8601 timestamp
  playerId: string;
  pulls: WuwaTrackerPull[];
}

export interface FiveStarPull {
  pull: PullHistory;
  pullsSinceLastFiveStar: number;
}

/* =======================
Tower of Adversity
======================= */

export interface TowerOfAdversity {
  id: number;
  last_reset: string;
  total_stars: number;
  astrite_earned: number;
  notes: string | null;
}

export interface TowerDetails {
  id: number;
  tower_type: string;
  stars_achieved: number;
  max_stars: number;
  notes: string | null;
}

export interface TowerFloor {
  id: number;
  tower_type: string;
  floor_number: number;
  stars: number;
  max_stars: number;
}

export interface TowerAreaEffect {
  id: number;
  tower_type: string;
  floor_range: string;
  effect_description: string;
}

export interface TowerTeam {
  id: number;
  tower_type: string;
  floor_number: number;
  character1: string;
  character2: string;
  character3: string;
}

/* =======================
   Whimpering Wastes
   ======================= */

export interface WhimperingWastes {
  id: number;
  last_reset: string;
  chasm_highest_stage: number;
  chasm_total_points: number;
  chasm_astrite: number;
  torrents_total_points: number;
  torrents_astrite: number;
  notes: string | null;
}

export interface TorrentsStage {
  id: number;
  stage_number: number;
  character1: string;
  character2: string;
  character3: string;
  token: string;
  points: number;
}

/* =======================
   Troop Matrix
   ======================= */

export interface TroopMatrix {
  id: number;
  unlocked: boolean;
  last_reset: string;
  stability_accords_points: number;
  stability_accords_astrite: number;
  singularity_expansion_points: number;
  singularity_expansion_astrite: number;
  singularity_expansion_highest_round: number;
  notes: string | null;
}

export interface MatrixTeam {
  id: number;
  mode: string; // "Stability Accords" or "Singularity Expansion"
  team_number: number;
  character1: string;
  character2: string;
  character3: string;
  points: number;
  round_number: number | null; // Only for Singularity Expansion
}

/* =======================
Utility
======================= */

export interface DropPos { top: number; left: number; width: number }

export interface PortalDropdownOption {
  label: string;
  value: string;
  meta?: string;
  disabled?: boolean;
  dim?: boolean;
  badge?: { text: string; className: string };
}

export interface AssetMetadata {
  id: string;
  filename: string;
  display_name: string;
  asset_type: string;
  rarity?: number;
  element?: string;
  weapon_type?: string;
  echo_class?: string;
  cost?: number;
  tags: string[];
}

export interface AssetFilters {
  asset_type?: string;
  rarity?: number;
  element?: string;
  weapon_type?: string;
  tags?: string[];
}

export interface UpdateProgress {
  current: number;
  total: number;
  current_asset: string;
  status: 'fetching' | 'downloading' | 'cached' | 'failed' | 'complete';
}

export interface UpdateSummary {
  downloaded: number;
  cached: number;
  failed: number;
  total_assets: number;
}

export interface CacheStats {
  total_assets: number;
  assets_by_type: Record<AssetType, number>;
  last_update: string | null;
  cache_size_mb: number;
}

export interface EndgameTabRef {
  refresh: () => Promise<void>;
}