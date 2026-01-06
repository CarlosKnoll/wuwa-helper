import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Character } from '../types';
import { getElementColor, getRarityStars, getBuildStatusColor, getBuildStatusPriority } from '../utils';
import CharacterModal from '../components/CharacterModal';

export default function CharactersTab({ characters, onUpdate }: { characters: Character[]; onUpdate: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const sortedCharacters = [...characters].sort((a, b) => {
    const priorityA = getBuildStatusPriority(a.build_status);
    const priorityB = getBuildStatusPriority(b.build_status);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.character_name.localeCompare(b.character_name);
  });

  const filteredCharacters = sortedCharacters.filter(c => c.character_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search characters..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCharacters.map((char) => (
          <div key={char.id} onClick={() => setSelectedChar(char)} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 hover:border-cyan-500 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div><h3 className="font-bold text-lg group-hover:text-cyan-400">{char.character_name}</h3>{char.variant && <p className="text-sm text-slate-400">{char.variant}</p>}</div>
              <span className="text-yellow-400">{getRarityStars(char.rarity)}</span>
            </div>
            <div className="space-y-2">
              <span className={`px-2 py-1 rounded text-xs ${getElementColor(char.element)}`}>{char.element}</span>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Level</span><span className="font-bold">{char.level}/{char.ascension * 10 + 20}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Waveband</span><span className="font-bold">S{char.waveband}</span></div>
              <div className={`px-2 py-1 rounded text-xs text-center ${getBuildStatusColor(char.build_status)}`}>{char.build_status}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedChar && <CharacterModal character={selectedChar} onClose={() => setSelectedChar(null)} onUpdate={() => { onUpdate(); setSelectedChar(null); }} />}
    </div>
  );
}