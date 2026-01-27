import { useState } from 'react';
import { Trophy, Edit2, Save, X, Plus, Trash2, Star } from 'lucide-react';
import { TowerOfAdversity, TowerDetails, TowerFloor, TowerAreaEffect, TowerTeam } from '../types';
import { safeInvoke } from '../utils';

interface TowerDetailsViewProps {
  towerInfo: TowerOfAdversity | null;
  towerDetails: TowerDetails[];
  towerFloors: Record<string, TowerFloor[]>;
  towerEffects: TowerAreaEffect[];
  towerTeams: TowerTeam[];
  selectedTower: string | null;
  onTowerSelect: (tower: string | null) => void;
  onUpdate: () => void;
  onInitializeFloors?: () => void;
}

type TowerType = 'echoing' | 'resonant' | 'hazard' | null;

export default function TowerDetailsView({
  towerInfo,
  towerDetails,
  towerFloors,
  towerEffects,
  towerTeams,
  selectedTower,
  onTowerSelect,
  onUpdate,
  onInitializeFloors
}: TowerDetailsViewProps) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingTower, setEditingTower] = useState(false);
  const [editingEffect, setEditingEffect] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [addingTeam, setAddingTeam] = useState(false);
  const [saving, setSaving] = useState(false);

  // Overview edit states
  const [editTotalStars, setEditTotalStars] = useState(0);
  const [editAstriteEarned, setEditAstriteEarned] = useState(0);
  const [editOverviewNotes, setEditOverviewNotes] = useState('');

  // Tower detail edit states
  const [editStarsAchieved, setEditStarsAchieved] = useState(0);
  const [editTowerNotes, setEditTowerNotes] = useState('');

  // Effect edit states
  const [editFloorRange, setEditFloorRange] = useState('');
  const [editEffectDesc, setEditEffectDesc] = useState('');

  // Team edit states
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [newTeamFloor, setNewTeamFloor] = useState(1);

  const getTowerConfig = (type: string) => {
    const configs: Record<string, { name: string; color: string; bg: string; border: string; bar: string }> = {
      'echoing': { 
        name: 'Echoing Tower', 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-500/20', 
        border: 'border-cyan-500/30',
        bar: 'bg-cyan-500'
      },
      'resonant': { 
        name: 'Resonant Tower', 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/20', 
        border: 'border-emerald-500/30',
        bar: 'bg-emerald-500'
      },
      'hazard': { 
        name: 'Hazard Tower', 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        border: 'border-red-500/30',
        bar: 'bg-red-500'
      }
    };
    return configs[type] || configs['echoing'];
  };

  const startEditOverview = () => {
    if (towerInfo) {
      setEditTotalStars(towerInfo.total_stars);
      setEditAstriteEarned(towerInfo.astrite_earned);
      setEditOverviewNotes(towerInfo.notes || '');
      setEditingOverview(true);
    }
  };

  const saveOverview = async () => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_of_adversity', {
        totalStars: editTotalStars,
        astriteEarned: editAstriteEarned,
        notes: editOverviewNotes || null
      });
      setEditingOverview(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tower overview:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const startEditTower = (detail: TowerDetails) => {
    setEditStarsAchieved(detail.stars_achieved);
    setEditTowerNotes(detail.notes || '');
    setEditingTower(true);
  };

  const saveTowerDetails = async (detail: TowerDetails) => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_details', {
        id: detail.id,
        starsAchieved: editStarsAchieved,
        notes: editTowerNotes || null
      });
      setEditingTower(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tower details:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateFloorStars = async (floorId: number, stars: number) => {
    try {
      await safeInvoke('update_tower_floor_stars', {
        id: floorId,
        stars: stars
      });
      // Only reload floor data, not the entire page
      await onUpdate();
    } catch (error) {
      console.error('Failed to update floor stars:', error);
      alert('Failed to update stars');
    }
  };

  const startEditEffect = (effect: TowerAreaEffect) => {
    setEditFloorRange(effect.floor_range);
    setEditEffectDesc(effect.effect_description);
    setEditingEffect(effect.id);
  };

  const saveEffect = async (effectId: number, towerType: string) => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_area_effect', {
        id: effectId,
        towerType,
        floorRange: editFloorRange,
        effectDescription: editEffectDesc
      });
      setEditingEffect(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update effect:', error);
      alert('Failed to save effect');
    } finally {
      setSaving(false);
    }
  };

  const startEditTeam = (team: TowerTeam) => {
    setEditChar1(team.character1);
    setEditChar2(team.character2);
    setEditChar3(team.character3);
    setEditingTeam(team.id);
  };

  const saveTeam = async (id: number) => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_team', {
        id,
        character1: editChar1,
        character2: editChar2,
        character3: editChar3
      });
      setEditingTeam(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update team:', error);
      alert('Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const addNewTeam = async () => {
    if (!selectedTower) return;
    
    setSaving(true);
    try {
      await safeInvoke('add_tower_team', {
        towerType: selectedTower,
        floorNumber: newTeamFloor,
        character1: editChar1 || 'None',
        character2: editChar2 || 'None',
        character3: editChar3 || 'None'
      });
      setAddingTeam(false);
      setEditChar1('');
      setEditChar2('');
      setEditChar3('');
      setNewTeamFloor(1);
      onUpdate();
    } catch (error) {
      console.error('Failed to add team:', error);
      alert('Failed to add team');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await safeInvoke('delete_tower_team', { id });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team');
    }
  };

  const startAddTeam = () => {
    setEditChar1('');
    setEditChar2('');
    setEditChar3('');
    setNewTeamFloor(1);
    setAddingTeam(true);
  };

  const renderStarSelector = (floor: TowerFloor) => {
    const stars = [1, 2, 3];
    return (
      <div className="flex gap-1">
        {stars.map(starCount => {
          const isActive = floor.stars >= starCount;
          const isExactMatch = floor.stars === starCount;
          
          return (
            <button
              key={starCount}
              onClick={() => {
                // If clicking the current star count, clear it (set to 0)
                // Otherwise, set to the clicked count
                const newStars = isExactMatch ? 0 : starCount;
                updateFloorStars(floor.id, newStars);
              }}
              className={`p-1 rounded transition-all ${
                isActive
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-slate-600 hover:text-slate-500'
              }`}
              title={isExactMatch ? 'Click to clear stars' : `Set to ${starCount} stars`}
            >
              <Star className="w-5 h-5" fill={isActive ? 'currentColor' : 'none'} />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      {towerInfo && (
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-cyan-400" />
              Tower of Adversity Overview
            </h3>
            {!editingOverview ? (
              <button
                onClick={startEditOverview}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingOverview(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={saveOverview}
                  disabled={saving}
                  className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>

          {editingOverview ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Total Stars</label>
                <input
                  type="number"
                  value={editTotalStars}
                  onChange={(e) => setEditTotalStars(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Astrite Earned</label>
                <input
                  type="number"
                  value={editAstriteEarned}
                  onChange={(e) => setEditAstriteEarned(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Notes</label>
                <input
                  type="text"
                  value={editOverviewNotes}
                  onChange={(e) => setEditOverviewNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  placeholder="Optional notes"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400">Last Reset</p>
                <p className="text-lg font-semibold">{towerInfo.last_reset}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Stars</p>
                <p className="text-lg font-semibold text-yellow-400">{towerInfo.total_stars} / 36</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Astrite Earned</p>
                <p className="text-lg font-semibold text-cyan-400">{towerInfo.astrite_earned} / 800</p>
              </div>
              {towerInfo.notes && (
                <div className="col-span-3">
                  <p className="text-sm text-slate-400">Notes</p>
                  <p className="text-sm mt-1">{towerInfo.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tower Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {towerDetails.map((detail) => {
          const config = getTowerConfig(detail.tower_type);
          const isSelected = selectedTower === detail.tower_type;
          
          return (
            <button
              key={detail.id}
              onClick={() => onTowerSelect(detail.tower_type)}
              className={`bg-slate-900/50 rounded-xl p-6 border transition-all text-left ${
                isSelected ? `${config.border} shadow-lg` : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <h4 className={`font-bold text-lg mb-2 ${config.color}`}>{config.name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Stars:</span>
                  <span className="font-semibold text-yellow-400">
                    {detail.stars_achieved} / {detail.max_stars}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${config.bar} h-full transition-all duration-300`}
                    style={{ width: `${(detail.stars_achieved / detail.max_stars) * 100}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Tower Details */}
      {selectedTower && (
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 space-y-6">
          {(() => {
            const config = getTowerConfig(selectedTower);
            const detail = towerDetails.find(d => d.tower_type === selectedTower);
            const floors = towerFloors[selectedTower] || [];

            return (
              <>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${config.color}`}>{config.name}</h3>
                </div>

                {/* Floor Stars Grid */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Floor Progress</h4>
                  {floors.length === 0 ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
                      <p className="text-yellow-400 mb-4">
                        ⚠️ Tower floors not initialized yet!
                      </p>
                      <p className="text-sm text-slate-400 mb-4">
                        Click the button below to create floor tracking data for all towers.
                      </p>
                      {onInitializeFloors && (
                        <button
                          onClick={onInitializeFloors}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                        >
                          Initialize Tower Floors
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Add Team Modal */}
                      {addingTeam && (
                        <div className="bg-slate-700/50 rounded-lg p-4 border-2 border-dashed border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <p className={`text-sm font-semibold ${config.color}`}>
                              Add Team for Floor {newTeamFloor}
                            </p>
                            <button
                              onClick={() => setAddingTeam(false)}
                              className="p-1 hover:bg-slate-600 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Floor Number</label>
                              <input
                                type="number"
                                value={newTeamFloor}
                                onChange={(e) => setNewTeamFloor(parseInt(e.target.value) || 1)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                                min="1"
                                max="12"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={editChar1}
                                onChange={(e) => setEditChar1(e.target.value)}
                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                                placeholder="Character 1"
                              />
                              <input
                                type="text"
                                value={editChar2}
                                onChange={(e) => setEditChar2(e.target.value)}
                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                                placeholder="Character 2"
                              />
                              <input
                                type="text"
                                value={editChar3}
                                onChange={(e) => setEditChar3(e.target.value)}
                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                                placeholder="Character 3"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setAddingTeam(false)}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                onClick={addNewTeam}
                                disabled={saving}
                                className={`px-3 py-2 ${config.bg} hover:opacity-80 rounded text-sm flex items-center gap-2 ${config.color}`}
                              >
                                <Save className="w-4 h-4" />
                                Add Team
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {floors.map((floor) => {
                        const floorTeam = towerTeams.find(
                          t => t.tower_type === selectedTower && t.floor_number === floor.floor_number
                        );
                        const isEditingThisTeam = editingTeam === floorTeam?.id;

                        return (
                          <div 
                            key={floor.id}
                            className={`${config.bg} rounded-lg p-4 border ${config.border}`}
                          >
                            {/* Floor Header with Stars */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${config.color}`}>
                                  Floor {floor.floor_number}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {floor.stars === 0 ? 'Not cleared' : `${floor.stars}/3 stars`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {renderStarSelector(floor)}
                              </div>
                            </div>

                            {/* Team Display */}
                            {floorTeam ? (
                              isEditingThisTeam ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      value={editChar1}
                                      onChange={(e) => setEditChar1(e.target.value)}
                                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                                      placeholder="Char 1"
                                    />
                                    <input
                                      type="text"
                                      value={editChar2}
                                      onChange={(e) => setEditChar2(e.target.value)}
                                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                                      placeholder="Char 2"
                                    />
                                    <input
                                      type="text"
                                      value={editChar3}
                                      onChange={(e) => setEditChar3(e.target.value)}
                                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                                      placeholder="Char 3"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setEditingTeam(null)}
                                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                                    >
                                      <X className="w-3 h-3" />
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => saveTeam(floorTeam.id)}
                                      disabled={saving}
                                      className={`px-2 py-1 ${config.bg} hover:opacity-80 rounded text-xs flex items-center gap-1 ${config.color}`}
                                    >
                                      <Save className="w-3 h-3" />
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-2 flex-wrap">
                                    <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                                      {floorTeam.character1}
                                    </span>
                                    <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                                      {floorTeam.character2}
                                    </span>
                                    <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                                      {floorTeam.character3}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => startEditTeam(floorTeam)}
                                      className="p-1 hover:bg-slate-600 rounded transition-colors"
                                      title="Edit team"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteTeam(floorTeam.id)}
                                      className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
                                      title="Delete team"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )
                            ) : (
                              <button
                                onClick={() => {
                                  setEditChar1('');
                                  setEditChar2('');
                                  setEditChar3('');
                                  setNewTeamFloor(floor.floor_number);
                                  setAddingTeam(true);
                                }}
                                className="w-full py-2 border border-dashed border-slate-600 hover:border-slate-500 rounded text-xs text-slate-500 hover:text-slate-400 transition-colors"
                              >
                                + Add team for this floor
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Area Effects */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase">Area Effects</h4>
                  {towerEffects
                    .filter(e => e.tower_type === selectedTower)
                    .map((effect) => {
                      const isEditingThis = editingEffect === effect.id;
                      
                      return (
                        <div key={effect.id} className={`${config.bg} rounded-lg p-3 border ${config.border}`}>
                          {isEditingThis ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editFloorRange}
                                onChange={(e) => setEditFloorRange(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                                placeholder="Floor range (e.g., 1-4)"
                              />
                              <textarea
                                value={editEffectDesc}
                                onChange={(e) => setEditEffectDesc(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                                placeholder="Effect description"
                                rows={2}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingEffect(null)}
                                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveEffect(effect.id, effect.tower_type)}
                                  disabled={saving}
                                  className={`px-2 py-1 ${config.bg} hover:opacity-80 rounded text-xs flex items-center gap-1 ${config.color}`}
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Floor {effect.floor_range}</p>
                                <p className="text-sm">{effect.effect_description}</p>
                              </div>
                              <button
                                onClick={() => startEditEffect(effect)}
                                className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}