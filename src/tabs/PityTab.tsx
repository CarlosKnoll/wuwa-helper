import React, { useState, useEffect } from 'react';
import { Edit2, Save } from 'lucide-react';
import { safeInvoke } from '../utils';

export default function PityTab({ pityStatus, onUpdate }: { pityStatus: PityStatus[]; onUpdate: () => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [forms, setForms] = useState<Record<number, { current_pity: number; guaranteed_next_fivestar: boolean; notes: string }>>({});

  useEffect(() => {
    const newForms: Record<number, any> = {};
    pityStatus.forEach(pity => {
      newForms[pity.id] = {
        current_pity: pity.current_pity,
        guaranteed_next_fivestar: pity.guaranteed_next_fivestar || false,
        notes: pity.notes || '',
      };
    });
    setForms(newForms);
  }, [pityStatus]);

  const handleSave = async (pity: PityStatus) => {
    try {
      const form = forms[pity.id];
      await safeInvoke('update_pity', {
        id: pity.id,
        currentPity: form.current_pity,
        guaranteedNextFivestar: form.guaranteed_next_fivestar,
        notes: form.notes || null,
      });
      setEditing(null);
      onUpdate();
    } catch (err) {
      alert('Failed to update pity: ' + err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {pityStatus.map((pity) => {
        const isEditing = editing === pity.id;
        const form = forms[pity.id] || { current_pity: pity.current_pity, guaranteed_next_fivestar: pity.guaranteed_next_fivestar || false, notes: pity.notes || '' };

        return (
          <div key={pity.id} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{pity.banner_type}</h3>
                <p className="text-sm text-slate-400 mt-1">Banner Type</p>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <button onClick={() => setEditing(pity.id)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => handleSave(pity)} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg">
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              {isEditing ? (
                <div>
                  <label className="text-sm text-slate-400">Current Pity</label>
                  <input
                    type="number"
                    value={form.current_pity}
                    onChange={e => setForms({ ...forms, [pity.id]: { ...form, current_pity: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-3xl font-bold focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-cyan-400">{form.current_pity}</span>
                  <span className="text-2xl text-slate-400">/ 80</span>
                </div>
              )}
              <div className="text-sm text-slate-400 mt-2">Pulls since last 5-star</div>
            </div>

            <div className="mb-4">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300" style={{ width: `${(form.current_pity / 80) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0</span>
                <span>Hard pity at 80</span>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.guaranteed_next_fivestar}
                    onChange={e => setForms({ ...forms, [pity.id]: { ...form, guaranteed_next_fivestar: e.target.checked } })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm">Guaranteed next 5-star</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForms({ ...forms, [pity.id]: { ...form, notes: e.target.value } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="Add notes..."
                />
              </div>
            ) : (
              <div className={`px-3 py-2 rounded text-center text-sm font-medium ${form.guaranteed_next_fivestar ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {form.guaranteed_next_fivestar ? '✓ Guaranteed 5-Star' : '50/50 Active'}
              </div>
            )}

            {!isEditing && form.notes && (
              <p className="text-sm text-slate-400 italic mt-4">{form.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}