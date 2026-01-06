import React, { useState } from 'react';
import { Edit2, Save, X, Shield } from 'lucide-react';
import { safeInvoke } from '../utils';
import EchoItem from './EchoItem';

interface CharacterEchoBuildSectionProps {
  echoBuild: EchoBuild | null;
  echoes: Echo[];
  echoSubstats: Record<number, EchoSubstat[]>;
  onUpdate: () => void;
}

export default function CharacterEchoBuildSection({
  echoBuild,
  echoes,
  echoSubstats,
  onUpdate
}: CharacterEchoBuildSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    set_bonus: echoBuild?.set_bonus || '',
    set_effect: echoBuild?.set_effect || '',
    overall_quality: echoBuild?.overall_quality || '',
    notes: echoBuild?.notes || '',
  });

  const handleSave = async () => {
    if (!echoBuild) return;
    
    try {
      await safeInvoke('update_echo_build', {
        buildId: echoBuild.id,
        setBonus: form.set_bonus || null,
        setEffect: form.set_effect || null,
        overallQuality: form.overall_quality || null,
        notes: form.notes || null,
      });
      setEditing(false);
      await onUpdate();
    } catch (err) {
      alert('Failed to update echo build: ' + err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      set_bonus: echoBuild?.set_bonus || '',
      set_effect: echoBuild?.set_effect || '',
      overall_quality: echoBuild?.overall_quality || '',
      notes: echoBuild?.notes || '',
    });
  };

  if (!echoBuild) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-purple-400" />
          <h3 className="text-lg font-bold">Echo Build</h3>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded transition-colors">
            <Edit2 size={16} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-2 bg-green-500 hover:bg-green-600 rounded transition-colors">
              <Save size={16} />
            </button>
            <button onClick={handleCancel} className="p-2 bg-slate-600 hover:bg-slate-700 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400">Set Bonus</label>
            <input
              type="text"
              value={form.set_bonus}
              onChange={e => setForm({ ...form, set_bonus: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Windward Pilgrimage 5pc"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Set Effect</label>
            <textarea
              value={form.set_effect}
              onChange={e => setForm({ ...form, set_effect: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              placeholder="Describe the set effect..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400">Overall Quality</label>
              <select
                value={form.overall_quality}
                onChange={e => setForm({ ...form, overall_quality: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select quality...</option>
                <option value="Poor">Poor</option>
                <option value="Underwhelming">Underwhelming</option>
                <option value="Decent">Decent</option>
                <option value="Good">Good</option>
                <option value="Great">Great</option>
                <option value="Amazing">Amazing</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="Build notes..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {form.set_bonus && (
            <div>
              <div className="text-sm text-slate-400">Set Bonus</div>
              <div className="font-medium">{form.set_bonus}</div>
            </div>
          )}
          {form.set_effect && (
            <div>
              <div className="text-sm text-slate-400">Set Effect</div>
              <div className="text-sm text-slate-300">{form.set_effect}</div>
            </div>
          )}
          <div className="flex justify-between items-center">
            {form.overall_quality && (
              <div>
                <div className="text-sm text-slate-400">Quality</div>
                <div className="font-medium text-cyan-400">{form.overall_quality}</div>
              </div>
            )}
            {form.notes && (
              <p className="text-sm text-slate-400 italic">{form.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Echoes Grid - Side by Side */}
      {echoes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 font-medium mb-3">
            Echoes ({echoes.length})
          </div>
          {/* Changed from space-y-3 to grid for side-by-side layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {echoes.map(echo => (
              <EchoItem
                key={echo.id}
                echo={echo}
                substats={echoSubstats[echo.id] || []}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
