// src/hooks/useAssets.ts
/**
 * React hook for managing Wuthering Waves assets
 * Provides methods to fetch and display assets from local cache
 */

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback } from 'react';

export type AssetType = 'character' | 'weapon' | 'echo' | 'element' | 'misc';

interface UpdateProgress {
  current: number;
  total: number;
  current_asset: string;
  status: 'fetching' | 'downloading' | 'cached' | 'failed' | 'complete';
}

interface UpdateSummary {
  downloaded: number;
  cached: number;
  failed: number;
  total_assets: number;
}

interface CacheStats {
  total_assets: number;
  assets_by_type: Record<AssetType, number>;
  last_update: string | null;
  cache_size_mb: number;
}

export function useAssets() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);

  // Initialize assets on mount
  useEffect(() => {
    initAssets();
  }, []);

  // Listen for update progress events
  useEffect(() => {
    const unlisten = listen<UpdateProgress>('asset-update-progress', (event) => {
      setUpdateProgress(event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const initAssets = async () => {
    try {
      await invoke('init_assets');
      setIsInitialized(true);
      await refreshStats();
    } catch (error) {
      console.error('Failed to initialize assets:', error);
    }
  };

  const getAsset = useCallback(async (
    assetType: AssetType,
    name: string
  ): Promise<string | null> => {
    try {
      const base64 = await invoke<string>('get_asset', {
        assetType,
        name,
      });
      return base64;
    } catch (error) {
      console.error(`Failed to get asset ${assetType}/${name}:`, error);
      return null;
    }
  }, []);

  const getAssetPath = useCallback(async (
    assetType: AssetType,
    name: string
  ): Promise<string | null> => {
    try {
      const path = await invoke<string>('get_asset_path', {
        assetType,
        name,
      });
      return path;
    } catch (error) {
      console.error(`Failed to get asset path ${assetType}/${name}:`, error);
      return null;
    }
  }, []);

  const updateAssets = useCallback(async (): Promise<UpdateSummary | null> => {
    setIsUpdating(true);
    setUpdateProgress(null);

    try {
      const summary = await invoke<UpdateSummary>('update_assets');
      await refreshStats();
      return summary;
    } catch (error) {
      console.error('Failed to update assets:', error);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const shouldUpdate = useCallback(async (): Promise<boolean> => {
    try {
      return await invoke<boolean>('should_update_assets');
    } catch (error) {
      console.error('Failed to check if should update:', error);
      return false;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const newStats = await invoke<CacheStats>('get_asset_stats');
      setStats(newStats);
    } catch (error) {
      console.error('Failed to get asset stats:', error);
    }
  }, []);

  return {
    isInitialized,
    isUpdating,
    updateProgress,
    stats,
    getAsset,
    getAssetPath,
    updateAssets,
    shouldUpdate,
    refreshStats,
  };
}

/**
 * Hook for loading a specific character asset
 */
export function useCharacterAsset(characterName: string) {
  const { getAssetPath } = useAssets();
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAsset = async () => {
      setIsLoading(true);
      const path = await getAssetPath('character', characterName);
      
      if (!cancelled) {
        if (path) {
          // Convert local path to asset URL for Tauri
          setAssetUrl(`asset://localhost/${path}`);
        }
        setIsLoading(false);
      }
    };

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [characterName, getAssetPath]);

  return { assetUrl, isLoading };
}

/**
 * Hook for loading a specific weapon asset
 */
export function useWeaponAsset(weaponName: string) {
  const { getAssetPath } = useAssets();
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAsset = async () => {
      setIsLoading(true);
      const path = await getAssetPath('weapon', weaponName);
      
      if (!cancelled) {
        if (path) {
          setAssetUrl(`asset://localhost/${path}`);
        }
        setIsLoading(false);
      }
    };

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [weaponName, getAssetPath]);

  return { assetUrl, isLoading };
}