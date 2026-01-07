import { useState, useEffect } from 'react';
import { Users, Coins, Target, Edit2, Save, Calculator, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Goal } from '../types';
import { safeInvoke, formatBannerType } from '../utils';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DashboardTab({ characters, resources, pityStatus, onUpdate }: any) {
  const [editingPity, setEditingPity] = useState<number | null>(null);
  const [pityForms, setPityForms] = useState<Record<number, { current_pity: number; guaranteed_next_fivestar: boolean; notes: string }>>({});
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

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    const newForms: Record<number, any> = {};
    pityStatus.forEach((pity: any) => {
      newForms[pity.id] = {
        current_pity: pity.current_pity,
        guaranteed_next_fivestar: pity.guaranteed_next_fivestar || false,
        notes: pity.notes || '',
      };
    });
    setPityForms(newForms);
  }, [pityStatus]);

  useEffect(() => {
    const newForms: Record<number, Goal> = {};
    goals.forEach(goal => {
      newForms[goal.id] = { ...goal };
    });
    setGoalForms(newForms);
  }, [goals]);

  const loadGoals = async () => {
    try {
      const data = await safeInvoke('get_goals') as Goal[];
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setGoals([]);
    }
  };

  const handleSavePity = async (pity: any) => {
    try {
      const form = pityForms[pity.id];
      await safeInvoke('update_pity', {
        id: pity.id,
        currentPity: form.current_pity,
        guaranteedNextFivestar: form.guaranteed_next_fivestar,
        notes: form.notes || null,
      });
      setEditingPity(null);
      onUpdate();
    } catch (err) {
      alert('Failed to update pity: ' + err);
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

  const handleDeleteGoal = (goalId: number, goalText: string) => {
    setDeleteConfirm({ id: goalId, text: goalText });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await safeInvoke('delete_goal', { id: deleteConfirm.id });
      await loadGoals();
    } catch (err) {
      alert('Failed to delete goal: ' + err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const builtCharacters = characters.filter((c: any) => 
    !['Not built', 'Barely built'].includes(c.build_status)
  ).length;
  
  const featuredCharPity = pityStatus.find((p: any) => p.banner_type === 'featuredCharacter')?.current_pity || 0;
  const featuredWeaponPity = pityStatus.find((p: any) => p.banner_type === 'featuredWeapon')?.current_pity || 0;

  // Pull Calculator - CORRECTED with Afterglow Corals
  const astrite = resources?.astrite || 0;
  const lustrousTide = resources?.lustrous_tide || 0;
  const radiantTide = resources?.radiant_tide || 0;
  const forgedTide = resources?.forged_tide || 0;
  const afterglowCoral = resources?.afterglow_coral || 0;

  const pullsFromAstrite = Math.floor(astrite / 160);
  const pullsFromTides = radiantTide;
  const pullsFromCorals = Math.floor(afterglowCoral / 8);
  const totalPulls = pullsFromAstrite + pullsFromTides + pullsFromCorals;

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'highest': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'immediate': return '🔥';
      case 'shortterm': return '⚡';
      case 'longterm': return '🎯';
      default: return '📌';
    }
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteConfirm?.text}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <Users className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold">{characters.length}</div>
          <div className="text-sm text-slate-400">Characters ({builtCharacters} built)</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <Coins className="w-8 h-8 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold">{astrite.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Astrite</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <Target className="w-8 h-8 text-purple-400 mb-2" />
          <div className="text-3xl font-bold">{featuredCharPity}</div>
          <div className="text-sm text-slate-400">Character Banner Pity</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <Target className="w-8 h-8 text-orange-400 mb-2" />
          <div className="text-3xl font-bold">{featuredWeaponPity}</div>
          <div className="text-sm text-slate-400">Weapon Banner Pity</div>
        </div>
      </div>

      {/* Pull Calculator */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold">Pull Calculator</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">From Astrite</div>
            <div className="text-2xl font-bold text-purple-400">{pullsFromAstrite} pulls</div>
            <div className="text-xs text-slate-500 mt-1">{astrite.toLocaleString()} ÷ 160</div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Radiant Tides</div>
            <div className="text-2xl font-bold text-cyan-400">{pullsFromTides} pulls</div>
            <div className="text-xs text-slate-500 mt-1">Radiant: {radiantTide}</div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Afterglow Corals</div>
            <div className="text-2xl font-bold text-pink-400">{pullsFromCorals} pulls</div>
            <div className="text-xs text-slate-500 mt-1">{afterglowCoral} ÷ 8</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg p-4 border border-purple-500/50">
            <div className="text-sm text-slate-400">Total Pulls</div>
            <div className="text-3xl font-bold text-white">{totalPulls}</div>
            <div className="text-xs text-cyan-400 mt-1">Available now</div>
          </div>
        </div>

        {/* Calculation Formula */}
        <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
          <div className="text-xs text-slate-400 mb-1">Calculation:</div>
          <div className="font-mono text-sm text-cyan-400">
            ({astrite.toLocaleString()} ÷ 160) + {radiantTide} + ({afterglowCoral} ÷ 8) = <span className="text-white font-bold">{totalPulls} pulls</span>
          </div>
        </div>

        {/* Other Resources Reference */}
        <div className="text-xs text-slate-400 mb-3">
          Other resources: Lustrous Tide: {lustrousTide}, Forged Tide: {forgedTide}
        </div>

        <div className="text-sm text-slate-300 text-center">
          You can do <span className="font-bold text-cyan-400">{totalPulls}</span> pulls right now! 
          {totalPulls >= 80 && <span className="text-green-400 font-semibold"> (Guaranteed 5★!)</span>}
          {totalPulls >= 160 && <span className="text-purple-400 font-semibold"> (2x 5★!)</span>}
        </div>
      </div>

      {/* Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-cyan-400" />
            Goals & Targets
          </h2>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add Goal
          </button>
        </div>

        {/* Add Goal Form */}
        {showAddGoal && (
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-4">
            <div className="space-y-3">
              <input
                type="text"
                value={newGoalForm.goal_text}
                onChange={e => setNewGoalForm({ ...newGoalForm, goal_text: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                placeholder="Goal description..."
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newGoalForm.priority}
                  onChange={e => setNewGoalForm({ ...newGoalForm, priority: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                >
                  <option value="highest">Highest Priority</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <select
                  value={newGoalForm.category}
                  onChange={e => setNewGoalForm({ ...newGoalForm, category: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                >
                  <option value="immediate">Immediate</option>
                  <option value="shortTerm">Short Term</option>
                  <option value="longTerm">Long Term</option>
                </select>
              </div>
              <textarea
                value={newGoalForm.notes}
                onChange={e => setNewGoalForm({ ...newGoalForm, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                placeholder="Notes..."
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={newGoalForm.astrite_needed || ''}
                  onChange={e => setNewGoalForm({ ...newGoalForm, astrite_needed: e.target.value ? parseInt(e.target.value) : null })}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                  placeholder="Astrite needed"
                />
                <input
                  type="text"
                  value={newGoalForm.estimated_banner}
                  onChange={e => setNewGoalForm({ ...newGoalForm, estimated_banner: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                  placeholder="Banner (e.g., Ver 3.1)"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 bg-green-500 hover:bg-green-600 rounded-lg px-4 py-2 font-semibold"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-800 text-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No goals set yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "Add Goal" to create your first goal</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const isEditing = editingGoal === goal.id;
              const form = goalForms[goal.id] || goal;

              return (
                <div key={goal.id} className={`bg-slate-900/50 rounded-xl p-4 border ${getPriorityColor(goal.priority).split(' ')[2]}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={form.goal_text}
                          onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, goal_text: e.target.value } })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-semibold"
                        />
                      ) : (
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getCategoryIcon(goal.category)}</span>
                          <h3 className="font-semibold text-white">{goal.goal_text}</h3>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!isEditing ? (
                        <>
                          <button onClick={() => setEditingGoal(goal.id)} className="p-1 bg-cyan-500 hover:bg-cyan-600 rounded">
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

                  <div className="flex gap-2 mb-3">
                    {isEditing ? (
                      <>
                        <select
                          value={form.priority || ''}
                          onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, priority: e.target.value } })}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="highest">Highest</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <select
                          value={form.category || ''}
                          onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, category: e.target.value } })}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="shortTerm">Short Term</option>
                          <option value="longTerm">Long Term</option>
                        </select>
                      </>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                        {goal.priority || 'No priority'}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={form.notes || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, notes: e.target.value } })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                        placeholder="Notes..."
                        rows={2}
                      />
                      <input
                        type="number"
                        value={form.astrite_needed || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, astrite_needed: e.target.value ? parseInt(e.target.value) : null } })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                        placeholder="Astrite needed"
                      />
                      <input
                        type="text"
                        value={form.estimated_banner || ''}
                        onChange={e => setGoalForms({ ...goalForms, [goal.id]: { ...form, estimated_banner: e.target.value } })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                        placeholder="Banner (e.g., Ver 3.1)"
                      />
                    </div>
                  ) : (
                    <>
                      {goal.notes && <p className="text-sm text-slate-300 mt-2 mb-2">{goal.notes}</p>}
                      {goal.astrite_needed && (
                        <div className="flex items-center gap-1 text-sm text-purple-400 mt-2">
                          <Coins className="w-4 h-4" />
                          {goal.astrite_needed.toLocaleString()} Astrite needed
                        </div>
                      )}
                      {goal.estimated_banner && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Target: {goal.estimated_banner}
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

      {/* Pity Status */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pity Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pityStatus.map((pity: any) => {
            const isEditing = editingPity === pity.id;
            const form = pityForms[pity.id] || { 
              current_pity: pity.current_pity, 
              guaranteed_next_fivestar: pity.guaranteed_next_fivestar || false, 
              notes: pity.notes || '' 
            };

            return (
              <div key={pity.id} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{formatBannerType(pity.banner_type)}</h3>
                    <p className="text-sm text-slate-400 mt-1">Banner Type</p>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <button onClick={() => setEditingPity(pity.id)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleSavePity(pity)} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  {isEditing ? (
                    <div>
                      <label className="text-sm text-slate-400">Current Pity</label>
                      <input
                        type="number"
                        value={form.current_pity}
                        onChange={e => setPityForms({ ...pityForms, [pity.id]: { ...form, current_pity: parseInt(e.target.value) || 0 } })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-3xl font-bold focus:outline-none focus:border-cyan-500 mt-1"
                      />
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-cyan-400">{form.current_pity}</span>
                      <span className="text-2xl text-slate-400">/ 80</span>
                    </div>
                  )}
                  <div className="text-sm text-slate-400 mt-2">Pulls since last 5-star</div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(form.current_pity / 80) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0</span>
                    <span>Hard pity at 80</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.guaranteed_next_fivestar}
                        onChange={e => setPityForms({ ...pityForms, [pity.id]: { ...form, guaranteed_next_fivestar: e.target.checked } })}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                      />
                      <span className="text-sm">Guaranteed next 5-star</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => setPityForms({ ...pityForms, [pity.id]: { ...form, notes: e.target.value } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="Add notes..."
                    />
                  </div>
                ) : (
                  <>
                    <div className={`px-3 py-2 rounded text-center text-sm font-medium ${form.guaranteed_next_fivestar ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {form.guaranteed_next_fivestar ? '✓ Guaranteed 5-Star' : '50/50 Active'}
                    </div>
                    {form.notes && <p className="text-sm text-slate-400 italic mt-4">{form.notes}</p>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}