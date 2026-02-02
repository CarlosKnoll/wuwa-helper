import { useState } from 'react';
import { Edit2, Save, X, Zap } from 'lucide-react';
import { CharacterTalents, CharacterTalentsSectionProps } from '../types';
import { safeInvoke } from '../utils';

export default function CharacterTalentsSection({
  talents,
  characterId,
  onUpdate
}: CharacterTalentsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    basic_level: talents?.basic_level || 1,
    skill_level: talents?.skill_level || 1,
    liberation_level: talents?.liberation_level || 1,
    forte_level: talents?.forte_level || 1,
    intro_level: talents?.intro_level || 1,
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
      basic_level: talents?.basic_level || 1,
      skill_level: talents?.skill_level || 1,
      liberation_level: talents?.liberation_level || 1,
      forte_level: talents?.forte_level || 1,
      intro_level: talents?.intro_level || 1,
      notes: talents?.notes || '',
    });
  };

  const handleTraceClick = (talentKey: keyof typeof form, targetLevel: number) => {
    if (!editing) return;
    const currentLevel = form[talentKey] as number;
    
    if (currentLevel === targetLevel) {
      setForm({ ...form, [talentKey]: Math.max(1, targetLevel - 1) });
    } else {
      setForm({ ...form, [talentKey]: targetLevel });
    }
  };

  if (!talents) return null;

  // Reordered to match in-game: Basic, Skill, Forte, Liberation, Intro
  const talentFields = [
    { key: 'basic_level', label: 'Normal Attack', icon: '⚔️', color: 'from-orange-500 to-orange-600' },
    { key: 'skill_level', label: 'Resonance Skill', icon: '🎯', color: 'from-blue-500 to-blue-600' },
    { key: 'forte_level', label: 'Forte Circuit', icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
    { key: 'liberation_level', label: 'Resonance Liberation', icon: '💫', color: 'from-purple-500 to-purple-600' },
    { key: 'intro_level', label: 'Intro Skill', icon: '🌟', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-[600px] relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Zap size={28} className="text-yellow-400" />
          <div>
            <h3 className="text-2xl font-bold text-white">Forte</h3>
            <p className="text-sm text-slate-400">Character Talents & Abilities</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors flex items-center gap-2">
            <Edit2 size={18} className="text-cyan-400" />
            <span className="text-cyan-400 font-semibold">Edit</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors flex items-center gap-2">
              <Save size={18} className="text-green-400" />
              <span className="text-green-400 font-semibold">Save</span>
            </button>
            <button onClick={handleCancel} className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 rounded-lg transition-colors flex items-center gap-2">
              <X size={18} className="text-slate-400" />
              <span className="text-slate-400 font-semibold">Cancel</span>
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-8">
          {/* Skill Tree Style Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talentFields.map(field => {
              const currentLevel = form[field.key as keyof typeof form] as number;
              return (
                <div key={field.key} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                  {/* Skill Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${field.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {field.icon}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{field.label}</div>
                      <div className="text-sm text-slate-400">Lv. {currentLevel}/10</div>
                    </div>
                  </div>
                  
                  {/* Level Circles */}
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(10)].map((_, idx) => {
                      const level = idx + 1;
                      const isActive = level <= currentLevel;
                      return (
                        <button
                          key={level}
                          onClick={() => handleTraceClick(field.key as keyof typeof form, level)}
                          className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${
                            isActive
                              ? `bg-gradient-to-br ${field.color} border-white/50 text-white shadow-md`
                              : 'border-slate-600 text-slate-500 hover:border-slate-500 bg-slate-800/50'
                          }`}
                          title={`Set ${field.label} to level ${level}`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <label className="text-sm text-slate-400 mb-2 block">Talent Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 min-h-[100px]"
              placeholder="Add notes about talent priorities, combos, or strategies..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Talent Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {talentFields.map(field => {
              const level = talents[field.key as keyof CharacterTalents] || 1;
              return (
                <div key={field.key} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${field.color} flex items-center justify-center text-3xl shadow-lg mb-3`}>
                    {field.icon}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{field.label}</div>
                  <div className="text-3xl font-bold text-white">
                    {level}
                    <span className="text-slate-500 text-lg">/10</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes Display */}
          {form.notes && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <div className="text-sm text-slate-400 mb-2">Talent Notes</div>
              <p className="text-slate-300 leading-relaxed">{form.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-yellow-500/50 via-purple-500/50 to-transparent" />
    </div>
  );
}