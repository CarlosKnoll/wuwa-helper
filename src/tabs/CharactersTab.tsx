import { useState, useEffect } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Character } from '../types';
import {
  getRarityStars,
  getBuildStatusColor,
  getBuildStatusPriority,
  safeInvoke,
} from '../utils';
import CharacterModal from '../components/CharacterModal';
import AddCharacterModal from '../components/AddCharacterModal';
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

  const filteredCharacters = [...characters]
    .sort((a, b) => {
      const pa = getBuildStatusPriority(a.build_status);
      const pb = getBuildStatusPriority(b.build_status);
      if (pa !== pb) return pa - pb;
      return a.character_name.localeCompare(b.character_name);
    })
    .filter((c) =>
      c.character_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const isRoverVariant = (c: Character) =>
    c.character_name.toLowerCase() === 'rover';

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
        <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search characters..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 bg-cyan-500 rounded-lg font-semibold flex items-center gap-2 text-sm"
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

  return (
    <div
      onClick={onSelect}
      className="bg-slate-900/50 rounded-xl border border-slate-800 hover:border-cyan-500 transition cursor-pointer overflow-hidden"
    >
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
              {character.character_name}
            </h3>

            {/* Element + delete */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ElementIcon element={character.element} size="sm" showLabel={false} />
              <button
                onClick={onDelete}
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
