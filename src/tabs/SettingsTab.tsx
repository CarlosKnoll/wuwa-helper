import { Database } from 'lucide-react';
import { safeInvoke } from '../utils';
import { save, open } from '@tauri-apps/plugin-dialog';

export default function SettingsTab() {
  const handleExport = async () => {
    try {
      // Open save dialog to let user choose export location
      const filePath = await save({
        filters: [{
          name: 'Database',
          extensions: ['db']
        }],
        defaultPath: 'wuwa_backup.db',
        title: 'Export Database'
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
      // Open file dialog to let user choose database file to import
      const filePath = await open({
        filters: [{
          name: 'Database',
          extensions: ['db']
        }],
        multiple: false,
        directory: false,
        title: 'Import Database'
      });

      if (filePath) {
        const result = await safeInvoke('import_database', { sourcePath: filePath });
        alert(result);
      }
    } catch (err) {
      alert('Import failed: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" />
          Database Management
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" />
            Export Database
          </button>
          <button
            onClick={handleImport}
            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" />
            Import Database
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-2">About</h3>
        <p className="text-slate-400">Wuthering Waves Assistant v0.2.0</p>
        <p className="text-sm text-slate-500 mt-2">A comprehensive tool for managing your Wuthering Waves game data</p>
      </div>
    </div>
  );
}