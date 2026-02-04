import { useState } from 'react';
import { Trophy, Edit2, Save, X, Plus, Trash2, Star } from 'lucide-react';
import { TowerOfAdversity, TowerDetails, TowerFloor, TowerAreaEffect, TowerTeam } from '../types';
import { safeInvoke, calculateTowerAstrite } from '../utils';
import CharacterPortrait from './CharacterPortrait';
import { CurrencyIcon } from './CurrencyIcon';

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
  const [floorsCollapsed, setFloorsCollapsed] = useState(false);

  // Overview edit states
  const [editTotalStars, setEditTotalStars] = useState(0);
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
      setEditOverviewNotes(towerInfo.notes || '');
      setEditingOverview(true);
    }
  };

  const saveOverview = async () => {
    setSaving(true);
    try {
      const calculatedAstrite = calculateTowerAstrite(editTotalStars);
      await safeInvoke('update_tower_of_adversity', {
        totalStars: editTotalStars,
        astriteEarned: calculatedAstrite,
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
      
      // Recalculate total stars and astrite from all tower details
      const allDetails = await safeInvoke('get_tower_details') as TowerDetails[];
      const totalStars = allDetails.reduce((sum, td) => sum + (td.stars_achieved || 0), 0);
      const calculatedAstrite = calculateTowerAstrite(totalStars);
      
      // Update the tower overview with new totals
      await safeInvoke('update_tower_of_adversity', {
        totalStars: totalStars,
        astriteEarned: calculatedAstrite,
        notes: towerInfo?.notes || null
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
      
      // Recalculate total stars and astrite after updating floor
      const allFloors = Object.values(towerFloors).flat();
      const totalStars = allFloors.reduce((sum, floor) => sum + (floor.stars || 0), 0);
      const calculatedAstrite = calculateTowerAstrite(totalStars);
      
      // Update the tower overview with new totals
      await safeInvoke('update_tower_of_adversity', {
        totalStars: totalStars,
        astriteEarned: calculatedAstrite,
        notes: towerInfo?.notes || null
      });
      
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

  const addTeam = async () => {
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

  const handleTowerClick = (towerType: string) => {
    if (selectedTower === towerType) {
      onTowerSelect(null);
    } else {
      onTowerSelect(towerType);
    }
  };

  if (!towerInfo) return null;

  const renderStarSelector = (floor: TowerFloor) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((starNum) => (
          <button
            key={starNum}
            onClick={() => updateFloorStars(floor.id, starNum === floor.stars ? 0 : starNum)}
            className={`transition-colors ${
              starNum <= floor.stars 
                ? 'text-yellow-400 hover:text-yellow-300' 
                : 'text-slate-600 hover:text-slate-500'
            }`}
            title={`${starNum} star${starNum !== 1 ? 's' : ''}`}
          >
            <Star className="w-4 h-4" fill={starNum <= floor.stars ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  // Reordered tower types: Resonant, Hazard, Echoing
  const orderedTowerTypes = ['resonant', 'hazard', 'echoing'];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-cyan-400" />
            Tower of Adversity Overview
          </h3>
          {!editingOverview && (
            <button
              onClick={startEditOverview}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingOverview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Total Stars</label>
                <input
                  type="number"
                  value={editTotalStars}
                  onChange={(e) => setEditTotalStars(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                  min="0"
                  max="36"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Astrite Earned (Auto-calculated)</label>
                <div className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-yellow-400 font-semibold flex items-center gap-2">
                  <CurrencyIcon currencyName="astrite" className="w-5 h-5" />
                  {calculateTowerAstrite(editTotalStars)} / 800
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Based on stars: 3-24★ = 75 each (×{Math.min(Math.floor(editTotalStars / 3), 8)}), 
                  27-36★ = 50 each (×{editTotalStars > 24 ? Math.floor((editTotalStars - 24) / 3) : 0})
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Notes</label>
              <textarea
                value={editOverviewNotes}
                onChange={(e) => setEditOverviewNotes(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                rows={3}
                placeholder="General notes about tower progress..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingOverview(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveOverview}
                disabled={saving}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Total Stars</p>
              <p className="text-2xl font-bold text-cyan-400">{towerInfo.total_stars} / 36</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Astrite Earned</p>
              <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <CurrencyIcon currencyName="astrite" className="w-6 h-6" />
                {towerInfo.astrite_earned} / 800
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Completion</p>
              <p className="text-2xl font-bold text-emerald-400">
                {((towerInfo.astrite_earned / 800) * 100).toFixed(1)}%
              </p>
            </div>
            {towerInfo.notes && (
              <div className="col-span-1 md:col-span-3 bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Notes</p>
                <p className="text-sm">{towerInfo.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual Tower Cards - Reordered: Resonant, Hazard, Echoing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orderedTowerTypes.map((towerType) => {
          const detail = towerDetails.find(d => d.tower_type === towerType);
          if (!detail) return null;
          
          const config = getTowerConfig(detail.tower_type);
          const isSelected = selectedTower === detail.tower_type;
          
          return (
            <div
              key={detail.id}
              onClick={() => handleTowerClick(detail.tower_type)}
              className={`bg-slate-900/50 rounded-xl p-4 border transition-all cursor-pointer ${
                isSelected 
                  ? `${config.border} shadow-lg` 
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <h4 className={`text-lg font-bold ${config.color} mb-3`}>
                {config.name}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Stars:</span>
                  <span className="font-semibold">{detail.stars_achieved} / 12</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div 
                    className={`${config.bar} h-full rounded-full transition-all`}
                    style={{ width: `${(detail.stars_achieved / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tower Details */}
      {selectedTower && (() => {
        const detail = towerDetails.find(d => d.tower_type === selectedTower);
        if (!detail) return null;

        const config = getTowerConfig(selectedTower);
        const floors = towerFloors[selectedTower] || [];
        const teams = towerTeams.filter(t => t.tower_type === selectedTower);
        const MAX_TEAMS = 4;
        const canAddTeam = teams.length < MAX_TEAMS;

        return (
          <div className={`bg-slate-900/50 rounded-xl p-6 border ${config.border}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${config.color}`}>{config.name} Details</h3>
              {!editingTower && (
                <button
                  onClick={() => startEditTower(detail)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingTower ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Stars Achieved</label>
                  <input
                    type="number"
                    value={editStarsAchieved}
                    onChange={(e) => setEditStarsAchieved(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    min="0"
                    max="36"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Notes</label>
                  <textarea
                    value={editTowerNotes}
                    onChange={(e) => setEditTowerNotes(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    rows={2}
                    placeholder="Notes about this tower..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingTower(false)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => saveTowerDetails(detail)}
                    disabled={saving}
                    className={`px-3 py-2 ${config.bg} hover:opacity-80 rounded flex items-center gap-2 text-sm ${config.color}`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Progress</p>
                    <p className={`text-lg font-semibold ${config.color}`}>
                      {detail.stars_achieved} / 12 Stars
                    </p>
                  </div>
                </div>
                {detail.notes && (
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-300">{detail.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Area Effects Section */}
            <div className="space-y-3 mb-6">
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

            {/* Floors and Teams Section */}
            <div className="space-y-3">

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase">Floors & Teams</h4>
                  <button
                    onClick={() => setFloorsCollapsed(!floorsCollapsed)}
                    className="text-xs text-slate-500 hover:text-slate-400"
                  >
                    {floorsCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>

                {!floorsCollapsed && (
                  <div className="space-y-3">
                    {floors.length === 0 && onInitializeFloors && (
                      <div className="text-center py-6">
                        <p className="text-slate-500 mb-3">No floor data available</p>
                        <button
                          onClick={onInitializeFloors}
                          className={`px-4 py-2 ${config.bg} ${config.color} rounded-lg hover:opacity-80 transition-colors`}
                        >
                          Initialize Floors
                        </button>
                      </div>
                    )}

                    {addingTeam && (
                      <div className={`${config.bg} rounded-lg p-3 border ${config.border} space-y-2`}>
                        <p className="text-sm font-semibold">Add New Team</p>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Floor Number</label>
                          <input
                            type="number"
                            value={newTeamFloor}
                            onChange={(e) => setNewTeamFloor(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
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
                            onClick={() => {
                              setAddingTeam(false);
                              setEditChar1('');
                              setEditChar2('');
                              setEditChar3('');
                              setNewTeamFloor(1);
                            }}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                          <button
                            onClick={addTeam}
                            disabled={saving}
                            className={`px-2 py-1 ${config.bg} hover:opacity-80 rounded text-xs flex items-center gap-1 ${config.color}`}
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {floors.map((floor) => {
                      const floorTeam = teams.find(t => t.floor_number === floor.floor_number);
                      const isEditingThisTeam = editingTeam === floorTeam?.id;

                      return (
                        <div key={floor.id} className={`${config.bg} rounded-lg p-3 border ${config.border} space-y-2`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className={`text-sm font-semibold ${config.color}`}>
                                Floor {floor.floor_number}
                              </span>
                              <span className="text-xs text-slate-500 ml-2">
                                {floor.stars === 0 ? 'Not cleared' : `${floor.stars}/3 stars`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {renderStarSelector(floor)}
                              {floorTeam && !isEditingThisTeam && (
                                <>
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
                                </>
                              )}
                            </div>
                          </div>

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
                              <div className="flex gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded min-w-0 flex-1">
                                  <CharacterPortrait characterName={floorTeam.character1} size="md" className="flex-shrink-0" />
                                  <span className="text-xs text-slate-300 truncate">{floorTeam.character1}</span>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded min-w-0 flex-1">
                                  <CharacterPortrait characterName={floorTeam.character2} size="md" className="flex-shrink-0" />
                                  <span className="text-xs text-slate-300 truncate">{floorTeam.character2}</span>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded min-w-0 flex-1">
                                  <CharacterPortrait characterName={floorTeam.character3} size="md" className="flex-shrink-0" />
                                  <span className="text-xs text-slate-300 truncate">{floorTeam.character3}</span>
                                </div>
                              </div>
                            )
                          ) : (
                            canAddTeam && (
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
                            )
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}