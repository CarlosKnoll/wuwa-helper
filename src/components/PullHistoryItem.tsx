// src/components/PullHistoryItem.tsx
/**
 * Lazy-loading pull history item component
 * Only loads asset images when the item is visible in the viewport
 */

import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { PullHistory } from '../types';

interface PullHistoryItemProps {
  pull: PullHistory;
  selectedBanner: string;
  isStandardItem: (itemName: string, itemType: string) => boolean;
  getRarityColor: (rarity: number) => string;
  getRarityBadge: (rarity: number) => string;
}

export function PullHistoryItem({
  pull,
  selectedBanner,
  isStandardItem,
  getRarityColor,
  getRarityBadge,
}: PullHistoryItemProps) {
  const [assetSrc, setAssetSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // Start loading 50px before item is visible
        threshold: 0.01,
      }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, []);

  // Load asset when visible
  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    const loadAsset = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Determine asset type and name
        const primaryAssetType = pull.item_type === 'character' ? 'character' : 'weapon';
        
        // Try primary asset type first
        try {
          const base64 = await invoke<string>('get_asset', {
            assetType: primaryAssetType,
            name: pull.item_name,
          });

          if (!cancelled && base64) {
            setAssetSrc(`data:image/webp;base64,${base64}`);
            return;
          }
        } catch (primaryErr) {
          // If primary type fails, try the alternate type as fallback
          const alternateAssetType = primaryAssetType === 'character' ? 'weapon' : 'character';
          
          try {
            const base64 = await invoke<string>('get_asset', {
              assetType: alternateAssetType,
              name: pull.item_name,
            });

            if (!cancelled && base64) {
              setAssetSrc(`data:image/webp;base64,${base64}`);
              return;
            }
          } catch (alternateErr) {
            // Both failed
            if (!cancelled) {
              setLoadError(true);
            }
          }
        }
      } catch (err) {
        console.error(`Failed to load asset for ${pull.item_name}:`, err);
        if (!cancelled) {
          setLoadError(true);
        }
      }
    };

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [isVisible, pull.item_name, pull.item_type]);

  const isFeaturedBanner = selectedBanner === 'featuredCharacter' || selectedBanner === 'featuredWeapon';
  const isStandard = pull.rarity === 5 && isStandardItem(pull.item_name, pull.item_type);

  return (
    <div
      ref={itemRef}
      className={`flex items-center gap-3 px-3 py-2 rounded border ${getRarityColor(pull.rarity)} hover:brightness-110 transition-all`}
    >
      {/* Asset Icon (Lazy Loaded) */}
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-700/50">
        {isVisible && assetSrc && !loadError ? (
          <img
            src={assetSrc}
            alt={pull.item_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isVisible && loadError ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            ?
          </div>
        ) : (
          <div className="w-full h-full animate-pulse bg-slate-700" />
        )}
      </div>

      {/* Rarity Badge */}
      <div className={`px-2 py-1 rounded text-xs font-bold ${getRarityBadge(pull.rarity)} min-w-[40px] text-center`}>
        {'★'.repeat(pull.rarity)}
      </div>

      {/* Item Name */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{pull.item_name}</div>
      </div>

      {/* Date */}
      <div className="text-xs text-slate-400 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {new Date(pull.pull_date).toLocaleDateString()}
      </div>

      {/* Standard Badge (for 5-star standard items on featured banners) */}
      {isFeaturedBanner && isStandard && (
        <div className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
          Standard
        </div>
      )}

      {/* Guarantee Badge */}
      {pull.is_guaranteed && (
        <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
          Guaranteed
        </div>
      )}
    </div>
  );
}