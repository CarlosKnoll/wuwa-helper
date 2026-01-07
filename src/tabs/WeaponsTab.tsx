import { useState, useEffect } from 'react';
import { Edit2, Save, Plus, Trash2 } from 'lucide-react';
import { Weapon } from '../types';
import { getRarityStars, safeInvoke } from '../utils';
import AddWeaponModal from '../components/AddWeaponModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function WeaponsTab({ weapons, onUpdate }: { weapons: Weapon[]; onUpdate: () => void }) {
  const [editingWeapon, setEditingWeapon] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deletingWeaponId, setDeletingWeaponId] = useState<number | null>(null);
  const [weaponForms, setWeaponForms] = useState<Record<number, {
    level: number;
    rank: number;
    equipped_on: string;
    category: string;
    notes: string;
  }>>({});

  useEffect(() => {
    const forms: Record<number, any> = {};
    weapons.forEach(weapon => {
      forms[weapon.id] = {
        level: weapon.level,
        rank: weapon.rank,
        equipped_on: weapon.equipped_on,
        category: weapon.category,
        notes: weapon.notes || '',
      };
    });
    setWeaponForms(forms);
  }, [weapons]);

  const handleSaveWeapon = async (weapon: Weapon) => {
    try {
      const form = weaponForms[weapon.id];
      
      // Enforce limits
      const level = Math.max(1, Math.min(90, form.level));
      const rank = Math.max(1, Math.min(5, form.rank));
      
      if (form.level !== level) {
        alert('Level must be between 1 and 90. Value has been adjusted.');
      }
      if (form.rank !== rank) {
        alert('Rank must be between 1 and 5. Value has been adjusted.');
      }
      
      await safeInvoke('update_weapon', {
        id: weapon.id,
        level: level,
        rank: rank,
        equippedOn: form.equipped_on,
        category: form.category,
        notes: form.notes || null,
      });
      setEditingWeapon(null);
      onUpdate();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const handleDeleteClick = (weapon: Weapon) => {
    setDeleteConfirm({ id: weapon.id, name: weapon.weapon_name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeletingWeaponId(deleteConfirm.id);
      await safeInvoke('delete_weapon', { id: deleteConfirm.id });
      onUpdate();
    } catch (err) {
      alert('Failed to delete weapon: ' + err);
    } finally {
      setDeletingWeaponId(null);
      setDeleteConfirm(null);
    }
  };

  const sortedWeapons = [...weapons].sort((a, b) => {
    if (a.category !== b.category) return a.category === 'leveled' ? -1 : 1;
    return b.rarity - a.rarity;
  });

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Weapon"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />

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
          const form = weaponForms[weapon.id] || { level: weapon.level, rank: weapon.rank, equipped_on: weapon.equipped_on, category: weapon.category, notes: weapon.notes || '' };

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
                    <>
                      <button 
                        onClick={() => setEditingWeapon(weapon.id)} 
                        className="p-1 bg-cyan-500 hover:bg-cyan-600 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(weapon)}
                        disabled={deletingWeaponId === weapon.id}
                        className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleSaveWeapon(weapon)} 
                      className="p-1 bg-green-500 hover:bg-green-600 rounded transition-colors"
                    >
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
                      min="1"
                      max="90"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Refinement</label>
                    <input
                      type="number"
                      value={form.rank}
                      onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, rank: parseInt(e.target.value) || 1}})}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                      min="1"
                      max="5"
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
                  <div>
                    <label className="text-xs text-slate-400">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, category: e.target.value}})}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                    >
                      <option value="owned">Owned</option>
                      <option value="leveled">Leveled</option>
                    </select>
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