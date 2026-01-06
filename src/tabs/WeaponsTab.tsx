import React, { useState, useEffect } from 'react';
import { Edit2, Save, Plus } from 'lucide-react';
import { getRarityStars, safeInvoke } from '../utils';
import AddWeaponModal from '../components/AddWeaponModal';

export default function WeaponsTab({ weapons, onUpdate }: { weapons: Weapon[]; onUpdate: () => void }) {
  const [editingWeapon, setEditingWeapon] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [weaponForms, setWeaponForms] = useState<Record<number, {
    level: number;
    rank: number;
    equipped_on: string;
    notes: string;
  }>>({});

  useEffect(() => {
    const forms: Record<number, any> = {};
    weapons.forEach(weapon => {
      forms[weapon.id] = {
        level: weapon.level,
        rank: weapon.rank,
        equipped_on: weapon.equipped_on,
        notes: weapon.notes || '',
      };
    });
    setWeaponForms(forms);
  }, [weapons]);

  const handleSaveWeapon = async (weapon: Weapon) => {
    try {
      const form = weaponForms[weapon.id];
      await safeInvoke('update_weapon', {
        id: weapon.id,
        level: form.level,
        rank: form.rank,
        equippedOn: form.equipped_on,
        notes: form.notes || null,
      });
      setEditingWeapon(null);
      onUpdate();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const sortedWeapons = [...weapons].sort((a, b) => {
    if (a.category !== b.category) return a.category === 'leveled' ? -1 : 1;
    return b.rarity - a.rarity;
  });

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Weapon
        </button>
      </div>

      {/* Weapons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedWeapons.map((weapon) => {
          const isEditing = editingWeapon === weapon.id;
          const form = weaponForms[weapon.id] || { level: weapon.level, rank: weapon.rank, equipped_on: weapon.equipped_on, notes: weapon.notes || '' };

          return (
            <div key={weapon.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{weapon.weapon_name}</h3>
                  <p className="text-sm text-slate-400">{weapon.weapon_type}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">{getRarityStars(weapon.rarity)}</span>
                  {!isEditing ? (
                    <button onClick={() => setEditingWeapon(weapon.id)} className="p-1 bg-cyan-500 hover:bg-cyan-600 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleSaveWeapon(weapon)} className="p-1 bg-green-500 hover:bg-green-600 rounded">
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400">Level</label>
                    <input
                      type="number"
                      value={form.level}
                      onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, level: parseInt(e.target.value) || 0}})}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Refinement</label>
                    <input
                      type="number"
                      value={form.rank}
                      onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, rank: parseInt(e.target.value) || 1}})}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Equipped On</label>
                    <input
                      type="text"
                      value={form.equipped_on}
                      onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, equipped_on: e.target.value}})}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <textarea
                    value={form.notes}
                    onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, notes: e.target.value}})}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    placeholder="Weapon notes..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Level</span>
                    <span className="font-bold">{form.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Refinement</span>
                    <span className="font-bold">R{form.rank}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Equipped On</span>
                    <span className={form.equipped_on !== 'Nobody' ? 'text-cyan-400' : 'text-slate-500'}>{form.equipped_on}</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs text-center ${weapon.category === 'leveled' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {weapon.category}
                  </div>
                  {form.notes && <p className="text-xs text-slate-400 italic mt-2">{form.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Weapon Modal */}
      {showAddModal && (
        <AddWeaponModal
          onClose={() => setShowAddModal(false)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
