import { useState, useEffect } from 'react';
import { Edit2, Save, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { EchoSubstat, EchoItemProps } from '../types';
import { safeInvoke, getRarityStars } from '../utils';
import ConfirmDialog from './ConfirmDialog';



export default function EchoItem({ echo, substats, onUpdate }: EchoItemProps) {
  const [editing, setEditing] = useState(false);
  const [showSubstats, setShowSubstats] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    echo_name: '',
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

  // Sync form with echo whenever it changes
  useEffect(() => {
    setForm({
      echo_name: echo.echo_name || '',
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
      // Update echo main stats including name
      await safeInvoke('update_echo', {
        id: echo.id,
        echoName: form.echo_name || null,
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

  const visibleSubstats = editing 
    ? substatForms.filter(s => !deletedSubstatIds.includes(s.id))
    : substats;

  const totalSubstats = visibleSubstats.length + newSubstats.length;

  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700">
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
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={form.echo_name}
                onChange={e => setForm({ ...form, echo_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-cyan-500 mb-2"
                placeholder="Echo name"
              />
            ) : (
              <div className="font-medium text-white">{form.echo_name}</div>
            )}
            <div className="flex gap-2 mt-1 text-sm text-slate-400">
              {form.cost > 0 && <span>Cost: {form.cost}</span>}
              {form.rarity > 0 && <span>{getRarityStars(form.rarity)}</span>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {!editing ? (
              <>
                {form.level > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-cyan-400">Lv.{form.level}</div>
                  </div>
                )}
                {form.main_stat && (
                  <div className="text-right">
                    <div className="text-sm text-purple-400">{form.main_stat}</div>
                    <div className="text-xs text-slate-400">{form.main_stat_value}</div>
                  </div>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 bg-cyan-500 hover:bg-cyan-600 rounded text-xs transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="p-1 bg-red-500 hover:bg-red-600 rounded text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  className="p-1 bg-green-500 hover:bg-green-600 rounded text-xs transition-colors"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 bg-slate-600 hover:bg-slate-700 rounded text-xs transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Main Stat</label>
                <input
                  type="text"
                  value={form.main_stat}
                  onChange={e => setForm({ ...form, main_stat: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., ATK%"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Value</label>
                <input
                  type="text"
                  value={form.main_stat_value}
                  onChange={e => setForm({ ...form, main_stat_value: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., 22.8%"
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

      {/* Collapsible Substats Section */}
      {(visibleSubstats.length > 0 || newSubstats.length > 0 || editing) && (
        <div className="border-t border-slate-700">
          <button
            onClick={() => setShowSubstats(!showSubstats)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-xs text-slate-400">
              Substats ({visibleSubstats.length + newSubstats.length})
            </span>
            {showSubstats ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showSubstats && (
            <div className="px-3 pb-3">
              {editing ? (
                <div className="space-y-2">
                  {/* Existing substats */}
                  {visibleSubstats.map((sub) => (
                    <div key={sub.id} className="flex gap-2">
                      <input
                        type="text"
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
                        placeholder="Stat name"
                      />
                      <input
                        type="text"
                        value={sub.stat_value}
                        onChange={e => {
                          const newSubstats = [...substatForms];
                          const actualIdx = newSubstats.findIndex(s => s.id === sub.id);
                          if (actualIdx >= 0) {
                            newSubstats[actualIdx] = { ...sub, stat_value: e.target.value };
                            setSubstatForms(newSubstats);
                          }
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => removeExistingSubstat(sub.id)}
                        className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* New substats */}
                  {newSubstats.map((sub, idx) => (
                    <div key={`new-${idx}`} className="flex gap-2">
                      <input
                        type="text"
                        value={sub.stat_name}
                        onChange={e => {
                          const updated = [...newSubstats];
                          updated[idx] = { ...sub, stat_name: e.target.value };
                          setNewSubstats(updated);
                        }}
                        className="flex-1 bg-slate-800 border border-green-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-500"
                        placeholder="Stat name (new)"
                      />
                      <input
                        type="text"
                        value={sub.stat_value}
                        onChange={e => {
                          const updated = [...newSubstats];
                          updated[idx] = { ...sub, stat_value: e.target.value };
                          setNewSubstats(updated);
                        }}
                        className="flex-1 bg-slate-800 border border-green-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-500"
                        placeholder="Value"
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
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {substats.map(sub => (
                    <div key={sub.id} className="text-xs text-slate-400">
                      {sub.stat_name}: <span className="text-white">{sub.stat_value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}