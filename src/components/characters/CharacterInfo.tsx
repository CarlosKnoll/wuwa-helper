import { Edit2, Save, X, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Weapon, Character } from '../../types';
import { CharacterInfoProps } from '../../props';
import { getBuildStatusColor, getBuildStatusOptions, safeInvoke, getRarityStars } from '../../utils';
import { useAssets } from '../../hooks/useAssets';
import ElementIcon from '../ElementIcon';
import WeaponTypeIcon from '../WeaponTypeIcon';

export default function CharacterInfo({
  character,
  form,
  editing,
  onEdit,
  onSave,
  onCancel,
  onChange
}: CharacterInfoProps) {
  const buildStatusOptions = getBuildStatusOptions();
  const { getAsset, isInitialized } = useAssets();
  
  // Character portrait state
  const [portraitSrc, setPortraitSrc] = useState<string>('');
  
  // Weapon section state
  const [weapon, setWeapon] = useState<any>(null);
  const [weaponSrc, setWeaponSrc] = useState<string>('');
  const [editingWeapon, setEditingWeapon] = useState(false);
  const [availableWeapons, setAvailableWeapons] = useState<Weapon[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [selectedWeaponWarning, setSelectedWeaponWarning] = useState<string | null>(null);
  const [weaponForm, setWeaponForm] = useState({
    weapon_name: '',
    rarity: 5,
    level: 90,
    rank: 1,
    notes: '',
  });

  // Load character portrait
  useEffect(() => {
    if (!isInitialized) return;
    getAsset('characters', character.character_name).then((r) => {
      if (r) setPortraitSrc(`data:image/webp;base64,${r}`);
    });
  }, [character.character_name, isInitialized, getAsset]);

  // Load weapon data
  useEffect(() => {
    loadWeaponData();
    loadCurrentCharacter();
  }, [character.id]);

  // Load weapon image when weapon changes
  useEffect(() => {
    if (!isInitialized || !weapon || weapon.weapon_name === 'None') {
      setWeaponSrc('');
      return;
    }
    
    getAsset('weapon', weapon.weapon_name).then((r) => {
      if (r) setWeaponSrc(`data:image/webp;base64,${r}`);
    });
  }, [weapon, isInitialized, getAsset]);

  const loadWeaponData = async () => {
    try {
      const w = await safeInvoke('get_character_weapon', { characterId: character.id });
      setWeapon(w);
      if (w) {
        setWeaponForm({
          weapon_name: w.weapon_name || '',
          rarity: w.rarity || 5,
          level: w.level || 90,
          rank: w.rank || 1,
          notes: w.notes || '',
        });
      }
    } catch (err) {
      console.error('Failed to load weapon:', err);
    }
  };

  const loadCurrentCharacter = async () => {
    try {
      const characters = await safeInvoke('get_all_characters') as Character[];
      const char = characters.find(c => c.id === character.id);
      setCurrentCharacter(char || null);
    } catch (err) {
      console.error('Failed to load character:', err);
    }
  };

  const loadAvailableWeapons = async () => {
    try {
      const weapons = await safeInvoke('get_all_weapons') as Weapon[];
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

  useEffect(() => {
    if (editingWeapon) {
      loadAvailableWeapons();
    }
  }, [editingWeapon]);

  const handleWeaponSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeapon = availableWeapons.find(w => w.weapon_name === e.target.value);
    if (selectedWeapon) {
      if (selectedWeapon.equipped_on !== 'Nobody' && selectedWeapon.equipped_on !== currentCharacter?.character_name) {
        setSelectedWeaponWarning(`This will unequip ${selectedWeapon.weapon_name} from ${selectedWeapon.equipped_on}`);
      } else {
        setSelectedWeaponWarning(null);
      }
      
      setWeaponForm({
        weapon_name: selectedWeapon.weapon_name,
        rarity: selectedWeapon.rarity,
        level: selectedWeapon.level,
        rank: selectedWeapon.rank,
        notes: selectedWeapon.notes || '',
      });
    } else if (e.target.value === 'None') {
      setSelectedWeaponWarning(null);
      setWeaponForm({
        weapon_name: 'None',
        rarity: 5,
        level: 1,
        rank: 1,
        notes: '',
      });
    }
  };

  const handleWeaponSave = async () => {
    try {
      await safeInvoke('update_character_weapon', {
        characterId: character.id,
        weaponName: weaponForm.weapon_name,
        rarity: weaponForm.weapon_name === 'None' ? null : (weaponForm.rarity || null),
        level: weaponForm.weapon_name === 'None' ? null : (weaponForm.level || null),
        rank: weaponForm.weapon_name === 'None' ? null : (weaponForm.rank || null),
        notes: weaponForm.notes || null,
      });
      setEditingWeapon(false);
      setSelectedWeaponWarning(null);
      await loadWeaponData();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const handleWeaponCancel = () => {
    setEditingWeapon(false);
    setSelectedWeaponWarning(null);
    if (weapon) {
      setWeaponForm({
        weapon_name: weapon.weapon_name || '',
        rarity: weapon.rarity || 5,
        level: weapon.level || 90,
        rank: weapon.rank || 1,
        notes: weapon.notes || '',
      });
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onSave();
  };

  const equippedWeapons = availableWeapons.filter(w => 
    w.equipped_on !== 'Nobody' && w.equipped_on !== currentCharacter?.character_name
  );
  const availableForEquip = availableWeapons.filter(w => 
    w.equipped_on === 'Nobody' || w.equipped_on === currentCharacter?.character_name
  );

  return (
    <div className="relative h-full flex flex-col">
      {/* Atmospheric Background similar to Forte/Echo tabs */}
      <div className="relative bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 overflow-hidden shadow-2xl flex-1 flex">
        {/* Central atmospheric glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-300/5 rounded-full blur-2xl"></div>
        
        {/* Stars/sparkles effect */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[30%] right-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[60%] left-[25%] w-0.5 h-0.5 bg-blue-200 rounded-full shadow-[0_0_3px_rgba(191,219,254,0.8)]"></div>
          <div className="absolute bottom-[25%] right-[30%] w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_3px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[45%] right-[15%] w-0.5 h-0.5 bg-blue-100 rounded-full shadow-[0_0_3px_rgba(219,234,254,0.8)]"></div>
          <div className="absolute bottom-[40%] left-[35%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
        </div>

        {/* Original Content */}
        <div className="relative z-10 grid grid-cols-[1fr_400px] gap-6 p-6 flex-1">
          {/* LEFT COLUMN - Character & Weapon Info Vertically Stacked */}
          <div className="space-y-6">
            {/* Character Section */}
            <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-lg border-2 border-slate-200/30 p-4 shadow-[0_0_20px_rgba(226,232,240,0.15)]">
              {/* Underglow effect */}
              <div className="absolute inset-20 -z-10 bg-slate-200/10 rounded-lg blur-xl"></div>
              {/* Header with Edit Button */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ElementIcon element={character.element} size="sm" />
                    <h3 className="text-xl font-bold text-white">{character.character_name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!editing ? (
                    <button onClick={onEdit} className="p-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded transition-colors">
                      <Edit2 size={16} className="text-white-400" />
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button onClick={handleSave} className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors">
                        <Save size={16} className="text-green-400" />
                      </button>
                      <button onClick={onCancel} className="p-1.5 bg-slate-600/20 hover:bg-slate-600/30 rounded transition-colors">
                        <X size={16} className="text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                {/* Level */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Level</label>
                  {editing ? (
                    <input
                      type="number"
                      value={form.level}
                      onChange={e => onChange({ ...form, level: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                      min="1"
                      max="90"
                    />
                  ) : (
                    <div className="text-white font-semibold text-sm">{character.level}/90</div>
                  )}
                </div>

                {/* Ascension */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Ascension</label>
                  {editing ? (
                    <input
                      type="number"
                      value={form.ascension}
                      onChange={e => onChange({ ...form, ascension: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                      min="0"
                      max="6"
                    />
                  ) : (
                    <div className="text-purple-400 font-semibold text-sm">{character.ascension}/6</div>
                  )}
                </div>

                {/* Waveband */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Waveband</label>
                  {editing ? (
                    <input
                      type="number"
                      value={form.waveband}
                      onChange={e => onChange({ ...form, waveband: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                      min="0"
                      max="6"
                    />
                  ) : (
                    <div className="text-yellow-400 font-semibold text-sm">S{character.waveband}</div>
                  )}
                </div>

                {/* Build Status */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Status</label>
                  {editing ? (
                    <select
                      value={form.build_status}
                      onChange={e => onChange({ ...form, build_status: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                    >
                      {buildStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getBuildStatusColor(character.build_status)}`}>
                      {character.build_status}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {(editing || form.notes) && (
                  <div className="col-span-4">
                    <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                    {editing ? (
                      <textarea
                        value={form.notes}
                        onChange={e => onChange({ ...form, notes: e.target.value })}
                        className="w-full bg-slate-800/30 border border-slate-700/50 rounded px-2 py-1.5 min-h-[60px] focus:outline-none focus:border-white text-white text-xs"
                        placeholder="Add notes..."
                      />
                    ) : (
                      <p className="text-slate-300 text-xs leading-relaxed">{form.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Weapon Section */}
            <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-lg border-2 border-slate-200/30 p-4 shadow-[0_0_20px_rgba(226,232,240,0.15)]">
              {/* Underglow effect */}
              <div className="absolute inset-20 -z-10 bg-slate-200/10 rounded-lg blur-xl"></div>
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <WeaponTypeIcon weaponType={character.weapon_type} size="sm" />
                  <h3 className="text-lg font-bold text-yellow-400">Weapon</h3>
                </div>
                {!editingWeapon ? (
                  <button onClick={() => setEditingWeapon(true)} className="p-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded transition-colors">
                    <Edit2 size={16} className="text-white-400" />
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button onClick={handleWeaponSave} className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors">
                      <Save size={16} className="text-green-400" />
                    </button>
                    <button onClick={handleWeaponCancel} className="p-1.5 bg-slate-600/20 hover:bg-slate-600/30 rounded transition-colors">
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>
                )}
              </div>

              {editingWeapon ? (
                <div className="space-y-3">
                  {/* Character weapon type info */}
                  {currentCharacter && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1.5 text-xs text-yellow-300 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>Showing {currentCharacter.weapon_type} weapons</span>
                    </div>
                  )}

                  {/* Weapon swap warning */}
                  {selectedWeaponWarning && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 text-xs text-red-300 flex items-start gap-1.5">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Weapon Swap</p>
                        <p>{selectedWeaponWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* Weapon Selection */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Select from Inventory</label>
                    <select
                      value={weaponForm.weapon_name}
                      onChange={handleWeaponSelect}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-500"
                    >
                      <option value="None">No Weapon</option>
                      
                      {availableForEquip.length > 0 && (
                        <optgroup label="Available Weapons">
                          {availableForEquip.map(w => (
                            <option key={w.id} value={w.weapon_name}>
                              {w.weapon_name} ({getRarityStars(w.rarity)}) - Lv.{w.level} R{w.rank}
                              {w.equipped_on === currentCharacter?.character_name ? ' [Equipped]' : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      
                      {equippedWeapons.length > 0 && (
                        <optgroup label="Equipped on Others">
                          {equippedWeapons.map(w => (
                            <option key={w.id} value={w.weapon_name}>
                              {w.weapon_name} ({getRarityStars(w.rarity)}) - Lv.{w.level} R{w.rank} [on {w.equipped_on}]
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                    <textarea
                      value={weaponForm.notes}
                      onChange={e => setWeaponForm({ ...weaponForm, notes: e.target.value })}
                      className="w-full bg-slate-800/30 border border-slate-700/50 rounded px-2 py-1.5 min-h-[60px] text-white text-xs focus:outline-none focus:border-yellow-500"
                      placeholder="Weapon notes..."
                    />
                  </div>
                </div>
              ) : weapon ? (
                <div>
                  {weapon.weapon_name !== 'None' ? (
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                      {/* Weapon Image */}
                      {weaponSrc && (
                        <div className="flex justify-center">
                          <img 
                            src={weaponSrc} 
                            alt={weapon.weapon_name}
                            className="w-28 h-28 object-contain drop-shadow-lg"
                          />
                        </div>
                      )}

                      {/* Weapon Details */}
                      <div className="space-y-2">
                        <div>
                          <div className="text-slate-400 text-xs mb-0.5">{character.weapon_type}</div>
                          <h4 className="text-base font-bold text-yellow-400">{weapon.weapon_name}</h4>
                          {weapon.rarity && (
                            <div className="text-yellow-400 text-sm">{getRarityStars(weapon.rarity)}</div>
                          )}
                        </div>

                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">⚔</span>
                            <span className="text-white font-medium">Lv. {weapon.level}/90</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">★</span>
                            <span className="text-purple-400 font-medium">R{weapon.rank}</span>
                          </div>
                        </div>

                        {weaponForm.notes && (
                          <p className="text-slate-300 text-xs leading-relaxed italic">{weaponForm.notes}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No weapon equipped
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT COLUMN - Character Portrait */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full h-[500px]">
              {portraitSrc ? (
                <img 
                  src={portraitSrc} 
                  alt={character.character_name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="w-full h-full bg-slate-800/30 rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-slate-600">Loading...</span>
                </div>
              )}
              {/* Glow effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}