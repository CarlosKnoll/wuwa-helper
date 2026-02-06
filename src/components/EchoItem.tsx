import { useState, useEffect } from 'react';
import { Edit2, Save, Plus, Trash2, X } from 'lucide-react';
import { EchoSubstat, EchoItemProps } from '../types';
import { safeInvoke, getRarityStars } from '../utils';
import ConfirmDialog from './ConfirmDialog';
import { invoke } from '@tauri-apps/api/core';

interface StatInfo {
  name: string;
  is_percentage: boolean;
}

interface EchoStatsOptions {
  main_stats_by_cost: Record<number, StatInfo[]>;
  substats: StatInfo[];
}

export default function EchoItem({ echo, substats = [], onUpdate, echoImage, echoSetImage, echoMetadata, allowedEchoSets = [] }: EchoItemProps & { allowedEchoSets?: string[] }) {
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [echoStatsOptions, setEchoStatsOptions] = useState<EchoStatsOptions | null>(null);
  const [availableEchoSets, setAvailableEchoSets] = useState<string[]>([]);
  const [form, setForm] = useState({
    echo_name: '',
    echo_set: '',
    cost: 0,
    rarity: 5,
    level: 0,
    main_stat: '',
    main_stat_value: '',
    notes: '',
  });
  
  const [substatForms, setSubstatForms] = useState<EchoSubstat[]>([]);
  const [newSubstats, setNewSubstats] = useState<{stat_name: string, stat_value: string}[]>([]);
  const [deletedSubstatIds, setDeletedSubstatIds] = useState<number[]>([]);

  // Load echo stats options on mount
  useEffect(() => {
    invoke<EchoStatsOptions>('get_echo_stats_options')
      .then(options => setEchoStatsOptions(options))
      .catch(err => console.error('Failed to load echo stats options:', err));
  }, []);

  // Load available echo sets when echo name changes
  useEffect(() => {
    if (echo.echo_name) {
      invoke<string[]>('get_echo_available_sets', { echoName: echo.echo_name })
        .then(sets => setAvailableEchoSets(sets))
        .catch(err => console.error('Failed to load available sonata effects:', err));
    }
  }, [echo.echo_name]);

  // Sync form with echo whenever it changes
  useEffect(() => {
    setForm({
      echo_name: echo.echo_name || '',
      echo_set: echo.echo_set || '',
      cost: echo.cost || 0,
      rarity: echo.rarity || 5,
      level: echo.level || 0,
      main_stat: echo.main_stat || '',
      main_stat_value: echo.main_stat_value || '',
      notes: echo.notes || '',
    });
  }, [echo]);

  // Sync substats whenever they change
  useEffect(() => {
    setSubstatForms([...substats]);
  }, [substats]);

  const handleSave = async () => {
    try {
      // Update echo main stats including name and set
      await safeInvoke('update_echo', {
        id: echo.id,
        echoName: form.echo_name || null,
        echoSet: form.echo_set || null,
        cost: form.cost || null,
        rarity: form.rarity || null,
        level: form.level || null,
        mainStat: form.main_stat || null,
        mainStatValue: form.main_stat_value || null,
        notes: form.notes || null,
      });

      // Update existing substats
      for (const substat of substatForms) {
        if (!deletedSubstatIds.includes(substat.id)) {
          await safeInvoke('update_echo_substat', {
            id: substat.id,
            statName: substat.stat_name,
            statValue: substat.stat_value,
          });
        }
      }

      // Delete removed substats
      for (const id of deletedSubstatIds) {
        await safeInvoke('delete_echo_substat', { id });
      }

      // Add new substats
      for (const newSub of newSubstats) {
        if (newSub.stat_name && newSub.stat_value) {
          await safeInvoke('add_echo_substat', {
            echoId: echo.id,
            statName: newSub.stat_name,
            statValue: newSub.stat_value,
          });
        }
      }

      setEditing(false);
      setNewSubstats([]);
      setDeletedSubstatIds([]);
      await onUpdate();
    } catch (err) {
      alert('Failed to update echo: ' + err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      echo_name: echo.echo_name || '',
      echo_set: echo.echo_set || '',
      cost: echo.cost || 0,
      rarity: echo.rarity || 5,
      level: echo.level || 0,
      main_stat: echo.main_stat || '',
      main_stat_value: echo.main_stat_value || '',
      notes: echo.notes || '',
    });
    setSubstatForms([...substats]);
    setNewSubstats([]);
    setDeletedSubstatIds([]);
  };

  const addNewSubstat = () => {
    // Check if already at max substats (5)
    const totalSubstats = visibleSubstats.length + newSubstats.length;
    if (totalSubstats >= 5) {
      alert('Maximum of 5 substats per echo reached.');
      return;
    }
    setNewSubstats([...newSubstats, { stat_name: '', stat_value: '' }]);
  };

  const removeExistingSubstat = (id: number) => {
    setDeletedSubstatIds([...deletedSubstatIds, id]);
    setSubstatForms(substatForms.filter(s => s.id !== id));
  };

  const removeNewSubstat = (index: number) => {
    setNewSubstats(newSubstats.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    try {
      await safeInvoke('delete_echo', { id: echo.id });
      await onUpdate();
    } catch (err) {
      alert('Failed to delete echo: ' + err);
    } finally {
      setDeleteConfirm(false);
    }
  };

  // Get main stat options for current echo cost
  const getMainStatOptions = (): StatInfo[] => {
    if (!echoStatsOptions || !form.cost) return [];
    return echoStatsOptions.main_stats_by_cost[form.cost] || [];
  };

  // Check if a stat is a percentage stat
  const isPercentageStat = (statName: string): boolean => {
    if (!echoStatsOptions) return false;
    
    // Check in main stats
    for (const stats of Object.values(echoStatsOptions.main_stats_by_cost)) {
      const stat = stats.find(s => s.name === statName);
      if (stat) return stat.is_percentage;
    }
    
    // Check in substats
    const substat = echoStatsOptions.substats.find(s => s.name === statName);
    return substat?.is_percentage || false;
  };

  // Strip % from value for editing
  const stripPercentage = (value: string): string => {
    return value.replace('%', '').trim();
  };

  // Add % to value if it's a percentage stat and doesn't have it
  const ensurePercentage = (value: string, statName: string): string => {
    if (!value) return value;
    const trimmed = value.trim();
    if (isPercentageStat(statName) && !trimmed.endsWith('%')) {
      return trimmed + '%';
    }
    return trimmed;
  };

  // Handle main stat value change
  const handleMainStatValueChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    setForm({ ...form, main_stat_value: cleanValue });
  };

  // Handle main stat value blur (add % when user leaves field)
  const handleMainStatValueBlur = () => {
    if (form.main_stat && form.main_stat_value) {
      setForm({ 
        ...form, 
        main_stat_value: ensurePercentage(form.main_stat_value, form.main_stat) 
      });
    }
  };

  const visibleSubstats = editing 
    ? substatForms.filter(s => !deletedSubstatIds.includes(s.id))
    : substats;

  const totalSubstats = visibleSubstats.length + newSubstats.length;

  return (
    <div className={`relative bg-slate-900/50 backdrop-blur-sm rounded-lg border-2 border-slate-200/30 shadow-[0_0_20px_rgba(226,232,240,0.15)] ${
      form.rarity === 5 
        ? '' 
        : form.rarity === 4 
        ? ''
        : form.rarity === 3
        ? ''
        : ''
    }`}>
      {/* Underglow effect */}
      <div className="absolute inset-0 -z-10 bg-slate-200/10 rounded-lg blur-xl"></div>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        title="Delete Echo"
        message={`Are you sure you want to delete "${form.echo_name}"? This will also delete all substats. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        variant="danger"
      />

      {/* Echo Header */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 flex items-center gap-3">
            {/* Echo Image on the left */}
            {echoImage && !editing && (
              <div className="w-12 h-12 rounded-lg bg-slate-900 border-2 border-cyan-500/50 overflow-hidden flex-shrink-0">
                <img
                  src={echoImage}
                  alt={form.echo_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Echo Name */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={form.echo_name}
                  onChange={e => setForm({ ...form, echo_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-cyan-500 mb-2"
                  placeholder="Echo name"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white text-base">{form.echo_name}</div>
                  {echoSetImage && (
                    <img
                      src={echoSetImage}
                      alt={form.echo_set || 'Sonata Effect'}
                      className="w-5 h-5 object-cover rounded"
                      title={form.echo_set || undefined}
                    />
                  )}
                </div>
              )}
              {editing && (
                <div className="flex gap-2 mt-1 text-sm text-slate-400">
                  {form.cost > 0 && <span>Cost: {form.cost}</span>}
                  {form.rarity > 0 && <span>{getRarityStars(form.rarity)}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded text-xs transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-white-400" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  className="p-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs transition-colors"
                >
                  <Save className="w-3 h-3 text-green-400" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 bg-slate-600/20 hover:bg-slate-600/30 rounded text-xs transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Echo Passives and Cooldown (when not editing and metadata is available) */}
        {!editing && echoMetadata && (echoMetadata.passive1 || echoMetadata.passive2 || echoMetadata.cooldown > 0) && (
          <div className="mb-3 bg-slate-800/30 rounded-lg p-2.5">
            <div className="text-white-400 text-xs leading-relaxed space-y-2">
              {echoMetadata.passive1 && (
                <div>{echoMetadata.passive1}</div>
              )}
              {echoMetadata.passive2 && (
                <div>{echoMetadata.passive2}</div>
              )}
              {echoMetadata.cooldown > 0 && (
                <div className="text-white">
                  Cooldown: {echoMetadata.cooldown}s
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Stat Display (when not editing) */}
        {!editing && form.main_stat && (
          <div className="mb-3">
            <div className="flex justify-between items-center bg-slate-800/50 border border-yellow-500/50 rounded-lg px-3 py-2">
              <span className="text-yellow-400 font-medium">{form.main_stat}</span>
              <span className="text-white font-medium">{form.main_stat_value}</span>
            </div>
          </div>
        )}

        {/* Echo Main Stats Editing */}
        {editing && (
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-slate-500">Cost</label>
                <input
                  type="number"
                  value={form.cost}
                  onChange={e => setForm({ ...form, cost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  min="1"
                  max="4"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Rarity</label>
                <input
                  type="number"
                  value={form.rarity}
                  onChange={e => setForm({ ...form, rarity: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  min="2"
                  max="5"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Level</label>
                <input
                  type="number"
                  value={form.level}
                  onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  min="0"
                  max="25"
                />
              </div>
            </div>
            
            {/* Echo Set Dropdown */}
            {availableEchoSets.length > 0 && (
              <div>
                <label className="text-xs text-slate-500">Sonata Effect</label>
                <select
                  value={form.echo_set}
                  onChange={e => setForm({ ...form, echo_set: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select sonata effect...</option>
                  {availableEchoSets
                    .filter(setName => {
                      // If build has selected sets, only show those sets
                      // Otherwise, show all available sets for this echo
                      if (allowedEchoSets.length > 0) {
                        return allowedEchoSets.includes(setName);
                      }
                      return true;
                    })
                    .map(setName => (
                      <option key={setName} value={setName}>
                        {setName}
                      </option>
                    ))}
                </select>
                {allowedEchoSets.length > 0 && (
                  <div className="text-xs text-slate-400 mt-1">
                    Only showing sets from your build configuration
                  </div>
                )}
              </div>
            )}
            
            {/* Main Stat: Dropdown for name, text input for value */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Main Stat</label>
                <select
                  value={form.main_stat}
                  onChange={e => setForm({ ...form, main_stat: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  disabled={!echoStatsOptions || !form.cost}
                >
                  <option value="">Select main stat...</option>
                  {getMainStatOptions().map(stat => (
                    <option key={stat.name} value={stat.name}>
                      {stat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Value {isPercentageStat(form.main_stat) && <span className="text-slate-600">(auto-adds %)</span>}
                </label>
                <input
                  type="text"
                  value={stripPercentage(form.main_stat_value)}
                  onChange={e => handleMainStatValueChange(e.target.value)}
                  onBlur={handleMainStatValueBlur}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder={isPercentageStat(form.main_stat) ? "22.8" : "e.g., 320"}
                />
              </div>
            </div>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
              placeholder="Echo notes..."
              rows={2}
            />
          </div>
        )}

        {/* Echo Notes (when not editing) */}
        {!editing && form.notes && (
          <p className="text-xs text-slate-400 italic mt-2">{form.notes}</p>
        )}
      </div>

      {/* Substats Section - Always Visible */}
      {(visibleSubstats.length > 0 || newSubstats.length > 0 || editing) && (
        <div className="border-t border-slate-700">
          <div className="px-3 py-2 bg-slate-800/30">
            <span className="text-xs text-slate-400 font-semibold">
              Substats ({visibleSubstats.length + newSubstats.length})
            </span>
          </div>

          <div className="px-3 pb-3 pt-2">
            {editing ? (
              <div className="space-y-2">
                {/* Existing substats: Dropdown for name, text input for value */}
                {visibleSubstats.map((sub) => (
                  <div key={sub.id} className="flex gap-2">
                    <select
                      value={sub.stat_name}
                      onChange={e => {
                        const newSubstats = [...substatForms];
                        const actualIdx = newSubstats.findIndex(s => s.id === sub.id);
                        if (actualIdx >= 0) {
                          newSubstats[actualIdx] = { ...sub, stat_name: e.target.value };
                          setSubstatForms(newSubstats);
                        }
                      }}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                      disabled={!echoStatsOptions}
                    >
                      <option value="">Select stat...</option>
                      {echoStatsOptions?.substats.map(stat => (
                        <option key={stat.name} value={stat.name}>
                          {stat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={stripPercentage(sub.stat_value)}
                      onChange={e => {
                        const cleanValue = e.target.value.replace(/[^\d.]/g, '');
                        const newSubstats = [...substatForms];
                        const actualIdx = newSubstats.findIndex(s => s.id === sub.id);
                        if (actualIdx >= 0) {
                          newSubstats[actualIdx] = { ...sub, stat_value: cleanValue };
                          setSubstatForms(newSubstats);
                        }
                      }}
                      onBlur={() => {
                        const newSubstats = [...substatForms];
                        const actualIdx = newSubstats.findIndex(s => s.id === sub.id);
                        if (actualIdx >= 0 && sub.stat_name && sub.stat_value) {
                          newSubstats[actualIdx] = { 
                            ...sub, 
                            stat_value: ensurePercentage(sub.stat_value, sub.stat_name) 
                          };
                          setSubstatForms(newSubstats);
                        }
                      }}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                      placeholder={isPercentageStat(sub.stat_name) ? "6.0" : "50"}
                    />
                    <button
                      onClick={() => removeExistingSubstat(sub.id)}
                      className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {/* New substats: Dropdown for name, text input for value */}
                {newSubstats.map((sub, idx) => (
                  <div key={`new-${idx}`} className="flex gap-2">
                    <select
                      value={sub.stat_name}
                      onChange={e => {
                        const updated = [...newSubstats];
                        updated[idx] = { ...sub, stat_name: e.target.value };
                        setNewSubstats(updated);
                      }}
                      className="flex-1 bg-slate-800 border border-green-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-500"
                      disabled={!echoStatsOptions}
                    >
                      <option value="">Select stat...</option>
                      {echoStatsOptions?.substats.map(stat => (
                        <option key={stat.name} value={stat.name}>
                          {stat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={stripPercentage(sub.stat_value)}
                      onChange={e => {
                        const cleanValue = e.target.value.replace(/[^\d.]/g, '');
                        const updated = [...newSubstats];
                        updated[idx] = { ...sub, stat_value: cleanValue };
                        setNewSubstats(updated);
                      }}
                      onBlur={() => {
                        if (sub.stat_name && sub.stat_value) {
                          const updated = [...newSubstats];
                          updated[idx] = { 
                            ...sub, 
                            stat_value: ensurePercentage(sub.stat_value, sub.stat_name) 
                          };
                          setNewSubstats(updated);
                        }
                      }}
                      className="flex-1 bg-slate-800 border border-green-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-500"
                      placeholder={isPercentageStat(sub.stat_name) ? "6.0" : "50"}
                    />
                    <button
                      onClick={() => removeNewSubstat(idx)}
                      className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addNewSubstat}
                  disabled={totalSubstats >= 5}
                  className="w-full py-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded text-xs text-cyan-400 disabled:text-slate-500 flex items-center justify-center gap-1"
                  title={totalSubstats >= 5 ? "Maximum 5 substats per echo" : "Add substat"}
                >
                  <Plus className="w-3 h-3" />
                  Add Substat {totalSubstats >= 5 && "(Max 5)"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {substats.map(sub => (
                  <div 
                    key={sub.id} 
                    className="flex justify-between items-center text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-slate-400">{sub.stat_name}</span>
                    <span className="text-white font-medium">{sub.stat_value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}