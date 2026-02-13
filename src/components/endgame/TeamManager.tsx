import { Save, X } from 'lucide-react';
import CharacterPortrait from '../characters/CharacterPortrait';
import CharacterDropdown from '../PortalDropdown';
import { TeamDisplayProps, TeamEditorProps } from '../../props';


export default function TeamDisplay({
  characters,
  size = 'md',
  showNames = true,
  className = '',
}: TeamDisplayProps) {
  const validCharacters = characters.filter(
    char => char && char !== '' && char !== 'None'
  ) as string[];

  if (validCharacters.length === 0) {
    return (
      <div className={`text-xs text-slate-500 italic ${className}`}>
        No characters assigned
      </div>
    );
  }

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {validCharacters.map((char, idx) => (
        <div
          key={`${char}-${idx}`}
          className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded min-w-0"
        >
          <CharacterPortrait characterName={char} size={size} className="flex-shrink-0" />
          {showNames && (
            <span className="text-xs text-slate-300 truncate">{char}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Matrix/Wastes style team display with yellow theming
export function MatrixTeamDisplay({
  characters,
  size = 'md',
  showNames = true,
}: TeamDisplayProps) {
  const validCharacters = characters.filter(
    char => char && char !== '' && char !== 'None'
  ) as string[];

  if (validCharacters.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic">
        No characters assigned
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {validCharacters.map((char, idx) => (
        <div
          key={`${char}-${idx}`}
          className="flex items-center gap-2 px-2 py-1 bg-yellow-500/20 rounded"
        >
          <CharacterPortrait characterName={char} size={size} />
          {showNames && (
            <span className="text-xs text-yellow-300">{char}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function TeamEditor({
  character1,
  character2,
  character3,
  onChar1Change,
  onChar2Change,
  onChar3Change,
  onSave,
  onCancel,
  availableCharacters,
  saving = false,
  vigorConfig,
  saveButtonColor = 'bg-gradient-to-r from-purple-600 to-purple-700',
  saveButtonHoverColor = 'hover:from-purple-500 hover:to-purple-600',
}: TeamEditorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <CharacterDropdown
          value={character1}
          onChange={onChar1Change}
          availableCharacters={availableCharacters}
          placeholder="Char 1"
          vigorConfig={vigorConfig}
        />
        <CharacterDropdown
          value={character2}
          onChange={onChar2Change}
          availableCharacters={availableCharacters}
          placeholder="Char 2"
          vigorConfig={vigorConfig}
        />
        <CharacterDropdown
          value={character3}
          onChange={onChar3Change}
          availableCharacters={availableCharacters}
          placeholder="Char 3"
          vigorConfig={vigorConfig}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className={`px-2 py-1 ${saveButtonColor} ${saveButtonHoverColor} rounded text-xs flex items-center gap-1 text-white disabled:opacity-50`}
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}