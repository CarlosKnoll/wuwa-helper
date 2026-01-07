import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { WhimperingWastesSectionProps, TorrentsStage } from '../types'
import { safeInvoke } from '../utils';

export default function WhimperingWastesSection({
  wastesInfo,
  torrentsStages,
  isExpanded,
  onToggle,
  onUpdate
}: WhimperingWastesSectionProps) {
  const [editing, setEditing] = useState(false);
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [editChasmStage, setEditChasmStage] = useState(0);
  const [editChasmPoints, setEditChasmPoints] = useState(0);
  const [editChasmAstrite, setEditChasmAstrite] = useState(0);
  const [editTorrentsPoints, setEditTorrentsPoints] = useState(0);
  const [editTorrentsAstrite, setEditTorrentsAstrite] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Edit state for torrents stages
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [editToken, setEditToken] = useState('');
  const [editPoints, setEditPoints] = useState(0);

  const startEdit = () => {
    if (wastesInfo) {
      setEditChasmStage(wastesInfo.chasm_highest_stage);
      setEditChasmPoints(wastesInfo.chasm_total_points);
      setEditChasmAstrite(wastesInfo.chasm_astrite);
      setEditTorrentsPoints(wastesInfo.torrents_total_points);
      setEditTorrentsAstrite(wastesInfo.torrents_astrite);
      setEditNotes(wastesInfo.notes || '');
      setEditing(true);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await safeInvoke('update_whimpering_wastes', {
        chasmHighestStage: editChasmStage,
        chasmTotalPoints: editChasmPoints,
        chasmAstrite: editChasmAstrite,
        torrentsTotalPoints: editTorrentsPoints,
        torrentsAstrite: editTorrentsAstrite,
        notes: editNotes || null
      });
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update whimpering wastes:', error);
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

  const cancelEditStage = () => {
    setEditingStage(null);
  };

  const saveStage = async (id: number) => {
    setSaving(true);
    try {
      await safeInvoke('update_torrents_stage', {
        id,
        character1: editChar1,
        character2: editChar2,
        character3: editChar3,
        token: editToken,
        points: editPoints
      });
      setEditingStage(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update torrents stage:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-purple-400" />
          <div className="text-left">
            <h3 className="text-xl font-bold">Whimpering Wastes</h3>
            {wastesInfo && (
              <p className="text-sm text-slate-400">
                Chasm: {wastesInfo.chasm_total_points} pts • Torrents: {wastesInfo.torrents_total_points} pts
              </p>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && wastesInfo && (
        <div className="p-6 space-y-6 border-t border-slate-800">
          {/* Overview with Edit Button */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Last Reset: {wastesInfo.last_reset}</p>
              {!editing && (
                <button
                  onClick={startEdit}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {!editing && wastesInfo.notes && (
              <p className="text-sm text-slate-300">{wastesInfo.notes}</p>
            )}
          </div>

          {editing ? (
            /* Edit Mode */
            <div className="space-y-4">
              {/* Chasm Stats Edit */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-orange-400">Chasm</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Highest Stage</label>
                    <input
                      type="number"
                      value={editChasmStage}
                      onChange={(e) => setEditChasmStage(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Total Points</label>
                    <input
                      type="number"
                      value={editChasmPoints}
                      onChange={(e) => setEditChasmPoints(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Astrite Earned</label>
                    <input
                      type="number"
                      value={editChasmAstrite}
                      onChange={(e) => setEditChasmAstrite(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Torrents Stats Edit */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-blue-400">Torrents</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Total Points</label>
                    <input
                      type="number"
                      value={editTorrentsPoints}
                      onChange={(e) => setEditTorrentsPoints(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Astrite Earned</label>
                    <input
                      type="number"
                      value={editTorrentsAstrite}
                      onChange={(e) => setEditTorrentsAstrite(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Edit */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <label className="text-sm text-slate-400 block mb-2">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Chasm Stats */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-orange-400">Chasm</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Highest Stage</p>
                    <p className="text-2xl font-bold">{wastesInfo.chasm_highest_stage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Points</p>
                    <p className="text-2xl font-bold">{wastesInfo.chasm_total_points}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Astrite Earned</p>
                    <p className="text-2xl font-bold text-cyan-400">{wastesInfo.chasm_astrite}</p>
                  </div>
                </div>
              </div>

              {/* Torrents Stats */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-blue-400">Torrents</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Points</p>
                    <p className="text-2xl font-bold">{wastesInfo.torrents_total_points}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Astrite Earned</p>
                    <p className="text-2xl font-bold text-cyan-400">{wastesInfo.torrents_astrite}</p>
                  </div>
                </div>

                {/* Torrents Stages */}
                {torrentsStages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-cyan-400 uppercase">Stages Completed</p>
                    <div className="grid gap-2">
                      {torrentsStages.map((stage) => {
                        const isEditingThisStage = editingStage === stage.id;

                        return isEditingThisStage ? (
                          <div key={stage.id} className="bg-slate-900/50 rounded p-3 space-y-3">
                            <p className="text-xs font-semibold text-slate-400">Stage {stage.stage_number}</p>
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
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Token</label>
                                <input
                                  type="text"
                                  value={editToken}
                                  onChange={(e) => setEditToken(e.target.value)}
                                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                  placeholder="Token type"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Points</label>
                                <input
                                  type="number"
                                  value={editPoints}
                                  onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                  min="0"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={cancelEditStage}
                                disabled={saving}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                              <button
                                onClick={() => saveStage(stage.id)}
                                disabled={saving}
                                className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 rounded text-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={stage.id} className="bg-slate-900/50 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">Stage {stage.stage_number}</span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">{stage.token}</span>
                                <span className="text-sm font-bold">{stage.points} pts</span>
                                <button
                                  onClick={() => startEditStage(stage)}
                                  className="p-1 hover:bg-slate-700 rounded transition-colors ml-2"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{stage.character1}</span>
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{stage.character2}</span>
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{stage.character3}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}