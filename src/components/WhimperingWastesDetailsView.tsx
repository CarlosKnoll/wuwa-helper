import { useState } from 'react';
import { Zap, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { WhimperingWastes, TorrentsStage } from '../types';
import { safeInvoke, calculateChasmAstrite, calculateTorrentsAstrite } from '../utils';
import CharacterPortrait from './CharacterPortrait';
import { CurrencyIcon } from './CurrencyIcon';

interface WhimperingWastesDetailsViewProps {
  wastesInfo: WhimperingWastes | null;
  torrentsStages: TorrentsStage[];
  onUpdate: () => void;
}

export default function WhimperingWastesDetailsView({
  wastesInfo,
  torrentsStages,
  onUpdate
}: WhimperingWastesDetailsViewProps) {
  const [editing, setEditing] = useState(false);
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [addingStage, setAddingStage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [torrentsCollapsed, setTorrentsCollapsed] = useState(false);

  // Main edit states
  const [editChasmStage, setEditChasmStage] = useState(0);
  const [editChasmPoints, setEditChasmPoints] = useState(0);
  const [editTorrentsPoints, setEditTorrentsPoints] = useState(0);
  const [editLastReset, setEditLastReset] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Stage edit states
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [editToken, setEditToken] = useState('');
  const [editPoints, setEditPoints] = useState(0);
  const [newStageNumber, setNewStageNumber] = useState(1);

  const MAX_TEAMS = 2;
  const canAddTeam = torrentsStages.length < MAX_TEAMS;

  const startEdit = () => {
    if (wastesInfo) {
      setEditChasmStage(wastesInfo.chasm_highest_stage);
      setEditChasmPoints(wastesInfo.chasm_total_points);
      setEditTorrentsPoints(wastesInfo.torrents_total_points);
      setEditLastReset(wastesInfo.last_reset);
      setEditNotes(wastesInfo.notes || '');
      setEditing(true);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Update last reset date
      await safeInvoke('update_wastes_last_reset', {
        lastReset: editLastReset
      });
      
      // Keep existing points (not editable)
      const calculatedChasmAstrite = calculateChasmAstrite(wastesInfo?.chasm_total_points || 0);
      const calculatedTorrentsAstrite = calculateTorrentsAstrite(wastesInfo?.torrents_total_points || 0);
      
      await safeInvoke('update_whimpering_wastes', {
        chasmHighestStage: editChasmStage,
        chasmTotalPoints: wastesInfo?.chasm_total_points || 0,
        chasmAstrite: calculatedChasmAstrite,
        torrentsTotalPoints: wastesInfo?.torrents_total_points || 0,
        torrentsAstrite: calculatedTorrentsAstrite,
        notes: editNotes || null
      });
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update whimpering wastes:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const startEditStage = (stage: TorrentsStage) => {
    setEditChar1(stage.character1);
    setEditChar2(stage.character2);
    setEditChar3(stage.character3);
    setEditToken(stage.token);
    setEditPoints(stage.points);
    setEditingStage(stage.id);
  };

  const saveStage = async (id: number) => {
    setSaving(true);
    try {
      await safeInvoke('update_torrents_stage', {
        id,
        character1: editChar1,
        character2: editChar2,
        character3: editChar3,
        token: editToken,
        points: editPoints
      });
      
      // Recalculate total torrents points and astrite after updating stage
      // Get all stages and recalculate
      const allStages = await safeInvoke('get_torrents_stages') as TorrentsStage[];
      const totalTorrentsPoints = allStages.reduce((sum, stage) => sum + stage.points, 0);
      const calculatedTorrentsAstrite = calculateTorrentsAstrite(totalTorrentsPoints);
      
      // Update wastes info with new totals (keep chasm values unchanged)
      if (wastesInfo) {
        await safeInvoke('update_whimpering_wastes', {
          chasmHighestStage: wastesInfo.chasm_highest_stage,
          chasmTotalPoints: wastesInfo.chasm_total_points,
          chasmAstrite: wastesInfo.chasm_astrite,
          torrentsTotalPoints: totalTorrentsPoints,
          torrentsAstrite: calculatedTorrentsAstrite,
          notes: wastesInfo.notes || null
        });
      }
      
      setEditingStage(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update torrents stage:', error);
      alert('Failed to save stage');
    } finally {
      setSaving(false);
    }
  };

  const addNewStage = async () => {
    setSaving(true);
    try {
      await safeInvoke('add_torrents_stage', {
        stageNumber: newStageNumber,
        character1: editChar1 || 'None',
        character2: editChar2 || 'None',
        character3: editChar3 || 'None',
        token: editToken || 'None',
        points: editPoints
      });
      
      // Recalculate total torrents points and astrite after adding stage
      const allStages = await safeInvoke('get_torrents_stages') as TorrentsStage[];
      const totalTorrentsPoints = allStages.reduce((sum, stage) => sum + stage.points, 0);
      const calculatedTorrentsAstrite = calculateTorrentsAstrite(totalTorrentsPoints);
      
      // Update wastes info with new totals
      if (wastesInfo) {
        await safeInvoke('update_whimpering_wastes', {
          chasmHighestStage: wastesInfo.chasm_highest_stage,
          chasmTotalPoints: wastesInfo.chasm_total_points,
          chasmAstrite: wastesInfo.chasm_astrite,
          torrentsTotalPoints: totalTorrentsPoints,
          torrentsAstrite: calculatedTorrentsAstrite,
          notes: wastesInfo.notes || null
        });
      }
      
      setAddingStage(false);
      setEditChar1('');
      setEditChar2('');
      setEditChar3('');
      setEditToken('');
      setEditPoints(0);
      setNewStageNumber(1);
      onUpdate();
    } catch (error) {
      console.error('Failed to add torrents stage:', error);
      alert('Failed to add stage');
    } finally {
      setSaving(false);
    }
  };

  const startAddStage = () => {
    setEditChar1('');
    setEditChar2('');
    setEditChar3('');
    setEditToken('');
    setEditPoints(0);
    const hasSide1 = torrentsStages.some(s => s.stage_number === 1);
    setNewStageNumber(hasSide1 ? 2 : 1);
    setAddingStage(true);
  };

  const deleteStage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;
    
    try {
      await safeInvoke('delete_torrents_stage', { id });
      
      // Recalculate total torrents points and astrite after deleting stage
      const allStages = await safeInvoke('get_torrents_stages') as TorrentsStage[];
      const totalTorrentsPoints = allStages.reduce((sum, stage) => sum + stage.points, 0);
      const calculatedTorrentsAstrite = calculateTorrentsAstrite(totalTorrentsPoints);
      
      // Update wastes info with new totals
      if (wastesInfo) {
        await safeInvoke('update_whimpering_wastes', {
          chasmHighestStage: wastesInfo.chasm_highest_stage,
          chasmTotalPoints: wastesInfo.chasm_total_points,
          chasmAstrite: wastesInfo.chasm_astrite,
          torrentsTotalPoints: totalTorrentsPoints,
          torrentsAstrite: calculatedTorrentsAstrite,
          notes: wastesInfo.notes || null
        });
      }
      
      onUpdate();
    } catch (error) {
      console.error('Failed to delete stage:', error);
      alert('Failed to delete stage');
    }
  };

  if (!wastesInfo) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border-2 shadow-[0_0_12px_rgba(226,232,240,0.08)] border-white/[0.3]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Whimpering Wastes Overview
          </h3>
          {!editing && (
            <button
              onClick={startEdit}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Last Reset</label>
                <input
                  type="date"
                  value={editLastReset}
                  onChange={(e) => setEditLastReset(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Respawning Waters: Chasm */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Respawning Waters: Chasm</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Points:</span>
                  <span className="font-semibold">{wastesInfo.chasm_total_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Astrite Earned:</span>
                  <span className="font-semibold text-yellow-400 flex items-center gap-1">
                    <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                    {wastesInfo.chasm_astrite} / 625
                  </span>
                </div>
                <div className="mt-3 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all"
                    style={{ width: `${Math.min((wastesInfo.chasm_astrite / 625) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Respawning Waters: Torrents */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Respawning Waters: Torrents</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Points:</span>
                  <span className="font-semibold">{wastesInfo.torrents_total_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Astrite Earned:</span>
                  <span className="font-semibold text-yellow-400 flex items-center gap-1">
                    <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                    {wastesInfo.torrents_astrite} / 175
                  </span>
                </div>
                <div className="mt-3 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all"
                    style={{ width: `${Math.min((wastesInfo.torrents_astrite / 175) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {wastesInfo.notes && (
              <div className="col-span-1 md:col-span-2 bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Notes</h4>
                <p className="text-sm text-slate-300">{wastesInfo.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Respawning Waters: Torrents Teams */}
      <div className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border-2 shadow-[0_0_12px_rgba(226,232,240,0.08)] border-white/[0.3]">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setTorrentsCollapsed(!torrentsCollapsed)}
            className="flex items-center gap-2 text-lg font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <span>Respawning Waters: Torrents Teams</span>
            <span className="text-sm">{torrentsCollapsed ? '▶' : '▼'}</span>
          </button>
          {!torrentsCollapsed && canAddTeam && (
            <button
              onClick={startAddStage}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Team
            </button>
          )}
        </div>

        {!torrentsCollapsed && (
          <>
            {torrentsStages.length > 0 || addingStage ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addingStage && (
                  <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-yellow-400">New Team</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Side (1 or 2)</label>
                      <input
                        type="number"
                        value={newStageNumber}
                        onChange={(e) => setNewStageNumber(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                        min="1"
                        max="2"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editChar1}
                        onChange={(e) => setEditChar1(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="Char 1"
                      />
                      <input
                        type="text"
                        value={editChar2}
                        onChange={(e) => setEditChar2(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="Char 2"
                      />
                      <input
                        type="text"
                        value={editChar3}
                        onChange={(e) => setEditChar3(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="Char 3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Token</label>
                        <input
                          type="text"
                          value={editToken}
                          onChange={(e) => setEditToken(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Points</label>
                        <input
                          type="number"
                          value={editPoints}
                          onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setAddingStage(false)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                      <button
                        onClick={addNewStage}
                        disabled={saving}
                        className="px-2 py-1 bg-green-500/[0.5] hover:bg-green-500/[0.65] rounded text-xs flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                )}
                
                {torrentsStages.map((stage) => {
                  const isEditingThis = editingStage === stage.id;

                  return (
                    <div key={stage.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                      {isEditingThis ? (
                        <>
                          <p className="text-sm font-semibold text-yellow-400">Side {stage.stage_number}</p>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editChar1}
                              onChange={(e) => setEditChar1(e.target.value)}
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                              placeholder="Char 1"
                            />
                            <input
                              type="text"
                              value={editChar2}
                              onChange={(e) => setEditChar2(e.target.value)}
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                              placeholder="Char 2"
                            />
                            <input
                              type="text"
                              value={editChar3}
                              onChange={(e) => setEditChar3(e.target.value)}
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                              placeholder="Char 3"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Token</label>
                              <input
                                type="text"
                                value={editToken}
                                onChange={(e) => setEditToken(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Points</label>
                              <input
                                type="number"
                                value={editPoints}
                                onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-400"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingStage(null)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                            <button
                              onClick={() => saveStage(stage.id)}
                              disabled={saving}
                              className="px-2 py-1 bg-green-500/[0.5] hover:bg-green-500/[0.65] rounded text-xs flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-yellow-400">
                              Side {stage.stage_number}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditStage(stage)}
                                className="p-1 hover:bg-slate-600 rounded transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteStage(stage.id)}
                                className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">{stage.token}</span>
                            <span className="text-xs text-slate-400">{stage.points} pts</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/20 rounded">
                              <CharacterPortrait characterName={stage.character1} size="md" />
                              <span className="text-xs text-yellow-400">{stage.character1}</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/20 rounded">
                              <CharacterPortrait characterName={stage.character2} size="md" />
                              <span className="text-xs text-yellow-400">{stage.character2}</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/20 rounded">
                              <CharacterPortrait characterName={stage.character3} size="md" />
                              <span className="text-xs text-yellow-400">{stage.character3}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No teams recorded yet. Click "Add Team" to record which teams you used on each side.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}