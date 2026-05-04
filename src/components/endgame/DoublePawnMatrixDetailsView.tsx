import { useState } from 'react';
import { Edit2, Save, X, Grid3X3 } from 'lucide-react';
import { TroopMatrix, MatrixTeam } from '../../types';
import { TroopMatrixDetailsViewProps } from '../../props';
import { safeInvoke } from '../../utils';
import { CurrencyIcon } from '../CurrencyIcon';
import TeamDisplay, { TeamEditor } from './TeamManager';
import type { ApiMatrixWave, ApiMatrixLevel } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** RES/weakness tag: element icon + name, coloured from the API */
function ResTag({ name, color, path }: { name: string; color: string; path: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {path && (
        <img
          src={path}
          alt={name}
          title={name}
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <span
        className="text-[10px] font-semibold leading-none"
        style={{ color }}
      >
        {name}
      </span>
    </div>
  );
}

/**
 * Boss card using SmallIconInModeView — the wide portrait card shown in-game.
 * Rendered as a landscape thumbnail (wider than tall) to match the source asset.
 */
function WaveCard({ wave }: { wave: ApiMatrixWave }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-slate-800/70 rounded-lg p-2 w-32 flex-shrink-0">
      {/* Landscape container matching the in-mode card aspect ratio (~2:1) */}
      <div className="w-full h-14 rounded-md bg-slate-900/60 flex items-center justify-center overflow-hidden flex-shrink-0">
        {wave.icon ? (
          <img
            src={wave.icon}
            alt={wave.name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-slate-600 text-xl">?</span>
        )}
      </div>
      <span className="text-[10px] text-slate-300 text-center leading-tight line-clamp-2 w-full">
        {wave.name}
      </span>
      {wave.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5">
          {wave.tags.map((tag, i) => (
            <ResTag key={i} name={tag.name} color={tag.color} path={tag.path} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sanitises API buff HTML: replaces <br>, keeps colour spans, adds bold.
 */
function sanitizeBuffDesc(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(
      /<span\s+style="color:([^";]+);?[^"]*"[^>]*>/gi,
      '<span style="color:$1;font-weight:700">'
    )
    .trim();
}

function BuffDesc({ desc }: { desc: string }) {
  return (
    <span
      className="text-xs text-slate-300"
      dangerouslySetInnerHTML={{ __html: sanitizeBuffDesc(desc) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const MATRIX_COLOR = 'text-orange-400';
const MATRIX_BG = 'bg-orange-500/20';
const MATRIX_BORDER = 'border-orange-500/[0.75]';
const MATRIX_BORDER_DIM = 'border-orange-500/[0.35]';

const STABILITY_COLOR = 'text-sky-400';
const STABILITY_BG = 'bg-sky-500/20';
const STABILITY_BORDER = 'border-sky-500/[0.75]';

const SINGULARITY_COLOR = 'text-purple-400';
const SINGULARITY_BG = 'bg-purple-500/20';
const SINGULARITY_BORDER = 'border-purple-500/[0.75]';

function modeConfig(mode: string) {
  if (mode === 'Singularity Expansion') {
    return { color: SINGULARITY_COLOR, bg: SINGULARITY_BG, border: SINGULARITY_BORDER };
  }
  return { color: STABILITY_COLOR, bg: STABILITY_BG, border: STABILITY_BORDER };
}

export default function DoublePawnMatrixDetailsView({
  troopMatrix,
  matrixTeams,
  onUpdate,
  availableCharacters = [],
  healerCharacters = [],
  apiData,
}: TroopMatrixDetailsViewProps) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [saCollapsed, setSaCollapsed] = useState(false);
  const [seCollapsed, setSeCollapsed] = useState(false);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [editSAPoints, setEditSAPoints] = useState(0);
  const [editSEPoints, setEditSEPoints] = useState(0);
  const [editSEHighestRound, setEditSEHighestRound] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [editTeamPoints, setEditTeamPoints] = useState(0);
  const [editRoundNumber, setEditRoundNumber] = useState<number | null>(null);

  if (!troopMatrix) return null;

  const startEditOverview = () => {
    setEditSAPoints(troopMatrix.stability_accords_points);
    setEditSEPoints(troopMatrix.singularity_expansion_points);
    setEditSEHighestRound(troopMatrix.singularity_expansion_highest_round);
    setEditNotes(troopMatrix.notes || '');
    setEditingOverview(true);
  };

  const saveOverview = async () => {
    setSaving(true);
    try {
      // SA: 3 milestones at 4800/7200/10000 pts, 50 Astrite each = 150 max
      const SA_THRESHOLDS: [number, number][] = [
        [4800, 50], [7200, 50], [10000, 50],
      ];
      const saAstrite = SA_THRESHOLDS
        .filter(([t]) => editSAPoints >= t)
        .reduce((sum, [, r]) => sum + r, 0);
      // SE points-based: 3 milestones at 12000/16000/21000 pts, 50 each = 150 max
      // (37k→Premium Tuners, 58k→Title — no Astrite)
      const SE_THRESHOLDS: [number, number][] = [
        [12000, 50], [16000, 50], [21000, 50],
      ];
      const sePointsAstrite = SE_THRESHOLDS
        .filter(([t]) => editSEPoints >= t)
        .reduce((sum, [, r]) => sum + r, 0);
      // SE team-count rewards: 2 separate tiers, each 50 Astrite
      //   Tier 1: ≥3 SE teams scoring ≥5000 pts → 50 Astrite
      //   Tier 2: ≥4 SE teams scoring ≥5000 pts → 50 Astrite
      //   Total team-count max = 100. Combined with points max (150), SE total = 250.
      const SE_TEAM_THRESHOLD = 5000;
      const seTeamsAboveThreshold = matrixTeams
        .filter((t) => t.mode === 'Singularity Expansion' && t.points >= SE_TEAM_THRESHOLD)
        .length;
      const seTeamAstrite = (seTeamsAboveThreshold >= 3 ? 50 : 0)
                          + (seTeamsAboveThreshold >= 4 ? 50 : 0);
      const seAstrite = sePointsAstrite + seTeamAstrite;
      await safeInvoke('update_troop_matrix', {
        id: troopMatrix.id,
        stabilityAccordsPoints: editSAPoints,
        stabilityAccordsAstrite: saAstrite,
        singularityExpansionPoints: editSEPoints,
        singularityExpansionAstrite: seAstrite,
        singularityExpansionHighestRound: editSEHighestRound,
        notes: editNotes || null,
      });
      setEditingOverview(false);
      onUpdate();
    } catch (e) {
      console.error('Failed to update matrix overview:', e);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const startEditTeam = (team: MatrixTeam) => {
    setEditChar1(team.character1);
    setEditChar2(team.character2);
    setEditChar3(team.character3);
    setEditTeamPoints(team.points);
    setEditRoundNumber(team.round_number ?? null);
    setEditingTeam(team.id);
  };

  const saveTeam = async (id: number) => {
    const chars = [editChar1, editChar2, editChar3].filter(
      (c) => c && c !== 'None' && c !== ''
    );
    if (chars.length !== new Set(chars).size) {
      alert('Cannot use the same character more than once in a team');
      return;
    }
    setSaving(true);
    try {
      await safeInvoke('update_matrix_team', {
        id,
        character1: editChar1 || 'None',
        character2: editChar2 || 'None',
        character3: editChar3 || 'None',
        points: editTeamPoints,
        roundNumber: editRoundNumber,
      });
      setEditingTeam(null);
      onUpdate();
    } catch (e) {
      console.error('Failed to update team:', e);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const computeVigorMap = (): Record<string, number> => {
    const consumed: Record<string, number> = {};
    for (const t of matrixTeams) {
      for (const char of [t.character1, t.character2, t.character3]) {
        if (char && char !== 'None') {
          consumed[char] = (consumed[char] || 0) + 1;
        }
      }
    }
    return consumed;
  };
  const vigorConsumedMap = computeVigorMap();

  const saTeams = matrixTeams.filter((t) => t.mode === 'Stability Accords');
  const seTeams = matrixTeams.filter((t) => t.mode === 'Singularity Expansion');
  // Count SE teams that have reached the 5,000-point team-count reward threshold
  const seTeamsAbove5k = seTeams.filter((t) => t.points >= 5000).length;
  const totalAstrite =
    troopMatrix.stability_accords_astrite + troopMatrix.singularity_expansion_astrite;

  const apiSA: ApiMatrixLevel | undefined = apiData?.levels?.find(
    (l) => l.name === 'Stability Accords'
  );
  const apiSE: ApiMatrixLevel | undefined = apiData?.levels?.find(
    (l) => l.name === 'Singularity Expansion'
  );

  // Deduplicate SE waves — all rounds share the same monster pool (same MonsterId),
  // so we only show the unique set (by wave index within round 1) rather than
  // repeating identical cards once per round.
  const seUniqueWaves: ApiMatrixWave[] = apiSE
    ? apiSE.waves.filter((w) => w.round === Math.min(...apiSE.waves.map((x) => x.round)))
    : [];

  // ── Reusable team card renderer ──
  function TeamCard({ team }: { team: MatrixTeam }) {
    const cfg = modeConfig(team.mode);
    const isEditingThis = editingTeam === team.id;
    return (
      <div className={`${cfg.bg} rounded-lg p-3 border ${cfg.border}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-semibold ${cfg.color}`}>
            Team {team.team_number}
            {team.round_number != null && (
              <span className="ml-1 text-xs text-slate-500">R{team.round_number}</span>
            )}
            {team.points > 0 && (
              <span className="ml-2 text-xs text-slate-400">
                {team.points.toLocaleString()} pts
              </span>
            )}
            {team.mode === 'Singularity Expansion' && team.points >= 5000 && (
              <span className={`ml-1 text-[10px] font-semibold px-1 rounded ${SINGULARITY_BG} ${SINGULARITY_COLOR}`}>
                ✓ 5k
              </span>
            )}
          </span>
          {!isEditingThis && (
            <button onClick={() => startEditTeam(team)} className="p-1 hover:bg-slate-600 rounded">
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {isEditingThis ? (
          <TeamEditor
            character1={editChar1}
            character2={editChar2}
            character3={editChar3}
            onChar1Change={setEditChar1}
            onChar2Change={setEditChar2}
            onChar3Change={setEditChar3}
            onSave={() => saveTeam(team.id)}
            onCancel={() => setEditingTeam(null)}
            availableCharacters={availableCharacters}
            saving={saving}
            vigorConfig={{ vigorConsumedMap, getMaxVigor: () => 10, vigorCost: 1 }}
            saveButtonColor={cfg.bg}
            saveButtonHoverColor="hover:opacity-80"
            extraFields={
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Points</label>
                  <input
                    type="number"
                    value={editTeamPoints}
                    onChange={(e) => setEditTeamPoints(parseInt(e.target.value) || 0)}
                    className={`w-full bg-slate-700 border ${cfg.border} rounded px-2 py-1 text-sm`}
                    min="0"
                  />
                </div>
                {team.mode === 'Singularity Expansion' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Round</label>
                    <input
                      type="number"
                      value={editRoundNumber ?? ''}
                      onChange={(e) =>
                        setEditRoundNumber(e.target.value ? parseInt(e.target.value) : null)
                      }
                      className={`w-full bg-slate-700 border ${cfg.border} rounded px-2 py-1 text-sm`}
                      min="1"
                      placeholder="–"
                    />
                  </div>
                )}
              </div>
            }
          />
        ) : (
          <TeamDisplay
            characters={[team.character1, team.character2, team.character3]}
            size="md"
            showNames={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Overview ──────────────────────────────────────────────────────── */}
      <div
        className={`bg-slate-900/50 rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold flex items-center gap-2`}>
            <Grid3X3 className="w-6 h-6" />
            Overview
            {apiData && (
              <span className="text-xs font-normal text-slate-500 ml-1">
                {apiData.season_name}
              </span>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Stability Accords Points
                </label>
                <input
                  type="number"
                  value={editSAPoints}
                  onChange={(e) => setEditSAPoints(parseInt(e.target.value) || 0)}
                  className={`w-full bg-slate-700 border ${STABILITY_BORDER} rounded px-3 py-2 text-sm focus:outline-none`}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Singularity Expansion Points
                </label>
                <input
                  type="number"
                  value={editSEPoints}
                  onChange={(e) => setEditSEPoints(parseInt(e.target.value) || 0)}
                  className={`w-full bg-slate-700 border ${SINGULARITY_BORDER} rounded px-3 py-2 text-sm focus:outline-none`}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">SE Highest Round</label>
                <input
                  type="number"
                  value={editSEHighestRound}
                  onChange={(e) => setEditSEHighestRound(parseInt(e.target.value) || 0)}
                  className={`w-full bg-slate-700 border ${SINGULARITY_BORDER} rounded px-3 py-2 text-sm focus:outline-none`}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className={`w-full bg-slate-700 border ${MATRIX_BORDER_DIM} rounded px-3 py-2 text-sm focus:outline-none`}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingOverview(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={saveOverview}
                disabled={saving}
                className={`px-4 py-2 ${MATRIX_BG} hover:opacity-80 rounded flex items-center gap-2 text-sm ${MATRIX_COLOR}`}
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">SA Points</p>
              <p className="text-2xl font-bold text-yellow-400">{troopMatrix.stability_accords_points.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">SE Points</p>
              <p className="text-2xl font-bold text-yellow-400">{troopMatrix.singularity_expansion_points.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Teams ≥5k pts</p>
              <p className="text-2xl font-bold text-yellow-400">{seTeamsAbove5k} / 4</p>
            </div>
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Total Astrite</p>
              <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <CurrencyIcon currencyName="astrite" className="w-6 h-6" />
                {totalAstrite}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stability Accords ─────────────────────────────────────────────── */}
      <div
        className={`bg-slate-900/50 rounded-xl p-6 border-2 ${STABILITY_BORDER} shadow-[0_0_12px_rgba(226,232,240,0.08)]`}
      >
        <button
          onClick={() => setSaCollapsed((c) => !c)}
          className={`w-full flex items-center justify-between mb-4 text-left`}
        >
          <h4 className={`text-lg font-semibold ${STABILITY_COLOR}`}>Stability Accords</h4>
          <span className={`text-sm ${STABILITY_COLOR}`}>{saCollapsed ? '▶' : '▼'}</span>
        </button>

        {!saCollapsed && (
          <>
            {/* Season buffs */}
            {apiSA && apiSA.season_buffs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1.5">Season modifiers</p>
                <div className="space-y-1">
                  {apiSA.season_buffs.map((b) => (
                    <div
                      key={b.id}
                      className={`${STABILITY_BG} rounded px-2 py-1 border ${STABILITY_BORDER}`}
                    >
                      <BuffDesc desc={b.desc} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boss lineup */}
            {apiSA && apiSA.waves.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Current bosses</p>
                <div className="flex flex-wrap gap-3">
                  {apiSA.waves.map((w) => (
                    <WaveCard key={w.wave} wave={w} />
                  ))}
                </div>
              </div>
            )}

            {/* User teams */}
            <div className="space-y-3">
              {saTeams.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No teams recorded.</p>
              ) : (
                saTeams.map((team) => <TeamCard key={team.id} team={team} />)
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Singularity Expansion ─────────────────────────────────────────── */}
      <div
        className={`bg-slate-900/50 rounded-xl p-6 border-2 ${SINGULARITY_BORDER} shadow-[0_0_12px_rgba(226,232,240,0.08)]`}
      >
        <button
          onClick={() => setSeCollapsed((c) => !c)}
          className="w-full flex items-center justify-between mb-4 text-left"
        >
          <h4 className={`text-lg font-semibold ${SINGULARITY_COLOR}`}>
            Singularity Expansion
          </h4>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${SINGULARITY_COLOR}`}>
              Highest Round: {troopMatrix.singularity_expansion_highest_round}
            </span>
            <span className={`text-sm ${SINGULARITY_COLOR}`}>{seCollapsed ? '▶' : '▼'}</span>
          </div>
        </button>

        {!seCollapsed && (
          <>
            {/* Season buffs */}
            {apiSE && apiSE.season_buffs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1.5">Season modifiers</p>
                <div className="space-y-1">
                  {apiSE.season_buffs.map((b) => (
                    <div
                      key={b.id}
                      className={`${SINGULARITY_BG} rounded px-2 py-1 border ${SINGULARITY_BORDER}`}
                    >
                      <BuffDesc desc={b.desc} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boss pool — deduplicated (all rounds share identical monsters) */}
            {seUniqueWaves.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Boss pool</p>
                <div className="flex flex-wrap gap-3">
                  {seUniqueWaves.map((w) => (
                    <WaveCard key={w.wave} wave={w} />
                  ))}
                </div>
              </div>
            )}

            {/* User teams */}
            <div className="space-y-3">
              {seTeams.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No teams recorded.</p>
              ) : (
                seTeams.map((team) => <TeamCard key={team.id} team={team} />)
              )}
            </div>

            {troopMatrix.notes && (
              <div className="mt-4 bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm">{troopMatrix.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}