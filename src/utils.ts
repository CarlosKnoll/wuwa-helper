import { invoke } from '@tauri-apps/api/core';

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
 * Tier 6 - Unbuilt: Character is not built at all
 * Tier 5 - Minimal: Basic functionality, low investment
 * Tier 4 - Functional: Character is usable with decent investment
 * Tier 3 - Optimized: Well-invested, performs well
 * Tier 2 - Maxed: High/maximum investment
 * Tier 1 - Building: Currently working on
 */

/**Changes for the database: 
 * Phrolova -> Hyperinvested
 * Cartethya -> Hyperinvested
 * Sanhua -> High investment
 * Youhu -> Medium investment
 * Mortefi - Low investment
*/

export const BUILD_STATUS_TIERS = {
  // Tier 6: Unbuilt
  'Not built': { tier: 6, priority: 7, color: 'bg-slate-700 text-slate-400' },
  
  // Tier 5: Minimal Investment (Levels 1-70, basic talents and echoes)
  'Low investment': { tier: 5, priority: 6, color: 'bg-red-500/20 text-red-400' },
  
  // Tier 4: Functional (Levels 40-80, decent talents and echoes)
  'Medium investment': { tier: 4, priority: 5, color: 'bg-lime-500/20 text-lime-400' },
  
  // Tier 3: Optimized (Levels 70-80, good talents, quality echoes)
  'High investment': { tier: 3, priority: 4, color: 'bg-green-500/20 text-green-400' },
  
  // Tier 2: Maxed (Level 90, maxed talents, optimized echoes)
  'Hyperinvested': { tier: 2, priority: 3, color: 'bg-cyan-500/20 text-cyan-400' },
  'Perfect': { tier: 2, priority: 2, color: 'bg-purple-500/20 text-purple-400' },

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