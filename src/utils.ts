import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { WuwaTrackerPull, PullHistory, WuwaTrackerExport, EchoSetData, EchoBuild } from './types';

export const checkForUpdates = async () => {
  const update = await check();
  if (update) {
    await update.downloadAndInstall();
    await relaunch();
  }
};

export async function safeInvoke(cmd: string, args?: Record<string, any>) {
  try {
    return await invoke(cmd, args);
  } catch (error) {
    console.error(`Invoke error (${cmd}):`, error);
    throw error;
  }
}

export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    Spectro: 'bg-yellow-500/20 text-yellow-400',
    Havoc: 'bg-purple-500/20 text-purple-400',
    Aero: 'bg-cyan-500/20 text-cyan-400',
    Electro: 'bg-violet-500/20 text-violet-400',
    Fusion: 'bg-red-500/20 text-red-400',
    Glacio: 'bg-blue-500/20 text-blue-400',
  };
  return colors[element] || 'bg-slate-500/20 text-slate-400';
}

export function getRarityStars(rarity: number): string {
  return '★'.repeat(rarity);
}

/**
 * Tiered Build Status Classification System
 * 
 * Tier 7 - Unbuilt: Character is not built at all
 * Tier 6 - Minimal: Basic functionality, low investment
 * Tier 5 - Functional: Character is usable with decent investment
 * Tier 4 - Optimized: Well-invested, performs well
 * Tier 3 - Maxed: High/maximum investment
 * Tier 2 - Next ones in line to be built/Characters without a serviceable build but not the focus to max
 * Tier 1 - Building: Currently working on
 */

export const BUILD_STATUS_TIERS = {
  // Tier 7: Unbuilt
  'Not built': { tier: 7, priority: 9, color: 'bg-slate-700 text-slate-400' },
  
  // Tier 6: Minimal Investment (Levels 1-70, basic talents and echoes)
  'Low investment': { tier: 6, priority: 8, color: 'bg-red-500/20 text-red-400' },
  
  // Tier 5: Functional (Levels 40-80, decent talents and echoes)
  'Medium investment': { tier: 5, priority: 7, color: 'bg-lime-500/20 text-lime-400' },
  
  // Tier 4: Optimized (Levels 70-80, good talents, quality echoes)
  'High investment': { tier: 4, priority: 6, color: 'bg-green-500/20 text-green-400' },
  
  // Tier 3: Maxed (Level 90, maxed talents, optimized echoes)
  'Hyperinvested': { tier: 3, priority: 5, color: 'bg-cyan-500/20 text-cyan-400' },
  'Perfect': { tier: 3, priority: 4, color: 'bg-purple-500/20 text-purple-400' },

  // Tier 2: Next ones in line to be built/Serviceable but not the focus to be maxed
  'On hold': { tier: 2, priority: 3, color: 'bg-yellow-500/20 text-yellow-400' },
  'Plan to build': { tier: 2, priority: 2, color: 'bg-yellow-500/20 text-yellow-400' },

  // Tier 1: Building (Characters currently being worked on)
  'Building': { tier: 1, priority: 1, color: 'bg-orange-500/20 text-orange-400' },
};

export function getBuildStatusColor(status: string): string {
  return BUILD_STATUS_TIERS[status as keyof typeof BUILD_STATUS_TIERS]?.color || 'bg-slate-500/20 text-slate-400';
}

export function getBuildStatusPriority(status: string): number {
  return BUILD_STATUS_TIERS[status as keyof typeof BUILD_STATUS_TIERS]?.priority || 999;
}

export function getBuildStatusTier(status: string): number {
  return BUILD_STATUS_TIERS[status as keyof typeof BUILD_STATUS_TIERS]?.tier || 0;
}

export function getBuildStatusOptions(): string[] {
  return Object.keys(BUILD_STATUS_TIERS);
}

export function formatBannerType(bannerType: string): string {
  const formatMap: Record<string, string> = {
    'featuredCharacter': 'Featured Character Banner',
    'featuredWeapon': 'Featured Weapon Banner',
    'standardCharacter': 'Standard Character Banner',
    'standardWeapon': 'Standard Weapon Banner',
  };
  return formatMap[bannerType] || bannerType;
}

/* =======================
   WuwaTracker Format Conversion Utilities
   ======================= */

/**
 * Convert cardPoolType to our internal banner_type format
 * 1 = Featured Character
 * 2 = Featured Weapon
 * 3 = Standard Character
 * 4 = Standard Weapon
 * 5 = Beginner (IGNORE - not tracked)
 * 6 = Selector (IGNORE - not tracked)
 * 7 = Standard Permanent (IGNORE - invalid/unknown type)
 */
export function cardPoolTypeToBannerType(cardPoolType: number): string {
  const mapping: Record<number, string> = {
    1: 'featuredCharacter',
    2: 'featuredWeapon',
    3: 'standardCharacter',
    4: 'standardWeapon',
    5: '', // Beginner banner - ignore
    6: '', // Selector banner - ignore
    7: '', // Standard permanent - ignore
  };
  return mapping[cardPoolType];
}

/**
 * Convert our internal banner_type to cardPoolType
 */
export function bannerTypeToCardPoolType(bannerType: string): number {
  const mapping: Record<string, number> = {
    'featuredCharacter': 1,
    'featuredWeapon': 2,
    'standardCharacter': 3,
    'standardWeapon': 4,
  };
  return mapping[bannerType] || 1;
}

/**
 * Determine if a pull is a character or weapon based on resourceId
 * Characters: 1001-1999
 * Weapons: 21000000+
 * Materials: Other ranges
 */
export function determineItemType(resourceId: number | null, name: string): 'character' | 'weapon' {
  if (!resourceId) {
    // Fallback to name-based detection
    const weaponKeywords = [
      'Sword', 'Broadblade', 'Pistols', 'Gauntlets', 'Rectifier',
      'Originite', // Materials
      'Cleaver', 'Rifle', 'Blade'
    ];
    const isWeapon = weaponKeywords.some(keyword => name.includes(keyword));
    return isWeapon ? 'weapon' : 'character';
  }

  // Character IDs are typically 1001-1999
  if (resourceId >= 1000 && resourceId < 2000) {
    return 'character';
  }
  
  // Everything else (weapons, materials) treated as weapon
  return 'weapon';
}

/**
 * Convert WuwaTracker pull to our internal PullHistory format
 */
export function wuwaTrackerPullToInternal(pull: WuwaTrackerPull, pullNumber: number): Omit<PullHistory, 'id'> {
  return {
    banner_type: cardPoolTypeToBannerType(pull.cardPoolType),
    pull_number: pullNumber,
    item_name: pull.name,
    rarity: pull.qualityLevel,
    item_type: determineItemType(pull.resourceId, pull.name),
    is_guaranteed: false, // We can't determine this from WuwaTracker data
    pull_date: pull.time,
    notes: null,
    group_order: pull.group || null,
  };
}

/**
 * Convert our internal PullHistory to WuwaTracker format
 */
export function internalPullToWuwaTracker(pull: PullHistory, group: number = 1): WuwaTrackerPull {
  return {
    cardPoolType: bannerTypeToCardPoolType(pull.banner_type),
    resourceId: null, // We don't store resourceId
    qualityLevel: pull.rarity,
    name: pull.item_name,
    time: pull.pull_date,
    isSorted: true,
    group: group,
  };
}

/**
 * Export pulls to WuwaTracker format
 */
export function exportToWuwaTrackerFormat(
  pulls: PullHistory[],
  playerId: string = 'unknown'
): WuwaTrackerExport {
  // Group pulls by their pull_date (10-pulls have same timestamp)
  const pullsByTime = new Map<string, PullHistory[]>();
  pulls.forEach(pull => {
    const existing = pullsByTime.get(pull.pull_date) || [];
    existing.push(pull);
    pullsByTime.set(pull.pull_date, existing);
  });

  // Convert to WuwaTracker format with group numbers
  const wuwaTrackerPulls: WuwaTrackerPull[] = [];
  pullsByTime.forEach((groupedPulls) => {
    groupedPulls.forEach((pull, index) => {
      wuwaTrackerPulls.push(
        internalPullToWuwaTracker(pull, groupedPulls.length - index)
      );
    });
  });

  return {
    version: '0.0.2',
    date: new Date().toISOString(),
    playerId: playerId,
    pulls: wuwaTrackerPulls,
  };
}

/**
 * Import pulls from WuwaTracker format
 * Returns pulls grouped by banner type with their pull numbers
 * Ignores beginner and selector banner pulls (types 5, 6, 7)
 */
export function importFromWuwaTrackerFormat(
  wuwaData: WuwaTrackerExport
): Map<string, Array<Omit<PullHistory, 'id'>>> {
  const pullsByBanner = new Map<string, Array<Omit<PullHistory, 'id'>>>();


  // Sort pulls by time (oldest first) to maintain correct pull order
  // The group field is preserved in group_order and will be used for display ordering
  const sortedPulls = [...wuwaData.pulls].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );


  // Group by banner type and calculate pull numbers
  sortedPulls.forEach((pull) => {
    const bannerType = cardPoolTypeToBannerType(pull.cardPoolType);
    
    // Skip beginner, selector, and other ignored banner types
    if (bannerType === null) {
      return;
    }
    
    const bannerPulls = pullsByBanner.get(bannerType) || [];
    
    const internalPull = wuwaTrackerPullToInternal(pull, bannerPulls.length + 1);
    bannerPulls.push(internalPull);
    
    pullsByBanner.set(bannerType, bannerPulls);
  });

  return pullsByBanner;
}

/**
 * Calculate pity state from a sequence of pulls
 */
export function calculatePityFromPulls(pulls: Array<Omit<PullHistory, 'id'>>) {
  let currentPity = 0;
  let guaranteed = false;

  pulls.forEach(pull => {
    if (pull.rarity === 5) {
      currentPity = 0;
      // If we didn't get the guaranteed item, next is guaranteed
      guaranteed = !pull.is_guaranteed;
    } else {
      currentPity++;
    }
  });

  return { currentPity, guaranteed };
}

/* =======================
   Endgame Astrite Calculation Utilities
   ======================= */

/**
 * Calculate Tower of Adversity astrite based on total stars
 * - 3-24 stars: 75 astrite per 3 stars (8 tiers × 75 = 600)
 * - 27-36 stars: 50 astrite per 3 stars (4 tiers × 50 = 200)
 * Total max: 800 astrite
 */
export function calculateTowerAstrite(totalStars: number): number {
  let astrite = 0;
  
  // First tier: 3-24 stars (8 rewards of 75 each)
  const tier1Stars = Math.min(totalStars, 24);
  const tier1Rewards = Math.floor(tier1Stars / 3);
  astrite += tier1Rewards * 75;
  
  // Second tier: 27-36 stars (4 rewards of 50 each)
  if (totalStars > 24) {
    const tier2Stars = Math.min(totalStars - 24, 12);
    const tier2Rewards = Math.floor(tier2Stars / 3);
    astrite += tier2Rewards * 50;
  }
  
  return astrite;
}

/**
 * Calculate Whimpering Wastes - Chasm astrite based on score
 * Breakpoints: 5000, 7000, 9500, 12000, 15000 (125 astrite each)
 * Total max: 625 astrite (but documentation says 600, using 5 breakpoints)
 */
export function calculateChasmAstrite(score: number): number {
  const breakpoints = [5000, 7000, 9500, 12000, 15000];
  const rewardPerBreakpoint = 125;
  
  let astrite = 0;
  for (const breakpoint of breakpoints) {
    if (score >= breakpoint) {
      astrite += rewardPerBreakpoint;
    }
  }
  
  return astrite;
}

/**
 * Calculate Whimpering Wastes - Torrents astrite based on score
 * Breakpoints: 3500 (75), 4000 (50), 4500 (50)
 * Total max: 175 astrite (but documentation says 200, need to verify)
 */
export function calculateTorrentsAstrite(score: number): number {
  let astrite = 0;
  
  if (score >= 3500) astrite += 75;
  if (score >= 4000) astrite += 50;
  if (score >= 4500) astrite += 50;
  
  return astrite;
}

/**
 * Calculate Troop Matrix - Stability Accords astrite based on score
 * Breakpoints: 4800, 7200, 10000 (50 astrite each)
 * Total max: 150 astrite
 */
export function calculateStabilityAccordsAstrite(score: number): number {
  const breakpoints = [4800, 7200, 10000];
  const rewardPerBreakpoint = 50;
  
  let astrite = 0;
  for (const breakpoint of breakpoints) {
    if (score >= breakpoint) {
      astrite += rewardPerBreakpoint;
    }
  }
  
  return astrite;
}

/**
 * Calculate Troop Matrix - Singularity Expansion astrite
 * Based on total score and team count achievements
 */
export function calculateSingularityExpansionAstrite(
  totalScore: number,
  teamScores: number[]
): { astrite: number; missingNonAstriteRewards: string[] } {
  let astrite = 0;
  const missingRewards: string[] = [];
  
  // Score-based rewards
  const scoreBreakpoints = [
    { score: 12000, reward: 50 },
    { score: 16000, reward: 50 },
    { score: 21000, reward: 50 },
  ];
  
  for (const breakpoint of scoreBreakpoints) {
    if (totalScore >= breakpoint.score) {
      astrite += breakpoint.reward;
    }
  }
  
  // Non-astrite score rewards (just for notification)
  const nonAstriteBreakpoints = [29000, 37000, 45000, 58000];
  for (const breakpoint of nonAstriteBreakpoints) {
    if (totalScore >= breakpoint) {
      // Already achieved, no notification needed
    } else {
      // Could be achieved - note it
      missingRewards.push(`${breakpoint} total score`);
      break; // Only show the next missing one
    }
  }
  
  // Team count achievements (reaching 5000 with X teams)
  const teamsAt5000 = teamScores.filter(score => score >= 5000).length;
  
  if (teamsAt5000 >= 3) astrite += 50;
  if (teamsAt5000 >= 4) astrite += 50;
  if (teamsAt5000 >= 6) {
    // Non-astrite reward, just note it
  } else if (teamsAt5000 >= 4) {
    missingRewards.push('6 teams at 5000+ (non-astrite reward)');
  }
  
  return { astrite, missingNonAstriteRewards: missingRewards };
}

// Helper functions for echo builds

export function isMixedSet(build: EchoBuild): boolean {
  return build.secondary_set_pieces > 0 && build.secondary_set_key !== null;
}

export function getSetConfigurationLabel(build: EchoBuild): string {
  if (build.secondary_set_pieces === 0) {
    return `${build.primary_set_pieces}pc`;
  }
  return `${build.primary_set_pieces}pc + ${build.secondary_set_pieces}pc`;
}

export function getValidSecondaryPieceCounts(primaryPieces: number): number[] {
  if (primaryPieces === 5) return [];
  if (primaryPieces === 3) return [2];
  if (primaryPieces === 2) return [3];
  return [];
}

export function canUseAsSecondarySet(
  set: EchoSetData,
  requiredPieces: number,
  primarySetKey: string | null
): boolean {
  // Can't use same set twice
  if (set.key === primarySetKey) return false;
  
  // Check if set has the required piece count effect
  if (requiredPieces === 2) return set.has_2pc;
  if (requiredPieces === 3) return set.has_3pc;
  
  return false;
}