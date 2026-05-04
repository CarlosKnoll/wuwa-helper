import { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X, Waves, ChevronDown, Search } from 'lucide-react';
import { WhimperingWastes, TorrentsStage } from '../../types';
import { WhimperingWastesDetailsViewProps } from '../../props';
import { safeInvoke } from '../../utils';
import { CurrencyIcon } from '../CurrencyIcon';
import TeamDisplay, { TeamEditor } from './TeamManager';
import type { ApiMonster, ApiElement, ApiWhiwaStage, ApiWhiwaToken } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Enemy card: monster portrait + stacked element icons below name */
function MonsterCard({ monster }: { monster: ApiMonster }) {
  return (
    <div
      className="flex flex-col items-center gap-1 bg-slate-800/70 rounded-lg p-2.5 w-[4.5rem] flex-shrink-0"
      title={monster.name}
    >
      {/* Monster portrait */}
      <div className="relative w-10 h-10 flex-shrink-0">
        {monster.icon ? (
          <img
            src={monster.icon}
            alt={monster.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700" />
        )}
      </div>
      {/* Name */}
      <span className="text-[10px] text-slate-300 text-center leading-tight line-clamp-2 w-full">
        {monster.name}
      </span>
      {/* Element icons — one per resistance, skip if no icons */}
      {monster.elements.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5">
          {monster.elements.map((el, i) => (
            <img
              key={i}
              src={el.icon}
              alt={el.name}
              title={el.name}
              className="w-4 h-4 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MonsterLineup({ monsters }: { monsters: ApiMonster[] }) {
  if (!monsters.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {monsters.map((m, i) => (
        <MonsterCard key={i} monster={m} />
      ))}
    </div>
  );
}

/**
 * Sanitises API buff HTML: strips raw tags while preserving colour spans and
 * making all coloured text bold too.
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
// Token dropdown with icon + searchable list
// ─────────────────────────────────────────────────────────────────────────────

function TokenDropdown({
  value,
  onChange,
  tokens,
}: {
  value: string;
  onChange: (name: string) => void;
  tokens: ApiWhiwaToken[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const filtered = tokens.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const selected = tokens.find((t) => t.name === value);

  const qualityBorder = (q: number) =>
    q >= 5 ? 'border-yellow-500/60' : 'border-purple-500/60';
  const qualityGlow = (q: number) =>
    q >= 5 ? 'text-yellow-400' : 'text-purple-400';

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className="w-full flex items-center gap-2 bg-slate-700 border border-teal-500/40 rounded px-2 py-1.5 text-sm hover:border-teal-500/70 transition-colors text-left"
      >
        {selected ? (
          <>
            <img
              src={selected.icon}
              alt={selected.name}
              className={`w-5 h-5 rounded flex-shrink-0 border ${qualityBorder(selected.quality)}`}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className={`flex-1 truncate text-xs ${qualityGlow(selected.quality)}`}>
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-slate-400 text-xs">Select token…</span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-700">
            <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens…"
              className="flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
            />
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-700 transition-colors"
            >
              <span className="w-5 h-5 flex-shrink-0" />
              <span className="italic">None</span>
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500 italic">No results</p>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onChange(t.name); setOpen(false); setQuery(''); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 transition-colors ${
                  value === t.name ? 'bg-slate-700' : ''
                }`}
              >
                <img
                  src={t.icon}
                  alt={t.name}
                  className={`w-5 h-5 rounded flex-shrink-0 border ${qualityBorder(t.quality)}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className={`text-xs truncate ${qualityGlow(t.quality)}`}>
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Token display badge (read-only)
// ─────────────────────────────────────────────────────────────────────────────

function TokenBadge({
  tokenName,
  tokens,
}: {
  tokenName: string;
  tokens: ApiWhiwaToken[];
}) {
  const token = tokens.find((t) => t.name === tokenName);
  if (!tokenName) return null;

  if (!token) {
    // Fallback for legacy plain-string tokens (pre-API)
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium text-teal-300 bg-teal-500/20">
        {tokenName}
      </span>
    );
  }

  const isGold = token.quality >= 5;
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${
        isGold ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-purple-500/50 bg-purple-500/10'
      }`}
    >
      <img
        src={token.icon}
        alt={token.name}
        className="w-4 h-4 rounded flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <span className={`text-xs font-medium ${isGold ? 'text-yellow-400' : 'text-purple-300'}`}>
        {token.name}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const WHIWA_COLOR = 'text-teal-400';
const WHIWA_BG = 'bg-teal-500/20';
const WHIWA_BORDER = 'border-teal-500/[0.75]';
const WHIWA_BORDER_DIM = 'border-teal-500/[0.35]';
const WHIWA_BAR = 'bg-teal-500';

export default function WhimperingWastesDetailsView({
  wastesInfo,
  torrentsStages,
  onUpdate,
  availableCharacters = [],
  apiData,
}: WhimperingWastesDetailsViewProps) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Overview form
  const [editChasmPoints, setEditChasmPoints] = useState(0);
  const [editTorrentsPoints, setEditTorrentsPoints] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Stage form
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [editToken, setEditToken] = useState('');
  const [editPoints, setEditPoints] = useState(0);

  if (!wastesInfo) return null;

  // Token list from API (empty array if offline)
  const apiTokens: ApiWhiwaToken[] = apiData?.token_items ?? [];

  const startEditOverview = () => {
    setEditChasmPoints(wastesInfo.chasm_total_points);
    setEditTorrentsPoints(wastesInfo.torrents_total_points);
    setEditNotes(wastesInfo.notes || '');
    setEditingOverview(true);
  };

  const saveOverview = async () => {
    setSaving(true);
    try {
      // Chasm: 5 milestones at 5000/7000/9500/12000/15000 pts, 125 Astrite each = 625 max
      const CHASM_THRESHOLDS: [number, number][] = [
        [5000, 125], [7000, 125], [9500, 125], [12000, 125], [15000, 125],
      ];
      const chasmAstrite = CHASM_THRESHOLDS
        .filter(([t]) => editChasmPoints >= t)
        .reduce((sum, [, reward]) => sum + reward, 0);
      // Torrents: 3 milestones at 3500/4000/4500 pts, 75+50+50 = 175 max
      const TORRENTS_THRESHOLDS: [number, number][] = [
        [3500, 75], [4000, 50], [4500, 50],
      ];
      const torrentsAstrite = TORRENTS_THRESHOLDS
        .filter(([t]) => editTorrentsPoints >= t)
        .reduce((sum, [, reward]) => sum + reward, 0);
      await safeInvoke('update_whimpering_wastes', {
        id: wastesInfo.id,
        chasmHighestStage: wastesInfo.chasm_highest_stage,
        chasmTotalPoints: editChasmPoints,
        chasmAstrite,
        torrentsTotalPoints: editTorrentsPoints,
        torrentsAstrite,
        notes: editNotes || null,
      });
      setEditingOverview(false);
      onUpdate();
    } catch (e) {
      console.error('Failed to update wastes overview:', e);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const startEditStage = (stage: TorrentsStage) => {
    setEditChar1(stage.character1);
    setEditChar2(stage.character2);
    setEditChar3(stage.character3);
    setEditToken(stage.token);
    setEditPoints(stage.points);
    setEditingStage(stage.id);
  };

  const saveStage = async (id: number) => {
    const chars = [editChar1, editChar2, editChar3].filter(
      (c) => c && c !== 'None' && c !== ''
    );
    if (chars.length !== new Set(chars).size) {
      alert('Cannot use the same character more than once in a team');
      return;
    }
    setSaving(true);
    try {
      await safeInvoke('update_torrents_stage', {
        id,
        character1: editChar1 || 'None',
        character2: editChar2 || 'None',
        character3: editChar3 || 'None',
        token: editToken || '',
        points: editPoints,
      });
      setEditingStage(null);
      onUpdate();
    } catch (e) {
      console.error('Failed to update stage:', e);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const computeVigorMap = (): Record<string, number> => {
    const consumed: Record<string, number> = {};
    for (const s of torrentsStages) {
      for (const char of [s.character1, s.character2, s.character3]) {
        if (char && char !== 'None') {
          consumed[char] = (consumed[char] || 0) + 1;
        }
      }
    }
    return consumed;
  };
  const vigorConsumedMap = computeVigorMap();

  const totalAstrite = wastesInfo.chasm_astrite + wastesInfo.torrents_astrite;

  return (
    <div className="space-y-6">
      {/* ── Overview ──────────────────────────────────────────────────────── */}
      <div
        className={`bg-slate-900/50 rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold flex items-center gap-2`}>
            <Waves className="w-6 h-6" />
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
                <label className="text-sm text-slate-400 block mb-1">Chasm Total Points</label>
                <input
                  type="number"
                  value={editChasmPoints}
                  onChange={(e) => setEditChasmPoints(parseInt(e.target.value) || 0)}
                  className={`w-full bg-slate-700 border ${WHIWA_BORDER} rounded px-3 py-2 text-sm focus:outline-none`}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Torrents Total Points</label>
                <input
                  type="number"
                  value={editTorrentsPoints}
                  onChange={(e) => setEditTorrentsPoints(parseInt(e.target.value) || 0)}
                  className={`w-full bg-slate-700 border ${WHIWA_BORDER} rounded px-3 py-2 text-sm focus:outline-none`}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className={`w-full bg-slate-700 border ${WHIWA_BORDER_DIM} rounded px-3 py-2 text-sm focus:outline-none`}
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
                className={`px-4 py-2 ${WHIWA_BG} hover:opacity-80 rounded flex items-center gap-2 text-sm ${WHIWA_COLOR}`}
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Chasm Points</p>
              <p className="text-2xl font-bold text-yellow-400">{wastesInfo.chasm_total_points.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Torrents Points</p>
              <p className="text-2xl font-bold text-yellow-400">{wastesInfo.torrents_total_points.toLocaleString()}</p>
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

      {/* ── Infinite Torrents ──────────────────────────────────────────────── */}
      <div
        className={`bg-slate-900/50 rounded-xl p-6 border-2 ${WHIWA_BORDER} shadow-[0_0_12px_rgba(226,232,240,0.08)]`}
      >
        <h4 className={`text-lg font-semibold ${WHIWA_COLOR} mb-4 flex items-center gap-2`}>
          <Waves className="w-5 h-5" />
          Infinite Torrents
          {apiData && (
            <span className="text-xs font-normal text-slate-400 ml-1">
              — {apiData.season_name}
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((sideIndex) => {
            const stage = torrentsStages.find((s) => s.stage_number === sideIndex);
            const isEditingThis = editingStage === stage?.id;
            const apiStage: ApiWhiwaStage | undefined = apiData?.torrents_stages?.find(
              (s) => s.stage_index === sideIndex
            );

            return (
              <div
                key={sideIndex}
                className={`${WHIWA_BG} rounded-lg p-4 border ${WHIWA_BORDER} space-y-3`}
              >
                {/* Side header */}
                <div className="flex items-center justify-between">
                  <h5 className={`text-sm font-semibold ${WHIWA_COLOR}`}>Side {sideIndex}</h5>
                  {stage && !isEditingThis && (
                    <button
                      onClick={() => startEditStage(stage)}
                      className="p-1 hover:bg-slate-600 rounded transition-colors"
                      title="Edit team"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* ① API dungeon description */}
                {apiStage?.dungeon_desc && (
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    <BuffDesc desc={apiStage.dungeon_desc} />
                  </p>
                )}

                {/* ② Enemies — above team card */}
                {apiStage && apiStage.monsters.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Enemies</p>
                    <MonsterLineup monsters={apiStage.monsters} />
                  </div>
                )}

                {/* ③ Team + token — edit or display */}
                {isEditingThis ? (
                  <TeamEditor
                    character1={editChar1}
                    character2={editChar2}
                    character3={editChar3}
                    onChar1Change={setEditChar1}
                    onChar2Change={setEditChar2}
                    onChar3Change={setEditChar3}
                    onSave={() => saveStage(stage!.id)}
                    onCancel={() => setEditingStage(null)}
                    availableCharacters={availableCharacters}
                    saving={saving}
                    vigorConfig={{
                      vigorConsumedMap,
                      getMaxVigor: () => 10,
                      vigorCost: 1,
                    }}
                    saveButtonColor={WHIWA_BG}
                    saveButtonHoverColor="hover:opacity-80"
                    extraFields={
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Token</label>
                          {apiTokens.length > 0 ? (
                            <TokenDropdown
                              value={editToken}
                              onChange={setEditToken}
                              tokens={apiTokens}
                            />
                          ) : (
                            <input
                              type="text"
                              value={editToken}
                              onChange={(e) => setEditToken(e.target.value)}
                              className={`w-full bg-slate-700 border ${WHIWA_BORDER_DIM} rounded px-2 py-1 text-sm`}
                              placeholder="Token name…"
                            />
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Points</label>
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                            className={`w-full bg-slate-700 border ${WHIWA_BORDER_DIM} rounded px-2 py-1 text-sm`}
                            min="0"
                          />
                        </div>
                      </div>
                    }
                  />
                ) : stage ? (
                  <div className="space-y-2">
                    <TeamDisplay
                      characters={[stage.character1, stage.character2, stage.character3]}
                      size="md"
                      showNames={true}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {stage.token && (
                        <TokenBadge tokenName={stage.token} tokens={apiTokens} />
                      )}
                      {stage.points > 0 && (
                        <span className={`text-sm font-semibold ${WHIWA_COLOR} ml-auto`}>
                          {stage.points.toLocaleString()} pts
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No team recorded
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total points progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Total Points</span>
            <span className={WHIWA_COLOR}>
              {wastesInfo.torrents_total_points.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className={`${WHIWA_BAR} h-full rounded-full transition-all`}
              style={{
                width: `${Math.min((wastesInfo.torrents_total_points / 5500) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-slate-500">/ 5,500 (SSS)</span>
          </div>
        </div>

        {wastesInfo.notes && (
          <div className="mt-4 bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <p className="text-sm">{wastesInfo.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}