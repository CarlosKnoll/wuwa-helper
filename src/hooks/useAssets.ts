// src/hooks/useAssets.ts
/**
 * React hook for managing Wuthering Waves assets
 * Provides methods to fetch and display assets from local cache
 */

import { invoke } from '@tauri-apps/api/core'; // Tauri v2
import { useState, useEffect, useCallback } from 'react';

export type AssetType = 'characters' | 'weapon' | 'echo' | 'element' | 'exploration' | 'misc' ;

export function useAssets() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize assets on mount
  useEffect(() => {
    initAssets();
  }, []);

  const initAssets = async () => {
    setIsInitialized(true);
  };

  const getAsset = useCallback(async (
    assetType: AssetType,
    name: string,
    weaponType?: string
  ): Promise<string | null> => {
    try {
      const base64 = await invoke<string>('get_asset', {
        assetType,
        name,
        weaponType: weaponType || null,
      });
      return base64;
    } catch (error) {
      console.error(`Failed to get asset ${assetType}/${name}:`, error);
      return null;
    }
  }, []);

  const getAssetPath = useCallback(async (
    assetType: AssetType,
    name: string,
    weaponType?: string
  ): Promise<string | null> => {
    try {
      const path = await invoke<string>('get_asset_path', {
        assetType,
        name,
        weaponType: weaponType || null,
      });
      return path;
    } catch (error) {
      console.error(`Failed to get asset path ${assetType}/${name}:`, error);
      return null;
    }
  }, []);

  return {
    isInitialized,
    getAsset,
    getAssetPath,
  };
}