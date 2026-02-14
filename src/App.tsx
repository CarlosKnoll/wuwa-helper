import { useState, useEffect, useRef } from 'react';
import { Users, Sword, Target, Map, Settings, Database, TrendingUp, Menu, Trophy } from 'lucide-react';
import { Character, Weapon, Resources, PityStatus, ExplorationRegion, EndgameTabRef } from './types';
import { safeInvoke } from './utils';
import DashboardTab from './tabs/DashboardTab';
import CharactersTab from './tabs/CharactersTab';
import WeaponsTab from './tabs/WeaponsTab';
import PityTab from './tabs/PityTab';
import ExplorationTab from './tabs/ExplorationTab';
import EndgameTab from './tabs/EndgameTab';
import SettingsTab from './tabs/SettingsTab';

export default function WuwaHelper() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [resources, setResources] = useState<Resources | null>(null);
  const [pityStatus, setPityStatus] = useState<PityStatus[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [explorationRegions, setExplorationRegions] = useState<ExplorationRegion[]>([]);

  // Ref for EndgameTab to trigger refresh
  const endgameTabRef = useRef<EndgameTabRef>(null);

  useEffect(() => { loadAllData(true); }, []);

  const loadAllData = async (isInitial = false) => {
    setLoading(true);
    setError(null);
    try {
      const [chars, res, pity, weaps, regions] = await Promise.all([
        safeInvoke('get_all_characters'),
        safeInvoke('get_resources'),
        safeInvoke('get_pity_status'),
        safeInvoke('get_all_weapons'),
        safeInvoke('get_exploration_regions')
      ]);
      setCharacters(chars as Character[]);
      setResources(res as Resources);
      setPityStatus(pity as PityStatus[]);
      setWeapons(weaps as Weapon[]);
      setExplorationRegions(regions as ExplorationRegion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    // If we're in the endgame tab, refresh endgame data
    if (activeTab === 'endgame' && endgameTabRef.current) {
      setLoading(true);
      try {
        await endgameTabRef.current.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh endgame data');
      } finally {
        setLoading(false);
      }
    } else {
      // Otherwise refresh main data
      await loadAllData();
    }
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'characters', name: 'Characters', icon: Users },
    { id: 'weapons', name: 'Weapons', icon: Sword },
    { id: 'pity', name: 'Convene History', icon: Target },
    { id: 'exploration', name: 'Exploration', icon: Map },
    { id: 'endgame', name: 'Endgame', icon: Trophy },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {sidebarOpen && <div><h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">WuWa Assistant</h1><p className="text-xs text-slate-400 mt-1">Wuthering Waves</p></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-slate-100/10 text-slate-100 border border-slate-200/40 shadow-[0_0_15px_rgba(226,232,240,0.2)]' : 'hover:bg-slate-800 text-slate-400'}`}><Icon className="w-5 h-5" />{sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}</button>;
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-900/30 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-2xl font-bold">{navigation.find(n => n.id === activeTab)?.name}</h2></div>
            <button onClick={handleRefresh} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:bg-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"><Database className="w-4 h-4" />{loading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400"><strong>Error:</strong> {error}</div>}
          
          {initialLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab characters={characters} resources={resources} pityStatus={pityStatus} onUpdate={loadAllData} />}
              {activeTab === 'characters' && <CharactersTab characters={characters} onUpdate={loadAllData} />}
              {activeTab === 'weapons' && <WeaponsTab weapons={weapons} onUpdate={loadAllData} />}
              {activeTab === 'pity' && <PityTab pityStatus={pityStatus} onUpdate={loadAllData} />}
              {activeTab === 'exploration' && <ExplorationTab regions={explorationRegions} onUpdate={loadAllData} />}
              {activeTab === 'endgame' && <EndgameTab ref={endgameTabRef} />}
              {activeTab === 'settings' && <SettingsTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}