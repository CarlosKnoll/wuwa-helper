import { useState, useEffect } from 'react';
import { Download, Upload, FileText, Filter, Calendar, Star, Copy, Check, Play } from 'lucide-react';
import { PityStatus, PullHistory, WuwaTrackerExport } from '../types';
import { safeInvoke, formatBannerType } from '../utils';
import { PullHistoryItem } from '../components/PullHistoryItem';
import { FiveStarHistory } from '../components/FiveStarHistory';
import { open, Command } from '@tauri-apps/plugin-shell';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

// Standard pool items (if pulled on featured banner, next 5-star is guaranteed)
const STANDARD_CHARACTERS = ['Calcharo', 'Encore', 'Jianxin', 'Lingyang', 'Verina'];
const STANDARD_WEAPONS = [
  'Abyss Surges',
  'Boson Astrolabe',
  'Cosmic Ripples',
  'Emerald of Genesis',
  'Laser Shearer',
  'Lustrous Razor',
  'Phasic Homogenizer',
  'Pulsation Bracer',
  'Radiance Cleaver',
  'Static Mist'
];

export default function PityTab({ pityStatus, onUpdate }: { pityStatus: PityStatus[]; onUpdate: () => void }) {
  // Pull History States
  const [pullHistory, setPullHistory] = useState<PullHistory[]>([]);
  const [selectedBanner, setSelectedBanner] = useState('featuredCharacter');
  const [showImportExport, setShowImportExport] = useState(false);
  const [conveneUrl, setConveneUrl] = useState('');
  
  // Loading states
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isSuccessFadingOut, setIsSuccessFadingOut] = useState(false); 
  
  // Clean import option
  const [cleanImport, setCleanImport] = useState(false);
  
  // Instructions expansion
  const [showUrlInstructions, setShowUrlInstructions] = useState(false);
  
  // Copy button state
  const [isCopied, setIsCopied] = useState(false);
  
  // PowerShell execution state
  const [isPowerShellRunning, setIsPowerShellRunning] = useState(false);
  
  // Filter states - changed to arrays for multiple selection
  const [rarityFilters, setRarityFilters] = useState<number[]>([]);
  const [itemTypeFilters, setItemTypeFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');

  useEffect(() => {
    loadPullHistory();
  }, []);

  const loadPullHistory = async () => {
    try {
      const data = await safeInvoke('get_pull_history') as PullHistory[];
      setPullHistory(data);
    } catch (err) {
      console.error('Failed to load pull history:', err);
      setPullHistory([]);
    }
  };

  const handleCopyPowerShellScript = async () => {
    const script = 'iwr -UseBasicParsing -Headers @{"User-Agent"="Mozilla/5.0"} https://raw.githubusercontent.com/wuwatracker/wuwatracker/refs/heads/main/import.ps1 | iex';
    try {
      await navigator.clipboard.writeText(script);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy script:', err);
      alert('Failed to copy script to clipboard');
    }
  };

  const handleAutoRunPowerShell = async () => {
    const script = '$ProgressPreference = "SilentlyContinue"; iwr -UseBasicParsing -Headers @{"User-Agent"="Mozilla/5.0"} https://raw.githubusercontent.com/wuwatracker/wuwatracker/refs/heads/main/import.ps1 | iex';
    
    setIsPowerShellRunning(true);
    
    try {
      const command = Command.create('powershell', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command', 
        script
      ]);
      
      const output = await command.execute();
      
      if (output.code === 0) {
        // Try to get URL from clipboard
        try {
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && clipboardText.includes('aki-game')) {
            setConveneUrl(clipboardText);
            alert('PowerShell script executed successfully! The URL has been automatically populated. Click "Import" to continue.');
          } else {
            alert('PowerShell script executed. Please paste the URL from your clipboard if it was copied.');
          }
        } catch (clipErr) {
          alert('PowerShell script executed. Please paste the URL manually (it should be in your clipboard).');
        }
      } else {
        alert(`PowerShell script failed with exit code ${output.code}. Please try copying the script manually.`);
      }
    } catch (err) {
      console.error('Failed to run PowerShell:', err);
      alert('Failed to run PowerShell command. Please copy and run the script manually.');
    } finally {
      setIsPowerShellRunning(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!conveneUrl.trim()) {
      alert('Please enter a Convene History URL');
      return;
    }

    setIsImportingUrl(true);
    setImportProgress('Validating URL...');
    setImportSuccess(''); // Clear any previous success message

    try {
      const url = new URL(conveneUrl);
      const params = new URLSearchParams(url.hash.substring(url.hash.indexOf('?')));
      
      const serverId = params.get('svr_id');
      const playerId = params.get('player_id');
      const recordId = params.get('record_id');
      
      if (!serverId || !playerId || !recordId) {
        alert('Invalid Convene History URL. Please make sure you copied the complete URL from the game.');
        setIsImportingUrl(false);
        setImportProgress('');
        return;
      }

      // IMPROVED: Clean import for URL method
      if (cleanImport) {
        const existingPulls = await safeInvoke('get_pull_history') as PullHistory[];
        const totalPulls = existingPulls.length;
        
        if (totalPulls > 0) {
          setImportProgress(`Clearing existing convene history... (0/${totalPulls})`);
          
          for (let i = 0; i < existingPulls.length; i++) {
            await safeInvoke('delete_pull', { id: existingPulls[i].id });
            
            // Update progress every 10 deletes or on the last one
            if ((i + 1) % 10 === 0 || i === existingPulls.length - 1) {
              setImportProgress(`Clearing existing convene history... (${i + 1}/${totalPulls})`);
            }
          }
        }
      }

      setImportProgress('Fetching convene history from game servers...');

      const result = await safeInvoke('import_pulls_from_url', {
        url: conveneUrl
      }) as string;

      // IMPROVED: Show success message instead of alert
      setImportSuccess(result || 'Successfully imported convene history from game!');
      await loadPullHistory();
      if (onUpdate) onUpdate();
      setConveneUrl('');
      setCleanImport(false); // Reset clean import checkbox
      
      setTimeout(() => setIsSuccessFadingOut(true), 5000);  // Start fade at 5s
      setTimeout(() => {
        setImportSuccess('');
        setIsSuccessFadingOut(false);
      }, 8000);
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import from URL: ' + err);
    } finally {
      setIsImportingUrl(false);
      setImportProgress('');
    }
  };

  const handleExportToJson = async () => {
    try {
      const pulls = await safeInvoke('get_pull_history') as PullHistory[];
      
      const { exportToWuwaTrackerFormat } = await import('../utils');
      const exportData = exportToWuwaTrackerFormat(pulls, 'user');

      // FIXED: Use Tauri's save dialog to let user choose save location
      const filePath = await save({
        defaultPath: `wuwatracker-pulls-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (filePath) {
        // Write file to selected location
        await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
        alert('Export successful!');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export: ' + err);
    }
  };

  const handleImportFromJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingJson(true);
    setImportProgress('Reading JSON file...');
    setImportSuccess(''); // Clear any previous success message

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const { importFromWuwaTrackerFormat } = await import('../utils');
      
      if (data.version && data.pulls && Array.isArray(data.pulls)) {
        // Clean import: delete all existing pulls first
        if (cleanImport) {
          const existingPulls = await safeInvoke('get_pull_history') as PullHistory[];
          const totalPulls = existingPulls.length;
          
          if (totalPulls > 0) {
            setImportProgress(`Clearing existing convene history... (0/${totalPulls})`);
            
            for (let i = 0; i < existingPulls.length; i++) {
              await safeInvoke('delete_pull', { id: existingPulls[i].id });
              
              // Update progress every 10 deletes or on the last one
              if ((i + 1) % 10 === 0 || i === existingPulls.length - 1) {
                setImportProgress(`Clearing existing convene history... (${i + 1}/${totalPulls})`);
              }
            }
          }
        }

        setImportProgress(`Processing ${data.pulls.length} convenes...`);
        const pullsByBanner = importFromWuwaTrackerFormat(data);
        
        let totalImported = 0;
        let processedCount = 0;
        const totalPulls = Array.from(pullsByBanner.values()).reduce((sum, pulls) => sum + pulls.length, 0);
        
        for (const [banner, pulls] of pullsByBanner) {
          for (const pull of pulls) {
            processedCount++;
            setImportProgress(`Importing convenes... (${processedCount}/${totalPulls})`);
            
            const exists = await safeInvoke('check_pull_exists', {
              bannerType: banner,
              itemName: pull.item_name,
              pullDate: pull.pull_date,
              groupOrder: pull.group_order,
            }) as boolean;

            if (!exists) {
              await safeInvoke('add_pull', {
                bannerType: banner,
                itemName: pull.item_name,
                rarity: pull.rarity,
                itemType: pull.item_type,
                isGuaranteed: pull.is_guaranteed,
                pullDate: pull.pull_date,
                notes: pull.notes,
                groupOrder: pull.group_order,
              });
              totalImported++;
            }
          }
        }

        // IMPROVED: Show success message instead of alert
        setImportSuccess(`Successfully imported ${totalImported} new convenes (${processedCount} total in file)`);
        await loadPullHistory();
        if (onUpdate) onUpdate();
        setCleanImport(false); // Reset clean import checkbox
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setIsSuccessFadingOut(true), 5000);  // Start fade at 5s
        setTimeout(() => {
          setImportSuccess('');
          setIsSuccessFadingOut(false);
        }, 8000);
      } else {
        alert('Invalid JSON format. Please use a valid WuwaTracker export file.');
      }
    } catch (err) {
      alert('Failed to import JSON: ' + err);
    } finally {
      setIsImportingJson(false);
      setImportProgress('');
      // Reset file input
      event.target.value = '';
    }
  };

  // Filter pulls
  const getFilteredPulls = () => {
    let filtered = pullHistory.filter(p => p.banner_type === selectedBanner);

    // Rarity filters - check if pull's rarity is in the selected array
    if (rarityFilters.length > 0) {
      filtered = filtered.filter(p => rarityFilters.includes(p.rarity));
    }

    // Item type filters - check if pull's type is in the selected array
    if (itemTypeFilters.length > 0) {
      filtered = filtered.filter(p => itemTypeFilters.includes(p.item_type));
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.pull_date) >= cutoffDate);
    }

    return filtered;
  };

  const filteredPulls = getFilteredPulls();

  // Toggle functions for multi-select filters
  const toggleRarityFilter = (rarity: number) => {
    setRarityFilters(prev => 
      prev.includes(rarity)
        ? prev.filter(r => r !== rarity)
        : [...prev, rarity]
    );
  };

  const toggleItemTypeFilter = (type: string) => {
    setItemTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Helper function to check if an item is from standard pool
  const isStandardItem = (itemName: string, itemType: string) => {
    if (itemType === 'character') {
      return STANDARD_CHARACTERS.includes(itemName);
    } else {
      return STANDARD_WEAPONS.includes(itemName);
    }
  };

  // IMPROVED: Helper function to determine if next pull is guaranteed
    const isNextGuaranteed = (bannerType: string) => {
    if (bannerType !== 'featuredCharacter' && bannerType !== 'featuredWeapon') {
      return false; // Standard banners don't have guarantee system
    }

    // Find the last 5-star pull for this banner using pull_number (correct chronological order)
    const fiveStarPulls = pullHistory
      .filter(p => p.banner_type === bannerType && p.rarity === 5)
      .sort((a, b) => new Date(b.pull_date).getTime() - new Date(a.pull_date).getTime());

    if (fiveStarPulls.length === 0) {
      return false; // No 5-stars yet, so it's 50/50
    }

    const lastFiveStar = fiveStarPulls[0];
    return isStandardItem(lastFiveStar.item_name, lastFiveStar.item_type);
  };

  const getRarityColor = (rarity: number) => {
    if (rarity === 5) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    if (rarity === 4) return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  const getRarityBadge = (rarity: number) => {
    if (rarity === 5) return 'bg-yellow-500/20 text-yellow-400';
    if (rarity === 4) return 'bg-purple-500/20 text-purple-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  // Calculate stats for selected banner
  const bannerPulls = pullHistory.filter(p => p.banner_type === selectedBanner);


  // Calculate all-time stats across all banners
  const allTimeFiveStarCount = pullHistory.filter(p => p.rarity === 5).length;
  const allTimeFourStarCount = pullHistory.filter(p => p.rarity === 4).length;
  const allTimeThreeStarCount = pullHistory.filter(p => p.rarity === 3).length;

  return (
    <div className="space-y-6">
      {/* All-Time Pull Statistics - Now on Top */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-200/20 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <h2 className="text-xl font-bold mb-4">All-Time Convene Statistics</h2>
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{allTimeFiveStarCount}</div>
            <div className="text-sm text-slate-400">5-Star Convenes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{allTimeFourStarCount}</div>
            <div className="text-sm text-slate-400">4-Star Convenes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{allTimeThreeStarCount}</div>
            <div className="text-sm text-slate-400">3-Star Convenes</div>
          </div>
        </div>
        <div className="mt-4 text-center font-bold text-white-400 text-sm">
          Total Convenes: {pullHistory.length}
        </div>
      </div>

      {/* Pull History Section */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-200/20 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Convenes History</h2>
          <button
            onClick={() => setShowImportExport(!showImportExport)}
            className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Import/Export
          </button>
        </div>

        {/* Import/Export Panel */}
        {showImportExport && (
          <div className="bg-slate-800/50 rounded-lg p-4 mb-4 space-y-4">
            {/* IMPROVED: Success Message */}
            {importSuccess && (
              <div 
                className={`bg-green-900/30 border border-green-500/50 rounded-lg p-3 transition-opacity duration-[3000ms] ${
                  isSuccessFadingOut ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-green-400">✓</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-400">Import Successful!</div>
                    <div className="text-xs text-slate-300">{importSuccess}</div>
                  </div>
                </div>
              </div>
            )}

            {/* IMPROVED: Loading Progress - now shows for both URL and JSON */}
            {(isImportingUrl || isImportingJson) && (
              <div className="bg-amber-900/30 border border-yellow-500/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-400">Importing...</div>
                    <div className="text-xs text-slate-400">{importProgress}</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-yellow-500 h-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold mb-2">Import from Game</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={conveneUrl}
                  onChange={e => setConveneUrl(e.target.value)}
                  disabled={isImportingUrl || isImportingJson}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm disabled:opacity-50"
                  placeholder="Paste your Convene History URL here..."
                />
                <button
                  onClick={handleImportFromUrl}
                  disabled={isImportingUrl || isImportingJson}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              </div>
              <button
                onClick={() => setShowUrlInstructions(!showUrlInstructions)}
                className="text-xs text-yellow-400 hover:underline mt-1 inline-block cursor-pointer"
              >
                {showUrlInstructions ? '▼' : '▶'} How to get your Convene URL
              </button>
              
              {showUrlInstructions && (
                <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-300 space-y-2 border border-slate-700">
                  <p className="font-semibold text-white">1. First, launch the game and open your in-game history details.</p>
                  <p className="font-semibold text-white">2. Afterwards, click the auto-run button.</p>
                  <p>or open Windows PowerShell, paste the following script and paste the copied URL above</p>
                  <div className="relative">
                    <code className="block bg-slate-900/80 p-2 pr-10 rounded text-yellow-400 font-mono text-[11px] overflow-x-auto">
                      {'iwr -UseBasicParsing -Headers @{"User-Agent"="Mozilla/5.0"} https://raw.githubusercontent.com/wuwatracker/wuwatracker/refs/heads/main/import.ps1 | iex'}
                    </code>
                    <button
                      onClick={handleCopyPowerShellScript}
                      className="absolute top-1 right-1 p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded transition-colors"
                      title="Copy script to clipboard"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleAutoRunPowerShell}
                    disabled={isPowerShellRunning}
                    className="w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg disabled:bg-yellow-800 disabled:cursor-not-allowed rounded text-white transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    {isPowerShellRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Auto-run PowerShell
                      </>
                    )}
                  </button>
                  <p className="text-slate-400 italic">
                    NOTE: The script only reads your game logs to extract your Convene History URL. You can{' '}
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); open('https://github.com/wuwatracker/wuwatracker/blob/main/import.ps1'); }}
                      className="text-yellow-400 hover:underline"
                    >
                      view the script here
                    </a>.
                  </p>
                  <p className="font-semibold text-white">2. Press the "Import" button</p>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={cleanImport}
                onChange={e => setCleanImport(e.target.checked)}
                disabled={isImportingUrl || isImportingJson}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900 disabled:opacity-50"
              />
              <span className={cleanImport ? 'text-red-400 font-medium' : 'text-slate-400'}>
                Clean Import (⚠️ deletes all existing convenes first)
              </span>
            </label>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-bold mb-2">Import/Export JSON</h3>

              <div className="flex gap-2">
                <label className={`flex-1 px-4 py-2 rounded-lg text-sm text-center transition-colors flex items-center justify-center ${
                  isImportingUrl || isImportingJson 
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 opacity-50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 cursor-pointer'
                }`}>
                  <Upload className="w-4 h-4 inline mr-2" />
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFromJson}
                    disabled={isImportingUrl || isImportingJson}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportToJson}
                  disabled={isImportingUrl || isImportingJson}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {['featuredCharacter', 'featuredWeapon', 'standardCharacter', 'standardWeapon'].map(banner => (
            <button
              key={banner}
              onClick={() => setSelectedBanner(banner)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedBanner === banner
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {formatBannerType(banner)}
            </button>
          ))}
        </div>

        {/* Current Pity Status for Selected Banner */}
        {(() => {
          const currentPity = pityStatus.find(p => p.banner_type === selectedBanner);
          if (!currentPity) return null;

          const isFeatured = selectedBanner === 'featuredCharacter' || selectedBanner === 'featuredWeapon';
          const nextIsGuaranteed = isNextGuaranteed(selectedBanner);
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Current Pity Card */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 uppercase tracking-wide mb-3 flex items-center justify-between">
                  <span>Current Pity</span>
                  {selectedBanner === 'featuredCharacter' && (
                    <div className={`px-2 py-1 rounded text-xs font-medium ${nextIsGuaranteed ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {nextIsGuaranteed ? '✓ Guaranteed' : '50/50'}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* 5-Star Pity */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-yellow-400">{currentPity.current_pity_5star}</span>
                      <span className="text-sm text-slate-400">/ 80</span>
                    </div>

                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mb-1">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all duration-300" 
                        style={{ width: `${(currentPity.current_pity_5star / 80) * 100}%` }}
                      />
                    </div>
                    
                    <div className="text-xs text-slate-500">5-Star Pity</div>
                  </div>

                  {/* 4-Star Pity */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-purple-400">{currentPity.current_pity_4star}</span>
                      <span className="text-sm text-slate-400">/ 10</span>
                    </div>

                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mb-1">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300" 
                        style={{ width: `${(currentPity.current_pity_4star / 10) * 100}%` }}
                      />
                    </div>
                    
                    <div className="text-xs text-slate-500">4-Star Pity</div>
                  </div>
                </div>
              </div>

              {/* 5-Star Pull History */}
              <FiveStarHistory 
                pulls={pullHistory}
                selectedBanner={selectedBanner}
              />
            </div>
          );
        })()}

        {/* Filters */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Filters</span>
            {(rarityFilters.length > 0 || itemTypeFilters.length > 0 || dateRange !== 'all') && (
              <button
                onClick={() => {
                  setRarityFilters([]);
                  setItemTypeFilters([]);
                  setDateRange('all');
                }}
                className="ml-auto text-xs text-yellow-400 hover:text-yellow-300"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rarity Filters */}
            <div>
              <div className="text-xs text-slate-400 mb-2 font-medium">Rarity</div>
              <div className="space-y-2">
                {[5, 4, 3].map(rarity => (
                  <label key={rarity} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rarityFilters.includes(rarity)}
                      onChange={() => toggleRarityFilter(rarity)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {'★'.repeat(rarity)} ({rarity}-Star)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item Type Filters */}
            <div>
              <div className="text-xs text-slate-400 mb-2 font-medium">Type</div>
              <div className="space-y-2">
                {['character', 'weapon'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={itemTypeFilters.includes(type)}
                      onChange={() => toggleItemTypeFilter(type)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors capitalize">
                      {type}s
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <div className="text-xs text-slate-400 mb-2 font-medium">Date Range</div>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value as any)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-400">
            Showing {filteredPulls.length} of {bannerPulls.length} convenes
          </div>
        </div>

        {/* Pull List */}
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {filteredPulls.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No convenes recorded for this banner yet.
              {(rarityFilters.length > 0 || itemTypeFilters.length > 0 || dateRange !== 'all') && (
                <div className="mt-2 text-sm">Try adjusting your filters.</div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPulls.map(pull => (
                <PullHistoryItem
                  key={pull.id}
                  pull={pull}
                  selectedBanner={selectedBanner}
                  isStandardItem={isStandardItem}
                  getRarityColor={getRarityColor}
                  getRarityBadge={getRarityBadge}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}