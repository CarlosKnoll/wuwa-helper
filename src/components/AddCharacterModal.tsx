import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { AddCharacterModalProps } from '../types';
import { safeInvoke, getBuildStatusOptions } from '../utils';

const elements = ['Spectro', 'Havoc', 'Aero', 'Electro', 'Fusion', 'Glacio'];
const weaponTypes = ['Sword', 'Broadblade', 'Pistols', 'Gauntlets', 'Rectifier'];

export default function AddCharacterModal({ onClose, onSuccess }: AddCharacterModalProps) {
  const buildStatusOptions = getBuildStatusOptions();
  
  const [form, setForm] = useState({
    character_name: '',
    variant: '',
    resonance_date: new Date().toISOString().split('T')[0],
    rarity: 5,
    element: 'Spectro',
    weapon_type: 'Sword',
    waveband: 0,
    level: 1,
    ascension: 0,
    build_status: 'Not built',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.character_name.trim()) {
      alert('Character name is required');
      return;
    }

    // Enforce limits
    const level = Math.max(1, Math.min(90, form.level));
    const ascension = Math.max(0, Math.min(6, form.ascension));
    const waveband = Math.max(0, Math.min(6, form.waveband));
    
    if (form.level !== level || form.ascension !== ascension || form.waveband !== waveband) {
      alert('Values adjusted: Level (1-90), Ascension (0-6), Waveband (0-6)');
    }

    try {
      setLoading(true);
      await safeInvoke('add_character', {
        characterName: form.character_name,
        variant: form.variant || null,
        resonanceDate: form.resonance_date,
        rarity: form.rarity,
        element: form.element,
        weaponType: form.weapon_type,
        waveband: waveband,
        level: level,
        ascension: ascension,
        buildStatus: form.build_status,
        notes: form.notes || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to add character: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plus size={24} className="text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Add New Character</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-slate-400">Character Name *</label>
              <input
                type="text"
                value={form.character_name}
                onChange={e => setForm({ ...form, character_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="e.g., Jiyan"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Variant</label>
              <input
                type="text"
                value={form.variant}
                onChange={e => setForm({ ...form, variant: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="Optional (for Rover)"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Resonance Date</label>
              <input
                type="date"
                value={form.resonance_date}
                onChange={e => setForm({ ...form, resonance_date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Rarity</label>
              <select
                value={form.rarity}
                onChange={e => setForm({ ...form, rarity: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                <option value={5}>5 Star</option>
                <option value={4}>4 Star</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">Element</label>
              <select
                value={form.element}
                onChange={e => setForm({ ...form, element: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                {elements.map(el => (
                  <option key={el} value={el}>{el}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">Weapon Type</label>
              <select
                value={form.weapon_type}
                onChange={e => setForm({ ...form, weapon_type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                {weaponTypes.map(wt => (
                  <option key={wt} value={wt}>{wt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">Level</label>
              <input
                type="number"
                value={form.level}
                onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                min="1"
                max="90"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Ascension</label>
              <input
                type="number"
                value={form.ascension}
                onChange={e => setForm({ ...form, ascension: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                min="0"
                max="6"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Waveband</label>
              <input
                type="number"
                value={form.waveband}
                onChange={e => setForm({ ...form, waveband: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                min="0"
                max="6"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Build Status</label>
              <select
                value={form.build_status}
                onChange={e => setForm({ ...form, build_status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                {buildStatusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-sm text-slate-400">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="Add any notes about this character..."
                rows={3}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:bg-slate-700 rounded-lg px-4 py-2 font-semibold transition-colors"
            >
              {loading ? 'Adding...' : 'Add Character'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}