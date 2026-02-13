import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Trophy, Zap, Users, RotateCcw, Edit2, Save, X } from 'lucide-react';
import { safeInvoke } from '../utils';
import { 
  TowerOfAdversity, 
  TowerDetails,
  TowerFloor,
  TowerAreaEffect, 
  TowerTeam, 
  WhimperingWastes, 
  TorrentsStage, 
  TroopMatrix, 
  MatrixTeam 
} from '../types';
import TowerDetailsView from '../components/TowerDetailsView';
import WhimperingWastesDetailsView from '../components/WhimperingWastesDetailsView';
import TroopMatrixDetailsView from '../components/TroopMatrixDetailsView';
import ConfirmDialog from '../components/ConfirmDialog';
import { CurrencyIcon } from '../components/CurrencyIcon';

type EndgameMode = 'tower' | 'wastes' | 'matrix' | null;

export interface EndgameTabRef {
  refresh: () => Promise<void>;
}

const EndgameTab = forwardRef<EndgameTabRef>((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<EndgameMode>(null);
  const [showResetDialog, setShowResetDialog] = useState<{mode: string, name: string} | null>(null);
  const [resetting, setResetting] = useState(false);

  // Inline last-reset editing per card
  const [editingLastReset, setEditingLastReset] = useState<'tower' | 'wastes' | 'matrix' | null>(null);
  const [editLastResetValue, setEditLastResetValue] = useState('');

  // Tower of Adversity State
  const [towerInfo, setTowerInfo] = useState<TowerOfAdversity | null>(null);
  const [towerDetails, setTowerDetails] = useState<TowerDetails[]>([]);
  const [towerFloors, setTowerFloors] = useState<Record<string, TowerFloor[]>>({});
  const [towerEffects, setTowerEffects] = useState<TowerAreaEffect[]>([]);
  const [towerTeams, setTowerTeams] = useState<TowerTeam[]>([]);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);

  // Whimpering Wastes State
  const [wastesInfo, setWastesInfo] = useState<WhimperingWastes | null>(null);
  const [torrentsStages, setTorrentsStages] = useState<TorrentsStage[]>([]);

  // Troop Matrix State
  const [troopMatrix, setTroopMatrix] = useState<TroopMatrix | null>(null);
  const [matrixTeams, setMatrixTeams] = useState<MatrixTeam[]>([]);

  // Available characters for vigor dropdowns
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
  const [healerCharacters, setHealerCharacters] = useState<string[]>([]);

  useEffect(() => {
    loadAllEndgameData();
  }, []);

  // Expose refresh method to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadAllEndgameData();
    }
  }));

  const loadAllEndgameData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        safeInvoke('get_tower_of_adversity'),
        safeInvoke('get_tower_details'),
        safeInvoke('get_tower_area_effects'),
        safeInvoke('get_tower_teams'),
        safeInvoke('get_whimpering_wastes'),
        safeInvoke('get_torrents_stages'),
        safeInvoke('get_troop_matrix'),
        safeInvoke('get_matrix_teams')
      ]);

      if (results[0].status === 'fulfilled') setTowerInfo(results[0].value as TowerOfAdversity);
      if (results[1].status === 'fulfilled') setTowerDetails(results[1].value as TowerDetails[]);
      if (results[2].status === 'fulfilled') setTowerEffects(results[2].value as TowerAreaEffect[]);
      if (results[3].status === 'fulfilled') setTowerTeams(results[3].value as TowerTeam[]);
      if (results[4].status === 'fulfilled') setWastesInfo(results[4].value as WhimperingWastes);
      if (results[5].status === 'fulfilled') setTorrentsStages(results[5].value as TorrentsStage[]);
      if (results[6].status === 'fulfilled') setTroopMatrix(results[6].value as TroopMatrix);
      if (results[7].status === 'fulfilled') setMatrixTeams(results[7].value as MatrixTeam[]);

      // Load owned character names and healer list for vigor dropdowns
      try {
        const [allChars, healers] = await Promise.all([
          safeInvoke('get_all_characters') as Promise<{ character_name: string }[]>,
          safeInvoke('get_healer_characters') as Promise<string[]>,
        ]);
        setAvailableCharacters(allChars.map(c => c.character_name).sort());
        setHealerCharacters(healers);
      } catch {
        // non-fatal: dropdowns will just be empty
      }

      // Load floor data for each tower type
      await loadTowerFloors();

    } catch (error) {
      console.error('Failed to load endgame data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTowerFloors = async () => {
    const towerTypes = ['echoing', 'resonant', 'hazard'];
    const floorResults = await Promise.allSettled(
      towerTypes.map(type => safeInvoke('get_tower_floors', { towerType: type }))
    );

    const newFloors: Record<string, TowerFloor[]> = {};
    floorResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        newFloors[towerTypes[index]] = result.value as TowerFloor[];
      } else {
        console.error(`Failed to load floors for ${towerTypes[index]}:`, result.reason);
      }
    });
    setTowerFloors(newFloors);
  };

  const handleResetConfirm = async () => {
    if (!showResetDialog) return;

    setResetting(true);
    try {
      const { mode } = showResetDialog;
      
      if (mode === 'tower') {
        await safeInvoke('reset_tower_of_adversity');
      } else if (mode === 'wastes') {
        await safeInvoke('reset_whimpering_wastes');
      } else if (mode === 'matrix') {
        await safeInvoke('reset_troop_matrix');
      }

      setShowResetDialog(null);
      await loadAllEndgameData();
    } catch (error) {
      console.error('Failed to reset endgame mode:', error);
      alert('Failed to reset: ' + error);
    } finally {
      setResetting(false);
    }
  };

  const openResetDialog = (mode: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowResetDialog({ mode, name });
  };

  const initializeTowerFloors = async () => {
    try {
      const result = await safeInvoke('initialize_tower_floors');
      alert(result);
      await loadTowerFloors();
    } catch (error) {
      console.error('Failed to initialize floors:', error);
      alert('Failed to initialize floors: ' + error);
    }
  };

  const calculateTowerCompletion = () => {
    if (!towerInfo) return { earned: 0, max: 800, percentage: 0 };
    const max = 800;
    return {
      earned: towerInfo.astrite_earned,
      max,
      percentage: (towerInfo.astrite_earned / max) * 100
    };
  };

  const calculateWastesCompletion = () => {
    if (!wastesInfo) return { earned: 0, max: 800, percentage: 0 };
    const max = 800;
    const earned = wastesInfo.chasm_astrite + wastesInfo.torrents_astrite;
    return {
      earned,
      max,
      percentage: (earned / max) * 100
    };
  };

  const calculateMatrixCompletion = () => {
    if (!troopMatrix) return { earned: 0, max: 400, percentage: 0 };
    const max = 400;
    const earned = troopMatrix.stability_accords_astrite + troopMatrix.singularity_expansion_astrite;
    return {
      earned,
      max,
      percentage: (earned / max) * 100
    };
  };

  const handleModeClick = (mode: EndgameMode) => {
    setSelectedMode(selectedMode === mode ? null : mode);
  };

  const startEditLastReset = (mode: 'tower' | 'wastes' | 'matrix', currentDate: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLastReset(mode);
    setEditLastResetValue(currentDate);
  };

  const saveLastReset = async (mode: 'tower' | 'wastes' | 'matrix', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (mode === 'tower') {
        await safeInvoke('update_tower_last_reset', { lastReset: editLastResetValue });
      } else if (mode === 'wastes') {
        await safeInvoke('update_wastes_last_reset', { lastReset: editLastResetValue });
      } else if (mode === 'matrix') {
        await safeInvoke('update_matrix_last_reset', { lastReset: editLastResetValue });
      }
      setEditingLastReset(null);
      await loadAllEndgameData();
    } catch (error) {
      console.error('Failed to update last reset:', error);
      alert('Failed to update last reset');
    }
  };

  const towerCompletion = calculateTowerCompletion();
  const wastesCompletion = calculateWastesCompletion();
  const matrixCompletion = calculateMatrixCompletion();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-400">Loading endgame data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={showResetDialog !== null}
        title={`Reset ${showResetDialog?.name}?`}
        message="This will reset all progress and teams for this mode. This action cannot be undone."
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetDialog(null)}
        confirmText="Reset"
        cancelText="Cancel"
        isDestructive
        isLoading={resetting}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tower of Adversity Card */}
        <div
          onClick={() => handleModeClick('tower')}
          className={`bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 transition-all relative overflow-hidden cursor-pointer shadow-[0_0_12px_rgba(226,232,240,0.08)] ${
            selectedMode === 'tower'
              ? 'border-white shadow-lg shadow-white/20'
              : 'border-white/30 hover:border-white/60'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-8 h-8 text-blue-400" />
              {towerInfo && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => startEditLastReset('tower', towerInfo.last_reset, e)}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors group"
                    title="Edit last reset date"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                  </button>
                  <button
                    onClick={(e) => openResetDialog('tower', 'Tower of Adversity', e)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                    title="Reset tower progress"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-bold text-xl mb-2">Tower of Adversity</h3>
            {towerInfo && (
              <>
                <div className="mb-3" >
                  {editingLastReset === 'tower' ? (
                    <div className="flex items-center gap-2">
                      <input onClick={(e) => e.stopPropagation()}
                        type="date"
                        value={editLastResetValue}
                        onChange={(e) => setEditLastResetValue(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-white/60"
                        autoFocus
                      />
                      <button onClick={(e) => saveLastReset('tower', e)} className="p-1 hover:bg-green-500/20 rounded transition-colors text-green-400" title="Save"><Save className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingLastReset(null); }} className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-400" title="Cancel"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">
                      Last Reset: {towerInfo.last_reset}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Astrite Earned:</span>
                    <span className="font-semibold text-yellow-400 flex items-center gap-1">
                      <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                      {towerCompletion.earned} / {towerCompletion.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all duration-300"
                      style={{ width: `${towerCompletion.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-right">
                    {towerCompletion.percentage.toFixed(1)}% Complete
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Whimpering Wastes Card */}
        <div
          onClick={() => handleModeClick('wastes')}
          className={`bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 transition-all relative overflow-hidden cursor-pointer shadow-[0_0_12px_rgba(226,232,240,0.08)] ${
            selectedMode === 'wastes'
              ? 'border-white shadow-lg shadow-white/20'
              : 'border-white/30 hover:border-white/60'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-8 h-8 text-purple-400" />
              {wastesInfo && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => startEditLastReset('wastes', wastesInfo.last_reset, e)}
                    className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group"
                    title="Edit last reset date"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                  </button>
                  <button
                    onClick={(e) => openResetDialog('wastes', 'Whimpering Wastes', e)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                    title="Reset wastes progress"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-bold text-xl mb-2">Whimpering Wastes</h3>
            {wastesInfo && (
              <>
                <div className="mb-3" >
                  {editingLastReset === 'wastes' ? (
                    <div className="flex items-center gap-2">
                      <input onClick={(e) => e.stopPropagation()}
                        type="date"
                        value={editLastResetValue}
                        onChange={(e) => setEditLastResetValue(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-white/60"
                        autoFocus
                      />
                      <button onClick={(e) => saveLastReset('wastes', e)} className="p-1 hover:bg-green-500/20 rounded transition-colors text-green-400" title="Save"><Save className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingLastReset(null); }} className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-400" title="Cancel"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">
                      Last Reset: {wastesInfo.last_reset}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Astrite Earned:</span>
                    <span className="font-semibold text-yellow-400 flex items-center gap-1">
                      <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                      {wastesCompletion.earned} / {wastesCompletion.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all duration-300"
                      style={{ width: `${wastesCompletion.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-right">
                    {wastesCompletion.percentage.toFixed(1)}% Complete
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Troop Matrix Card */}
        <div
          onClick={() => handleModeClick('matrix')}
          className={`bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 transition-all relative overflow-hidden cursor-pointer shadow-[0_0_12px_rgba(226,232,240,0.08)] ${
            selectedMode === 'matrix'
              ? 'border-white shadow-lg shadow-white/20'
              : 'border-white/30 hover:border-white/60'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8 text-orange-400" />
              {troopMatrix && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => startEditLastReset('matrix', troopMatrix.last_reset, e)}
                    className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors group"
                    title="Edit last reset date"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
                  </button>
                  <button
                    onClick={(e) => openResetDialog('matrix', 'Doubled Pawns Matrix', e)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                    title="Reset matrix progress"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-bold text-xl mb-2">Doubled Pawns Matrix</h3>
            {troopMatrix && (
              <>
                <div className="mb-3" >
                  {editingLastReset === 'matrix' ? (
                    <div className="flex items-center gap-2">
                      <input onClick={(e) => e.stopPropagation()}
                        type="date"
                        value={editLastResetValue}
                        onChange={(e) => setEditLastResetValue(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-white/60"
                        autoFocus
                      />
                      <button onClick={(e) => saveLastReset('matrix', e)} className="p-1 hover:bg-green-500/20 rounded transition-colors text-green-400" title="Save"><Save className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingLastReset(null); }} className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-400" title="Cancel"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">
                      Last Reset: {troopMatrix.last_reset}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Astrite Earned:</span>
                    <span className="font-semibold text-yellow-400 flex items-center gap-1">
                      <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                      {matrixCompletion.earned} / {matrixCompletion.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all duration-300"
                      style={{ width: `${matrixCompletion.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-right">
                    {matrixCompletion.percentage.toFixed(1)}% Complete
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details View */}
      {selectedMode === 'tower' && (
        <TowerDetailsView
          towerInfo={towerInfo}
          towerDetails={towerDetails}
          towerFloors={towerFloors}
          towerEffects={towerEffects}
          towerTeams={towerTeams}
          selectedTower={selectedTower}
          onTowerSelect={setSelectedTower}
          onUpdate={loadAllEndgameData}
          onInitializeFloors={initializeTowerFloors}
          availableCharacters={availableCharacters}
        />
      )}

      {selectedMode === 'wastes' && (
        <WhimperingWastesDetailsView
          wastesInfo={wastesInfo}
          torrentsStages={torrentsStages}
          onUpdate={loadAllEndgameData}
          availableCharacters={availableCharacters}
        />
      )}

      {selectedMode === 'matrix' && (
        <TroopMatrixDetailsView
          troopMatrix={troopMatrix}
          matrixTeams={matrixTeams}
          onUpdate={loadAllEndgameData}
          availableCharacters={availableCharacters}
          healerCharacters={healerCharacters}
        />
      )}
    </div>
  );
});

EndgameTab.displayName = 'EndgameTab';

export default EndgameTab;