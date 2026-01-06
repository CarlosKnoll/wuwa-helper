import React, { useState } from 'react';
import { Edit2, Save, X, Zap } from 'lucide-react';
import { safeInvoke } from '../utils';

interface CharacterTalentsSectionProps {
  talents: CharacterTalents | null;
  characterId: number;
  onUpdate: () => void;
}

export default function CharacterTalentsSection({
  talents,
  characterId,
  onUpdate
}: CharacterTalentsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    basic_level: talents?.basic_level || 0,
    skill_level: talents?.skill_level || 0,
    liberation_level: talents?.liberation_level || 0,
    forte_level: talents?.forte_level || 0,
    intro_level: talents?.intro_level || 0,
    notes: talents?.notes || '',
  });

  const handleSave = async () => {
    try {
      await safeInvoke('update_character_talents', {
        characterId,
        basicLevel: form.basic_level || null,
        skillLevel: form.skill_level || null,
        liberationLevel: form.liberation_level || null,
        forteLevel: form.forte_level || null,
        introLevel: form.intro_level || null,
        notes: form.notes || null,
      });
      setEditing(false);
      await onUpdate();
    } catch (err) {
      alert('Failed to update talents: ' + err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      basic_level: talents?.basic_level || 0,
      skill_level: talents?.skill_level || 0,
      liberation_level: talents?.liberation_level || 0,
      forte_level: talents?.forte_level || 0,
      intro_level: talents?.intro_level || 0,
      notes: talents?.notes || '',
    });
  };

  if (!talents) return null;

  const talentFields = [
    { key: 'basic_level', label: 'Basic', icon: '⚔️' },
    { key: 'skill_level', label: 'Skill', icon: '🎯' },
    { key: 'liberation_level', label: 'Liberation', icon: '💫' },
    { key: 'forte_level', label: 'Forte', icon: '⚡' },
    { key: 'intro_level', label: 'Intro', icon: '🌟' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          <h3 className="text-lg font-bold">Talents</h3>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded transition-colors">
            <Edit2 size={16} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-2 bg-green-500 hover:bg-green-600 rounded transition-colors">
              <Save size={16} />
            </button>
            <button onClick={handleCancel} className="p-2 bg-slate-600 hover:bg-slate-700 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {talentFields.map(field => (
              <div key={field.key}>
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <span>{field.icon}</span>
                  {field.label}
                </label>
                <input
                  type="number"
                  value={form[field.key as keyof typeof form] as number}
                  onChange={e => setForm({ ...form, [field.key]: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 mt-1 text-sm focus:outline-none focus:border-cyan-500"
                  min="0"
                  max="10"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 text-sm focus:outline-none focus:border-cyan-500"
              placeholder="Talent notes..."
              rows={2}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {talentFields.map(field => (
              <div key={field.key} className="bg-slate-900/50 rounded p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">{field.icon} {field.label}</p>
                <p className="text-cyan-400 font-bold text-2xl">
                  {talents[field.key as keyof CharacterTalents] || 0}
                </p>
              </div>
            ))}
          </div>
          {form.notes && (
            <p className="text-sm text-slate-400 italic">{form.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
