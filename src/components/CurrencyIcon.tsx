import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

/**
 * CurrencyIcon Component
 * Displays actual currency assets from the misc folder
 * Falls back to Coins icon from lucide-react if asset fails to load
 */
export function CurrencyIcon({ 
  currencyName, 
  className = "w-6 h-6" 
}: { 
  currencyName: string; 
  className?: string;
}) {
  const [iconSrc, setIconSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadIcon = async () => {
      try {
        // Map currency names to their icon filenames
        const iconMapping: Record<string, string> = {
          'astrite': 'astrite_icon',
          'lustrous_tide': 'lustrous_icon',
          'radiant_tide': 'radiant_icon',
          'forged_tide': 'forged_icon',
          'afterglow_coral': 'afterglow_icon',
          'oscillated_coral': 'oscillated_icon',
          'shell_credits': 'shell_icon',
        };

        const filename = iconMapping[currencyName];
        if (!filename) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        // Initialize AssetManager
        try {
          await invoke('init_assets');
        } catch (err) {
          // Already initialized, ignore
        }

        // Get the asset (without .png extension - mod.rs will add it)
        const assetData = await invoke<string>('get_asset', {
          assetType: 'misc',
          name: filename,
        });
        
        if (!cancelled && assetData) {
          setIconSrc(`data:image/png;base64,${assetData}`);
          setLoading(false);
        } else if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load ${currencyName} icon:`, err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      cancelled = true;
    };
  }, [currencyName]);

  // Use fallback Coins icon while loading or if no icon loaded
  if (loading || !iconSrc) {
    return <Coins className={className} />;
  }

  return (
    <img
      src={iconSrc}
      alt={currencyName}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}