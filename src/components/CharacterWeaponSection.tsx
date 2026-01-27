import { useState, useEffect } from 'react';
import { Edit2, Save, X, Sword, AlertCircle } from 'lucide-react';
import { Weapon, CharacterWeaponSectionProps, Character } from '../types';
import { safeInvoke, getRarityStars } from '../utils';

export default function CharacterWeaponSection({
  weapon,
  characterId,
  onUpdate
}: CharacterWeaponSectionProps) {
  const [editing, setEditing] = useState(false);
  const [availableWeapons, setAvailableWeapons] = useState<Weapon[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [selectedWeaponWarning, setSelectedWeaponWarning] = useState<string | null>(null);
  const [form, setForm] = useState({
    weapon_name: weapon?.weapon_name || '',
    rarity: weapon?.rarity || 5,
    level: weapon?.level || 90,
    rank: weapon?.rank || 1,
    notes: weapon?.notes || '',
  });

  useEffect(() => {
    loadCurrentCharacter();
  }, [characterId]);

  useEffect(() => {
    if (editing) {
      loadAvailableWeapons();
    }
  }, [editing]);

  const loadCurrentCharacter = async () => {
    try {
      const characters = await safeInvoke('get_all_characters') as Character[];
      const character = characters.find(c => c.id === characterId);
      setCurrentCharacter(character || null);
    } catch (err) {
      console.error('Failed to load character:', err);
    }
  };

  const loadAvailableWeapons = async () => {
    try {
      const weapons = await safeInvoke('get_all_weapons') as Weapon[];
      // Filter weapons by matching weapon type if character is loaded
      if (currentCharacter) {
        const filtered = weapons.filter(w => w.weapon_type === currentCharacter.weapon_type);
        setAvailableWeapons(filtered);
      } else {
        setAvailableWeapons(weapons);
      }
    } catch (err) {
      console.error('Failed to load weapons:', err);
    }
  };

  const handleWeaponSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeapon = availableWeapons.find(w => w.weapon_name === e.target.value);
    if (selectedWeapon) {
      // Check if weapon is equipped on another character
      if (selectedWeapon.equipped_on !== 'Nobody' && selectedWeapon.equipped_on !== currentCharacter?.character_name) {
        setSelectedWeaponWarning(`This will unequip ${selectedWeapon.weapon_name} from ${selectedWeapon.equipped_on}`);
      } else {
        setSelectedWeaponWarning(null);
      }
      
      setForm({
        weapon_name: selectedWeapon.weapon_name,
        rarity: selectedWeapon.rarity,
        level: selectedWeapon.level,
        rank: selectedWeapon.rank,
        notes: selectedWeapon.notes || '',
      });
    } else if (e.target.value === 'None') {
      setSelectedWeaponWarning(null);
      setForm({
        weapon_name: 'None',
        rarity: 5,
        level: 1,
        rank: 1,
        notes: '',
      });
    }
  };

  const handleSave = async () => {
    try {
      await safeInvoke('update_character_weapon', {
        characterId,
        weaponName: form.weapon_name,
        rarity: form.weapon_name === 'None' ? null : (form.rarity || null),
        level: form.weapon_name === 'None' ? null : (form.level || null),
        rank: form.weapon_name === 'None' ? null : (form.rank || null),
        notes: form.notes || null,
      });
      setEditing(false);
      setSelectedWeaponWarning(null);
      await onUpdate();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setSelectedWeaponWarning(null);
    setForm({
      weapon_name: weapon?.weapon_name || '',
      rarity: weapon?.rarity || 5,
      level: weapon?.level || 90,
      rank: weapon?.rank || 1,
      notes: weapon?.notes || '',
    });
  };

  if (!weapon) return null;

  // Group weapons by availability
  const equippedWeapons = availableWeapons.filter(w => 
    w.equipped_on !== 'Nobody' && w.equipped_on !== currentCharacter?.character_name
  );
  const availableForEquip = availableWeapons.filter(w => 
    w.equipped_on === 'Nobody' || w.equipped_on === currentCharacter?.character_name
  );

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
          {/* Character weapon type info */}
          {currentCharacter && (
            <div className="bg-slate-700/50 rounded p-2 text-sm text-slate-300 flex items-center gap-2">
              <AlertCircle size={16} className="text-cyan-400" />
              <span>Showing {currentCharacter.weapon_type} weapons for {currentCharacter.character_name}</span>
            </div>
          )}

          {/* Weapon swap warning */}
          {selectedWeaponWarning && (
            <div className="bg-orange-500/20 border border-orange-500/50 rounded p-3 text-sm text-orange-300 flex items-start gap-2">
              <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Weapon Swap</p>
                <p>{selectedWeaponWarning}</p>
              </div>
            </div>
          )}

          {/* Weapon Selection Dropdown */}
          <div>
            <label className="text-sm text-slate-400">Select from Inventory</label>
            <select
              value={form.weapon_name}
              onChange={handleWeaponSelect}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="None">No Weapon</option>
              
              {availableForEquip.length > 0 && (
                <optgroup label="Available Weapons">
                  {availableForEquip.map(w => (
                    <option key={w.id} value={w.weapon_name}>
                      {w.weapon_name} ({getRarityStars(w.rarity)}) - Lv.{w.level} R{w.rank}
                      {w.equipped_on === currentCharacter?.character_name ? ' [Currently Equipped]' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              
              {equippedWeapons.length > 0 && (
                <optgroup label="Equipped on Other Characters">
                  {equippedWeapons.map(w => (
                    <option key={w.id} value={w.weapon_name}>
                      {w.weapon_name} ({getRarityStars(w.rarity)}) - Lv.{w.level} R{w.rank} [on {w.equipped_on}]
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Changing weapon will automatically update the Weapons tab
            </p>
          </div>

          {/* Manual Entry (only show if not selecting from inventory) */}
          {form.weapon_name !== 'None' && !availableWeapons.find(w => w.weapon_name === form.weapon_name) && (
            <>
              <div>
                <label className="text-sm text-slate-400">Custom Weapon Name</label>
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
            </>
          )}

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
            {weapon.weapon_name !== 'None' && weapon.rarity && (
              <p className="text-sm text-yellow-400 mt-1">{getRarityStars(weapon.rarity)}</p>
            )}
            {form.notes && <p className="text-sm text-slate-400 italic mt-2">{form.notes}</p>}
          </div>
          {weapon.weapon_name !== 'None' && (
            <div className="text-right">
              <p className="text-cyan-400 font-semibold">Level {weapon.level}</p>
              <p className="text-purple-400 text-sm mt-1">Rank {weapon.rank}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}