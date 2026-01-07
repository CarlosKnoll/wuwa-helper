import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Character } from '../types.ts';
import { getElementColor, getRarityStars, getBuildStatusColor, getBuildStatusPriority, safeInvoke } from '../utils';
import CharacterModal from '../components/CharacterModal';
import AddCharacterModal from '../components/AddCharacterModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CharactersTab({ characters, onUpdate }: { characters: Character[]; onUpdate: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deletingCharId, setDeletingCharId] = useState<number | null>(null);

  // Find the selected character from the current characters array
  const selectedChar = selectedCharId ? characters.find(c => c.id === selectedCharId) : null;

  const handleDeleteClick = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ id: char.id, name: char.character_name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeletingCharId(deleteConfirm.id);
      await safeInvoke('delete_character', { id: deleteConfirm.id });
      onUpdate();
    } catch (err) {
      alert('Failed to delete character: ' + err);
    } finally {
      setDeletingCharId(null);
      setDeleteConfirm(null);
    }
  };

  const sortedCharacters = [...characters].sort((a, b) => {
    const priorityA = getBuildStatusPriority(a.build_status);
    const priorityB = getBuildStatusPriority(b.build_status);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.character_name.localeCompare(b.character_name);
  });

  const filteredCharacters = sortedCharacters.filter(c => c.character_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Helper function to check if character is a Rover variant
  const isRoverVariant = (char: Character) => {
    return char.character_name.toLowerCase() === 'rover';
  };

  // Helper function to calculate max level based on ascension
  const getMaxLevel = (ascension: number): number => {
    const maxLevels = [20, 40, 50, 60, 70, 80, 90];
    return maxLevels[ascension] || 20;
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Character"
        message={`Are you sure you want to delete ${deleteConfirm?.name}? This will also delete all related data (talents, weapon, echoes). This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />

      {/* Search and Add */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCharacters.map((char) => (
          <div
            key={char.id}
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 hover:border-cyan-500 transition-all cursor-pointer group relative"
          >
            {/* Character Content */}
            <div onClick={() => setSelectedCharId(char.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-lg group-hover:text-cyan-400">
                    {char.character_name}
                  </h3>
                  {/* Only show variant if NOT Rover (for Rover, variant IS the element) */}
                  {char.variant && !isRoverVariant(char) && (
                    <p className="text-sm text-slate-400">{char.variant}</p>
                  )}
                </div>
                <div className="flex items-start gap-2 flex-shrink-0">
                  <span className="text-yellow-400">{getRarityStars(char.rarity)}</span>
                  {/* Delete Button - Like weapons tab */}
                  <button
                    onClick={(e) => handleDeleteClick(char, e)}
                    disabled={deletingCharId === char.id}
                    className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <span className={`inline-block px-2 py-1 rounded text-xs ${getElementColor(char.element)}`}>
                  {char.element}
                </span>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Level</span>
                  <span className="font-bold">{char.level}/{getMaxLevel(char.ascension)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Waveband</span>
                  <span className="font-bold">S{char.waveband}</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs text-center ${getBuildStatusColor(char.build_status)}`}>
                  {char.build_status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {selectedChar && (
        <CharacterModal
          key={selectedCharId}
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