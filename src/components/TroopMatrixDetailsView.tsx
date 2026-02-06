import { useState } from 'react';
import { Users, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { TroopMatrix, MatrixTeam } from '../types';
import { safeInvoke, calculateStabilityAccordsAstrite, calculateSingularityExpansionAstrite } from '../utils';
import CharacterPortrait from './CharacterPortrait';
import { CurrencyIcon } from './CurrencyIcon';

interface TroopMatrixDetailsViewProps {
  troopMatrix: TroopMatrix | null;
  matrixTeams: MatrixTeam[];
  onUpdate: () => void;
}

export default function TroopMatrixDetailsView({
  troopMatrix,
  matrixTeams,
  onUpdate
}: TroopMatrixDetailsViewProps) {
  const [editing, setEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [stabilityCollapsed, setStabilityCollapsed] = useState(false);
  const [singularityCollapsed, setSingularityCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Main edit states
  const [editStabilityPoints, setEditStabilityPoints] = useState(0);
  const [editSingularityPoints, setEditSingularityPoints] = useState(0);
  const [editSingularityRound, setEditSingularityRound] = useState(0);
  const [editLastReset, setEditLastReset] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Team edit states
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [editPoints, setEditPoints] = useState(0);
  const [editRound, setEditRound] = useState<number | null>(null);

  const stabilityTeams = matrixTeams.filter(t => t.mode === 'Stability Accords');
  const singularityTeams = matrixTeams.filter(t => t.mode === 'Singularity Expansion');

  const startEdit = () => {
    if (troopMatrix) {
      setEditStabilityPoints(troopMatrix.stability_accords_points);
      setEditSingularityPoints(troopMatrix.singularity_expansion_points);
      setEditSingularityRound(troopMatrix.singularity_expansion_highest_round);
      setEditLastReset(troopMatrix.last_reset);
      setEditNotes(troopMatrix.notes || '');
      setEditing(true);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Update last reset date
      await safeInvoke('update_matrix_last_reset', {
        lastReset: editLastReset
      });
      
      // Keep existing points (not editable)
      const calculatedStabilityAstrite = calculateStabilityAccordsAstrite(troopMatrix?.stability_accords_points || 0);
      
      // Get all singularity team scores for proper calculation
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
        singularityExpansionHighestRound: editSingularityRound,
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
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await safeInvoke('delete_matrix_team', { id });
      
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
    }
  };

  const addTeam = async (mode: string) => {
    const teamCount = matrixTeams.filter(t => t.mode === mode).length;
    
    try {
      await safeInvoke('add_matrix_team', {
        mode,
        teamNumber: teamCount + 1,
        character1: 'None',
        character2: 'None',
        character3: 'None',
        points: 0,
        roundNumber: mode === 'Singularity Expansion' ? 1 : null
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
    const colorClass = isStability ? 'text-cyan-400' : 'text-purple-400';
    const bgClass = isStability ? 'bg-cyan-500/20' : 'bg-purple-500/20';
    
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Points</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                />
              </div>
              {!isStability && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Round</label>
                  <input
                    type="number"
                    value={editRound || ''}
                    onChange={(e) => setEditRound(parseInt(e.target.value) || null)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
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
                className={`px-2 py-1 ${bgClass} hover:opacity-80 rounded text-xs flex items-center gap-1 ${colorClass}`}
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
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Last Reset</label>
                <input
                  type="date"
                  value={editLastReset}
                  onChange={(e) => setEditLastReset(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-400 block mb-1">Highest Round</label>
                <input
                  type="number"
                  value={editSingularityRound}
                  onChange={(e) => setEditSingularityRound(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                  min="0"
                />
              </div>
            </div>
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
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded flex items-center gap-2"
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
              <h4 className="text-lg font-bold text-cyan-400 mb-3">Stability Accords</h4>
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
                    className="bg-cyan-500 h-full transition-all"
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
              <h4 className="text-lg font-bold text-purple-400 mb-3">Singularity Expansion</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Points:</span>
                  <span className="font-semibold">{troopMatrix.singularity_expansion_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Highest Round:</span>
                  <span className="font-semibold text-purple-400">{troopMatrix.singularity_expansion_highest_round}</span>
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
                    className="bg-purple-500 h-full transition-all"
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
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setStabilityCollapsed(!stabilityCollapsed)} 
                className="flex items-center gap-2 text-lg font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Stability Accords Teams</span>
                <span className="text-sm">{stabilityCollapsed ? '▶' : '▼'}</span>
              </button>
              {!stabilityCollapsed && stabilityTeams.length < 3 && (
                <button
                  onClick={() => addTeam('Stability Accords')}
                  className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm"
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
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSingularityCollapsed(!singularityCollapsed)} 
                className="flex items-center gap-2 text-lg font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Singularity Expansion Teams</span>
                <span className="text-sm">{singularityCollapsed ? '▶' : '▼'}</span>
              </button>
              {!singularityCollapsed && (
                <button
                  onClick={() => addTeam('Singularity Expansion')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
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
    </div>
  );
}