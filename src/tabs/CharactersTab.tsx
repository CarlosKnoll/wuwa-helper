import { useState, useEffect } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Character } from '../types';
import {
  getRarityStars,
  getBuildStatusColor,
  getBuildStatusPriority,
  safeInvoke,
} from '../utils';
import CharacterModal from '../components/characters/CharacterModal';
import AddCharacterModal from '../components/characters/AddCharacterModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ElementIcon from '../components/ElementIcon';
import { useAssets } from '../hooks/useAssets';

export default function CharactersTab({
  characters,
  onUpdate,
}: {
  characters: Character[];
  onUpdate: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingCharId, setDeletingCharId] = useState<number | null>(null);

  const selectedChar = selectedCharId
    ? characters.find((c) => c.id === selectedCharId)
    : null;

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeletingCharId(deleteConfirm.id);
      await safeInvoke('delete_character', { id: deleteConfirm.id });
      onUpdate();
    } finally {
      setDeletingCharId(null);
      setDeleteConfirm(null);
    }
  };

  const getDisplayName = (c: Character) => {
    // If character_name is already "Rover - Element", use it as-is
    // Otherwise, fall back to original logic
    if (c.character_name.startsWith('Rover - ')) {
      return c.character_name;
    }
    
    // Legacy format support (shouldn't happen anymore)
    if (c.character_name.toLowerCase() === 'rover') {
      const elementName = c.element.charAt(0).toUpperCase() + c.element.slice(1);
      return `${elementName} Rover`;
    }
    
    return c.character_name;
  };

  const filteredCharacters = [...characters]
    .sort((a, b) => {
      const pa = getBuildStatusPriority(a.build_status);
      const pb = getBuildStatusPriority(b.build_status);
      if (pa !== pb) return pa - pb;
      return a.character_name.localeCompare(b.character_name);
    })
    .filter((c) => {
      const search = searchTerm.toLowerCase();
      const charName = c.character_name.toLowerCase();
      const displayName = getDisplayName(c).toLowerCase();
      const element = c.element.toLowerCase();
      
      return charName.includes(search) || 
             displayName.includes(search) || 
             element.includes(search);
    });

  const isRoverVariant = (c: Character) =>
    c.character_name.toLowerCase().startsWith('rover');


  const getMaxLevel = (a: number) => [20, 40, 50, 60, 70, 80, 90][a] ?? 20;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Character"
        message={`Delete ${deleteConfirm?.name}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />

      <div className="flex gap-3 items-center">
        <div className="flex-1 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search characters..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/[0.4] rounded-lg focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-lg font-semibold flex items-center gap-2 text-sm transition-all"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCharacters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onSelect={() => setSelectedCharId(char.id)}
            onDelete={() =>
              setDeleteConfirm({ id: char.id, name: char.character_name })
            }
            isDeleting={deletingCharId === char.id}
            isRoverVariant={isRoverVariant(char)}
            displayName={getDisplayName(char)}
            maxLevel={getMaxLevel(char.ascension)}
          />
        ))}
      </div>

      {selectedChar && (
        <CharacterModal
          character={selectedChar}
          onClose={() => setSelectedCharId(null)}
          onUpdate={onUpdate}
        />
      )}

      {showAddModal && (
        <AddCharacterModal
          onClose={() => setShowAddModal(false)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}

function CharacterCard({
  character,
  onSelect,
  onDelete,
  isDeleting,
  isRoverVariant,
  displayName,
  maxLevel,
}: any) {
  const { getAsset, isInitialized } = useAssets();
  const [portraitSrc, setPortraitSrc] = useState<string>('');

  useEffect(() => {
    if (!isInitialized) return;
    getAsset('character', character.character_name).then((r) => {
      if (r) setPortraitSrc(`data:image/webp;base64,${r}`);
    });
  }, [character.character_name, isInitialized, getAsset]);

  // Get border color based on rarity
  const getRarityBorderColor = (rarity: number): string => {
    switch (rarity) {
      case 5:
        return 'border-yellow-500/60';
      case 4:
        return 'border-purple-500/60';
      case 3:
        return 'border-blue-500/60';
      case 2:
        return 'border-green-500/60';
      case 1:
        return 'border-slate-500/60';
      default:
        return 'border-slate-800';
    }
  };

  // Get brighter hover border color based on rarity
  const getRarityHoverColor = (rarity: number): string => {
    switch (rarity) {
      case 5:
        return 'hover:border-yellow-400';
      case 4:
        return 'hover:border-purple-400';
      case 3:
        return 'hover:border-blue-400';
      case 2:
        return 'hover:border-green-400';
      case 1:
        return 'hover:border-slate-400';
      default:
        return 'hover:border-slate-600';
    }
  };

  const rarityBorderClass = getRarityBorderColor(character.rarity);
  const rarityHoverClass = getRarityHoverColor(character.rarity);

  return (
    <div
      onClick={onSelect}
      className={`relative bg-slate-900/50 backdrop-blur-sm rounded-xl border-2 transition cursor-pointer overflow-hidden shadow-[0_0_15px_rgba(226,232,240,0.1)] ${rarityBorderClass} ${rarityHoverClass}`}>
      {/* Underglow */}
      <div className="absolute inset-0 -z-10 bg-slate-200/8 rounded-xl blur-lg"></div>
      <div className="flex min-h-[12rem]">
        <div className="w-32 bg-slate-800/50 flex-shrink-0">
          {portraitSrc ? (
            <img src={portraitSrc} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-700 animate-pulse" />
          )}
        </div>

        <div className="flex-1 p-3 flex flex-col min-w-0">
        {/* HEADER */}
        <div className="space-y-1">
          {/* First line: name + element + delete */}
          <div className="flex items-start gap-2 min-w-0">
            {/* Name */}
            <h3 className="font-bold text-sm leading-tight flex-1 min-w-0">
              {displayName}
            </h3>

            {/* Element + delete */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ElementIcon element={character.element} size="sm" showLabel={false} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
                className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Second line: rarity */}
          <div className="text-yellow-400 text-xs leading-none">
            {getRarityStars(character.rarity)}
          </div>

          {/* Notes */}
          {character.notes && (
            <p className="text-xs text-slate-400 italic line-clamp-2 mt-1">
              {character.notes}
            </p>
          )}
        </div>






          {/* STATS */}
          <div className="mt-auto space-y-1 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Level</span>
              <span className="font-bold">
                {character.level}/{maxLevel}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Waveband</span>
              <span className="font-bold">S{character.waveband}</span>
            </div>
            <div
              className={`px-2 py-1 rounded text-xs text-center truncate ${getBuildStatusColor(
                character.build_status
              )}`}
            >
              {character.build_status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}