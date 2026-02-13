import { useState, useMemo, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { safeInvoke } from '../utils';
import { WeaponListItem } from '../types';
import { AddWeaponModalProps } from '../props';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableWeapons, setAvailableWeapons] = useState<WeaponListItem[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load available weapons from backend on mount
  useEffect(() => {
    const loadWeapons = async () => {
      try {
        const weapons = await safeInvoke('get_available_weapons') as WeaponListItem[];
        setAvailableWeapons(weapons);
      } catch (err) {
        console.error('Failed to load weapon list:', err);
        setAvailableWeapons([]);
      } finally {
        setLoadingWeapons(false);
      }
    };

    loadWeapons();
  }, []);

  // Filter weapons based on search term
  const filteredWeapons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return availableWeapons;
    }
    return availableWeapons.filter(weapon => 
      weapon.name.toLowerCase().includes(term)
    );
  }, [searchTerm, availableWeapons]);

  const handleWeaponSelect = (weapon: WeaponListItem) => {
    setForm({ 
      ...form, 
      weapon_name: weapon.name,
      weapon_type: weapon.weapon_type,
      rarity: weapon.rarity,
    });
    setSearchTerm(weapon.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, weapon_name: value });
    setSearchTerm(value);
    setShowDropdown(true);
  };

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
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Plus size={24} className="text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Add New Weapon</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Weapon Name with Dropdown */}
            <div className="col-span-2 relative">
              <label className="text-sm text-slate-400">Weapon Name *</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.weapon_name}
                  onChange={handleInputChange}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => {
                    // Delay hiding dropdown to allow click events to fire
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 pr-10 mt-1 focus:outline-none focus:border-cyan-500"
                  placeholder={loadingWeapons ? "Loading weapons..." : "Select or type weapon name..."}
                  required
                  autoComplete="off"
                  disabled={loadingWeapons}
                />
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors mt-0.5"
                  disabled={loadingWeapons}
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* Dropdown */}
              {showDropdown && !loadingWeapons && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredWeapons.length > 0 ? (
                    filteredWeapons.map((weapon, index) => (
                      <button
                        key={`${weapon.name}-${index}`}
                        type="button"
                        onMouseDown={(e) => {
                          // Use onMouseDown instead of onClick to fire before onBlur
                          e.preventDefault();
                          handleWeaponSelect(weapon);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-white flex items-center justify-between"
                      >
                        <span>{weapon.name}</span>
                        <span className="text-xs text-slate-400">
                          {weapon.rarity}★ {weapon.weapon_type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-400 text-sm">
                      {availableWeapons.length === 0 
                        ? "No weapons loaded. You can still add a custom weapon."
                        : `No matches found. You can still add "${form.weapon_name}" as a custom weapon.`
                      }
                    </div>
                  )}
                </div>
              )}
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
                <option value="building">Building</option>
                <option value="leveled">Leveled</option>
                <option value="owned">Owned</option>
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

          {/* Category Info */}
          <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Category Guide:</p>
            <ul className="space-y-1 ml-4">
              <li><span className="text-orange-400 font-semibold">Building:</span> Weapons you're currently leveling/upgrading</li>
              <li><span className="text-green-400 font-semibold">Leveled:</span> Weapons that are fully leveled and ready to use</li>
              <li><span className="text-slate-400 font-semibold">Owned:</span> Weapons you own but haven't leveled yet</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || loadingWeapons}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:bg-slate-700 rounded-lg px-4 py-2 font-semibold transition-colors"
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