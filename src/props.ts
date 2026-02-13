import { Character, CharacterTalents, CharacterWeapon,
         EchoBuild, Echo, EchoSubstat, 
         TowerOfAdversity, TowerDetails, TowerFloor, TowerAreaEffect, TowerTeam,
         WhimperingWastes, TorrentsStage,
         TroopMatrix, MatrixTeam,
         PullHistory, FiveStarPull,
         PortalDropdownOption
         } from './types';
import { ReactNode } from 'react';    

/* =======================
Character & Equipment
======================= */
export interface CharacterPortraitProps {
  characterName: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
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

export interface CharacterWeaponSectionProps {
  weapon: CharacterWeapon | null;
  characterId: number;
  onUpdate: () => void;
}

export interface CharacterTalentsSectionProps {
  talents: CharacterTalents | null;
  characterId: number;
  onUpdate: () => void;
}

export interface CharacterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  availableCharacters: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  vigorConfig?: {
    vigorConsumedMap: Record<string, number>;
    getMaxVigor: (charName: string) => number;
    vigorCost: number;
  };
}

/* =======================
   Weapons 
   ======================= */

export interface WeaponTypeIconProps {
  weaponType: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

/* =======================
   Echo System
   ======================= */

export interface CharacterEchoBuildSectionProps {
  echoBuild: EchoBuild | null;
  echoes: Echo[];
  echoSubstats: Record<number, EchoSubstat[]>;
  onUpdate: () => void;
}

export interface EchoItemProps {
  echo: Echo;
  substats: EchoSubstat[];
  onUpdate: () => void;
  echoImage?: string; // Optional base64 image data for the echo
  echoSetImage?: string; // Optional base64 image data for the echo's set
  echoMetadata?: {
    passive1: string;
    passive2: string;
    cooldown: number;
  };
}

/* =======================
Pity
======================= */

export interface FiveStarHistoryProps {
  pulls: PullHistory[];
  selectedBanner: string;
}

export interface FiveStarPortraitProps {
  fiveStar: FiveStarPull;
  loadAsset: (itemName: string, itemType: string) => Promise<string | null>;
  isFeaturedBanner: boolean;
}

export interface PullHistoryItemProps {
  pull: PullHistory;
  selectedBanner: string;
  isStandardItem: (itemName: string, itemType: string) => boolean;
  getRarityColor: (rarity: number) => string;
  getRarityBadge: (rarity: number) => string;
}

/* =======================
Endgame Content
======================= */

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

export interface TowerDetailsViewProps {
  towerInfo: TowerOfAdversity | null;
  towerDetails: TowerDetails[];
  towerFloors: Record<string, TowerFloor[]>;
  towerEffects: TowerAreaEffect[];
  towerTeams: TowerTeam[];
  selectedTower: string | null;
  onTowerSelect: (tower: string | null) => void;
  onUpdate: () => void;
  onInitializeFloors?: () => void;
  availableCharacters?: string[];
}

export interface WhimperingWastesDetailsViewProps {
  wastesInfo: WhimperingWastes | null;
  torrentsStages: TorrentsStage[];
  onUpdate: () => void;
  availableCharacters?: string[];
}

export interface TroopMatrixDetailsViewProps {
  troopMatrix: TroopMatrix | null;
  matrixTeams: MatrixTeam[];
  onUpdate: () => void;
  availableCharacters?: string[];
  healerCharacters?: string[];
}

export interface StarRatingProps {
  stars: number;
  maxStars?: number;
  onChange?: (stars: number) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  activeColor?: string;
  inactiveColor?: string;
}

export interface TeamDisplayProps {
  characters: (string | null | undefined)[];
  size?: 'xs' | 'sm' | 'md';
  showNames?: boolean;
  className?: string;
}

export interface TeamEditorProps {
  character1: string;
  character2: string;
  character3: string;
  onChar1Change: (value: string) => void;
  onChar2Change: (value: string) => void;
  onChar3Change: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  availableCharacters: string[];
  saving?: boolean;
  vigorConfig?: {
    vigorConsumedMap: Record<string, number>;
    getMaxVigor: (charName: string) => number;
    vigorCost: number;
  };
  saveButtonColor?: string;
  saveButtonHoverColor?: string;
}

/* =======================
Utility
======================= */

export interface ElementIconProps {
  element: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

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

export interface PortalDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: PortalDropdownOption[];
  placeholder?: string;
  emptyLabel?: string;
  clearLabel?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  showChevron?: boolean;
  closeImmediatelyOnInputTab?: boolean;
}

export interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  actions?: ReactNode;
  collapsible?: boolean;
  color?: string;
}

export interface AddCharacterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export interface AddWeaponModalProps {
  onClose: () => void;
  onSuccess: () => void;
}