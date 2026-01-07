import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { safeInvoke } from '../utils';
import { AddWeaponModalProps } from '../types';

const weaponTypes = ['Sword', 'Broadblade', 'Pistols', 'Gauntlets', 'Rectifier'];

export default function AddWeaponModal({ onClose, onSuccess }: AddWeaponModalProps) {
  const [form, setForm] = useState({
    weapon_name: '',
    weapon_type: 'Sword',
    rarity: 5,
    level: 1,
    rank: 1,
    equipped_on: 'Nobody',
    category: 'owned',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.weapon_name.trim()) {
      alert('Weapon name is required');
      return;
    }

    try {
      setLoading(true);
      await safeInvoke('add_weapon', {
        weaponName: form.weapon_name,
        weaponType: form.weapon_type,
        rarity: form.rarity,
        level: form.level,
        rank: form.rank,
        equippedOn: form.equipped_on,
        category: form.category,
        notes: form.notes || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to add weapon: ' + err);
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
            <Plus size={24} className="text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Add New Weapon</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-slate-400">Weapon Name *</label>
              <input
                type="text"
                value={form.weapon_name}
                onChange={e => setForm({ ...form, weapon_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="e.g., Emerald of Genesis"
                required
              />
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
              <label className="text-sm text-slate-400">Rarity</label>
              <select
                value={form.rarity}
                onChange={e => setForm({ ...form, rarity: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                <option value={5}>5 Star</option>
                <option value={4}>4 Star</option>
                <option value={3}>3 Star</option>
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
              <label className="text-sm text-slate-400">Refinement Rank</label>
              <input
                type="number"
                value={form.rank}
                onChange={e => setForm({ ...form, rank: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                min="1"
                max="5"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Equipped On</label>
              <input
                type="text"
                value={form.equipped_on}
                onChange={e => setForm({ ...form, equipped_on: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="Character name or 'Nobody'"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="owned">Owned</option>
                <option value="leveled">Leveled</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-sm text-slate-400">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                placeholder="Add any notes about this weapon..."
                rows={3}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 rounded-lg px-4 py-2 font-semibold transition-colors"
            >
              {loading ? 'Adding...' : 'Add Weapon'}
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