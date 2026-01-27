import { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { TroopMatrixSectionProps } from '../types'
import { safeInvoke } from '../utils';

export default function TroopMatrixSection({
  troopMatrix,
  isExpanded,
  onToggle,
  onUpdate
}: TroopMatrixSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editProgress, setEditProgress] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const startEdit = () => {
    if (troopMatrix) {
      setEditProgress(troopMatrix.progress);
      setEditNotes(troopMatrix.notes || '');
      setEditing(true);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await safeInvoke('update_troop_matrix', {
        progress: editProgress,
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

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-green-400" />
          <div className="text-left">
            <h3 className="text-xl font-bold">Double Pawns Matrix (Troop Matrix)</h3>
            {troopMatrix ? (
              <p className="text-sm text-slate-400">
                {troopMatrix.unlocked ? 'Unlocked' : 'Locked'} • {troopMatrix.progress}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Not unlocked yet - Requires 30★ Tower + 4500pts Wastes</p>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="p-6 border-t border-slate-800">
          {troopMatrix ? (
            editing ? (
              /* Edit Mode */
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Progress</label>
                  <input
                    type="text"
                    value={editProgress}
                    onChange={(e) => setEditProgress(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    placeholder="e.g., 5/10 completed"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    rows={3}
                    placeholder="Add notes about your progress..."
                  />
                </div>
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
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      troopMatrix.unlocked 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {troopMatrix.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                    <button
                      onClick={startEdit}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-400 mb-1">Progress</p>
                  <p className="text-lg font-semibold">{troopMatrix.progress}</p>
                </div>
                {troopMatrix.notes && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-300">{troopMatrix.notes}</p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Troop Matrix Not Unlocked</h4>
              <p className="text-slate-400 text-sm mb-4">
                Complete the following requirements to unlock:
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>Obtain 30 stars in Tower of Adversity</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Score 4500+ points in Whimpering Wastes: Infinite Torrents</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}