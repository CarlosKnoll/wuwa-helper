import { useState, useEffect } from 'react';
import { Edit2, Save, X, Sword } from 'lucide-react';
import { Weapon, CharacterWeaponSectionProps } from '../types';
import { safeInvoke, getRarityStars } from '../utils';

export default function CharacterWeaponSection({
  weapon,
  characterId,
  onUpdate
}: CharacterWeaponSectionProps) {
  const [editing, setEditing] = useState(false);
  const [availableWeapons, setAvailableWeapons] = useState<Weapon[]>([]);
  const [form, setForm] = useState({
    weapon_name: weapon?.weapon_name || '',
    rarity: weapon?.rarity || 5,
    level: weapon?.level || 90,
    rank: weapon?.rank || 1,
    notes: weapon?.notes || '',
  });

  useEffect(() => {
    if (editing) {
      loadAvailableWeapons();
    }
  }, [editing]);

  const loadAvailableWeapons = async () => {
    try {
      const weapons = await safeInvoke('get_all_weapons') as Weapon[];
      setAvailableWeapons(weapons);
    } catch (err) {
      console.error('Failed to load weapons:', err);
    }
  };

  const handleWeaponSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeapon = availableWeapons.find(w => w.weapon_name === e.target.value);
    if (selectedWeapon) {
      setForm({
        weapon_name: selectedWeapon.weapon_name,
        rarity: selectedWeapon.rarity,
        level: selectedWeapon.level,
        rank: selectedWeapon.rank,
        notes: selectedWeapon.notes || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      await safeInvoke('update_character_weapon', {
        characterId,
        weaponName: form.weapon_name,
        rarity: form.rarity || null,
        level: form.level || null,
        rank: form.rank || null,
        notes: form.notes || null,
      });
      setEditing(false);
      await onUpdate();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      weapon_name: weapon?.weapon_name || '',
      rarity: weapon?.rarity || 5,
      level: weapon?.level || 90,
      rank: weapon?.rank || 1,
      notes: weapon?.notes || '',
    });
  };

  if (!weapon) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Sword size={20} className="text-orange-400" />
          <h3 className="text-lg font-bold">Weapon</h3>
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
        <div className="space-y-4">
          {/* Weapon Selection Dropdown */}
          <div>
            <label className="text-sm text-slate-400">Select from Inventory</label>
            <select
              onChange={handleWeaponSelect}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Choose a weapon...</option>
              {availableWeapons.map(w => (
                <option key={w.id} value={w.weapon_name}>
                  {w.weapon_name} ({getRarityStars(w.rarity)}) - Lv.{w.level} R{w.rank}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Entry */}
          <div>
            <label className="text-sm text-slate-400">Or Enter Manually</label>
            <input
              type="text"
              value={form.weapon_name}
              onChange={e => setForm({ ...form, weapon_name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              placeholder="Enter weapon name..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-slate-400">Rarity</label>
              <select
                value={form.rarity}
                onChange={e => setForm({ ...form, rarity: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
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
                onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                min="1"
                max="90"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Rank</label>
              <input
                type="number"
                value={form.rank}
                onChange={e => setForm({ ...form, rank: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
                min="1"
                max="5"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              placeholder="Weapon notes..."
              rows={2}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white font-semibold text-lg">{weapon.weapon_name}</p>
            <p className="text-sm text-yellow-400 mt-1">{getRarityStars(weapon.rarity || 5)}</p>
            {form.notes && <p className="text-sm text-slate-400 italic mt-2">{form.notes}</p>}
          </div>
          <div className="text-right">
            <p className="text-cyan-400 font-semibold">Level {weapon.level}</p>
            <p className="text-purple-400 text-sm mt-1">Rank {weapon.rank}</p>
          </div>
        </div>
      )}
    </div>
  );
}
