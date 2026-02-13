// src/hooks/useAssetResolver.ts
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface AssetMetadata {
  id: string;
  filename: string;
  display_name: string;
  asset_type: string;
  rarity?: number;
  element?: string;
  weapon_type?: string;
  echo_class?: string;
  cost?: number;
  tags: string[];
}

interface AssetFilters {
  asset_type?: string;
  rarity?: number;
  element?: string;
  weapon_type?: string;
  tags?: string[];
}

export function useAssetResolver() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    invoke('init_asset_resolver')
      .then(() => setInitialized(true))
      .catch(err => console.error('Failed to initialize asset resolver:', err));
  }, []);

  /**
   * Get the asset path for use in img src
   * Usage: <img src={getAssetSrc('Jiyan')} />
   */
  const getAssetSrc = useCallback(async (identifier: string): Promise<string> => {
    try {
      const filename = await invoke<string | null>('get_asset_filename', { identifier });
      if (filename) {
        // Get the actual asset data (base64)
        const assetData = await invoke<string>('get_asset', {
          assetType: 'characters', // Or determine from metadata
          name: filename.replace('_card.webp', '').replace('.webp', ''),
        });
        return `data:image/webp;base64,${assetData}`;
      }
      return '';
    } catch (err) {
      console.error('Failed to get asset:', err);
      return '';
    }
  }, []);

  /**
   * Search for assets
   * Usage: const results = await searchAssets('jiyan');
   */
  const searchAssets = useCallback(async (query: string): Promise<AssetMetadata[]> => {
    try {
      return await invoke('search_assets', { query });
    } catch (err) {
      console.error('Failed to search assets:', err);
      return [];
    }
  }, []);

  /**
   * Get assets by type
   * Usage: const characters = await getAssetsByType('character');
   */
  const getAssetsByType = useCallback(async (assetType: string): Promise<AssetMetadata[]> => {
    try {
      return await invoke('get_assets_by_type', { assetType });
    } catch (err) {
      console.error('Failed to get assets by type:', err);
      return [];
    }
  }, []);

  /**
   * Filter assets
   * Usage: const fiveStarSpectro = await filterAssets({ rarity: 5, element: 'Spectro' });
   */
  const filterAssets = useCallback(async (filters: AssetFilters): Promise<AssetMetadata[]> => {
    try {
      return await invoke('filter_assets', {
        filters: {
          asset_type: filters.asset_type || null,
          rarity: filters.rarity || null,
          element: filters.element || null,
          weapon_type: filters.weapon_type || null,
          tags: filters.tags || [],
        },
      });
    } catch (err) {
      console.error('Failed to filter assets:', err);
      return [];
    }
  }, []);

  /**
   * Resolve asset metadata by name
   */
  const resolveAsset = useCallback(async (name: string): Promise<AssetMetadata | null> => {
    try {
      return await invoke('resolve_asset_by_name', { name });
    } catch (err) {
      console.error('Failed to resolve asset:', err);
      return null;
    }
  }, []);

  return {
    initialized,
    getAssetSrc,
    searchAssets,
    getAssetsByType,
    filterAssets,
    resolveAsset,
  };
}

/**
 * Component-friendly hook for a single asset
 * Usage: const { src, loading, error } = useAsset('Jiyan');
 */
export function useAsset(identifier: string) {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAssetSrc, initialized } = useAssetResolver();

  useEffect(() => {
    if (!initialized || !identifier) return;

    setLoading(true);
    setError(null);

    getAssetSrc(identifier)
      .then(srcData => {
        setSrc(srcData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [identifier, initialized, getAssetSrc]);

  return { src, loading, error };
}

/**
 * Prebuilt component for rendering character cards
 */
export function CharacterAsset({ name, className = '' }: { name: string; className?: string }) {
  const { src, loading, error } = useAsset(name);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-700 rounded-lg ${className}`}>
        <div className="w-full h-full" />
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`rounded-lg object-cover ${className}`}
      loading="lazy"
    />
  );
}