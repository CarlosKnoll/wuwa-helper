import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { safeInvoke, getElementColor } from '../utils';
import CharacterInfo from './CharacterInfo';
import CharacterTalentsSection from './CharacterTalentsSection';
import CharacterWeaponSection from './CharacterWeaponSection';
import CharacterEchoBuildSection from './CharacterEchoBuildSection';

interface CharacterModalProps {
  character: Character;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CharacterModal({ character, onClose, onUpdate }: CharacterModalProps) {
  // Character basic info state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    level: character.level,
    ascension: character.ascension,
    waveband: character.waveband,
    build_status: character.build_status,
    notes: character.notes || ''
  });

  // Related data state
  const [talents, setTalents] = useState<CharacterTalents | null>(null);
  const [weapon, setWeapon] = useState<CharacterWeapon | null>(null);
  const [echoBuild, setEchoBuild] = useState<EchoBuild | null>(null);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [echoSubstats, setEchoSubstats] = useState<Record<number, EchoSubstat[]>>({});

  // Track current character to reload when props change
  const [currentCharacterId, setCurrentCharacterId] = useState(character.id);

  useEffect(() => {
    loadDetails();
    setCurrentCharacterId(character.id);
  }, []);

  // Reload if character changes (e.g., from external update)
  useEffect(() => {
    if (currentCharacterId !== character.id) {
      setForm({
        level: character.level,
        ascension: character.ascension,
        waveband: character.waveband,
        build_status: character.build_status,
        notes: character.notes || ''
      });
      setCurrentCharacterId(character.id);
      loadDetails();
    }
  }, [character]);

  const loadDetails = async () => {
    try {
      const [t, w, b] = await Promise.all([
        safeInvoke('get_character_talents', { characterId: character.id }),
        safeInvoke('get_character_weapon', { characterId: character.id }),
        safeInvoke('get_echo_build', { characterId: character.id }),
      ]);

      setTalents(t as CharacterTalents | null);
      setWeapon(w as CharacterWeapon | null);
      setEchoBuild(b as EchoBuild | null);

      if (b) {
        const echoesData = await safeInvoke('get_echoes', { buildId: (b as EchoBuild).id }) as Echo[];
        setEchoes(echoesData);

        const substatsMap: Record<number, EchoSubstat[]> = {};
        for (const echo of echoesData) {
          const substats = await safeInvoke('get_echo_substats', { echoId: echo.id }) as EchoSubstat[];
          substatsMap[echo.id] = substats;
        }
        setEchoSubstats(substatsMap);
      }
    } catch (err) {
      console.error('Error loading details:', err);
    }
  };

  const handleSave = async () => {
    try {
      await safeInvoke('update_character', {
        id: character.id,
        level: form.level,
        ascension: form.ascension,
        waveband: form.waveband,
        buildStatus: form.build_status,
        notes: form.notes || null
      });
      setEditing(false);
      // Update parent list but keep modal open
      onUpdate();
      // Reload character details to reflect changes
      await loadDetails();
    } catch (err) {
      alert('Failed to update: ' + err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{character.character_name}</h2>
            <p className={`text-${getElementColor(character.element)}`}>
              {character.element} • {character.weapon_type}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Character Basic Info */}
          <CharacterInfo
            character={character}
            form={form}
            editing={editing}
            onEdit={() => setEditing(true)}
            onSave={handleSave}
            onCancel={() => {
              setEditing(false);
              setForm({
                level: character.level,
                ascension: character.ascension,
                waveband: character.waveband,
                build_status: character.build_status,
                notes: character.notes || ''
              });
            }}
            onChange={setForm}
          />

          {/* Talents Section */}
          <CharacterTalentsSection
            talents={talents}
            characterId={character.id}
            onUpdate={loadDetails}
          />

          {/* Weapon Section */}
          <CharacterWeaponSection
            weapon={weapon}
            characterId={character.id}
            onUpdate={loadDetails}
          />

          {/* Echo Build Section */}
          <CharacterEchoBuildSection
            echoBuild={echoBuild}
            echoes={echoes}
            echoSubstats={echoSubstats}
            onUpdate={loadDetails}
          />
        </div>
      </div>
    </div>
  );
}
