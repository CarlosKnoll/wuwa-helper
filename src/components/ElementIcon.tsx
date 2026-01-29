// src/components/ElementIcon.tsx
/**
 * Element icon component - simplified to use asset resolver
 */

import { useState, useEffect } from 'react';
import { useAssets } from '../hooks/useAssets';
import { getElementColor } from '../utils';

interface ElementIconProps {
  element: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function ElementIcon({ 
  element, 
  size = 'md', 
  className = '',
  showLabel = false 
}: ElementIconProps) {
  const [iconSrc, setIconSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { getAsset, isInitialized } = useAssets();

  useEffect(() => {
    if (!isInitialized || !element) return;

    const loadIcon = async () => {
      setLoading(true);
      setError(false);

      try {
        // Backend resolver handles all format variations
        // Just pass the element name (e.g., "Aero", "Spectro")
        const result = await getAsset('element', element);
        
        if (result) {
          setIconSrc(`data:image/png;base64,${result}`);
        } else {
          setError(true);
        }
      } catch (err) {
        console.warn(`Failed to load element icon: ${element}`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadIcon();
  }, [element, isInitialized, getAsset]);

  // Check if this is an element that needs special sizing (e.g., Electro is smaller)
  const needsScaling = element.toLowerCase() === 'electro';

  // Loading state
  if (loading) {
    return (
      <div className={`${sizeMap[size]} ${className} animate-pulse bg-slate-700 rounded-full`} />
    );
  }

  // Error state - fall back to text badge
  if (error || !iconSrc) {
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs ${getElementColor(element)} ${className}`}>
        {element}
      </span>
    );
  }

  // Success - show icon
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className={`${sizeMap[size]} flex items-center justify-center`}>
        <img 
          src={iconSrc} 
          alt={`${element} element`}
          className={`${needsScaling ? 'w-full h-full' : 'max-w-full max-h-full'} object-contain`}
          title={element}
          style={needsScaling ? { transform: 'scale(1.4)' } : undefined}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium">{element}</span>
      )}
    </div>
  );
}