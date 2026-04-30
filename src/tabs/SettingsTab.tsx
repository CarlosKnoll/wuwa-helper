import { Database, RefreshCw, Download } from 'lucide-react';
import { safeInvoke } from '../utils';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

type SyncState = 'idle' | 'syncing' | 'up_to_date' | 'updated' | 'error';

export default function SettingsTab() {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const filePath = await save({
        filters: [{ name: 'Database', extensions: ['db'] }],
        defaultPath: 'wuwa_backup.db',
        title: 'Export Database',
      });
      if (filePath) {
        const result = await safeInvoke('export_database', { destPath: filePath });
        alert(result);
      }
    } catch (err) {
      alert('Export failed: ' + err);
    }
  };

  const handleImport = async () => {
    try {
      const filePath = await open({
        filters: [{ name: 'Database', extensions: ['db'] }],
        multiple: false,
        directory: false,
        title: 'Import Database',
      });
      if (filePath) {
        const result = await safeInvoke('import_database', { sourcePath: filePath });
        alert(result);
      }
    } catch (err) {
      alert('Import failed: ' + err);
    }
  };

  const handleSyncAssets = async () => {
    if (syncState === 'syncing') return;
    setSyncState('syncing');
    setSyncMessage(null);
    try {
      const result = await safeInvoke('sync_assets') as string;
      // The Rust command returns a status string we can inspect
      const wasUpdated = result.toLowerCase().includes('updated') || result.toLowerCase().includes('installed');
      setSyncState(wasUpdated ? 'updated' : 'up_to_date');
      setSyncMessage(result);
    } catch (err) {
      setSyncState('error');
      setSyncMessage(String(err));
    }
  };

  const syncLabel: Record<SyncState, string> = {
    idle:       'Check for Asset Updates',
    syncing:    'Syncing...',
    up_to_date: 'Assets are up to date',
    updated:    'Assets updated!',
    error:      'Sync failed — retry',
  };

  const syncButtonStyle: Record<SyncState, string> = {
    idle:       'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500',
    syncing:    'bg-slate-600 cursor-not-allowed',
    up_to_date: 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600',
    updated:    'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600',
    error:      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Database Management */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-yellow-400" />
          Database Management
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" />
            Export Database
          </button>
          <button
            onClick={handleImport}
            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" />
            Import Database
          </button>
        </div>
      </div>

      {/* Asset Sync */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Download className="w-6 h-6 text-yellow-400" />
          Asset Updates
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Fetch the latest character, weapon, echo, and exploration assets from the remote repository.
            The app checks automatically on launch — use this to force a manual sync.
          </p>
          <button
            onClick={handleSyncAssets}
            disabled={syncState === 'syncing'}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${syncButtonStyle[syncState]}`}
          >
            <RefreshCw className={`w-5 h-5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
            {syncLabel[syncState]}
          </button>
          {syncMessage && (
            <p className={`text-xs mt-1 ${syncState === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
              {syncMessage}
            </p>
          )}
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <h3 className="text-xl font-bold mb-2">About</h3>
        <p className="text-slate-400">Wuthering Waves Assistant v1.2.0</p>
        <p className="text-sm text-slate-500 mt-2">A comprehensive tool for managing your Wuthering Waves game data</p>
      </div>
    </div>
  );
}