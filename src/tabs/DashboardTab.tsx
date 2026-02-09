import { useState, useEffect } from 'react';
import { Target, Calculator, Plus, Trash2, Trophy, Zap, Users, Edit2, Save } from 'lucide-react';
import { Goal } from '../types';
import { safeInvoke } from '../utils';
import ConfirmDialog from '../components/ConfirmDialog';
import { CurrencyIcon } from '../components/CurrencyIcon';

export default function DashboardTab({ resources, pityStatus, onUpdate }: any) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [goalForms, setGoalForms] = useState<Record<number, Goal>>({});
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; text: string } | null>(null);
  const [newGoalForm, setNewGoalForm] = useState({
    goal_text: '',
    priority: 'medium',
    category: 'immediate',
    notes: '',
    astrite_needed: null as number | null,
    estimated_banner: '',
  });

  // Resources editing
  const [editingResources, setEditingResources] = useState(false);
  const [resourcesForm, setResourcesForm] = useState({
    astrite: 0,
    lustrous_tide: 0,
    radiant_tide: 0,
    forged_tide: 0,
    afterglow_coral: 0,
    oscillated_coral: 0,
  });

  // Endgame data
  const [endgameData, setEndgameData] = useState({
    tower_astrite: 0,
    wastes_astrite: 0,
    matrix_astrite: 0,
    tower_max: 800,
    wastes_max: 800,
    matrix_max: 400
  });

  // Local pity status state that can be refreshed
  const [localPityStatus, setLocalPityStatus] = useState(pityStatus);

  useEffect(() => {
    loadGoals();
    loadEndgameData();
    loadPityStatus();
  }, []);

  // Update local pity when prop changes
  useEffect(() => {
    if (pityStatus) {
      setLocalPityStatus(pityStatus);
    }
  }, [pityStatus]);

  const loadPityStatus = async () => {
    try {
      const data = await safeInvoke('get_pity_status');
      setLocalPityStatus(data);
    } catch (err) {
      console.error('Failed to load pity status:', err);
    }
  };

  useEffect(() => {
    const newForms: Record<number, Goal> = {};
    goals.forEach(goal => {
      newForms[goal.id] = { ...goal };
    });
    setGoalForms(newForms);
  }, [goals]);

  useEffect(() => {
    if (resources) {
      setResourcesForm({
        astrite: resources.astrite || 0,
        lustrous_tide: resources.lustrous_tide || 0,
        radiant_tide: resources.radiant_tide || 0,
        forged_tide: resources.forged_tide || 0,
        afterglow_coral: resources.afterglow_coral || 0,
        oscillated_coral: resources.oscillated_coral || 0,
      });
    }
  }, [resources]);

  const loadGoals = async () => {
    try {
      const data = await safeInvoke('get_goals') as Goal[];
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setGoals([]);
    }
  };

  const loadEndgameData = async () => {
    try {
      const [tower, wastes, matrix] = await Promise.allSettled([
        safeInvoke('get_tower_of_adversity'),
        safeInvoke('get_whimpering_wastes'),
        safeInvoke('get_troop_matrix')
      ]);

      setEndgameData({
        tower_astrite: tower.status === 'fulfilled' ? (tower.value as any).astrite_earned : 0,
        wastes_astrite: wastes.status === 'fulfilled' ? 
          ((wastes.value as any).chasm_astrite + (wastes.value as any).torrents_astrite) : 0,
        matrix_astrite: matrix.status === 'fulfilled' ? 
          ((matrix.value as any).stability_accords_astrite + (matrix.value as any).singularity_expansion_astrite) : 0,
        tower_max: 800,
        wastes_max: 800,
        matrix_max: 400
      });
    } catch (err) {
      console.error('Failed to load endgame data:', err);
    }
  };

  const handleSaveResources = async () => {
    try {
      await safeInvoke('update_resources', {
        astrite: resourcesForm.astrite,
        lustrousTide: resourcesForm.lustrous_tide,
        radiantTide: resourcesForm.radiant_tide,
        forgedTide: resourcesForm.forged_tide,
        afterglowCoral: resourcesForm.afterglow_coral,
        oscillatedCoral: resourcesForm.oscillated_coral,
        shellCredits: resources?.shell_credits || 0,
        notes: resources?.notes || null
      });
      setEditingResources(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update resources:', err);
      alert('Failed to update resources: ' + err);
    }
  };

  const handleSaveGoal = async (goal: Goal) => {
    try {
      const form = goalForms[goal.id];
      await safeInvoke('update_goal', {
        id: goal.id,
        goalText: form.goal_text,
        priority: form.priority || null,
        category: form.category || null,
        notes: form.notes || null,
        astriteNeeded: form.astrite_needed || null,
        estimatedBanner: form.estimated_banner || null,
      });
      setEditingGoal(null);
      await loadGoals();
    } catch (err) {
      alert('Failed to update goal: ' + err);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalForm.goal_text.trim()) {
      alert('Goal text is required');
      return;
    }

    try {
      await safeInvoke('add_goal', {
        goalText: newGoalForm.goal_text,
        priority: newGoalForm.priority || null,
        category: newGoalForm.category || null,
        notes: newGoalForm.notes || null,
        astriteNeeded: newGoalForm.astrite_needed || null,
        estimatedBanner: newGoalForm.estimated_banner || null,
      });
      setShowAddGoal(false);
      setNewGoalForm({
        goal_text: '',
        priority: 'medium',
        category: 'immediate',
        notes: '',
        astrite_needed: null,
        estimated_banner: '',
      });
      await loadGoals();
    } catch (err) {
      alert('Failed to add goal: ' + err);
    }
  };

  const handleDeleteGoal = (id: number, text: string) => {
    setDeleteConfirm({ id, text });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await safeInvoke('delete_goal', { id: deleteConfirm.id });
      setDeleteConfirm(null);
      await loadGoals();
    } catch (err) {
      alert('Failed to delete goal: ' + err);
    }
  };

  // Pull Calculator
  const astrite = resources?.astrite || 0;
  const lustrousTide = resources?.lustrous_tide || 0;
  const radiantTide = resources?.radiant_tide || 0;
  const forgedTide = resources?.forged_tide || 0;
  const afterglowCoral = resources?.afterglow_coral || 0;
  const oscillatedCoral = resources?.oscillated_coral || 0;

  const pullsFromAstrite = Math.floor(astrite / 160);
  const pullsFromTides = radiantTide;
  const pullsFromCorals = Math.floor(afterglowCoral / 8);
  const totalPulls = pullsFromAstrite + pullsFromTides + pullsFromCorals;

  const getPriorityColor = (priority: string | null) => {
    const colors: Record<string, string> = {
      highest: 'bg-red-500/20 border-red-500/50 text-red-400',
      high: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
      medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
      low: 'bg-green-500/20 border-green-500/50 text-green-400',
    };
    return colors[priority || ''] || 'bg-slate-500/20 border-slate-500/50 text-slate-400';
  };

  const getCategoryIcon = (category: string | null) => {
    const icons: Record<string, string> = {
      immediate: '🔥',
      shortTerm: '⏰',
      longTerm: '🎯',
    };
    return icons[category || ''] || '📌';
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteConfirm?.text}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />

      {/* 1. Resources - Editable */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CurrencyIcon currencyName="astrite" className="w-5 h-5" />
            Resources
          </h2>
          {!editingResources ? (
            <button
              onClick={() => setEditingResources(true)}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingResources(false)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResources}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {editingResources ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <CurrencyIcon currencyName="astrite" className="w-5 h-5" />
                Astrite
              </label>
              <input
                type="number"
                value={resourcesForm.astrite}
                onChange={e => setResourcesForm({...resourcesForm, astrite: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg font-bold text-yellow-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <CurrencyIcon currencyName="lustrous_tide" className="w-5 h-5" />
                Lustrous Tide
              </label>
              <input
                type="number"
                value={resourcesForm.lustrous_tide}
                onChange={e => setResourcesForm({...resourcesForm, lustrous_tide: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg font-bold text-blue-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <CurrencyIcon currencyName="radiant_tide" className="w-5 h-5" />
                Radiant Tide
              </label>
              <input
                type="number"
                value={resourcesForm.radiant_tide}
                onChange={e => setResourcesForm({...resourcesForm, radiant_tide: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg font-bold text-purple-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <CurrencyIcon currencyName="forged_tide" className="w-5 h-5" />
                Forged Tide
              </label>
              <input
                type="number"
                value={resourcesForm.forged_tide}
                onChange={e => setResourcesForm({...resourcesForm, forged_tide: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg font-bold text-orange-400 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <CurrencyIcon currencyName="afterglow_coral" className="w-5 h-5" />
                Afterglow Coral
              </label>
              <input
                type="number"
                value={resourcesForm.afterglow_coral}
                onChange={e => setResourcesForm({...resourcesForm, afterglow_coral: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg font-bold text-pink-400 focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <CurrencyIcon currencyName="oscillated_coral" className="w-5 h-5" />
                Oscillated Coral
              </label>
              <input
                type="number"
                value={resourcesForm.oscillated_coral}
                onChange={e => setResourcesForm({...resourcesForm, oscillated_coral: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg font-bold text-teal-400 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <CurrencyIcon currencyName="astrite" className="w-5 h-5" />
                Astrite
              </div>
              <div className="text-lg font-bold text-yellow-400">{astrite.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <CurrencyIcon currencyName="lustrous_tide" className="w-5 h-5" />
                Lustrous
              </div>
              <div className="text-lg font-bold text-blue-400">{lustrousTide}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <CurrencyIcon currencyName="radiant_tide" className="w-5 h-5" />
                Radiant
              </div>
              <div className="text-lg font-bold text-purple-400">{radiantTide}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <CurrencyIcon currencyName="forged_tide" className="w-5 h-5" />
                Forged
              </div>
              <div className="text-lg font-bold text-orange-400">{forgedTide}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <CurrencyIcon currencyName="afterglow_coral" className="w-5 h-5" />
                Afterglow
              </div>
              <div className="text-lg font-bold text-pink-400">{afterglowCoral.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <CurrencyIcon currencyName="oscillated_coral" className="w-5 h-5" />
                Oscillated
              </div>
              <div className="text-lg font-bold text-teal-400">{oscillatedCoral.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Pull Calculator */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-yellow-400" />
          Convene Calculator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg p-4 border border-yellow-500/30">
            <div className="text-sm text-yellow-400 mb-1 flex items-center gap-1">
              <CurrencyIcon currencyName="astrite" className="w-5 h-5" />
              From Astrite
            </div>
            <div className="text-3xl font-bold text-yellow-400">{pullsFromAstrite}</div>
            <div className="text-xs text-slate-400 mt-1">{astrite} ÷ 160</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/30">
            <div className="text-sm text-purple-400 mb-1 flex items-center gap-1">
              <CurrencyIcon currencyName="radiant_tide" className="w-5 h-5" />
              From Tides
            </div>
            <div className="text-3xl font-bold text-purple-400">{pullsFromTides}</div>
            <div className="text-xs text-slate-400 mt-1">Radiant Tides</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 rounded-lg p-4 border border-pink-500/30">
            <div className="text-sm text-pink-400 mb-1 flex items-center gap-1">
              <CurrencyIcon currencyName="afterglow_coral" className="w-5 h-5" />
              From Corals
            </div>
            <div className="text-3xl font-bold text-pink-400">{pullsFromCorals}</div>
            <div className="text-xs text-slate-400 mt-1">{afterglowCoral} ÷ 8</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/50">
            <div className="text-sm text-cyan-400 mb-1">Total Convenes</div>
            <div className="text-4xl font-bold text-cyan-400">{totalPulls}</div>
            <div className="text-xs text-slate-400 mt-1">Available now</div>
          </div>
        </div>
      </div>

      {/* 3. Pity Counters - Compact Grid */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Pity Counter
          </h2>
          <button
            onClick={loadPityStatus}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Refresh pity status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {localPityStatus?.map((pity: any) => {
            const bannerName = pity.banner_type.replace(/([A-Z])/g, ' $1').trim();

            return (
              <div key={pity.banner_type} className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                  {bannerName}
                </div>

                {/* 5-Star Pity */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-yellow-400">{pity.current_pity_5star}</span>
                    <span className="text-sm text-slate-400">/ 80</span>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all"
                      style={{ width: `${(pity.current_pity_5star / 80) * 100}%` }}
                    />
                  </div>
                  
                  <div className="text-[9px] text-slate-500">5★ Pity</div>
                </div>

                {/* 4-Star Pity */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-lg font-bold text-purple-400">{pity.current_pity_4star}</span>
                    <span className="text-xs text-slate-400">/ 10</span>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden mb-1">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                      style={{ width: `${(pity.current_pity_4star / 10) * 100}%` }}
                    />
                  </div>
                  
                  <div className="text-[9px] text-slate-500">4★ Pity</div>
                </div>

                {pity.banner_type === 'featuredCharacter' && (
                  <div className={`text-[10px] text-center py-0.5 rounded ${
                    pity.guaranteed_next_fivestar 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {pity.guaranteed_next_fivestar ? '✓ Guaranteed' : '50/50'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Endgame Summary */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-400" />
          Endgame Content (This Cycle)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-lg p-4 border border-cyan-500/30">
            <div className="text-sm text-cyan-400 mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tower of Adversity
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CurrencyIcon currencyName="astrite" className="w-8 h-8" />
              <span className="text-3xl font-bold text-yellow-400">{endgameData.tower_astrite}</span>
              <span className="text-slate-400">/ {endgameData.tower_max}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all"
                style={{ width: `${(endgameData.tower_astrite / endgameData.tower_max) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">{((endgameData.tower_astrite / endgameData.tower_max) * 100).toFixed(1)}% Complete</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/30">
            <div className="text-sm text-purple-400 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Whimpering Wastes
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CurrencyIcon currencyName="astrite" className="w-8 h-8" />
              <span className="text-3xl font-bold text-yellow-400">{endgameData.wastes_astrite}</span>
              <span className="text-slate-400">/ {endgameData.wastes_max}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                style={{ width: `${(endgameData.wastes_astrite / endgameData.wastes_max) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">{((endgameData.wastes_astrite / endgameData.wastes_max) * 100).toFixed(1)}% Complete</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/30">
            <div className="text-sm text-orange-400 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Doubled Pawns Matrix
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CurrencyIcon currencyName="astrite" className="w-8 h-8" />
              <span className="text-3xl font-bold text-yellow-400">{endgameData.matrix_astrite}</span>
              <span className="text-slate-400">/ {endgameData.matrix_max}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all"
                style={{ width: `${(endgameData.matrix_astrite / endgameData.matrix_max) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">{((endgameData.matrix_astrite / endgameData.matrix_max) * 100).toFixed(1)}% Complete</div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Endgame Astrite This Cycle:</span>
            <span className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              <CurrencyIcon currencyName="astrite" className="w-5 h-5" />
              {endgameData.tower_astrite + endgameData.wastes_astrite + endgameData.matrix_astrite} 
              <span className="text-sm text-slate-400 ml-1">/ {endgameData.tower_max + endgameData.wastes_max + endgameData.matrix_max}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Goals */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Goals & Objectives</h2>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>

        {showAddGoal && (
          <div className="bg-slate-800/50 rounded-lg p-4 mb-4 space-y-3">
            <input
              type="text"
              value={newGoalForm.goal_text}
              onChange={e => setNewGoalForm({ ...newGoalForm, goal_text: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
              placeholder="Goal description..."
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newGoalForm.priority}
                onChange={e => setNewGoalForm({ ...newGoalForm, priority: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
              >
                <option value="highest">Highest Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <select
                value={newGoalForm.category}
                onChange={e => setNewGoalForm({ ...newGoalForm, category: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
              >
                <option value="immediate">Immediate</option>
                <option value="shortTerm">Short Term</option>
                <option value="longTerm">Long Term</option>
              </select>
            </div>
            <textarea
              value={newGoalForm.notes}
              onChange={e => setNewGoalForm({ ...newGoalForm, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
              placeholder="Add notes... (optional)"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg"
              >
                Add Goal
              </button>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No goals set. Add one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              const isEditing = editingGoal === goal.id;
              const form = goalForms[goal.id] || goal;

              return (
                <div key={goal.id} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.goal_text}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, goal_text: e.target.value } })}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm mr-2"
                      />
                    ) : (
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-lg">{getCategoryIcon(goal.category)}</span>
                        <div className="flex-1">
                          <span className="font-semibold">{goal.goal_text}</span>
                          {goal.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic">{goal.notes}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {!isEditing ? (
                        <>
                          <button onClick={() => setEditingGoal(goal.id)} className="p-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDeleteGoal(goal.id, goal.goal_text)} className="p-1 bg-red-500 hover:bg-red-600 rounded">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleSaveGoal(goal)} className="p-1 bg-green-500 hover:bg-green-600 rounded">
                          <Save className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        value={form.category || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, category: e.target.value } })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="short-term">Short-term</option>
                        <option value="long-term">Long-term</option>
                      </select>
                      <select
                        value={form.priority || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, priority: e.target.value } })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                      >
                        <option value="highest">Highest</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <input
                        type="number"
                        value={form.astrite_needed || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, astrite_needed: e.target.value ? parseInt(e.target.value) : null } })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                        placeholder="Astrite needed"
                      />
                      <textarea
                        value={form.notes || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, notes: e.target.value } })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                        placeholder="Notes (optional)"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                        {goal.priority || 'No priority'}
                      </span>
                      {goal.astrite_needed && (
                        <div className="flex items-center gap-1 text-sm text-purple-400 mt-2">
                          <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                          {goal.astrite_needed.toLocaleString()} Astrite
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}