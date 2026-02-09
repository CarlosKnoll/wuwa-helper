import { useState, useEffect } from 'react';
import { Map, Edit2, Check} from 'lucide-react';
import { ExplorationMap, ExplorationRegion } from '../types';
import { safeInvoke } from '../utils';

export default function ExplorationTab({ regions, onUpdate }: { regions: ExplorationRegion[]; onUpdate: () => void }) {
  const [selectedRegion, setSelectedRegion] = useState<ExplorationRegion | null>(null);
  const [maps, setMaps] = useState<ExplorationMap[]>([]);
  const [editingMap, setEditingMap] = useState<number | null>(null);
  const [mapForms, setMapForms] = useState<Record<number, { exploration_percent: number; notes: string }>>({});

  useEffect(() => {
    setMaps([]);
    if (selectedRegion) {
      loadMaps(selectedRegion.id);
    }
  }, [selectedRegion]);

  const loadMaps = async (regionId: number) => {
    try {
      const mapsData = await safeInvoke('get_exploration_maps', { regionId }) as ExplorationMap[];
      setMaps(mapsData);
      const newForms: Record<number, any> = {};
      mapsData.forEach(map => {
        newForms[map.id] = {
          exploration_percent: map.exploration_percent,
          notes: map.notes || '',
        };
      });
      setMapForms(newForms);
    } catch (err) {
      console.error('Error loading maps:', err);
    }
  };

  const handleSaveMap = async (map: ExplorationMap) => {
    try {
      const form = mapForms[map.id];
      await safeInvoke('update_exploration_map', {
        id: map.id,
        explorationPercent: form.exploration_percent,
        notes: form.notes || null,
      });
      setEditingMap(null);
      onUpdate();
      if (selectedRegion) loadMaps(selectedRegion.id);
    } catch (err) {
      alert('Failed to update map: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => setSelectedRegion(selectedRegion?.id === region.id ? null : region)}
            className={`bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 transition-all text-left shadow-[0_0_12px_rgba(226,232,240,0.08)] ${
              selectedRegion?.id === region.id
                ? 'border-white shadow-lg shadow-white/20'
                : 'border-white/30 hover:border-white/60'
            }`}
          >
            <Map className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="font-bold text-lg">{region.region_name}</h3>
            {region.notes && <p className="text-sm text-slate-400 mt-2">{region.notes}</p>}
          </button>
        ))}
      </div>

      {selectedRegion && maps.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
          <h3 className="text-xl font-bold mb-4">{selectedRegion.region_name} - Maps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maps.map((map) => {
              const isEditing = editingMap === map.id;
              const form = mapForms[map.id] || { exploration_percent: map.exploration_percent, notes: map.notes || '' };

              return (
                <div key={map.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border-2 border-white/20 shadow-[0_0_10px_rgba(226,232,240,0.06)]">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold">{map.map_name}</h4>
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <button onClick={() => setEditingMap(map.id)} className="p-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded">
                          <Edit2 className="w-3 h-3 text-white-400" />
                        </button>
                      ) : (
                        <button onClick={() => handleSaveMap(map)} className="p-1 bg-green-500 hover:bg-green-600 rounded">
                          <Check className="w-3 h-3 text-white-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-400">Exploration %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.exploration_percent}
                          onChange={e => setMapForms({ ...mapForms, [map.id]: { ...form, exploration_percent: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <textarea
                        value={form.notes}
                        onChange={e => setMapForms({ ...mapForms, [map.id]: { ...form, notes: e.target.value } })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="Notes..."
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-yellow-400 font-bold text-xl">{form.exploration_percent}%</span>
                      </div>
                      <div className="mb-3">
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 h-full transition-all duration-300" style={{ width: `${form.exploration_percent}%` }}></div>
                        </div>
                      </div>
                      {form.notes && <p className="text-xs text-slate-400 italic">{form.notes}</p>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}