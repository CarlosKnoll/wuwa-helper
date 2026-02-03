// src/components/WeaponTypeIcon.tsx
/**
 * Weapon type icon component using existing asset system
 */

import { useState, useEffect } from 'react';
import { useAssets } from '../hooks/useAssets';

interface WeaponTypeIconProps {
  weaponType: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

// Weapon type to filename mapping
// Note: Actual asset files use plural forms for some types
const weaponTypeMap: Record<string, string> = {
  'Sword': 'sword',
  'Broadblade': 'broadblade',
  'Pistols': 'pistols',      // File is "pistols" (plural)
  'Pistol': 'pistols',       // Also accept singular UI name
  'Gauntlets': 'gauntlets',  // File is "gauntlets" (plural)
  'Gauntlet': 'gauntlets',   // Also accept singular UI name
  'Rectifier': 'rectifier',
};

export default function WeaponTypeIcon({ 
  weaponType, 
  size = 'md', 
  className = '',
  showLabel = false 
}: WeaponTypeIconProps) {
  const [iconSrc, setIconSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { getAsset, isInitialized } = useAssets();

  useEffect(() => {
    if (!isInitialized || !weaponType) return;

    const loadIcon = async () => {
      setLoading(true);
      setError(false);

      try {
        // Map weapon type to filename
        const weaponTypeKey = weaponTypeMap[weaponType];
        if (!weaponTypeKey) {
          console.warn(`Unknown weapon type: ${weaponType}`);
          setError(true);
          setLoading(false);
          return;
        }

        // Build the filename - backend will handle .png extension
        const filename = `weapon_${weaponTypeKey}`;
        
        // Try to get the asset
        const base64 = await getAsset('weapon', filename);
        
        if (base64) {
          setIconSrc(`data:image/png;base64,${base64}`);
        } else {
          console.warn(`Asset not found for weapon type: ${weaponType} (${filename})`);
          setError(true);
        }
      } catch (err) {
        console.error(`Failed to load weapon type icon for ${weaponType}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadIcon();
  }, [weaponType, isInitialized, getAsset]);

  // Loading state
  if (loading) {
    return (
      <div className={`${sizeMap[size]} ${className} animate-pulse bg-slate-700 rounded`} />
    );
  }

  // Error state - fall back to text
  if (error || !iconSrc) {
    return (
      <span className={`inline-block text-xs text-slate-400 ${className}`}>
        {weaponType}
      </span>
    );
  }

  // Success - show icon
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <img 
        src={iconSrc} 
        alt={`${weaponType} weapon type`}
        className={`${sizeMap[size]} object-contain`}
        title={weaponType}
      />
      {showLabel && (
        <span className="text-xs font-medium">{weaponType}</span>
      )}
    </div>
  );
}