// src/components/AssetManager.tsx
/**
 * Asset Manager component for updating and managing game assets
 */

import React, { useEffect, useState } from 'react';
import { useAssets } from '../hooks/useAssets';

export const AssetManager: React.FC = () => {
  const {
    stats,
    isUpdating,
    updateProgress,
    updateAssets,
    shouldUpdate,
    refreshStats,
  } = useAssets();

  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    const needs = await shouldUpdate();
    setNeedsUpdate(needs);
  };

  const handleUpdate = async () => {
    const summary = await updateAssets();
    if (summary) {
      setNeedsUpdate(false);
    }
  };

  const formatLastUpdate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Asset Manager</h2>
        {needsUpdate && (
          <span className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-full">
            Update Available
          </span>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400 text-sm">Total Assets</div>
            <div className="text-white text-2xl font-bold">{stats.total_assets}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400 text-sm">Cache Size</div>
            <div className="text-white text-2xl font-bold">
              {formatSize(stats.cache_size_mb)}
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400 text-sm">Last Update</div>
            <div className="text-white text-sm">
              {formatLastUpdate(stats.last_update)}
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400 text-sm">Status</div>
            <div className="text-white text-sm font-bold">
              {isUpdating ? 'Updating...' : 'Ready'}
            </div>
          </div>
        </div>
      )}

      {/* Update Progress */}
      {isUpdating && updateProgress && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">
              {updateProgress.status === 'complete' 
                ? 'Update Complete!' 
                : `Updating... (${updateProgress.current}/${updateProgress.total})`}
            </span>
            <span className="text-gray-400 text-xs">
              {((updateProgress.current / updateProgress.total) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(updateProgress.current / updateProgress.total) * 100}%`,
              }}
            />
          </div>
          {updateProgress.current_asset && (
            <div className="text-gray-400 text-xs truncate">
              {updateProgress.current_asset}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={`
            flex-1 px-4 py-2 rounded font-medium transition-colors
            ${isUpdating
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : needsUpdate
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {isUpdating ? 'Updating...' : needsUpdate ? 'Update Now' : 'Check for Updates'}
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Detailed Stats */}
      {showDetails && stats && (
        <div className="bg-gray-700 p-3 rounded">
          <h3 className="text-white font-bold mb-2">Assets by Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.assets_by_type).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{type}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;