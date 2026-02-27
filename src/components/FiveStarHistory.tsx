// src/components/FiveStarHistory.tsx
/**
 * Component to display the history of 5-star pulls for a banner
 * Shows portraits and pull counts between each 5-star
 */

import { useState, useEffect } from 'react';
import { FiveStarPull } from '../types';
import { FiveStarHistoryProps, FiveStarPortraitProps } from '../props';
import { invoke } from '@tauri-apps/api/core';

// Standard 5-star characters that indicate a 50/50 loss on featured banners
const STANDARD_FIVE_STARS = ['Encore', 'Jianxin', 'Calcharo', 'Lingyang', 'Verina'];

export function FiveStarHistory({ pulls, selectedBanner }: FiveStarHistoryProps) {
  const [fiveStarPulls, setFiveStarPulls] = useState<FiveStarPull[]>([]);
  const [assetCache, setAssetCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Sort all pulls chronologically: first by pull_date, then by group_order ascending
    // Within a batch: group_order 1 = oldest/first, group_order 10 = newest/last
    const sortedPulls = pulls
      .filter(p => p.banner_type === selectedBanner)
      .sort((a, b) => {
        const dateCompare = new Date(a.pull_date).getTime() - new Date(b.pull_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        // Within same timestamp, lower group_order came earlier (1 is oldest, 10 is newest)
        return (a.group_order ?? 0) - (b.group_order ?? 0);
      });

    // Extract 5-star pulls in chronological order
    const fiveStarResults = sortedPulls.filter(p => p.rarity === 5);

    // Calculate pity for each 5-star
    // Pity = number of pulls from previous 5-star (exclusive) to current 5-star (inclusive)
    // For the first 5-star, count from the beginning of the banner
    const fiveStars: FiveStarPull[] = fiveStarResults.map((pull, index) => {
      if (index === 0) {
        // First 5-star: count all pulls from start of banner to this 5-star (inclusive)
        const firstFiveStarIndex = sortedPulls.findIndex(p => p.id === pull.id);
        return { pull, pullsSinceLastFiveStar: firstFiveStarIndex + 1 };
      }

      const previousFiveStar = fiveStarResults[index - 1];
      
      // Count pulls between previous 5-star and current 5-star
      // We need pulls that come chronologically after previousFiveStar and up to & including current pull
      let count = 0;
      let foundPrevious = false;
      
      for (const p of sortedPulls) {
        // Skip until we find the previous 5-star
        if (!foundPrevious) {
          if (p.id === previousFiveStar.id) {
            foundPrevious = true;
          }
          continue;
        }
        
        // Count this pull
        count++;
        
        // Stop when we reach current 5-star
        if (p.id === pull.id) {
          break;
        }
      }

      return { pull, pullsSinceLastFiveStar: count };
    });

    setFiveStarPulls(fiveStars.reverse()); // Most recent first for display
  }, [pulls, selectedBanner]);

  // Load asset for a pull
  const loadAsset = async (itemName: string, itemType: string) => {
    if (assetCache.has(itemName)) {
      return assetCache.get(itemName)!;
    }

    try {
      const primaryAssetType = itemType === 'character' ? 'character' : 'weapon';
      
      // Try primary asset type first
      try {
        const base64 = await invoke<string>('get_asset', {
          assetType: primaryAssetType,
          name: itemName,
        });

        if (base64) {
          const src = `data:image/webp;base64,${base64}`;
          setAssetCache(prev => new Map(prev).set(itemName, src));
          return src;
        }
      } catch (primaryErr) {
        // If primary type fails, try the alternate type as fallback
        const alternateAssetType = primaryAssetType === 'character' ? 'weapon' : 'character';
        
        try {
          const base64 = await invoke<string>('get_asset', {
            assetType: alternateAssetType,
            name: itemName,
          });

          if (base64) {
            const src = `data:image/webp;base64,${base64}`;
            setAssetCache(prev => new Map(prev).set(itemName, src));
            return src;
          }
        } catch (alternateErr) {
          // Both failed, log and return null
          console.error(`Failed to load asset for ${itemName} as both ${primaryAssetType} and ${alternateAssetType}`);
        }
      }
    } catch (err) {
      console.error(`Failed to load asset for ${itemName}:`, err);
    }
    return null;
  };

  if (fiveStarPulls.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex items-center justify-center">
        <div className="text-slate-500 text-sm">No 5★ pulls yet</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="text-sm text-slate-400 uppercase tracking-wide mb-3">
        5★ Pull History
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {fiveStarPulls.map((fiveStar) => (
          <FiveStarPortrait
            key={fiveStar.pull.id}
            fiveStar={fiveStar}
            loadAsset={loadAsset}
            isFeaturedBanner={selectedBanner === 'featuredCharacter' || selectedBanner === 'featuredWeapon'}
          />
        ))}
      </div>
    </div>
  );
}

function FiveStarPortrait({ fiveStar, loadAsset, isFeaturedBanner }: FiveStarPortraitProps) {
  const [assetSrc, setAssetSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const src = await loadAsset(fiveStar.pull.item_name, fiveStar.pull.item_type);
      if (!cancelled) {
        setAssetSrc(src);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fiveStar.pull.item_name, fiveStar.pull.item_type]);

  // Determine if this was a 50/50 loss (standard character on featured banner)
  const isStandardCharacter = STANDARD_FIVE_STARS.includes(fiveStar.pull.item_name);
  const isFiftyFiftyLoss = isFeaturedBanner && isStandardCharacter && fiveStar.pull.item_type === 'character';
  const borderColor = isFiftyFiftyLoss ? 'border-slate-500' : 'border-yellow-500/50';

  return (
    <div className="flex-shrink-0 relative group">
      {/* Portrait */}
      <div className={`w-24 h-32 rounded-lg overflow-hidden bg-slate-700/50 border-2 ${borderColor} relative`}>
        {loading ? (
          <div className="w-full h-full animate-pulse bg-slate-700" />
        ) : assetSrc ? (
          <img
            src={assetSrc}
            alt={fiveStar.pull.item_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            ?
          </div>
        )}
        
        {/* Character name at top */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/70 to-transparent px-1.5 py-1.5">
          <div className="text-center text-[11px] leading-tight text-yellow-400 font-bold truncate">
            {fiveStar.pull.item_name}
          </div>
        </div>
        
        {/* Pity count at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-1.5 py-1.5">
          <div className="text-center text-sm font-bold text-yellow-400">
            {fiveStar.pullsSinceLastFiveStar > 80 ? '???' : fiveStar.pullsSinceLastFiveStar}
          </div>
        </div>
      </div>

      {/* Tooltip on hover - shows full name and pull number */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap">
          <div className="font-semibold">{fiveStar.pull.item_name}</div>
          <div className="text-slate-400">Pull #{fiveStar.pull.pull_number}</div>
          <div className="text-yellow-400">Pity: {fiveStar.pullsSinceLastFiveStar}</div>
        </div>
      </div>
    </div>
  );
}