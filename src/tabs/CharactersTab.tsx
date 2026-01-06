import React, { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Character } from '../types';
import { getElementColor, getRarityStars, getBuildStatusColor, getBuildStatusPriority, safeInvoke } from '../utils';
import CharacterModal from '../components/CharacterModal';
import AddCharacterModal from '../components/AddCharacterModal';

export default function CharactersTab({ characters, onUpdate }: { characters: Character[]; onUpdate: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingCharId, setDeletingCharId] = useState<number | null>(null);

  const handleDelete = async (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Show confirmation dialog FIRST, before doing anything
    const confirmed = window.confirm(
      `Are you sure you want to delete ${char.character_name}? This will also delete all related data (talents, weapon, echoes).`
    );
    
    // Only proceed if user clicked OK
    if (confirmed) {
      try {
        setDeletingCharId(char.id);
        await safeInvoke('delete_character', { id: char.id });
        onUpdate();
      } catch (err) {
        alert('Failed to delete character: ' + err);
      } finally {
        setDeletingCharId(null);
      }
    }
    else if (!confirmed) {
      return;
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

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex gap-3">
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
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
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
            {/* Delete Button */}
            <button
              onClick={(e) => handleDelete(char, e)}
              disabled={deletingCharId === char.id}
              className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              title="Delete character"
            >
              <Trash2 size={14} />
            </button>

            {/* Character Content */}
            <div onClick={() => setSelectedChar(char)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-cyan-400">
                    {char.character_name}
                  </h3>
                  {/* Only show variant if NOT Rover (for Rover, variant IS the element) */}
                  {char.variant && !isRoverVariant(char) && (
                    <p className="text-sm text-slate-400">{char.variant}</p>
                  )}
                </div>
                <span className="text-yellow-400">{getRarityStars(char.rarity)}</span>
              </div>
              <div className="space-y-2">
                <span className={`inline-block px-2 py-1 rounded text-xs ${getElementColor(char.element)}`}>
                  {char.element}
                </span>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Level</span>
                  <span className="font-bold">{char.level}/{char.ascension * 10 + 20}</span>
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
          character={selectedChar}
          onClose={() => setSelectedChar(null)}
          onUpdate={() => {
            onUpdate();
          }}
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