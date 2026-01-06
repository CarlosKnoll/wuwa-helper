import React, { useState, useEffect } from 'react';
import { Target, Star, Shield, Edit2, Save, Coins } from 'lucide-react';
import { safeInvoke } from '../utils';

export default function ResourcesTab({ resources, onUpdate }: { resources: Resources | null; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    astrite: resources?.astrite || 0,
    lustrous_tide: resources?.lustrous_tide || 0,
    radiant_tide: resources?.radiant_tide || 0,
    forged_tide: resources?.forged_tide || 0,
    afterglow_coral: resources?.afterglow_coral || 0,
    oscillated_coral: resources?.oscillated_coral || 0,
    shell_credits: resources?.shell_credits || 0,
    notes: resources?.notes || '',
  });

  useEffect(() => {
    if (resources) {
      setForm({
        astrite: resources.astrite,
        lustrous_tide: resources.lustrous_tide,
        radiant_tide: resources.radiant_tide,
        forged_tide: resources.forged_tide,
        afterglow_coral: resources.afterglow_coral,
        oscillated_coral: resources.oscillated_coral,
        shell_credits: resources.shell_credits,
        notes: resources.notes || '',
      });
    }
  }, [resources]);

  const handleSave = async () => {
    try {
      await safeInvoke('update_resources', {
        astrite: form.astrite,
        lustrousTide: form.lustrous_tide,
        radiantTide: form.radiant_tide,
        forgedTide: form.forged_tide,
        afterglowCoral: form.afterglow_coral,
        oscillatedCoral: form.oscillated_coral,
        shellCredits: form.shell_credits,
        notes: form.notes || null,
      });
      setEditing(false);
      onUpdate();
    } catch (err) {
      alert('Failed to update resources: ' + err);
    }
  };

  if (!resources) return <div>No resource data</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!editing ? (
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg flex items-center gap-2">
            <Edit2 className="w-4 h-4" />Edit Resources
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-2">
              <Save className="w-4 h-4" />Save
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancel</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          { label: 'Astrite', key: 'astrite', icon: Star, color: 'text-yellow-400' },
          { label: 'Lustrous Tide', key: 'lustrous_tide', icon: Target, color: 'text-blue-400' },
          { label: 'Radiant Tide', key: 'radiant_tide', icon: Target, color: 'text-purple-400' },
          { label: 'Forged Tide', key: 'forged_tide', icon: Target, color: 'text-cyan-400' },
          { label: 'Afterglow Coral', key: 'afterglow_coral', icon: Shield, color: 'text-pink-400' },
          { label: 'Oscillated Coral', key: 'oscillated_coral', icon: Shield, color: 'text-orange-400' },
          { label: 'Shell Credits', key: 'shell_credits', icon: Coins, color: 'text-green-400' },
        ].map(({ label, key, icon: Icon, color }) => (
          <div key={key} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <Icon className={`w-6 h-6 ${color}`} />
              <span className="text-slate-400 text-sm">{label}</span>
            </div>
            {editing ? (
              <input
                type="number"
                value={form[key as keyof typeof form]}
                onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-2xl font-bold focus:outline-none focus:border-cyan-500"
              />
            ) : (
              <div className="text-3xl font-bold">{form[key as keyof typeof form].toLocaleString()}</div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <h3 className="font-bold mb-2">Notes</h3>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:border-cyan-500"
            placeholder="Add notes about your resources..."
          />
        </div>
      )}
    </div>
  );
}