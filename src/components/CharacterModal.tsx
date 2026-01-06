import React, { useState, useEffect } from 'react';
import { Sword,Shield, Zap, Edit2, X, Save } from 'lucide-react';
import { getElementColor, safeInvoke, getRarityStars, getBuildStatusColor } from '../utils';

export default function CharacterModal({ character, onClose, onUpdate }: { character: Character; onClose: () => void; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editingTalents, setEditingTalents] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState(false);
  const [editingEchoBuild, setEditingEchoBuild] = useState(false);
  const [editingEcho, setEditingEcho] = useState<number | null>(null);
  
  const [form, setForm] = useState({ level: character.level, ascension: character.ascension, waveband: character.waveband, build_status: character.build_status, notes: character.notes || '' });
  const [talents, setTalents] = useState<CharacterTalents | null>(null);
  const [weapon, setWeapon] = useState<CharacterWeapon | null>(null);
  const [echoBuild, setEchoBuild] = useState<EchoBuild | null>(null);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [echoSubstats, setEchoSubstats] = useState<Record<number, EchoSubstat[]>>({});
  
  const [talentForm, setTalentForm] = useState({
    basic_level: 0,
    skill_level: 0,
    liberation_level: 0,
    forte_level: 0,
    intro_level: 0,
    notes: '',
  });

  const [weaponForm, setWeaponForm] = useState({
    weapon_name: '',
    rarity: 5,
    level: 90,
    rank: 1,
    notes: '',
  });

  const [echoBuildForm, setEchoBuildForm] = useState({
    set_bonus: '',
    set_effect: '',
    overall_quality: '',
    notes: '',
  });

  const [echoForms, setEchoForms] = useState<Record<number, {
    level: number;
    main_stat: string;
    main_stat_value: string;
    notes: string;
  }>>({});

  const [echoSubstatForms, setEchoSubstatForms] = useState<Record<number, EchoSubstat[]>>({});

  useEffect(() => { loadDetails(); }, []);

  const loadDetails = async () => {
    try {
      const [t, w, b] = await Promise.all([
        safeInvoke('get_character_talents', { characterId: character.id }),
        safeInvoke('get_character_weapon', { characterId: character.id }),
        safeInvoke('get_echo_build', { characterId: character.id }),
      ]);
      setTalents(t as CharacterTalents | null);
      setWeapon(w as CharacterWeapon | null);
      setEchoBuild(b as EchoBuild | null);
      
      if (t) {
        setTalentForm({
          basic_level: (t as CharacterTalents).basic_level || 0,
          skill_level: (t as CharacterTalents).skill_level || 0,
          liberation_level: (t as CharacterTalents).liberation_level || 0,
          forte_level: (t as CharacterTalents).forte_level || 0,
          intro_level: (t as CharacterTalents).intro_level || 0,
          notes: (t as CharacterTalents).notes || '',
        });
      }

      if (w) {
        setWeaponForm({
          weapon_name: (w as CharacterWeapon).weapon_name,
          rarity: (w as CharacterWeapon).rarity || 5,
          level: (w as CharacterWeapon).level || 90,
          rank: (w as CharacterWeapon).rank || 1,
          notes: (w as CharacterWeapon).notes || '',
        });
      }

      if (b) {
        setEchoBuildForm({
          set_bonus: (b as EchoBuild).set_bonus || '',
          set_effect: (b as EchoBuild).set_effect || '',
          overall_quality: (b as EchoBuild).overall_quality || '',
          notes: (b as EchoBuild).notes || '',
        });

        const echoesData = await safeInvoke('get_echoes', { buildId: (b as EchoBuild).id }) as Echo[];
        setEchoes(echoesData);
        
        const forms: Record<number, any> = {};
        const substatsMap: Record<number, EchoSubstat[]> = {};
        
        for (const echo of echoesData) {
          forms[echo.id] = {
            level: echo.level || 0,
            main_stat: echo.main_stat || '',
            main_stat_value: echo.main_stat_value || '',
            notes: echo.notes || '',
          };
          const substats = await safeInvoke('get_echo_substats', { echoId: echo.id }) as EchoSubstat[];
          substatsMap[echo.id] = substats;
        }
        
        setEchoForms(forms);
        setEchoSubstats(substatsMap);
        setEchoSubstatForms(JSON.parse(JSON.stringify(substatsMap))); // Deep copy for editing
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSave = async () => {
    try {
      await safeInvoke('update_character', { id: character.id, level: form.level, ascension: form.ascension, waveband: form.waveband, buildStatus: form.build_status, notes: form.notes || null });
      setEditing(false);
      onUpdate();
    } catch (err) {
      alert('Failed: ' + err);
    }
  };

  const handleSaveTalents = async () => {
    try {
      await safeInvoke('update_character_talents', {
        characterId: character.id,
        basicLevel: talentForm.basic_level || null,
        skillLevel: talentForm.skill_level || null,
        liberationLevel: talentForm.liberation_level || null,
        forteLevel: talentForm.forte_level || null,
        introLevel: talentForm.intro_level || null,
        notes: talentForm.notes || null,
      });
      setEditingTalents(false);
      await loadDetails();
    } catch (err) {
      alert('Failed to update talents: ' + err);
    }
  };

  const handleSaveWeapon = async () => {
    try {
      await safeInvoke('update_character_weapon', {
        characterId: character.id,
        weaponName: weaponForm.weapon_name,
        rarity: weaponForm.rarity || null,
        level: weaponForm.level || null,
        rank: weaponForm.rank || null,
        notes: weaponForm.notes || null,
      });
      setEditingWeapon(false);
      await loadDetails();
    } catch (err) {
      alert('Failed to update weapon: ' + err);
    }
  };

  const handleSaveEchoBuild = async () => {
    if (!echoBuild) return;
    try {
      await safeInvoke('update_echo_build', {
        id: echoBuild.id,
        setBonus: echoBuildForm.set_bonus || null,
        setEffect: echoBuildForm.set_effect || null,
        overallQuality: echoBuildForm.overall_quality || null,
        notes: echoBuildForm.notes || null,
      });
      setEditingEchoBuild(false);
      await loadDetails();
    } catch (err) {
      alert('Failed to update echo build: ' + err);
    }
  };

  const handleSaveEcho = async (echoId: number) => {
    try {
      const form = echoForms[echoId];
      await safeInvoke('update_echo', {
        id: echoId,
        level: form.level || null,
        mainStat: form.main_stat || null,
        mainStatValue: form.main_stat_value || null,
        notes: form.notes || null,
      });
      
      // Save substats
      const substats = echoSubstatForms[echoId] || [];
      for (const substat of substats) {
        await safeInvoke('update_echo_substat', {
          id: substat.id,
          statName: substat.stat_name,
          statValue: substat.stat_value,
        });
      }
      
      setEditingEcho(null);
      await loadDetails();
    } catch (err) {
      alert('Failed to update echo: ' + err);
    }
  };

  const buildStatusOptions = ['Hyperinvested', 'High investment', 'Solid investment', 'Enough investment', 'Building', 'Medium investment', 'Low investment', 'Barely built', 'Not built'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-start justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold">{character.character_name}</h2>
            {character.variant && <p className="text-slate-400">{character.variant}</p>}
            <span className={`inline-block px-3 py-1 rounded mt-2 ${getElementColor(character.element)}`}>{character.element}</span>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg"><Edit2 className="w-5 h-5" /></button>
            ) : (
              <button onClick={handleSave} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg"><Save className="w-5 h-5" /></button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Level</div>
              {editing ? (
                <input type="number" value={form.level} onChange={e => setForm({...form, level: parseInt(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm" />
              ) : (
                <div className="font-bold">{form.level}/{form.ascension * 10 + 20}</div>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Ascension</div>
              {editing ? (
                <input type="number" value={form.ascension} onChange={e => setForm({...form, ascension: parseInt(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm" />
              ) : (
                <div className="font-bold">{form.ascension}</div>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Waveband</div>
              {editing ? (
                <input type="number" value={form.waveband} onChange={e => setForm({...form, waveband: parseInt(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm" />
              ) : (
                <div className="font-bold">S{form.waveband}</div>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Weapon Type</div>
              <div className="font-bold">{character.weapon_type}</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Build Status</div>
            {editing ? (
              <select value={form.build_status} onChange={e => setForm({...form, build_status: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2">
                {buildStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <div className={`inline-block px-4 py-2 rounded ${getBuildStatusColor(form.build_status)}`}>{form.build_status}</div>
            )}
          </div>

          {talents && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400" />Talents</h3>
                {!editingTalents ? (
                  <button onClick={() => setEditingTalents(true)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSaveTalents} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm">
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-4">
                {['basic_level', 'skill_level', 'liberation_level', 'forte_level', 'intro_level'].map((key, idx) => {
                  const labels = ['Basic', 'Skill', 'Liberation', 'Forte', 'Intro'];
                  return (
                    <div key={key} className="text-center">
                      <div className="text-xs text-slate-400 mb-1">{labels[idx]}</div>
                      {editingTalents ? (
                        <input
                          type="number"
                          value={talentForm[key as keyof typeof talentForm] as number}
                          onChange={e => setTalentForm({...talentForm, [key]: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center text-lg font-bold text-cyan-400"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-cyan-400">{talentForm[key as keyof typeof talentForm] || 0}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {editingTalents && (
                <textarea
                  value={talentForm.notes}
                  onChange={e => setTalentForm({...talentForm, notes: e.target.value})}
                  className="w-full mt-3 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="Talent notes..."
                />
              )}
            </div>
          )}

          {weapon && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><Sword className="w-5 h-5 text-cyan-400" />Weapon</h3>
                {!editingWeapon ? (
                  <button onClick={() => setEditingWeapon(true)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSaveWeapon} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm">
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editingWeapon ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Weapon Name</label>
                    <input
                      type="text"
                      value={weaponForm.weapon_name}
                      onChange={e => setWeaponForm({...weaponForm, weapon_name: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">Rarity</label>
                      <input
                        type="number"
                        value={weaponForm.rarity}
                        onChange={e => setWeaponForm({...weaponForm, rarity: parseInt(e.target.value) || 5})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Level</label>
                      <input
                        type="number"
                        value={weaponForm.level}
                        onChange={e => setWeaponForm({...weaponForm, level: parseInt(e.target.value) || 90})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rank</label>
                      <input
                        type="number"
                        value={weaponForm.rank}
                        onChange={e => setWeaponForm({...weaponForm, rank: parseInt(e.target.value) || 1})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1"
                      />
                    </div>
                  </div>
                  <textarea
                    value={weaponForm.notes}
                    onChange={e => setWeaponForm({...weaponForm, notes: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                    placeholder="Weapon notes..."
                  />
                </div>
              ) : (
                <>
                  <div className="font-bold text-lg">{weaponForm.weapon_name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {weaponForm.rarity && <span className="text-yellow-400">{getRarityStars(weaponForm.rarity)}</span>}
                    <span className="text-slate-400">Level {weaponForm.level}</span>
                    <span className="text-slate-400">R{weaponForm.rank}</span>
                  </div>
                  {weaponForm.notes && <p className="text-sm text-slate-400 mt-2 italic">{weaponForm.notes}</p>}
                </>
              )}
            </div>
          )}

          {echoBuild && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Echo Build</h3>
                {!editingEchoBuild ? (
                  <button onClick={() => setEditingEchoBuild(true)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSaveEchoBuild} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm">
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editingEchoBuild ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Set Bonus</label>
                    <input
                      type="text"
                      value={echoBuildForm.set_bonus}
                      onChange={e => setEchoBuildForm({...echoBuildForm, set_bonus: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Set Effect</label>
                    <textarea
                      value={echoBuildForm.set_effect}
                      onChange={e => setEchoBuildForm({...echoBuildForm, set_effect: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Overall Quality</label>
                    <input
                      type="text"
                      value={echoBuildForm.overall_quality}
                      onChange={e => setEchoBuildForm({...echoBuildForm, overall_quality: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 text-sm"
                    />
                  </div>
                  <textarea
                    value={echoBuildForm.notes}
                    onChange={e => setEchoBuildForm({...echoBuildForm, notes: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                    placeholder="Build notes..."
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {echoBuildForm.set_bonus && <div><div className="text-sm text-slate-400">Set Bonus</div><div className="font-medium">{echoBuildForm.set_bonus}</div></div>}
                  {echoBuildForm.set_effect && <div><div className="text-sm text-slate-400">Set Effect</div><div className="text-sm">{echoBuildForm.set_effect}</div></div>}
                  {echoBuildForm.overall_quality && <div><div className="text-sm text-slate-400">Overall Quality</div><div className="font-medium text-cyan-400">{echoBuildForm.overall_quality}</div></div>}
                  {echoBuildForm.notes && <p className="text-sm text-slate-400 italic">{echoBuildForm.notes}</p>}
                </div>
              )}

              {echoes.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-slate-400 font-medium">Echoes ({echoes.length})</div>
                  {echoes.map(echo => {
                    const isEditingEcho = editingEcho === echo.id;
                    const echoForm = echoForms[echo.id] || { level: echo.level || 0, main_stat: echo.main_stat || '', main_stat_value: echo.main_stat_value || '', notes: echo.notes || '' };
                    
                    return (
                      <div key={echo.id} className="bg-slate-900/50 rounded p-3 border border-slate-700">
                        <div className="flex justify-between mb-2">
                          <div>
                            <div className="font-medium">{echo.echo_name}</div>
                            <div className="flex gap-2 mt-1 text-sm text-slate-400">
                              {echo.cost && <span>Cost: {echo.cost}</span>}
                              {echo.rarity && <span>{getRarityStars(echo.rarity)}</span>}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {!isEditingEcho ? (
                              <>
                                {echoForm.main_stat && (
                                  <div className="text-right">
                                    <div className="text-sm text-cyan-400">{echoForm.main_stat}</div>
                                    <div className="text-xs text-slate-400">{echoForm.main_stat_value}</div>
                                  </div>
                                )}
                                <button onClick={() => setEditingEcho(echo.id)} className="p-1 bg-cyan-500 hover:bg-cyan-600 rounded text-xs">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleSaveEcho(echo.id)} className="p-1 bg-green-500 hover:bg-green-600 rounded text-xs">
                                <Save className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {isEditingEcho && (
                          <div className="space-y-2 mb-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-slate-500">Level</label>
                                <input
                                  type="number"
                                  value={echoForm.level}
                                  onChange={e => setEchoForms({...echoForms, [echo.id]: {...echoForm, level: parseInt(e.target.value) || 0}})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500">Main Stat</label>
                                <input
                                  type="text"
                                  value={echoForm.main_stat}
                                  onChange={e => setEchoForms({...echoForms, [echo.id]: {...echoForm, main_stat: e.target.value}})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500">Value</label>
                                <input
                                  type="text"
                                  value={echoForm.main_stat_value}
                                  onChange={e => setEchoForms({...echoForms, [echo.id]: {...echoForm, main_stat_value: e.target.value}})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                                />
                              </div>
                            </div>
                            <textarea
                              value={echoForm.notes}
                              onChange={e => setEchoForms({...echoForms, [echo.id]: {...echoForm, notes: e.target.value}})}
                              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                              placeholder="Echo notes..."
                            />
                          </div>
                        )}
                        
                        {isEditingEcho ? (
                          <div className="mt-2 pt-2 border-t border-slate-700">
                            <div className="text-xs text-slate-500 mb-2">Substats (editable):</div>
                            <div className="space-y-2">
                              {(echoSubstatForms[echo.id] || []).map((sub, idx) => (
                                <div key={sub.id} className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={sub.stat_name}
                                    onChange={e => {
                                      const newSubstats = [...echoSubstatForms[echo.id]];
                                      newSubstats[idx] = {...sub, stat_name: e.target.value};
                                      setEchoSubstatForms({...echoSubstatForms, [echo.id]: newSubstats});
                                    }}
                                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                                    placeholder="Stat name"
                                  />
                                  <input
                                    type="text"
                                    value={sub.stat_value}
                                    onChange={e => {
                                      const newSubstats = [...echoSubstatForms[echo.id]];
                                      newSubstats[idx] = {...sub, stat_value: e.target.value};
                                      setEchoSubstatForms({...echoSubstatForms, [echo.id]: newSubstats});
                                    }}
                                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                                    placeholder="Value"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          echoSubstats[echo.id] && echoSubstats[echo.id].length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700">
                              <div className="text-xs text-slate-500 mb-1">Substats:</div>
                              <div className="grid grid-cols-2 gap-1">
                                {echoSubstats[echo.id].map(sub => (
                                  <div key={sub.id} className="text-xs text-slate-400">
                                    {sub.stat_name}: <span className="text-white">{sub.stat_value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                        
                        {!isEditingEcho && echoForm.notes && (
                          <p className="text-xs text-slate-400 italic mt-2">{echoForm.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {editing && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Notes</div>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 min-h-[80px] focus:outline-none focus:border-cyan-500" placeholder="Add notes..." />
            </div>
          )}

          {!editing && form.notes && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-bold mb-2">Notes</h3>
              <p className="text-slate-300">{form.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}