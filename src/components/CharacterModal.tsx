import { useState, useEffect } from 'react';
import { X, User, Shield, Zap } from 'lucide-react';
import { safeInvoke, getElementColor } from '../utils';
import { CharacterTalents, CharacterWeapon, Echo, EchoBuild, EchoSubstat, CharacterModalProps } from '../types';
import CharacterInfo from './CharacterInfo';
import CharacterTalentsSection from './CharacterTalentsSection';
import CharacterEchoBuildSection from './CharacterEchoBuildSection';

type SubMenuType = 'overview' | 'talents' | 'echoes';

export default function CharacterModal({ character, onClose, onUpdate }: CharacterModalProps) {
  // Active submenu state
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>('overview');

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
    setForm({
      level: character.level,
      ascension: character.ascension,
      waveband: character.waveband,
      build_status: character.build_status,
      notes: character.notes || ''
    });
    setCurrentCharacterId(character.id);
    if (currentCharacterId !== character.id) {
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
    // Enforce limits
    const level = Math.max(1, Math.min(90, form.level));
    const ascension = Math.max(0, Math.min(6, form.ascension));
    const waveband = Math.max(0, Math.min(6, form.waveband));
    
    if (form.level !== level || form.ascension !== ascension || form.waveband !== waveband) {
      alert('Values adjusted: Level (1-90), Ascension (0-6), Waveband (0-6)');
    }
    
    try {
      await safeInvoke('update_character', {
        id: character.id,
        level: level,
        ascension: ascension,
        waveband: waveband,
        buildStatus: form.build_status,
        notes: form.notes || null
      });
      
      // Update local form state
      setForm({
        level: level,
        ascension: ascension,
        waveband: waveband,
        build_status: form.build_status,
        notes: form.notes
      });
      
      setEditing(false);
      
      // Trigger parent update
      onUpdate();
      
    } catch (err) {
      alert('Failed to update: ' + err);
    }
  };

  const subMenuItems = [
    { id: 'overview' as SubMenuType, label: 'Overview', icon: User },
    { id: 'talents' as SubMenuType, label: 'Forte', icon: Zap },
    { id: 'echoes' as SubMenuType, label: 'Echo', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Left Sidebar Navigation */}
        <div className="w-20 bg-slate-950/50 border-r border-slate-700 flex flex-col py-6">
          <div className="flex flex-col gap-4 px-3">
            {subMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubMenu(item.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={item.label}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">{character.character_name}</h2>
              <p className={`text-${getElementColor(character.element)}`}>
                {character.element} • {character.weapon_type}
              </p>
            </div>
            <button 
              onClick={() => {
                onUpdate(); // Update parent when closing
                onClose();
              }} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-y-auto ${activeSubMenu === 'talents' ? 'p-0' : 'p-6'}`}>
            {activeSubMenu === 'overview' && (
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
            )}

            {activeSubMenu === 'talents' && (
              <CharacterTalentsSection
                talents={talents}
                characterId={character.id}
                onUpdate={loadDetails}
              />
            )}

            {activeSubMenu === 'echoes' && (
              <CharacterEchoBuildSection
                echoBuild={echoBuild}
                echoes={echoes}
                echoSubstats={echoSubstats}
                onUpdate={loadDetails}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}