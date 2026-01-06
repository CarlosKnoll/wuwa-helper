import React from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { getBuildStatusColor, getBuildStatusOptions } from '../utils';

interface CharacterInfoProps {
  character: Character;
  form: {
    level: number;
    ascension: number;
    waveband: number;
    build_status: string;
    notes: string;
  };
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (form: any) => void;
}

export default function CharacterInfo({
  character,
  form,
  editing,
  onEdit,
  onSave,
  onCancel,
  onChange
}: CharacterInfoProps) {
  const buildStatusOptions = getBuildStatusOptions();

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Character Info</h3>
        {!editing ? (
          <button onClick={onEdit} className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded transition-colors">
            <Edit2 size={16} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onSave} className="p-2 bg-green-500 hover:bg-green-600 rounded transition-colors">
              <Save size={16} />
            </button>
            <button onClick={onCancel} className="p-2 bg-slate-600 hover:bg-slate-700 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-slate-400">Level</label>
            <input
              type="number"
              value={form.level}
              onChange={e => onChange({ ...form, level: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              min="1"
              max="90"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Ascension</label>
            <input
              type="number"
              value={form.ascension}
              onChange={e => onChange({ ...form, ascension: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              min="0"
              max="6"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Waveband</label>
            <input
              type="number"
              value={form.waveband}
              onChange={e => onChange({ ...form, waveband: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
              min="0"
              max="6"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Build Status</label>
            <select
              value={form.build_status}
              onChange={e => onChange({ ...form, build_status: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500"
            >
              {buildStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="text-slate-400">Level</p>
              <p className="text-cyan-400 font-semibold text-lg">{character.level}/90</p>
            </div>
            <div>
              <p className="text-slate-400">Ascension</p>
              <p className="text-cyan-400 font-semibold text-lg">{character.ascension}/6</p>
            </div>
            <div>
              <p className="text-slate-400">Waveband</p>
              <p className="text-purple-400 font-semibold text-lg">S{character.waveband}</p>
            </div>
          </div>

          {/* Build Status Badge - Centered */}
          <div className="flex justify-center">
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getBuildStatusColor(character.build_status)}`}>
              {character.build_status}
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      {editing && (
        <div className="mt-4">
          <label className="text-sm text-slate-400">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => onChange({ ...form, notes: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mt-1 min-h-[80px] focus:outline-none focus:border-cyan-500"
            placeholder="Add notes about this character..."
          />
        </div>
      )}

      {!editing && form.notes && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-300">{form.notes}</p>
        </div>
      )}
    </div>
  );
}