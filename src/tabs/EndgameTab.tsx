import { useState, useEffect } from 'react';
import { safeInvoke } from '../utils';
import { TowerOfAdversity, TowerDetails, TowerAreaEffect, TowerTeam, WhimperingWastes, TorrentsStage, TroopMatrix } from '../types.ts'
import TowerSection from '../components/TowerSection';
import WhimperingWastesSection from '../components/WhimperingWastesSection';
import TroopMatrixSection from '../components/TroopMatrixSection';

export default function EndgameTab() {
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    tower: false,
    wastes: false,
    matrix: false
  });

  // Tower of Adversity State
  const [towerInfo, setTowerInfo] = useState<TowerOfAdversity | null>(null);
  const [towerDetails, setTowerDetails] = useState<TowerDetails[]>([]);
  const [towerEffects, setTowerEffects] = useState<TowerAreaEffect[]>([]);
  const [towerTeams, setTowerTeams] = useState<TowerTeam[]>([]);

  // Whimpering Wastes State
  const [wastesInfo, setWastesInfo] = useState<WhimperingWastes | null>(null);
  const [torrentsStages, setTorrentsStages] = useState<TorrentsStage[]>([]);

  // Troop Matrix State
  const [troopMatrix, setTroopMatrix] = useState<TroopMatrix | null>(null);

  useEffect(() => {
    loadAllEndgameData();
  }, []);

  const loadAllEndgameData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        safeInvoke('get_tower_of_adversity'),
        safeInvoke('get_tower_details'),
        safeInvoke('get_tower_area_effects'),
        safeInvoke('get_tower_teams'),
        safeInvoke('get_whimpering_wastes'),
        safeInvoke('get_torrents_stages'),
        safeInvoke('get_troop_matrix')
      ]);

      if (results[0].status === 'fulfilled') setTowerInfo(results[0].value as TowerOfAdversity);
      if (results[1].status === 'fulfilled') setTowerDetails(results[1].value as TowerDetails[]);
      if (results[2].status === 'fulfilled') setTowerEffects(results[2].value as TowerAreaEffect[]);
      if (results[3].status === 'fulfilled') setTowerTeams(results[3].value as TowerTeam[]);
      if (results[4].status === 'fulfilled') setWastesInfo(results[4].value as WhimperingWastes);
      if (results[5].status === 'fulfilled') setTorrentsStages(results[5].value as TorrentsStage[]);
      if (results[6].status === 'fulfilled') setTroopMatrix(results[6].value as TroopMatrix);
      
    } catch (error) {
      console.error('Failed to load endgame data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TowerSection
        towerInfo={towerInfo}
        towerDetails={towerDetails}
        towerEffects={towerEffects}
        towerTeams={towerTeams}
        isExpanded={expandedSections.tower}
        onToggle={() => toggleSection('tower')}
        onUpdate={loadAllEndgameData}
      />

      <WhimperingWastesSection
        wastesInfo={wastesInfo}
        torrentsStages={torrentsStages}
        isExpanded={expandedSections.wastes}
        onToggle={() => toggleSection('wastes')}
        onUpdate={loadAllEndgameData}
      />

      <TroopMatrixSection
        troopMatrix={troopMatrix}
        isExpanded={expandedSections.matrix}
        onToggle={() => toggleSection('matrix')}
        onUpdate={loadAllEndgameData}
      />
    </div>
  );
}