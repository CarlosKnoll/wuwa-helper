import { useState, useEffect, useMemo } from 'react';
import { Edit2, Save, Plus, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { Weapon } from '../types';
import { getRarityStars, safeInvoke } from '../utils';
import AddWeaponModal from '../components/AddWeaponModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAssets } from '../hooks/useAssets';

export default function WeaponsTab({ weapons, onUpdate }: { weapons: Weapon[]; onUpdate: () => void }) {
  const [editingWeapon, setEditingWeapon] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deletingWeaponId, setDeletingWeaponId] = useState<number | null>(null);
  const [equipWarnings, setEquipWarnings] = useState<Record<number, string>>({});
  const [weaponForms, setWeaponForms] = useState<Record<number, {
    level: number;
    rank: number;
    rarity: number;
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
        rarity: weapon.rarity,
        equipped_on: weapon.equipped_on,
        category: weapon.category,
        notes: weapon.notes || '',
      };
    });
    setWeaponForms(forms);
  }, [weapons]);

  const handleEquippedOnChange = (weaponId: number, newEquippedOn: string, currentWeaponName: string) => {
    const form = weaponForms[weaponId];
    
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
        const newWarnings = { ...equipWarnings };
        delete newWarnings[weaponId];
        setEquipWarnings(newWarnings);
      }
    } else {
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
      const level = Math.max(1, Math.min(90, form.level));
      const rank = Math.max(1, Math.min(5, form.rank));
      const rarity = [1, 2, 3, 4, 5].includes(form.rarity) ? form.rarity : 5;
      
      if (form.level !== level) {
        alert('Level must be between 1 and 90. Value has been adjusted.');
      }
      if (form.rank !== rank) {
        alert('Rank must be between 1 and 5. Value has been adjusted.');
      }
      if (form.rarity !== rarity) {
        alert('Rarity must be 1-5 stars. Value has been adjusted.');
      }
      
      await safeInvoke('update_weapon', {
        id: weapon.id,
        level: level,
        rank: rank,
        rarity: rarity,
        equippedOn: form.equipped_on,
        category: form.category,
        notes: form.notes || null,
      });
      
      const newWarnings = { ...equipWarnings };
      delete newWarnings[weapon.id];
      setEquipWarnings(newWarnings);
      
      setEditingWeapon(null);
      onUpdate();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const handleDeleteClick = (weapon: Weapon, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ id: weapon.id, name: weapon.weapon_name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeletingWeaponId(deleteConfirm.id);
      await safeInvoke('delete_weapon', { id: deleteConfirm.id });
      onUpdate();
    } finally {
      setDeletingWeaponId(null);
      setDeleteConfirm(null);
    }
  };

  const weaponTypes = useMemo(() => {
    const types = new Set(weapons.map(w => w.weapon_type));
    return Array.from(types).sort();
  }, [weapons]);

  const filteredAndSortedWeapons = useMemo(() => {
    let filtered = weapons.filter(weapon => {
      const matchesSearch = weapon.weapon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           weapon.equipped_on.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterWeaponType === 'all' || weapon.weapon_type === filterWeaponType;
      const matchesRarity = filterRarity === 'all' || weapon.rarity.toString() === filterRarity;
      const matchesCategory = filterCategory === 'all' || weapon.category === filterCategory;
      
      return matchesSearch && matchesType && matchesRarity && matchesCategory;
    });

    return filtered.sort((a, b) => {
      const categoryOrder: Record<string, number> = {
        'building': 0,
        'leveled': 1,
        'owned': 2
      };
      const categoryA = categoryOrder[a.category] ?? 3;
      const categoryB = categoryOrder[b.category] ?? 3;
      
      // First sort by category
      if (categoryA !== categoryB) return categoryA - categoryB;
      
      // Then sort by rarity (descending - higher rarity first)
      if (a.rarity !== b.rarity) return b.rarity - a.rarity;
      
      // Then sort by level (descending - higher level first)
      if (a.level !== b.level) return b.level - a.level;
      
      // Finally sort by name alphabetically
      return a.weapon_name.localeCompare(b.weapon_name);
    });
  }, [weapons, searchQuery, filterWeaponType, filterRarity, filterCategory]);

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

      {/* Search and Add */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search weapons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
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

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex justify-end mt-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedWeapons.map((weapon) => {
            // Ensure form exists with default values
            const form = weaponForms[weapon.id] || {
              level: weapon.level,
              rank: weapon.rank,
              equipped_on: weapon.equipped_on,
              category: weapon.category,
              notes: weapon.notes || '',
            };

            return (
              <WeaponCard
                key={weapon.id}
                weapon={weapon}
                form={form}
                isEditing={editingWeapon === weapon.id}
                isDeleting={deletingWeaponId === weapon.id}
                equipWarning={equipWarnings[weapon.id]}
                onEdit={() => setEditingWeapon(weapon.id)}
                onSave={() => handleSaveWeapon(weapon)}
                onDelete={(e) => handleDeleteClick(weapon, e)}
                onFormChange={(updates) => setWeaponForms({
                  ...weaponForms,
                  [weapon.id]: { ...form, ...updates }
                })}
                onEquippedOnChange={(newValue) => handleEquippedOnChange(weapon.id, newValue, weapon.weapon_name)}
              />
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

// Separate WeaponCard component matching CharacterCard pattern
function WeaponCard({
  weapon,
  form,
  isEditing,
  isDeleting,
  equipWarning,
  onEdit,
  onSave,
  onDelete,
  onFormChange,
  onEquippedOnChange,
}: {
  weapon: Weapon;
  form: any;
  isEditing: boolean;
  isDeleting: boolean;
  equipWarning?: string;
  onEdit: () => void;
  onSave: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onFormChange: (updates: any) => void;
  onEquippedOnChange: (value: string) => void;
}) {
  const { getAsset, isInitialized } = useAssets();
  const [weaponSrc, setWeaponSrc] = useState<string>('');
  const [weaponTypeSrc, setWeaponTypeSrc] = useState<string>('');

  // Safety check: ensure form has all required properties
  const safeForm = form || {
    level: weapon.level,
    rank: weapon.rank,
    rarity: weapon.rarity,
    equipped_on: weapon.equipped_on,
    category: weapon.category,
    notes: weapon.notes || '',
  };

  // Load weapon image
  useEffect(() => {
    if (!isInitialized) return;
    
    // Map weapon names to their file IDs based on weapon type
    // This handles cases like "Somnoire Anchor" which exists for both Sword and Pistols
    const getWeaponFilename = (name: string, type: string): string => {
      // Create a lookup key
      const key = `${name.toLowerCase()}_${type.toLowerCase()}`;
      
      // Special cases for duplicate weapon names
      const duplicateWeaponMap: Record<string, string> = {
        // Add more duplicate weapons here as needed
      };
      
      // If it's a known duplicate, use the specific ID
      if (duplicateWeaponMap[key]) {
        return duplicateWeaponMap[key];
      }
      
      // Otherwise, use the weapon name as-is
      return name;
    };
    
    // Try to load weapon portrait with correct filename
    const weaponFilename = getWeaponFilename(weapon.weapon_name, weapon.weapon_type);
    getAsset('weapon', weaponFilename).then((r) => {
      if (r) setWeaponSrc(`data:image/webp;base64,${r}`);
    });

    // Try to load weapon type icon
    const weaponTypeMap: Record<string, string> = {
      'Sword': 'sword',
      'Broadblade': 'broadblade',
      'Pistols': 'pistols',
      'Gauntlets': 'gauntlets',
      'Rectifier': 'rectifier',
    };
    
    const weaponTypeKey = weaponTypeMap[weapon.weapon_type];
    if (weaponTypeKey) {
      getAsset('weapon', `weapon_${weaponTypeKey}`).then((r) => {
        if (r) setWeaponTypeSrc(`data:image/png;base64,${r}`);
      });
    }
  }, [weapon.weapon_name, weapon.weapon_type, isInitialized, getAsset]);

  // Get border color based on rarity
  const getRarityBorderColor = (rarity: number): string => {
    switch (rarity) {
      case 5:
        return 'border-yellow-500/60';
      case 4:
        return 'border-purple-500/60';
      case 3:
        return 'border-blue-500/60';
      case 2:
        return 'border-green-500/60';
      case 1:
        return 'border-slate-500/60';
      default:
        return 'border-slate-800';
    }
  };

  // Get brighter hover border color based on rarity
  const getRarityHoverColor = (rarity: number): string => {
    switch (rarity) {
      case 5:
        return 'hover:border-yellow-400';
      case 4:
        return 'hover:border-purple-400';
      case 3:
        return 'hover:border-blue-400';
      case 2:
        return 'hover:border-green-400';
      case 1:
        return 'hover:border-slate-400';
      default:
        return 'hover:border-slate-600';
    }
  };

  const rarityBorderClass = getRarityBorderColor(weapon.rarity);
  const rarityHoverClass = getRarityHoverColor(weapon.rarity);

  return (
    <div
      onClick={isEditing ? undefined : onEdit}
      className={`bg-slate-900/50 rounded-xl border-2 transition cursor-pointer overflow-hidden ${
        !isEditing ? `${rarityHoverClass} ${rarityBorderClass}` : rarityBorderClass
      }`}
    >
      {/* Top Row: Image + Header Info */}
      <div className="flex items-start gap-2.5 p-2.5 border-b border-slate-800">
        {/* Weapon Portrait - Left Side */}
        <div className="w-16 h-16 bg-slate-800/50 flex-shrink-0 rounded">
          {weaponSrc ? (
            <img src={weaponSrc} className="w-full h-full object-cover rounded" alt={weapon.weapon_name} />
          ) : (
            <div className="w-full h-full bg-slate-700 animate-pulse rounded" />
          )}
        </div>

        {/* Header Info - Right Side */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Name and Actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm leading-tight flex-1 min-w-0 truncate">
              {weapon.weapon_name}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {weaponTypeSrc && (
                <img 
                  src={weaponTypeSrc} 
                  alt={weapon.weapon_type}
                  className="w-5 h-5 object-contain"
                  title={weapon.weapon_type}
                />
              )}
              {!isEditing ? (
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={onSave}
                  className="p-1 bg-green-500 hover:bg-green-600 rounded transition-colors"
                >
                  <Save className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          {/* Rarity */}
          <div className="text-yellow-400 text-xs leading-none mt-1">
            {getRarityStars(weapon.rarity)}
          </div>
        </div>
      </div>

      {/* Bottom Row: Stats - Two Column Grid or Edit Form */}
      <div className="p-2.5">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Level</label>
              <input
                type="number"
                value={safeForm.level}
                onChange={(e) => onFormChange({ level: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
                min="1"
                max="90"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Refinement</label>
              <input
                type="number"
                value={safeForm.rank}
                onChange={(e) => onFormChange({ rank: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
                min="1"
                max="5"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 block mb-1">Rarity</label>
              <select
                value={safeForm.rarity}
                onChange={(e) => onFormChange({ rarity: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
              >
                <option value={5}>5 Star</option>
                <option value={4}>4 Star</option>
                <option value={3}>3 Star</option>
                <option value={2}>2 Star</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 block mb-1">Equipped On</label>
              <input
                type="text"
                value={safeForm.equipped_on}
                onChange={(e) => onEquippedOnChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
              />
              {equipWarning && (
                <div className="mt-1 bg-orange-500/20 border border-orange-500/50 rounded p-1.5 text-[10px] text-orange-300 flex items-start gap-1">
                  <AlertCircle size={10} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <p>{equipWarning}</p>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 block mb-1">Category</label>
              <select
                value={safeForm.category}
                onChange={(e) => onFormChange({ category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
              >
                <option value="building">Building</option>
                <option value="leveled">Leveled</option>
                <option value="owned">Owned</option>
              </select>
            </div>
            <div className="col-span-2">
              <textarea
                value={safeForm.notes}
                onChange={(e) => onFormChange({ notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
                placeholder="Notes..."
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div className="flex gap-1.5">
              <span className="text-slate-400">Level</span>
              <span className="font-bold">{safeForm.level}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-slate-400">Refinement</span>
              <span className="font-bold">R{safeForm.rank}</span>
            </div>
            <div className="col-span-2 flex gap-1.5">
              <span className="text-slate-400">Equipped On</span>
              <span className={safeForm.equipped_on !== 'Nobody' ? 'text-cyan-400' : 'text-slate-500'}>
                {safeForm.equipped_on}
              </span>
            </div>
            <div className="col-span-2">
              <div
                className={`px-2 py-1 rounded text-xs text-center font-semibold ${
                  weapon.category === 'building'
                    ? 'bg-orange-500/20 text-orange-400'
                    : weapon.category === 'leveled'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {weapon.category.charAt(0).toUpperCase() + weapon.category.slice(1)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}