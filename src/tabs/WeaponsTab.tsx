import { useState, useEffect, useMemo } from 'react';
import { Edit2, Save, Plus, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { Weapon } from '../types';
import { getRarityStars, safeInvoke } from '../utils';
import AddWeaponModal from '../components/AddWeaponModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function WeaponsTab({ weapons, onUpdate }: { weapons: Weapon[]; onUpdate: () => void }) {
  const [editingWeapon, setEditingWeapon] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deletingWeaponId, setDeletingWeaponId] = useState<number | null>(null);
  const [equipWarnings, setEquipWarnings] = useState<Record<number, string>>({});
  const [weaponForms, setWeaponForms] = useState<Record<number, {
    level: number;
    rank: number;
    equipped_on: string;
    category: string;
    notes: string;
  }>>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWeaponType, setFilterWeaponType] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const handleEquippedOnChange = (weaponId: number, newEquippedOn: string, currentWeaponName: string) => {
    const form = weaponForms[weaponId];
    
    // Check if the character already has a weapon equipped
    if (newEquippedOn !== 'Nobody') {
      const characterCurrentWeapon = weapons.find(w => 
        w.equipped_on === newEquippedOn && w.weapon_name !== currentWeaponName
      );
      
      if (characterCurrentWeapon) {
        setEquipWarnings({
          ...equipWarnings,
          [weaponId]: `${newEquippedOn} currently has ${characterCurrentWeapon.weapon_name} equipped. It will be unequipped.`
        });
      } else {
        // Remove warning if no conflict
        const newWarnings = { ...equipWarnings };
        delete newWarnings[weaponId];
        setEquipWarnings(newWarnings);
      }
    } else {
      // Remove warning if setting to Nobody
      const newWarnings = { ...equipWarnings };
      delete newWarnings[weaponId];
      setEquipWarnings(newWarnings);
    }
    
    setWeaponForms({
      ...weaponForms,
      [weaponId]: { ...form, equipped_on: newEquippedOn }
    });
  };

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
      
      // Clear warning for this weapon
      const newWarnings = { ...equipWarnings };
      delete newWarnings[weapon.id];
      setEquipWarnings(newWarnings);
      
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

  // Get unique weapon types from weapons array
  const weaponTypes = useMemo(() => {
    const types = new Set(weapons.map(w => w.weapon_type));
    return Array.from(types).sort();
  }, [weapons]);

  // Filter and sort weapons
  const filteredAndSortedWeapons = useMemo(() => {
    let filtered = weapons.filter(weapon => {
      // Search filter
      const matchesSearch = weapon.weapon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           weapon.equipped_on.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Weapon type filter
      const matchesType = filterWeaponType === 'all' || weapon.weapon_type === filterWeaponType;
      
      // Rarity filter
      const matchesRarity = filterRarity === 'all' || weapon.rarity.toString() === filterRarity;
      
      // Category filter
      const matchesCategory = filterCategory === 'all' || weapon.category === filterCategory;
      
      return matchesSearch && matchesType && matchesRarity && matchesCategory;
    });

    // Sort: Building > Leveled > Owned, then by rarity
    return filtered.sort((a, b) => {
      // First priority: category (building > leveled > owned)
      const categoryOrder: Record<string, number> = {
        'building': 0,
        'leveled': 1,
        'owned': 2
      };
      const categoryA = categoryOrder[a.category] ?? 3;
      const categoryB = categoryOrder[b.category] ?? 3;
      
      if (categoryA !== categoryB) return categoryA - categoryB;
      
      // Second priority: rarity (descending)
      return b.rarity - a.rarity;
    });
  }, [weapons, searchQuery, filterWeaponType, filterRarity, filterCategory]);

  // Count active filters
  const activeFiltersCount = [
    filterWeaponType !== 'all',
    filterRarity !== 'all',
    filterCategory !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterWeaponType('all');
    setFilterRarity('all');
    setFilterCategory('all');
  };

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

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Weapons Inventory</h2>
          <p className="text-slate-400 text-sm mt-1">
            {filteredAndSortedWeapons.length} {filteredAndSortedWeapons.length === 1 ? 'weapon' : 'weapons'}
            {activeFiltersCount > 0 && ` (${weapons.length} total)`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Weapon
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by weapon name or equipped character..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weapon Type Filter */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Weapon Type</label>
            <select
              value={filterWeaponType}
              onChange={(e) => setFilterWeaponType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">All Types</option>
              {weaponTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Rarity</label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">All Rarities</option>
              <option value="5">5★ Legendary</option>
              <option value="4">4★ Epic</option>
              <option value="3">3★ Rare</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="building">Building</option>
              <option value="leveled">Leveled</option>
              <option value="owned">Owned</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Clear {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'}
            </button>
          </div>
        )}
      </div>

      {/* Weapons Grid */}
      {filteredAndSortedWeapons.length === 0 ? (
        <div className="bg-slate-900/50 rounded-xl p-12 border border-slate-800 text-center">
          <p className="text-slate-400 text-lg">No weapons found matching your filters</p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedWeapons.map((weapon) => {
            const isEditing = editingWeapon === weapon.id;
            const form = weaponForms[weapon.id] || { 
              level: weapon.level, 
              rank: weapon.rank, 
              equipped_on: weapon.equipped_on, 
              category: weapon.category, 
              notes: weapon.notes || '' 
            };

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
                        onChange={e => handleEquippedOnChange(weapon.id, e.target.value, weapon.weapon_name)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                      />
                      {equipWarnings[weapon.id] && (
                        <div className="mt-2 bg-orange-500/20 border border-orange-500/50 rounded p-2 text-xs text-orange-300 flex items-start gap-2">
                          <AlertCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                          <p>{equipWarnings[weapon.id]}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Category</label>
                      <select
                        value={form.category}
                        onChange={e => setWeaponForms({...weaponForms, [weapon.id]: {...form, category: e.target.value}})}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1"
                      >
                        <option value="building">Building</option>
                        <option value="leveled">Leveled</option>
                        <option value="owned">Owned</option>
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
                    <div className={`px-2 py-1 rounded text-xs text-center font-semibold ${
                      weapon.category === 'building' ? 'bg-orange-500/20 text-orange-400' :
                      weapon.category === 'leveled' ? 'bg-green-500/20 text-green-400' : 
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {weapon.category.charAt(0).toUpperCase() + weapon.category.slice(1)}
                    </div>
                    {form.notes && <p className="text-xs text-slate-400 italic mt-2">{form.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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