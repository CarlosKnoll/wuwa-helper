import { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Star, Edit2, Save, X } from 'lucide-react';
import { TowerDetails, TowerTeam, TowerSectionProps } from '../types'
import { safeInvoke } from '../utils';

export default function TowerSection({
  towerInfo,
  towerDetails,
  towerEffects,
  towerTeams,
  isExpanded,
  onToggle,
  onUpdate
}: TowerSectionProps) {
  const [expandedTowers, setExpandedTowers] = useState({
    echoing: false,
    resonant: false,
    hazard: false
  });

  const [editingOverview, setEditingOverview] = useState(false);
  const [editingTower, setEditingTower] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit state for overview
  const [editLastReset, setEditLastReset] = useState('');
  const [editTotalStars, setEditTotalStars] = useState(0);
  const [editAstriteEarned, setEditAstriteEarned] = useState(0);
  const [editOverviewNotes, setEditOverviewNotes] = useState('');

  // Edit state for tower details
  const [editStarsAchieved, setEditStarsAchieved] = useState(0);
  const [editTowerNotes, setEditTowerNotes] = useState('');

  // Edit state for teams
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');

  const toggleTower = (tower: keyof typeof expandedTowers) => {
    setExpandedTowers(prev => ({ ...prev, [tower]: !prev[tower] }));
  };

  const getTowerTypeName = (type: string) => {
    const names: Record<string, string> = {
      'echoing': 'Echoing Tower',
      'resonant': 'Resonant Tower',
      'hazard': 'Hazard Tower'
    };
    return names[type] || type;
  };

  const startEditOverview = () => {
    if (towerInfo) {
      setEditLastReset(towerInfo.last_reset);
      setEditTotalStars(towerInfo.total_stars);
      setEditAstriteEarned(towerInfo.astrite_earned);
      setEditOverviewNotes(towerInfo.notes || '');
      setEditingOverview(true);
    }
  };

  const cancelEditOverview = () => {
    setEditingOverview(false);
  };

  const saveOverview = async () => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_last_reset', {
        lastReset: editLastReset
      });
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
    setEditingTower(detail.tower_type);
  };

  const cancelEditTower = () => {
    setEditingTower(null);
  };

  const saveTowerDetails = async (id: number) => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_details', {
        id,
        starsAchieved: editStarsAchieved,
        notes: editTowerNotes || null
      });
      setEditingTower(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tower details:', error);
      alert('Failed to save changes');
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

  const cancelEditTeam = () => {
    setEditingTeam(null);
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
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getGroupedEffects = (towerType: string) => {
    const effects = towerEffects.filter(e => e.tower_type === towerType);
    const grouped: Record<string, string[]> = {};
    
    effects.forEach(effect => {
      if (!grouped[effect.floor_range]) {
        grouped[effect.floor_range] = [];
      }
      grouped[effect.floor_range].push(effect.effect_description);
    });
    
    return grouped;
  };

  const getTeamsForFloors = (towerType: string, floors: number[]) => {
    return towerTeams
      .filter(t => t.tower_type === towerType && floors.includes(t.floor_number))
      .sort((a, b) => a.floor_number - b.floor_number);
  };

  const parseFloorRange = (floorRange: string): number[] => {
    const cleaned = floorRange.replace(/floors?\s+/i, '').trim();
    if (cleaned.includes('&')) {
      return cleaned.split('&').map(f => parseInt(f.trim()));
    }
    if (cleaned.toLowerCase().includes(' and ')) {
      return cleaned.toLowerCase().split(' and ').map(f => parseInt(f.trim()));
    }
    return [parseInt(cleaned)];
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-cyan-400" />
          <div className="text-left">
            <h3 className="text-xl font-bold">Tower of Adversity</h3>
            {towerInfo && (
              <p className="text-sm text-slate-400">
                {towerInfo.total_stars} Stars • {towerInfo.astrite_earned} Astrite Earned
              </p>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="p-6 space-y-6 border-t border-slate-800">
          {/* Tower Overview */}
          {towerInfo && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Overview</h4>
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
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Last Reset</label>
                    <input
                      type="date"
                      value={editLastReset}
                      onChange={(e) => setEditLastReset(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Total Stars</label>
                      <input
                        type="number"
                        value={editTotalStars}
                        onChange={(e) => setEditTotalStars(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                        min="0"
                        max="36"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Astrite Earned</label>
                      <input
                        type="number"
                        value={editAstriteEarned}
                        onChange={(e) => setEditAstriteEarned(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Notes</label>
                    <textarea
                      value={editOverviewNotes}
                      onChange={(e) => setEditOverviewNotes(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEditOverview}
                      disabled={saving}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveOverview}
                      disabled={saving}
                      className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Last Reset</p>
                      <p className="text-lg font-semibold">{towerInfo.last_reset}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Progress</p>
                      <p className="text-lg font-semibold">{towerInfo.total_stars} / 36 Stars</p>
                    </div>
                  </div>
                  {towerInfo.notes && (
                    <p className="mt-3 text-sm text-slate-300">{towerInfo.notes}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tower Details by Type */}
          <div className="grid gap-4">
            {towerDetails.map((detail) => {
              const groupedEffects = getGroupedEffects(detail.tower_type);
              const isTowerExpanded = expandedTowers[detail.tower_type as keyof typeof expandedTowers];
              const isEditing = editingTower === detail.tower_type;
              
              return (
                <div key={detail.id} className="bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="p-4 flex items-center justify-between">
                    <button
                      onClick={() => toggleTower(detail.tower_type as keyof typeof expandedTowers)}
                      className="flex-1 flex items-center justify-between hover:bg-slate-700/50 transition-colors rounded-lg pr-3"
                    >
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{getTowerTypeName(detail.tower_type)}</h4>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span className="font-bold">{detail.stars_achieved} / {detail.max_stars}</span>
                        </div>
                      </div>
                      {isTowerExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => startEditTower(detail)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors ml-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isTowerExpanded && (
                    <div className="p-4 pt-0 space-y-4">
                      {isEditing ? (
                        <div className="space-y-3 bg-slate-900/50 rounded-lg p-3">
                          <div>
                            <label className="text-sm text-slate-400 block mb-1">Stars Achieved</label>
                            <input
                              type="number"
                              value={editStarsAchieved}
                              onChange={(e) => setEditStarsAchieved(parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                              min="0"
                              max={detail.max_stars}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-400 block mb-1">Notes</label>
                            <textarea
                              value={editTowerNotes}
                              onChange={(e) => setEditTowerNotes(e.target.value)}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={cancelEditTower}
                              disabled={saving}
                              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                            <button
                              onClick={() => saveTowerDetails(detail.id)}
                              disabled={saving}
                              className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        detail.notes && <p className="text-sm text-slate-300">{detail.notes}</p>
                      )}

                      {/* Show grouped effects with teams below for Hazard tower */}
                      {detail.tower_type === 'hazard' ? (
                        <div className="space-y-4">
                          {Object.entries(groupedEffects)
                            .sort(([a], [b]) => {
                              const firstA = parseInt(a.split(/[&]| and /i)[0].replace(/floors?\s+/i, ''));
                              const firstB = parseInt(b.split(/[&]| and /i)[0].replace(/floors?\s+/i, ''));
                              return firstA - firstB;
                            })
                            .map(([floorRange, descriptions]) => {
                            const floors = parseFloorRange(floorRange);
                            const teamsForFloors = getTeamsForFloors(detail.tower_type, floors);

                            return (
                              <div key={floorRange} className="bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-cyan-400 uppercase mb-2">
                                  Floor {floorRange}
                                </p>
                                
                                <div className="space-y-2 mb-3">
                                  {descriptions.map((desc, idx) => (
                                    <p key={idx} className="text-sm text-slate-300">{desc}</p>
                                  ))}
                                </div>

                                {teamsForFloors.length > 0 ? (
                                  <div className="space-y-2 pt-2 border-t border-slate-700">
                                    <p className="text-xs font-semibold text-purple-400 uppercase">Teams Used</p>
                                    {teamsForFloors.map((team) => {
                                      const isEditingThisTeam = editingTeam === team.id;
                                      
                                      return isEditingThisTeam ? (
                                        <div key={team.id} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                          <p className="text-xs font-semibold text-slate-400">Floor {team.floor_number}</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            <input
                                              type="text"
                                              value={editChar1}
                                              onChange={(e) => setEditChar1(e.target.value)}
                                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                              placeholder="Character 1"
                                            />
                                            <input
                                              type="text"
                                              value={editChar2}
                                              onChange={(e) => setEditChar2(e.target.value)}
                                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                              placeholder="Character 2"
                                            />
                                            <input
                                              type="text"
                                              value={editChar3}
                                              onChange={(e) => setEditChar3(e.target.value)}
                                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                              placeholder="Character 3"
                                            />
                                          </div>
                                          <div className="flex gap-2 justify-end">
                                            <button
                                              onClick={cancelEditTeam}
                                              disabled={saving}
                                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                                            >
                                              <X className="w-3 h-3" />
                                              Cancel
                                            </button>
                                            <button
                                              onClick={() => saveTeam(team.id)}
                                              disabled={saving}
                                              className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 rounded text-xs flex items-center gap-1"
                                            >
                                              <Save className="w-3 h-3" />
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div key={team.id} className="flex items-center gap-3">
                                          <span className="text-xs font-semibold text-slate-400 w-16">Floor {team.floor_number}</span>
                                          <div className="flex gap-2 flex-1 flex-wrap">
                                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{team.character1}</span>
                                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{team.character2}</span>
                                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{team.character3}</span>
                                          </div>
                                          <button
                                            onClick={() => startEditTeam(team)}
                                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                                    No teams recorded for these floors
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <>
                          {Object.keys(groupedEffects).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-cyan-400 uppercase">Area Effects</p>
                              {Object.entries(groupedEffects).map(([floorRange, descriptions]) => (
                                <div key={floorRange} className="bg-slate-900/50 rounded p-2">
                                  <p className="text-xs text-slate-400 mb-1">Floor {floorRange}</p>
                                  {descriptions.map((desc, idx) => (
                                    <p key={idx} className="text-sm">{desc}</p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          {towerTeams.filter(t => t.tower_type === detail.tower_type).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-cyan-400 uppercase">Teams Used</p>
                              <div className="grid gap-2">
                                {towerTeams
                                  .filter(t => t.tower_type === detail.tower_type)
                                  .sort((a, b) => a.floor_number - b.floor_number)
                                  .map((team) => {
                                    const isEditingThisTeam = editingTeam === team.id;
                                    
                                    return isEditingThisTeam ? (
                                      <div key={team.id} className="bg-slate-800/50 rounded p-3 space-y-2">
                                        <p className="text-xs font-semibold text-slate-400">Floor {team.floor_number}</p>
                                        <div className="grid grid-cols-3 gap-2">
                                          <input
                                            type="text"
                                            value={editChar1}
                                            onChange={(e) => setEditChar1(e.target.value)}
                                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                            placeholder="Character 1"
                                          />
                                          <input
                                            type="text"
                                            value={editChar2}
                                            onChange={(e) => setEditChar2(e.target.value)}
                                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                            placeholder="Character 2"
                                          />
                                          <input
                                            type="text"
                                            value={editChar3}
                                            onChange={(e) => setEditChar3(e.target.value)}
                                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                            placeholder="Character 3"
                                          />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            onClick={cancelEditTeam}
                                            disabled={saving}
                                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                                          >
                                            <X className="w-3 h-3" />
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() => saveTeam(team.id)}
                                            disabled={saving}
                                            className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 rounded text-xs flex items-center gap-1"
                                          >
                                            <Save className="w-3 h-3" />
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div key={team.id} className="bg-slate-900/50 rounded p-2 flex items-center gap-3">
                                        <span className="text-xs font-semibold text-slate-400 w-16">Floor {team.floor_number}</span>
                                        <div className="flex gap-2 flex-1">
                                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{team.character1}</span>
                                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{team.character2}</span>
                                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{team.character3}</span>
                                        </div>
                                        <button
                                          onClick={() => startEditTeam(team)}
                                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}