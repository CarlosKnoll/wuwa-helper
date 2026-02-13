import { useState } from 'react';
import { Users, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { TroopMatrix, MatrixTeam } from '../types';
import { safeInvoke, calculateStabilityAccordsAstrite, calculateSingularityExpansionAstrite } from '../utils';
import CharacterPortrait from './CharacterPortrait';
import { CurrencyIcon } from './CurrencyIcon';
import ConfirmDialog from './ConfirmDialog';

interface TroopMatrixDetailsViewProps {
  troopMatrix: TroopMatrix | null;
  matrixTeams: MatrixTeam[];
  onUpdate: () => void;
  availableCharacters?: string[];
  healerCharacters?: string[];
}

export default function TroopMatrixDetailsView({
  troopMatrix,
  matrixTeams,
  onUpdate,
  availableCharacters = [],
  healerCharacters = [],
}: TroopMatrixDetailsViewProps) {
  const [editing, setEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [stabilityCollapsed, setStabilityCollapsed] = useState(false);
  const [singularityCollapsed, setSingularityCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTeamDialog, setDeleteTeamDialog] = useState<number | null>(null);

  // Main edit states
  const [editNotes, setEditNotes] = useState('');

  // Team edit states
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [editPoints, setEditPoints] = useState(0);
  const [editRound, setEditRound] = useState<number | null>(null);

  // Character search state for dropdowns
  const [charSearch1, setCharSearch1] = useState('');
  const [charSearch2, setCharSearch2] = useState('');
  const [charSearch3, setCharSearch3] = useState('');
  const [showCharDrop1, setShowCharDrop1] = useState(false);
  const [showCharDrop2, setShowCharDrop2] = useState(false);
  const [showCharDrop3, setShowCharDrop3] = useState(false);

  const stabilityTeams = matrixTeams.filter(t => t.mode === 'Stability Accords');
  const singularityTeams = matrixTeams.filter(t => t.mode === 'Singularity Expansion');

  // Compute per-character vigor consumed across ALL matrix teams
  // Each participation costs 1 vigor. Max vigor: 1 normally, 2 for healers.
  const computeVigorMap = (): Record<string, number> => {
    const consumed: Record<string, number> = {};
    // Only count Singularity Expansion teams for vigor
    const singularityTeams = matrixTeams.filter(t => t.mode === 'Singularity Expansion');
    for (const team of singularityTeams) {
      for (const char of [team.character1, team.character2, team.character3]) {
        if (char && char !== 'None') {
          consumed[char] = (consumed[char] || 0) + 1;
        }
      }
    }
    return consumed;
  };

  const vigorConsumedMap = computeVigorMap();

  const healerSet = new Set(healerCharacters);

  const getMaxVigor = (charName: string) => healerSet.has(charName) ? 2 : 1;
  const getCharVigorRemaining = (charName: string) =>
    getMaxVigor(charName) - (vigorConsumedMap[charName] || 0);

  const renderCharDropdown = (
    value: string,
    search: string,
    showDrop: boolean,
    setVal: (v: string) => void,
    setSearch: (v: string) => void,
    setShow: (v: boolean) => void,
    placeholder: string
  ) => {
    // Process characters: consolidate Rover variants
    const roverVariants = availableCharacters.filter(c => c.startsWith('Rover'));
    const nonRoverChars = availableCharacters.filter(c => !c.startsWith('Rover'));
    
    // Create display entries - deduplicate Rovers by element
    const processedChars: Array<{display: string, actual: string, isRover: boolean}> = [];
    const roverElements = new Set<string>();
    
    // Add non-Rover characters
    nonRoverChars.forEach(char => {
      processedChars.push({display: char, actual: char, isRover: false});
    });
    
    // Add Rover variants - deduplicate by element
    roverVariants.forEach(rover => {
      const element = rover.replace('Rover', '').trim().replace(/^-\s*/, '').replace(/^\(\s*/, '').replace(/\s*\)$/, '');
      const display = element ? `Rover (${element})` : 'Rover';
      
      if (!roverElements.has(display)) {
        roverElements.add(display);
        processedChars.push({display, actual: rover, isRover: true});
      }
    });
    
    const filtered = processedChars.filter(c =>
      c.display.toLowerCase().includes(search.toLowerCase())
    );
    
    // Get display value for the input
    const getDisplayValue = () => {
      if (!value) return '';
      if (value.startsWith('Rover')) {
        const element = value.replace('Rover', '').trim().replace(/^-\s*/, '').replace(/^\(\s*/, '').replace(/\s*\)$/, '');
        return element ? `Rover (${element})` : 'Rover';
      }
      return value;
    };
    
    return (
      <div className="relative">
        <input
          type="text"
          value={showDrop ? search : getDisplayValue()}
          onChange={(e) => { 
            const newSearch = e.target.value;
            setSearch(newSearch);
            setShow(true);
            
            // Update value in real-time as user types
            if (newSearch.trim() === '' || newSearch.toLowerCase() === 'none') {
              setVal(''); // Allow empty/none
            } else {
              const exactMatch = processedChars.find(c => 
                c.display.toLowerCase() === newSearch.toLowerCase()
              );
              if (exactMatch) {
                setVal(exactMatch.actual); // Exact match
              } else {
                setVal(newSearch.trim()); // Custom entry
              }
            }
          }}
          onFocus={() => { 
            setSearch(value ? getDisplayValue() : '');
            setShow(true); 
          }}
          onBlur={() => setTimeout(() => { 
            setShow(false);
            setSearch(''); // Clear search - input will show getDisplayValue() now
          }, 200)}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-yellow-400"
          placeholder={placeholder}
        />
        {showDrop && filtered.length > 0 && (
          <div className="absolute z-[100] left-0 min-w-[220px] mt-1 bg-slate-800 border border-slate-600 rounded shadow-lg max-h-44 overflow-y-auto">
            <button
              onMouseDown={() => { setVal(''); setSearch(''); setShow(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-700 transition-colors"
            >
              — None —
            </button>
            {filtered.map(charObj => {
              // For Rover, check all variants' vigor (they share)
              let remaining, maxVigor, isHealer;
              if (charObj.isRover) {
                const allRoverVigor = roverVariants.reduce((sum, rv) => {
                  return sum + (vigorConsumedMap[rv] || 0);
                }, 0);
                isHealer = roverVariants.some(rv => healerSet.has(rv));
                maxVigor = isHealer ? 2 : 1;
                remaining = maxVigor - allRoverVigor;
              } else {
                remaining = getCharVigorRemaining(charObj.actual);
                maxVigor = getMaxVigor(charObj.actual);
                isHealer = healerSet.has(charObj.actual);
              }
              const depleted = remaining <= 0;
              return (
                <button
                  key={charObj.display}
                  onMouseDown={depleted ? undefined : () => { setVal(charObj.actual); setSearch(''); setShow(false); }}
                  disabled={depleted}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                    depleted ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <span className="truncate flex items-center gap-1">
                    {charObj.display}
                    {isHealer && <span className="text-[9px] text-green-400 bg-green-400/10 px-1 rounded">healer</span>}
                  </span>
                  <span className={`ml-2 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    remaining <= 0 ? 'bg-red-500/30 text-red-500' :
                    remaining < maxVigor ? 'bg-orange-500/30 text-orange-400' :
                    'bg-slate-600 text-slate-400'
                  }`}>
                    {remaining}/{maxVigor}⚡
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const startEdit = () => {
    if (troopMatrix) {
      setEditNotes(troopMatrix.notes || '');
      setEditing(true);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const calculatedStabilityAstrite = calculateStabilityAccordsAstrite(troopMatrix?.stability_accords_points || 0);
      
      const singularityTeamScores = singularityTeams.map(t => t.points);
      const { astrite: calculatedSingularityAstrite } = calculateSingularityExpansionAstrite(
        troopMatrix?.singularity_expansion_points || 0,
        singularityTeamScores
      );
      
      await safeInvoke('update_troop_matrix', {
        stabilityAccordsPoints: troopMatrix?.stability_accords_points || 0,
        stabilityAccordsAstrite: calculatedStabilityAstrite,
        singularityExpansionPoints: troopMatrix?.singularity_expansion_points || 0,
        singularityExpansionAstrite: calculatedSingularityAstrite,
        singularityExpansionHighestRound: troopMatrix?.singularity_expansion_highest_round || 0,
        notes: editNotes || null
      });
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update troop matrix:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const startTeamEdit = (team: MatrixTeam) => {
    setEditChar1(team.character1);
    setEditChar2(team.character2);
    setEditChar3(team.character3);
    setCharSearch1(team.character1);
    setCharSearch2(team.character2);
    setCharSearch3(team.character3);
    setEditPoints(team.points);
    setEditRound(team.round_number);
    setEditingTeam(team.id);
  };

  const saveTeamEdit = async (id: number) => {
    setSaving(true);
    try {
      await safeInvoke('update_matrix_team', {
        id,
        character1: editChar1,
        character2: editChar2,
        character3: editChar3,
        points: editPoints,
        roundNumber: editRound
      });
      
      // Recalculate total points and astrite after updating team
      if (troopMatrix) {
        const allTeams = await safeInvoke('get_matrix_teams') as MatrixTeam[];
        const stabilityTeams = allTeams.filter(t => t.mode === 'Stability Accords');
        const singularityTeams = allTeams.filter(t => t.mode === 'Singularity Expansion');
        
        const stabilityPoints = stabilityTeams.reduce((sum, team) => sum + team.points, 0);
        const singularityPoints = singularityTeams.reduce((sum, team) => sum + team.points, 0);
        
        const calculatedStabilityAstrite = calculateStabilityAccordsAstrite(stabilityPoints);
        const singularityTeamScores = singularityTeams.map(t => t.points);
        const { astrite: calculatedSingularityAstrite } = calculateSingularityExpansionAstrite(
          singularityPoints,
          singularityTeamScores
        );
        
        await safeInvoke('update_troop_matrix', {
          stabilityAccordsPoints: stabilityPoints,
          stabilityAccordsAstrite: calculatedStabilityAstrite,
          singularityExpansionPoints: singularityPoints,
          singularityExpansionAstrite: calculatedSingularityAstrite,
          singularityExpansionHighestRound: troopMatrix.singularity_expansion_highest_round,
          notes: troopMatrix.notes || null
        });
      }
      
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
    setDeleteTeamDialog(id);
  };

  const confirmDeleteTeam = async () => {
    if (deleteTeamDialog === null) return;
    
    try {
      await safeInvoke('delete_matrix_team', { id: deleteTeamDialog });
      
      // Recalculate total points and astrite after deleting team
      if (troopMatrix) {
        const allTeams = await safeInvoke('get_matrix_teams') as MatrixTeam[];
        const stabilityTeams = allTeams.filter(t => t.mode === 'Stability Accords');
        const singularityTeams = allTeams.filter(t => t.mode === 'Singularity Expansion');
        
        const stabilityPoints = stabilityTeams.reduce((sum, team) => sum + team.points, 0);
        const singularityPoints = singularityTeams.reduce((sum, team) => sum + team.points, 0);
        
        const calculatedStabilityAstrite = calculateStabilityAccordsAstrite(stabilityPoints);
        const singularityTeamScores = singularityTeams.map(t => t.points);
        const { astrite: calculatedSingularityAstrite } = calculateSingularityExpansionAstrite(
          singularityPoints,
          singularityTeamScores
        );
        
        await safeInvoke('update_troop_matrix', {
          stabilityAccordsPoints: stabilityPoints,
          stabilityAccordsAstrite: calculatedStabilityAstrite,
          singularityExpansionPoints: singularityPoints,
          singularityExpansionAstrite: calculatedSingularityAstrite,
          singularityExpansionHighestRound: troopMatrix.singularity_expansion_highest_round,
          notes: troopMatrix.notes || null
        });
      }
      
      onUpdate();
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team');
    } finally {
      setDeleteTeamDialog(null);
    }
  };

  const addTeam = async (mode: string) => {
    const modeTeams = matrixTeams.filter(t => t.mode === mode);
    
    // Find the lowest available team_number for this mode
    let newTeamNumber = 1;
    const existingNumbers = new Set(modeTeams.map(t => t.team_number));
    while (existingNumbers.has(newTeamNumber)) {
      newTeamNumber++;
    }
    
    // For Singularity Expansion, find the last round used
    let defaultRound = 1;
    if (mode === 'Singularity Expansion' && modeTeams.length > 0) {
      defaultRound = Math.max(...modeTeams.map(t => t.round_number || 1));
    }
    
    try {
      await safeInvoke('add_matrix_team', {
        mode,
        teamNumber: newTeamNumber,
        character1: 'None',
        character2: 'None',
        character3: 'None',
        points: 0,
        roundNumber: mode === 'Singularity Expansion' ? defaultRound : null
      });
      
      // Recalculate total points and astrite after adding team
      if (troopMatrix) {
        const allTeams = await safeInvoke('get_matrix_teams') as MatrixTeam[];
        const stabilityTeams = allTeams.filter(t => t.mode === 'Stability Accords');
        const singularityTeams = allTeams.filter(t => t.mode === 'Singularity Expansion');
        
        const stabilityPoints = stabilityTeams.reduce((sum, team) => sum + team.points, 0);
        const singularityPoints = singularityTeams.reduce((sum, team) => sum + team.points, 0);
        
        const calculatedStabilityAstrite = calculateStabilityAccordsAstrite(stabilityPoints);
        const singularityTeamScores = singularityTeams.map(t => t.points);
        const { astrite: calculatedSingularityAstrite } = calculateSingularityExpansionAstrite(
          singularityPoints,
          singularityTeamScores
        );
        
        await safeInvoke('update_troop_matrix', {
          stabilityAccordsPoints: stabilityPoints,
          stabilityAccordsAstrite: calculatedStabilityAstrite,
          singularityExpansionPoints: singularityPoints,
          singularityExpansionAstrite: calculatedSingularityAstrite,
          singularityExpansionHighestRound: troopMatrix.singularity_expansion_highest_round,
          notes: troopMatrix.notes || null
        });
      }
      
      onUpdate();
    } catch (error) {
      console.error('Failed to add team:', error);
      alert('Failed to add team');
    }
  };

  const renderTeamCard = (team: MatrixTeam) => {
    const isEditing = editingTeam === team.id;
    const isStability = team.mode === 'Stability Accords';
    const colorClass = 'text-yellow-400';
    const bgClass = 'bg-yellow-500/20';
    
    return (
      <div key={team.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${colorClass}`}>
            Team {team.team_number}
            {team.round_number && ` (Round ${team.round_number})`}
          </span>
          {!isEditing && (
            <div className="flex gap-1">
              <button
                onClick={() => startTeamEdit(team)}
                className="p-1 hover:bg-slate-600 rounded transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => deleteTeam(team.id)}
                className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {renderCharDropdown(editChar1, charSearch1, showCharDrop1, setEditChar1, setCharSearch1, setShowCharDrop1, 'Char 1')}
              {renderCharDropdown(editChar2, charSearch2, showCharDrop2, setEditChar2, setCharSearch2, setShowCharDrop2, 'Char 2')}
              {renderCharDropdown(editChar3, charSearch3, showCharDrop3, setEditChar3, setCharSearch3, setShowCharDrop3, 'Char 3')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Points</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>
              {!isStability && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Round</label>
                  <input
                    type="number"
                    value={editRound || ''}
                    onChange={(e) => setEditRound(parseInt(e.target.value) || null)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
              )}
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
                onClick={() => saveTeamEdit(team.id)}
                disabled={saving}
                className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded">
                <CharacterPortrait characterName={team.character1} size="md" />
                <span className="text-xs text-slate-300">{team.character1}</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded">
                <CharacterPortrait characterName={team.character2} size="md" />
                <span className="text-xs text-slate-300">{team.character2}</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded">
                <CharacterPortrait characterName={team.character3} size="md" />
                <span className="text-xs text-slate-300">{team.character3}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">{team.points.toLocaleString()} points</p>
          </>
        )}
      </div>
    );
  };

  if (!troopMatrix) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border-2 shadow-[0_0_12px_rgba(226,232,240,0.08)] border-white/[0.3]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-400" />
            Doubled Pawns Matrix Overview
          </h3>
          {!editing && (
            <button
              onClick={startEdit}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stability Accords */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Stability Accords</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Points:</span>
                  <span className="font-semibold">{troopMatrix.stability_accords_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Astrite Earned:</span>
                  <span className="font-semibold text-yellow-400 flex items-center gap-1">
                    <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                    {troopMatrix.stability_accords_astrite} / 150
                  </span>
                </div>
                <div className="mt-3 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full transition-all"
                    style={{ width: `${Math.min((troopMatrix.stability_accords_astrite / 150) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 text-right">
                  {((troopMatrix.stability_accords_astrite / 150) * 100).toFixed(1)}% Complete
                </p>
              </div>
            </div>

            {/* Singularity Expansion */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Singularity Expansion</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Points:</span>
                  <span className="font-semibold">{troopMatrix.singularity_expansion_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Astrite Earned:</span>
                  <span className="font-semibold text-yellow-400 flex items-center gap-1">
                    <CurrencyIcon currencyName="astrite" className="w-4 h-4" />
                    {troopMatrix.singularity_expansion_astrite} / 250
                  </span>
                </div>
                <div className="mt-3 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full transition-all"
                    style={{ width: `${Math.min((troopMatrix.singularity_expansion_astrite / 250) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 text-right">
                  {((troopMatrix.singularity_expansion_astrite / 250) * 100).toFixed(1)}% Complete
                </p>
              </div>
            </div>

            {troopMatrix.notes && (
              <div className="col-span-1 md:col-span-2 bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Notes</h4>
                <p className="text-sm text-slate-300">{troopMatrix.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teams Section */}
      <div className="space-y-6">
          {/* Stability Accords Teams */}
          <div className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border-2 shadow-[0_0_12px_rgba(226,232,240,0.08)] border-white/[0.3]">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setStabilityCollapsed(!stabilityCollapsed)} 
                className="flex items-center gap-2 text-lg font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <span>Stability Accords Teams</span>
                <span className="text-sm">{stabilityCollapsed ? '▶' : '▼'}</span>
              </button>
              {!stabilityCollapsed && stabilityTeams.length < 3 && (
                <button
                  onClick={() => addTeam('Stability Accords')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Team
                </button>
              )}
            </div>
            {!stabilityCollapsed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stabilityTeams.length > 0 ? (
                    stabilityTeams.map(renderTeamCard)
                  ) : (
                    <div className="col-span-2 text-center text-slate-500 py-6">
                      No teams added yet. Click "Add Team" to get started.
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-3">Max 3 teams can be deployed</p>
              </>
            )}
          </div>

          {/* Singularity Expansion Teams */}
          <div className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border-2 shadow-[0_0_12px_rgba(226,232,240,0.08)] border-white/[0.3]">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSingularityCollapsed(!singularityCollapsed)} 
                className="flex items-center gap-2 text-lg font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <span>Singularity Expansion Teams</span>
                <span className="text-sm">{singularityCollapsed ? '▶' : '▼'}</span>
              </button>
              {!singularityCollapsed && (
                <button
                  onClick={() => addTeam('Singularity Expansion')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Team
                </button>
              )}
            </div>
            {!singularityCollapsed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {singularityTeams.length > 0 ? (
                    singularityTeams.map(renderTeamCard)
                  ) : (
                    <div className="col-span-2 text-center text-slate-500 py-6">
                      No teams added yet. Click "Add Team" to get started.
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-3">Unlimited teams, boss HP increases each round</p>
              </>
            )}
          </div>
        </div>

        <ConfirmDialog
          isOpen={deleteTeamDialog !== null}
          title="Delete Team"
          message="Are you sure you want to delete this team? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteTeam}
          onCancel={() => setDeleteTeamDialog(null)}
        />
    </div>
  );
}