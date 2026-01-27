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
  id: number;
  banner_type: string;
  current_pity: number;
  guaranteed_next_fivestar: boolean;
  notes: string | null;
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
Character & Equipment
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

export interface CharacterModalProps {
  character: Character;
  onClose: () => void;
  onUpdate: () => void;
}

export interface CharacterInfoProps {
  character: Character;
  form: {
    level: number;
    ascension: number;
    waveband: number;
    build_status: string;
    notes: string;
  };
  editing: boolean;
  onEdit: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onChange: (form: any) => void;
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
}

export interface CharacterTalentsSectionProps {
  talents: CharacterTalents | null;
  characterId: number;
  onUpdate: () => void;
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

export interface CharacterWeaponSectionProps {
  weapon: CharacterWeapon | null;
  characterId: number;
  onUpdate: () => void;
}

export interface CharacterEchoBuildSectionProps {
  echoBuild: EchoBuild | null;
  echoes: Echo[];
  echoSubstats: Record<number, EchoSubstat[]>;
  onUpdate: () => void;
}

export interface AddCharacterModalProps {
  onClose: () => void;
  onSuccess: () => void;
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

export interface AddWeaponModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/* =======================
   Echo System
   ======================= */

export interface Echo {
  id: number;
  build_id: number;
  echo_name: string | null;
  cost: number;
  level: number;
  rarity: number;
  main_stat: string;
  main_stat_value: string;
  notes: string | null;
}

export interface EchoBuild {
  id: number;
  character_id: number;
  set_bonus: string | null;
  set_effect: string | null;
  overall_quality: string | null;
  notes: string | null;
}

export interface EchoSubstat {
  id: number;
  echo_id: number;
  stat_name: string;
  stat_value: string;
}

export interface EchoItemProps {
  echo: Echo;
  substats: EchoSubstat[];
  onUpdate: () => void;
}

/* =======================
Exploration
======================= */

export interface ExplorationMap {
  id: number;
  region_id: number;
  map_name: string;
  exploration_percent: number;
  notes: string | null;
}

export interface ExplorationRegion {
  id: number;
  region_name: string;
  notes: string | null;
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

export interface TowerSectionProps {
  towerInfo: TowerOfAdversity | null;
  towerDetails: TowerDetails[];
  towerFloors: TowerFloor[];
  towerEffects: TowerAreaEffect[];
  towerTeams: TowerTeam[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
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

export interface WhimperingWastesSectionProps {
  wastesInfo: WhimperingWastes | null;
  torrentsStages: TorrentsStage[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
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

// Component Props Interfaces
export interface TroopMatrixSectionProps {
  troopMatrix: TroopMatrix | null;
  matrixTeams: MatrixTeam[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}

/* =======================
Utility
======================= */

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}