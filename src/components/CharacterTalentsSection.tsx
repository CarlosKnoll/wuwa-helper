import { useState } from 'react';
import { Edit2, Save, X, Zap, ChevronUp, ChevronDown } from 'lucide-react';
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
    // Minor traces
    basic_minor_1: talents?.basic_minor_1 || 0,
    basic_minor_2: talents?.basic_minor_2 || 0,
    skill_minor_1: talents?.skill_minor_1 || 0,
    skill_minor_2: talents?.skill_minor_2 || 0,
    liberation_minor_1: talents?.liberation_minor_1 || 0,
    liberation_minor_2: talents?.liberation_minor_2 || 0,
    intro_minor_1: talents?.intro_minor_1 || 0,
    intro_minor_2: talents?.intro_minor_2 || 0,
    // Major traces
    forte_major_1: talents?.forte_major_1 || 0,
    forte_major_2: talents?.forte_major_2 || 0,
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
        basicMinor1: form.basic_minor_1,
        basicMinor2: form.basic_minor_2,
        skillMinor1: form.skill_minor_1,
        skillMinor2: form.skill_minor_2,
        liberationMinor1: form.liberation_minor_1,
        liberationMinor2: form.liberation_minor_2,
        introMinor1: form.intro_minor_1,
        introMinor2: form.intro_minor_2,
        forteMajor1: form.forte_major_1,
        forteMajor2: form.forte_major_2,
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
      basic_minor_1: talents?.basic_minor_1 || 0,
      basic_minor_2: talents?.basic_minor_2 || 0,
      skill_minor_1: talents?.skill_minor_1 || 0,
      skill_minor_2: talents?.skill_minor_2 || 0,
      liberation_minor_1: talents?.liberation_minor_1 || 0,
      liberation_minor_2: talents?.liberation_minor_2 || 0,
      intro_minor_1: talents?.intro_minor_1 || 0,
      intro_minor_2: talents?.intro_minor_2 || 0,
      forte_major_1: talents?.forte_major_1 || 0,
      forte_major_2: talents?.forte_major_2 || 0,
    });
  };

  const toggleTrace = (key: keyof typeof form) => {
    setForm({ ...form, [key]: form[key] === 1 ? 0 : 1 });
  };

  const adjustTalentLevel = (key: keyof typeof form, delta: number) => {
    const currentLevel = form[key] as number;
    const newLevel = Math.max(1, Math.min(10, currentLevel + delta));
    setForm({ ...form, [key]: newLevel });
  };

  if (!talents) return null;

  // Talent node config (bottom row)
  const talentNodes = [
    { key: 'basic_level', label: 'Normal Attack', icon: '⚔️', color: 'from-orange-500 to-orange-600' },
    { key: 'skill_level', label: 'Resonance Skill', icon: '🎯', color: 'from-blue-500 to-blue-600' },
    { key: 'forte_level', label: 'Forte Circuit', icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
    { key: 'liberation_level', label: 'Resonance Liberation', icon: '💫', color: 'from-purple-500 to-purple-600' },
    { key: 'intro_level', label: 'Intro Skill', icon: '🌟', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Zap size={28} className="text-yellow-400" />
          <div>
            <h3 className="text-2xl font-bold text-white">Forte</h3>
            <p className="text-sm text-slate-400">Character Talents & Traces</p>
          </div>
        </div>
      </div>

      {/* Skill Tree Layout */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 pt-12">
        <div className="max-w-5xl mx-auto">
          {/* Row 1: First set of traces - all horizontally aligned */}
          <div className="grid grid-cols-5 gap-4 mb-8 items-center">
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.basic_minor_1 === 1}
                onClick={() => toggleTrace('basic_minor_1')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.skill_minor_1 === 1}
                onClick={() => toggleTrace('skill_minor_1')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MajorTrace
                isUnlocked={form.forte_major_1 === 1}
                onClick={() => toggleTrace('forte_major_1')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.liberation_minor_1 === 1}
                onClick={() => toggleTrace('liberation_minor_1')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.intro_minor_1 === 1}
                onClick={() => toggleTrace('intro_minor_1')}
                editing={true}
              />
            </div>
          </div>

          {/* Row 2: Second set of traces - all horizontally aligned */}
          <div className="grid grid-cols-5 gap-4 mb-12 items-center">
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.basic_minor_2 === 1}
                onClick={() => toggleTrace('basic_minor_2')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.skill_minor_2 === 1}
                onClick={() => toggleTrace('skill_minor_2')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MajorTrace
                isUnlocked={form.forte_major_2 === 1}
                onClick={() => toggleTrace('forte_major_2')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.liberation_minor_2 === 1}
                onClick={() => toggleTrace('liberation_minor_2')}
                editing={true}
              />
            </div>
            <div className="flex justify-center">
              <MinorTrace
                isUnlocked={form.intro_minor_2 === 1}
                onClick={() => toggleTrace('intro_minor_2')}
                editing={true}
              />
            </div>
          </div>

          {/* Row 3: Bottom Talent Nodes - all horizontally aligned */}
          <div className="grid grid-cols-5 gap-4">
            {talentNodes.map(node => (
              <div key={node.key} className="flex justify-center">
                <TalentNode
                  label={node.label}
                  icon={node.icon}
                  level={form[node.key as keyof typeof form] as number}
                  color={node.color}
                  onIncrease={() => adjustTalentLevel(node.key as keyof typeof form, 1)}
                  onDecrease={() => adjustTalentLevel(node.key as keyof typeof form, -1)}
                  editing={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-slate-400">Talent Notes</label>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors flex items-center gap-2">
                <Edit2 size={16} className="text-cyan-400" />
                <span className="text-cyan-400 text-sm font-semibold">Edit</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors flex items-center gap-2">
                  <Save size={16} className="text-green-400" />
                  <span className="text-green-400 text-sm font-semibold">Save</span>
                </button>
                <button onClick={handleCancel} className="px-3 py-1 bg-slate-600/20 hover:bg-slate-600/30 rounded-lg transition-colors flex items-center gap-2">
                  <X size={16} className="text-slate-400" />
                  <span className="text-slate-400 text-sm font-semibold">Cancel</span>
                </button>
              </div>
            )}
          </div>
          {editing ? (
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 min-h-[80px]"
              placeholder="Add notes about talent priorities, combos, or strategies..."
            />
          ) : form.notes ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{form.notes}</p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-slate-500 italic">
              No notes added yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Talent Node Component (Diamond shape with level)
function TalentNode({
  label,
  icon,
  level,
  color,
  onIncrease,
  onDecrease,
  editing
}: {
  label: string;
  icon: string;
  level: number;
  color: string;
  onIncrease: () => void;
  onDecrease: () => void;
  editing: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 mb-4 overflow-visible">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-lg transform rotate-45 shadow-lg border-2 border-white/20`}>
          <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400 text-center max-w-[80px] min-h-[32px]">{label}</div>
      <div className="text-xl font-bold text-white mt-1">
        Lv. {level}
      </div>
      {editing && (
        <div className="flex gap-1 mt-2">
          <button
            onClick={onDecrease}
            disabled={level <= 1}
            className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronDown size={14} className="text-white" />
          </button>
          <button
            onClick={onIncrease}
            disabled={level >= 10}
            className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronUp size={14} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// Minor Trace Component (Small circle)
function MinorTrace({
  isUnlocked,
  onClick,
  editing
}: {
  isUnlocked: boolean;
  onClick: () => void;
  editing: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${
        isUnlocked
          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 border-white/50 shadow-md opacity-100'
          : 'bg-slate-800/50 border-slate-600 opacity-50'
      }`}
    >
      {isUnlocked && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      )}
    </button>
  );
}

// Major Trace Component (Larger diamond)
function MajorTrace({
  isUnlocked,
  onClick,
  editing
}: {
  isUnlocked: boolean;
  onClick: () => void;
  editing: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-16 h-16 rounded-lg transform rotate-45 transition-all border-2 hover:scale-110 cursor-pointer ${
        isUnlocked
          ? 'bg-gradient-to-br from-yellow-500 to-orange-500 border-white/50 shadow-lg opacity-100'
          : 'bg-slate-800/50 border-slate-600 opacity-50'
      }`}
    >
      {isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
          <div className="w-4 h-4 bg-white rounded-full" />
        </div>
      )}
    </button>
  );
}