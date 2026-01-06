import React from 'react';
import { Users, Coins, Target } from 'lucide-react';
import { Character, Resources, PityStatus } from '../types';

export default function DashboardTab({ characters, resources, pityStatus }: any) {
  const builtCharacters = characters.filter((c: Character) => !['Not built', 'Barely built'].includes(c.build_status)).length;
  
  const featuredCharPity = pityStatus.find((p: PityStatus) => p.banner_type === 'featuredCharacter')?.current_pity || 0;
  const featuredWeaponPity = pityStatus.find((p: PityStatus) => p.banner_type === 'featuredWeapon')?.current_pity || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800"><Users className="w-8 h-8 text-cyan-400 mb-2" /><div className="text-3xl font-bold">{characters.length}</div><div className="text-sm text-slate-400">Characters ({builtCharacters} built)</div></div>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800"><Coins className="w-8 h-8 text-yellow-400 mb-2" /><div className="text-3xl font-bold">{resources?.astrite?.toLocaleString() || 0}</div><div className="text-sm text-slate-400">Astrite</div></div>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800"><Target className="w-8 h-8 text-purple-400 mb-2" /><div className="text-3xl font-bold">{featuredCharPity}</div><div className="text-sm text-slate-400">Featured Character Pity</div></div>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800"><Target className="w-8 h-8 text-orange-400 mb-2" /><div className="text-3xl font-bold">{featuredWeaponPity}</div><div className="text-sm text-slate-400">Featured Weapon Pity</div></div>
      </div>
    </div>
  );
}