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

  const toggleTrace = async (key: keyof typeof form) => {
    const newValue = form[key] === 1 ? 0 : 1;
    setForm({ ...form, [key]: newValue });
    
    // Immediately save to database
    try {
      await safeInvoke('update_character_talents', {
        characterId,
        basicLevel: form.basic_level || null,
        skillLevel: form.skill_level || null,
        liberationLevel: form.liberation_level || null,
        forteLevel: form.forte_level || null,
        introLevel: form.intro_level || null,
        notes: form.notes || null,
        basicMinor1: key === 'basic_minor_1' ? newValue : form.basic_minor_1,
        basicMinor2: key === 'basic_minor_2' ? newValue : form.basic_minor_2,
        skillMinor1: key === 'skill_minor_1' ? newValue : form.skill_minor_1,
        skillMinor2: key === 'skill_minor_2' ? newValue : form.skill_minor_2,
        liberationMinor1: key === 'liberation_minor_1' ? newValue : form.liberation_minor_1,
        liberationMinor2: key === 'liberation_minor_2' ? newValue : form.liberation_minor_2,
        introMinor1: key === 'intro_minor_1' ? newValue : form.intro_minor_1,
        introMinor2: key === 'intro_minor_2' ? newValue : form.intro_minor_2,
        forteMajor1: key === 'forte_major_1' ? newValue : form.forte_major_1,
        forteMajor2: key === 'forte_major_2' ? newValue : form.forte_major_2,
      });
      await onUpdate();
    } catch (err) {
      console.error('Failed to update trace:', err);
      // Revert on error
      setForm({ ...form, [key]: form[key] });
    }
  };

  const adjustTalentLevel = async (key: keyof typeof form, delta: number) => {
    const currentLevel = form[key] as number;
    const newLevel = Math.max(1, Math.min(10, currentLevel + delta));
    if (newLevel === currentLevel) return; // No change
    
    setForm({ ...form, [key]: newLevel });
    
    // Immediately save to database
    try {
      await safeInvoke('update_character_talents', {
        characterId,
        basicLevel: key === 'basic_level' ? newLevel : form.basic_level || null,
        skillLevel: key === 'skill_level' ? newLevel : form.skill_level || null,
        liberationLevel: key === 'liberation_level' ? newLevel : form.liberation_level || null,
        forteLevel: key === 'forte_level' ? newLevel : form.forte_level || null,
        introLevel: key === 'intro_level' ? newLevel : form.intro_level || null,
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
      await onUpdate();
    } catch (err) {
      console.error('Failed to update talent level:', err);
      // Revert on error
      setForm({ ...form, [key]: currentLevel });
    }
  };

  if (!talents) return null;

  // Talent node config (bottom row) - Matching in-game white/silver aesthetic
  const talentNodes = [
    { key: 'basic_level', label: 'Normal Attack', icon: '⚔️' },
    { key: 'skill_level', label: 'Resonance Skill', icon: '🎯' },
    { key: 'forte_level', label: 'Forte Circuit', icon: '⚡' },
    { key: 'liberation_level', label: 'Resonance Liberation', icon: '💫' },
    { key: 'intro_level', label: 'Intro Skill', icon: '🌟' },
  ];

  return (
    <div className="relative h-full flex flex-col">
      {/* Skill Tree Layout - Dark blue atmospheric background like in-game */}
      <div className="relative bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
        {/* Central atmospheric glow - mimics the in-game center glow */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-300/5 rounded-full blur-2xl"></div>
        
        {/* Stars/sparkles effect */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[30%] right-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[60%] left-[25%] w-0.5 h-0.5 bg-blue-200 rounded-full shadow-[0_0_3px_rgba(191,219,254,0.8)]"></div>
          <div className="absolute bottom-[25%] right-[30%] w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_3px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[45%] right-[15%] w-0.5 h-0.5 bg-blue-100 rounded-full shadow-[0_0_3px_rgba(219,234,254,0.8)]"></div>
          <div className="absolute bottom-[40%] left-[35%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
        </div>
        
        <div className="relative w-full mx-auto z-10 flex-1 flex flex-col justify-center px-12 pt-8">
          {/* Connecting Lines - SVG overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(148, 163, 184, 0.4)" />
                <stop offset="50%" stopColor="rgba(203, 213, 225, 0.6)" />
                <stop offset="100%" stopColor="rgba(148, 163, 184, 0.4)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Vertical lines connecting traces to talents - positioned at center of each column */}
            {/* Column 1 - Basic Attack (10% center of first column) */}
            <line x1="10%" y1="12%" x2="10%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            <line x1="10%" y1="40%" x2="10%" y2="68%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            
            {/* Column 2 - Resonance Skill (30% center of second column) */}
            <line x1="30%" y1="12%" x2="30%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            <line x1="30%" y1="40%" x2="30%" y2="68%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            
            {/* Column 3 - Forte Circuit (50% center, connects to major traces) */}
            <line x1="50%" y1="12%" x2="50%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2.5" filter="url(#glow)" />
            <line x1="50%" y1="40%" x2="50%" y2="68%" stroke="url(#lineGradient)" strokeWidth="2.5" filter="url(#glow)" />
            
            {/* Column 4 - Resonance Liberation (70% center of fourth column) */}
            <line x1="70%" y1="12%" x2="70%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            <line x1="70%" y1="40%" x2="70%" y2="68%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            
            {/* Column 5 - Intro Skill (90% center of fifth column) */}
            <line x1="90%" y1="12%" x2="90%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
            <line x1="90%" y1="40%" x2="90%" y2="68%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
          </svg>
          
          {/* Row 1: First set of traces - all horizontally aligned */}
          <div className="relative grid grid-cols-5 gap-4 mb-16 items-center" style={{ zIndex: 1 }}>
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
          <div className="relative grid grid-cols-5 gap-4 mb-20 items-center" style={{ zIndex: 1 }}>
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
          <div className="relative grid grid-cols-5 gap-4" style={{ zIndex: 1 }}>
            {talentNodes.map(node => (
              <div key={node.key} className="flex justify-center">
                <TalentNode
                  label={node.label}
                  icon={node.icon}
                  level={form[node.key as keyof typeof form] as number}
                  onIncrease={() => adjustTalentLevel(node.key as keyof typeof form, 1)}
                  onDecrease={() => adjustTalentLevel(node.key as keyof typeof form, -1)}
                  editing={true}
                />
              </div>
            ))}
          </div>
        
          {/* Notes */}
          <div className="mt-auto pt-8">
            <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-slate-400">Talent Notes</label>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1 bg-gradient-to-r from-yellow-500/90 to-amber-600 hover:from-yellow-400/90 hover:to-amber-500 rounded-lg transition-colors flex items-center gap-2">
                <Edit2 size={16} className="text-slate-300" />
                <span className="text-slate-300 text-sm font-semibold">Edit</span>
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
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-slate-500 min-h-[80px]"
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
    </div>
  );
}

// Talent Node Component (Diamond shape with level) - White/silver design like in-game
function TalentNode({
  label,
  icon,
  level,
  onIncrease,
  onDecrease,
  editing
}: {
  label: string;
  icon: string;
  level: number;
  onIncrease: () => void;
  onDecrease: () => void;
  editing: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 mb-2 overflow-visible">
        {/* Outer glow effect */}
        <div className="absolute inset-[-2px] top-[-55px] bg-white/20 rounded-lg transform rotate-45 blur-xl"></div>
        
        {/* White/silver glowing diamond */}
        <div className="relative bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-lg transform rotate-45 shadow-[0_0_25px_rgba(255,255,255,0.6),0_0_40px_rgba(255,255,255,0.3)] border-[3px] border-white/70">
          {/* Inner shine effect */}
          <div className="absolute inset-[3px] bg-gradient-to-br from-white/60 via-transparent to-transparent rounded-md"></div>
          
          {/* Icon container - positioned to align with the background glow */}
          <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
            <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] filter brightness-90 contrast-110">{icon}</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-100 text-center max-w-[90px] min-h-[32px] font-medium leading-tight">{label}</div>
      <div className="text-lg font-bold text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        Lv. {level}/10
      </div>
      <div className="flex gap-1 mt-2">
        <button
          onClick={onDecrease}
          disabled={level <= 1}
          className="w-7 h-7 rounded bg-slate-800/60 hover:bg-slate-700/80 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all border border-slate-600/40 hover:border-slate-500/60"
        >
          <ChevronDown size={16} className="text-slate-200" />
        </button>
        <button
          onClick={onIncrease}
          disabled={level >= 10}
          className="w-7 h-7 rounded bg-slate-800/60 hover:bg-slate-700/80 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all border border-slate-600/40 hover:border-slate-500/60"
        >
          <ChevronUp size={16} className="text-slate-200" />
        </button>
      </div>
    </div>
  );
}

// Minor Trace Component (Small circle) - Cream/beige design like in-game
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
      className={`relative w-11 h-11 rounded-full border-[3px] transition-all hover:scale-110 cursor-pointer ${
        isUnlocked
          ? 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 border-slate-400/50 shadow-[0_0_12px_rgba(203,213,225,0.3)] opacity-100'
          : 'bg-slate-800/50 border-slate-600 opacity-50 hover:opacity-65'
      }`}
    >
      {isUnlocked && (
        <>
          {/* Outer glow when unlocked - much more reduced */}
          <div className="absolute inset-[-3px] bg-slate-300/15 rounded-full blur-sm"></div>
        </>
      )}
    </button>
  );
}

// Major Trace Component (Larger diamond) - White/silver design like in-game
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
      className="relative w-16 h-16 transition-all hover:scale-110 cursor-pointer"
    >
      {isUnlocked && (
        <>
          {/* Outer glow effect - much more reduced */}
          <div className="absolute inset-[-5px] bg-slate-300/20 rounded-lg transform rotate-45 blur-md"></div>
        </>
      )}
      
      {/* Diamond shape */}
      <div className={`relative w-full h-full rounded-lg transform rotate-45 border-[3px] transition-all ${
        isUnlocked
          ? 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 border-slate-400/60 shadow-[0_0_15px_rgba(203,213,225,0.35)] opacity-100'
          : 'bg-slate-800/50 border-slate-600 opacity-50 hover:opacity-65'
      }`}>
        {isUnlocked && (
          <>
            {/* Inner shine layer - much more reduced */}
            <div className="absolute inset-[3px] bg-gradient-to-br from-slate-100/20 via-transparent to-transparent rounded-md"></div>
          </>
        )}
      </div>
    </button>
  );
}