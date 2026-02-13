// src/components/CharacterPortrait.tsx
/**
 * Small character portrait component for displaying in team compositions
 */

import { useState, useEffect } from 'react';
import { useAssets } from '../hooks/useAssets';

interface CharacterPortraitProps {
  characterName: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizeMap = {
  xs: 'w-10 h-10',
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
};

export default function CharacterPortrait({ 
  characterName, 
  size = 'xs',
  className = '' 
}: CharacterPortraitProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { getAsset, isInitialized } = useAssets();

  useEffect(() => {
    if (!isInitialized || !characterName || characterName === '-' || characterName.toLowerCase() === 'none') {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      setError(false);

      try {
        let assetName = characterName;

        const result = await getAsset('characters', assetName);
        
        if (result) {
          setImageSrc(`data:image/webp;base64,${result}`);
        } else {
          setError(true);
        }
      } catch (err) {
        console.warn(`Failed to load character portrait: ${characterName}`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [characterName, isInitialized, getAsset]);

  // Don't render anything for empty slots
  if (!characterName || characterName === '-' || characterName.toLowerCase() === 'none') {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className={`${sizeMap[size]} ${className} animate-pulse bg-slate-700/50 rounded`} />
    );
  }

  // Error state - don't show anything, let the text be visible
  if (error || !imageSrc) {
    return null;
  }

  // Success - show image
  return (
    <img 
      src={imageSrc} 
      alt={characterName}
      className={`${sizeMap[size]} ${className} rounded object-cover flex-shrink-0`}
      title={characterName}
    />
  );
}