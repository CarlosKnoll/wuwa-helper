import React, { useState, useEffect } from 'react';
import { Users, Coins, Target, Edit2, Save, Calculator } from 'lucide-react';
import { Character, Resources, PityStatus, Goal } from '../types';
import { safeInvoke, formatBannerType } from '../utils';

export default function DashboardTab({ characters, resources, pityStatus, goals }: any) {
  const [editingPity, setEditingPity] = useState<number | null>(null);
  const [pityForms, setPityForms] = useState<Record<number, { current_pity: number; guaranteed_next_fivestar: boolean; notes: string }>>({});

  useEffect(() => {
    const newForms: Record<number, any> = {};
    (pityStatus as PityStatus[]).forEach(pity => {
      newForms[pity.id] = {
        current_pity: pity.current_pity,
        guaranteed_next_fivestar: pity.guaranteed_next_fivestar || false,
        notes: pity.notes || '',
      };
    });
    setPityForms(newForms);
  }, [pityStatus]);

  const handleSavePity = async (pity: PityStatus) => {
    try {
      const form = pityForms[pity.id];
      await safeInvoke('update_pity', {
        id: pity.id,
        currentPity: form.current_pity,
        guaranteedNextFivestar: form.guaranteed_next_fivestar,
        notes: form.notes || null,
      });
      setEditingPity(null);
    } catch (err) {
      alert('Failed to update pity: ' + err);
    }
  };

  const builtCharacters = (characters as Character[]).filter((c: Character) => !['Not built', 'Barely built'].includes(c.build_status)).length;
  
  const featuredCharPity = (pityStatus as PityStatus[]).find((p: PityStatus) => p.banner_type === 'featuredCharacter')?.current_pity || 0;
  const featuredWeaponPity = (pityStatus as PityStatus[]).find((p: PityStatus) => p.banner_type === 'featuredWeapon')?.current_pity || 0;

  // Pull Calculator
  const astrite = resources?.astrite || 0;
  const lustrousTide = resources?.lustrous_tide || 0;
  const radiantTide = resources?.radiant_tide || 0;
  const forgedTide = resources?.forged_tide || 0;

  const pullsFromAstrite = Math.floor(astrite / 160);
  const pullsFromTides = lustrousTide + radiantTide + forgedTide;
  const totalPulls = pullsFromAstrite + pullsFromTides;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <Users className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold">{(characters as Character[]).length}</div>
          <div className="text-sm text-slate-400">Characters ({builtCharacters} built)</div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <Coins className="w-8 h-8 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold">{resources?.astrite?.toLocaleString() || 0}</div>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">From Astrite</div>
            <div className="text-2xl font-bold text-purple-400">{pullsFromAstrite} pulls</div>
            <div className="text-xs text-slate-500 mt-1">{astrite.toLocaleString()} ÷ 160</div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">From Tides</div>
            <div className="text-2xl font-bold text-cyan-400">{pullsFromTides} pulls</div>
            <div className="text-xs text-slate-500 mt-1">
              L:{lustrousTide} + R:{radiantTide} + F:{forgedTide}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg p-4 border border-purple-500/50">
            <div className="text-sm text-slate-400">Total Pulls</div>
            <div className="text-3xl font-bold text-white">{totalPulls}</div>
            <div className="text-xs text-cyan-400 mt-1">Available now</div>
          </div>
        </div>

        <div className="text-sm text-slate-400 text-center">
          You can do {totalPulls} pulls right now! 
          {totalPulls >= 80 && <span className="text-green-400 font-semibold"> (Guaranteed 5★!)</span>}
          {totalPulls >= 160 && <span className="text-purple-400 font-semibold"> (2x 5★ guaranteed!)</span>}
        </div>
      </div>

      {/* Pity Status */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pity Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(pityStatus as PityStatus[]).map((pity) => {
            const isEditing = editingPity === pity.id;
            const form = pityForms[pity.id] || { current_pity: pity.current_pity, guaranteed_next_fivestar: pity.guaranteed_next_fivestar || false, notes: pity.notes || '' };

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

      {/* Goals Section */}
      {goals && (goals as Goal[]).length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(goals as Goal[]).map((goal) => (
              <div key={goal.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{goal.goal_text}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    goal.category === 'immediate' ? 'bg-red-500/20 text-red-400' :
                    goal.category === 'shortTerm' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {goal.category}
                  </span>
                </div>
                {goal.notes && <p className="text-sm text-slate-400 mt-2">{goal.notes}</p>}
                {goal.astrite_needed && (
                  <div className="mt-2 text-sm text-purple-400">
                    Need: {goal.astrite_needed.toLocaleString()} Astrite
                  </div>
                )}
                {goal.estimated_banner && (
                  <div className="text-xs text-slate-500 mt-1">
                    Target: {goal.estimated_banner}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}