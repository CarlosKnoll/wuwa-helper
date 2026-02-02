import { useState, useEffect } from 'react';
import { Edit2, Save, X, Shield, Plus, Info } from 'lucide-react';
import { CharacterEchoBuildSectionProps, EchoSetData } from '../types';
import { safeInvoke } from '../utils';
import EchoItem from './EchoItem';

export default function CharacterEchoBuildSection({
  echoBuild,
  echoes,
  echoSubstats,
  onUpdate
}: CharacterEchoBuildSectionProps) {
  const [editing, setEditing] = useState(false);
  const [echoSets, setEchoSets] = useState<EchoSetData[]>([]);
  const [form, setForm] = useState({
    primary_set_key: null as string | null,
    secondary_set_key: null as string | null,
    primary_set_pieces: 5,
    secondary_set_pieces: 0,
    overall_quality: '',
    notes: '',
  });

  // Load echo sets from backend asset mappings
  useEffect(() => {
    loadEchoSets();
  }, []);

  // Update form when echoBuild changes
  useEffect(() => {
    if (echoBuild) {
      setForm({
        primary_set_key: echoBuild.primary_set_key || null,
        secondary_set_key: echoBuild.secondary_set_key || null,
        primary_set_pieces: echoBuild.primary_set_pieces || 5,
        secondary_set_pieces: echoBuild.secondary_set_pieces || 0,
        overall_quality: echoBuild.overall_quality || '',
        notes: echoBuild.notes || '',
      });
    }
  }, [echoBuild]);

  const loadEchoSets = async () => {
    try {
      const sets = await safeInvoke<EchoSetData[]>('get_all_echo_sets');
      setEchoSets(sets);
    } catch (err) {
      console.error('Failed to load echo sets:', err);
    }
  };

  const handleSave = async () => {
    if (!echoBuild) return;
    
    try {
      await safeInvoke('update_echo_build', {
        buildId: echoBuild.id,
        primarySetKey: form.primary_set_key,
        secondarySetKey: form.secondary_set_key,
        primarySetPieces: form.primary_set_pieces,
        secondarySetPieces: form.secondary_set_pieces,
        overallQuality: form.overall_quality || null,
        notes: form.notes || null,
      });
      setEditing(false);
      await onUpdate();
    } catch (err) {
      alert('Failed to update echo build: ' + err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (echoBuild) {
      setForm({
        primary_set_key: echoBuild.primary_set_key || null,
        secondary_set_key: echoBuild.secondary_set_key || null,
        primary_set_pieces: echoBuild.primary_set_pieces || 5,
        secondary_set_pieces: echoBuild.secondary_set_pieces || 0,
        overall_quality: echoBuild.overall_quality || '',
        notes: echoBuild.notes || '',
      });
    }
  };

  const addNewEcho = async () => {
    if (!echoBuild) return;
    
    if (echoes.length >= 5) {
      alert('Maximum of 5 echoes per character reached.');
      return;
    }
    
    try {
      await safeInvoke('add_echo', {
        buildId: echoBuild.id,
        echoName: 'New Echo',
        cost: 1,
        level: 0,
        rarity: 5,
        mainStat: null,
        mainStatValue: null,
        notes: null,
      });
      await onUpdate();
    } catch (err) {
      alert('Failed to add echo: ' + err);
    }
  };

  // Handle configuration change (5pc, 3pc+2pc, or 2pc+3pc)
  const handleConfigurationChange = (config: '5pc' | '3pc+2pc' | '2pc+3pc') => {
    if (config === '5pc') {
      setForm({
        ...form,
        primary_set_pieces: 5,
        secondary_set_pieces: 0,
        secondary_set_key: null,
      });
    } else if (config === '3pc+2pc') {
      setForm({
        ...form,
        primary_set_pieces: 3,
        secondary_set_pieces: 2,
      });
    } else if (config === '2pc+3pc') {
      setForm({
        ...form,
        primary_set_pieces: 2,
        secondary_set_pieces: 3,
      });
    }
  };

  // Get available primary sets based on selected configuration
  const getAvailablePrimarySets = () => {
    return echoSets.filter(set => {
      if (form.primary_set_pieces === 5) return set.has_5pc;
      if (form.primary_set_pieces === 3) return set.has_3pc;
      if (form.primary_set_pieces === 2) return set.has_2pc;
      return false;
    });
  };

  // Get available secondary sets based on primary selection and required pieces
  const getAvailableSecondarySets = () => {
    if (form.secondary_set_pieces === 0) return [];
    
    return echoSets.filter(set => {
      // Can't use same set twice
      if (set.key === form.primary_set_key) return false;
      
      // Check if set has the required piece count effect
      if (form.secondary_set_pieces === 2) return set.has_2pc;
      if (form.secondary_set_pieces === 3) return set.has_3pc;
      
      return false;
    });
  };

  if (!echoBuild) return null;

  const canAddMoreEchoes = echoes.length < 5;
  const primarySet = echoSets.find(s => s.key === form.primary_set_key);
  const secondarySet = form.secondary_set_key 
    ? echoSets.find(s => s.key === form.secondary_set_key)
    : null;

  const isMixedBuild = form.secondary_set_pieces > 0;
  const configLabel = isMixedBuild 
    ? `${form.primary_set_pieces}pc + ${form.secondary_set_pieces}pc`
    : `${form.primary_set_pieces}pc`;

  return (
    <div className="min-h-[600px] relative flex">
      {/* Echo Build Info Panel - Left Side */}
      <div className="w-96 p-6 space-y-6 flex-shrink-0">
        {/* Header with Edit Button */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-purple-400" />
            <div>
              <h3 className="text-xl font-bold text-purple-400">Echo Build</h3>
              {!editing && <div className="text-cyan-400 text-sm">{configLabel}</div>}
            </div>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded transition-colors">
              <Edit2 size={18} className="text-cyan-400" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors">
                <Save size={18} className="text-green-400" />
              </button>
              <button onClick={handleCancel} className="p-2 bg-slate-600/20 hover:bg-slate-600/30 rounded transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            {/* Configuration Selection */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Build Configuration</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleConfigurationChange('5pc')}
                  className={`w-full px-4 py-3 rounded-lg border text-left transition-colors ${
                    form.primary_set_pieces === 5 && form.secondary_set_pieces === 0
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">5pc (Full Set)</div>
                  <div className="text-xs text-slate-500">Use all 5 pieces from one echo set</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleConfigurationChange('3pc+2pc')}
                  className={`w-full px-4 py-3 rounded-lg border text-left transition-colors ${
                    form.primary_set_pieces === 3 && form.secondary_set_pieces === 2
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">3pc + 2pc (Mixed Set)</div>
                  <div className="text-xs text-slate-500">3 pieces from one set, 2 from another</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleConfigurationChange('2pc+3pc')}
                  className={`w-full px-4 py-3 rounded-lg border text-left transition-colors ${
                    form.primary_set_pieces === 2 && form.secondary_set_pieces === 3
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">2pc + 3pc (Mixed Set)</div>
                  <div className="text-xs text-slate-500">2 pieces from one set, 3 from another</div>
                </button>
              </div>
            </div>

            {/* Primary Set Selection */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Primary Set ({form.primary_set_pieces} pieces)
              </label>
              <select
                value={form.primary_set_key || ''}
                onChange={e => {
                  const value = e.target.value || null;
                  setForm({ ...form, primary_set_key: value });
                }}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select primary set...</option>
                {getAvailablePrimarySets().map(set => (
                  <option key={set.key} value={set.key}>
                    {set.name}
                  </option>
                ))}
              </select>
              
              {/* Show primary set effect */}
              {primarySet && (
                <div className="mt-2 bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-green-400">
                      {form.primary_set_pieces === 5 && primarySet.five_piece_bonus}
                      {form.primary_set_pieces === 3 && primarySet.two_piece_bonus}
                      {form.primary_set_pieces === 2 && primarySet.two_piece_bonus}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Set Selection (only shown for mixed builds) */}
            {isMixedBuild && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Secondary Set ({form.secondary_set_pieces} pieces)
                </label>
                <select
                  value={form.secondary_set_key || ''}
                  onChange={e => {
                    const value = e.target.value || null;
                    setForm({ ...form, secondary_set_key: value });
                  }}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select secondary set...</option>
                  {getAvailableSecondarySets().map(set => (
                    <option key={set.key} value={set.key}>
                      {set.name}
                    </option>
                  ))}
                </select>
                
                {/* Show secondary set effect */}
                {secondarySet && (
                  <div className="mt-2 bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-400">
                        {form.secondary_set_pieces === 2 && secondarySet.two_piece_bonus}
                        {form.secondary_set_pieces === 3 && secondarySet.two_piece_bonus}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Overall Quality</label>
              <select
                value={form.overall_quality}
                onChange={e => setForm({ ...form, overall_quality: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select quality...</option>
                <option value="Poor">Poor</option>
                <option value="Underwhelming">Underwhelming</option>
                <option value="Decent">Decent</option>
                <option value="Good">Good</option>
                <option value="Great">Great</option>
                <option value="Amazing">Amazing</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 min-h-[60px] text-sm"
                placeholder="Additional build notes..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {primarySet ? (
              <>
                {/* Primary Set Display */}
                <div>
                  <div className="text-slate-400 text-sm mb-2">Primary Set</div>
                  <div className="text-white font-semibold text-lg">{primarySet.name}</div>
                  <div className="text-cyan-400 text-sm mt-1">
                    {form.primary_set_pieces} pieces
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-cyan-400 text-xs font-semibold mb-1">
                    {form.primary_set_pieces === 5 ? '5-Piece Bonus' : 
                     form.primary_set_pieces === 3 ? '3-Piece Bonus' : '2-Piece Bonus'}
                  </div>
                  <div className="text-green-400 text-sm leading-relaxed">
                    {form.primary_set_pieces === 5 && primarySet.five_piece_bonus}
                    {form.primary_set_pieces === 3 && primarySet.two_piece_bonus}
                    {form.primary_set_pieces === 2 && primarySet.two_piece_bonus}
                  </div>
                </div>

                {/* Secondary Set Display (for mixed builds) */}
                {secondarySet && isMixedBuild && (
                  <>
                    <div className="border-t border-slate-700/50" />
                    <div>
                      <div className="text-slate-400 text-sm mb-2">Secondary Set</div>
                      <div className="text-white font-semibold text-lg">{secondarySet.name}</div>
                      <div className="text-cyan-400 text-sm mt-1">
                        {form.secondary_set_pieces} pieces
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="text-cyan-400 text-xs font-semibold mb-1">
                        {form.secondary_set_pieces === 3 ? '3-Piece Bonus' : '2-Piece Bonus'}
                      </div>
                      <div className="text-green-400 text-sm leading-relaxed">
                        {secondarySet.two_piece_bonus}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Shield size={48} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No echo set selected</p>
                <p className="text-slate-600 text-xs mt-1">Click edit to choose a set</p>
              </div>
            )}

            {form.overall_quality && (
              <>
                <div className="border-t border-slate-700/50" />
                <div>
                  <div className="text-slate-400 text-sm mb-2">Build Quality</div>
                  <div className="text-cyan-400 font-semibold">{form.overall_quality}</div>
                </div>
              </>
            )}

            {form.notes && (
              <>
                <div className="border-t border-slate-700/50" />
                <div>
                  <div className="text-slate-400 text-sm mb-2">Notes</div>
                  <p className="text-slate-300 text-sm italic whitespace-pre-line">{form.notes}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-transparent" />
      </div>

      {/* Echoes Section - Right Side */}
      <div className="flex-1 p-6 border-l border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-1">Equipped Echoes</h4>
            <p className="text-sm text-slate-400">
              <span className="text-cyan-400 font-semibold">{echoes.length}</span> / 5 Echoes
            </p>
          </div>
          <button
            onClick={addNewEcho}
            disabled={!canAddMoreEchoes}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              canAddMoreEchoes
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50'
                : 'bg-slate-700/20 cursor-not-allowed opacity-50 text-slate-500 border border-slate-700'
            }`}
            title={canAddMoreEchoes ? 'Add Echo' : 'Maximum 5 echoes reached'}
          >
            <Plus className="w-4 h-4" />
            Add Echo {!canAddMoreEchoes && '(Max)'}
          </button>
        </div>
        
        {echoes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {echoes.map(echo => (
              <EchoItem
                key={echo.id}
                echo={echo}
                substats={echoSubstats[echo.id] || []}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-700/50 rounded-lg">
            <div className="text-center">
              <Shield size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 text-sm mb-2">No echoes equipped</p>
              <p className="text-slate-600 text-xs">Click "Add Echo" to start building</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}