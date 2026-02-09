import { useState, useEffect } from 'react';
import { Edit2, Save, X, Shield, Plus, Info, AlertTriangle } from 'lucide-react';
import { CharacterEchoBuildSectionProps, EchoSetData } from '../types';
import { safeInvoke } from '../utils';
import EchoItem from './EchoItem';
import { invoke } from '@tauri-apps/api/core';

export default function CharacterEchoBuildSection({
  echoBuild,
  echoes,
  echoSubstats,
  onUpdate
}: CharacterEchoBuildSectionProps) {
  const [editing, setEditing] = useState(false);
  const [echoSets, setEchoSets] = useState<EchoSetData[]>([]);
  const [selectedEchoId, setSelectedEchoId] = useState<number | null>(null);
  const [echoSetImages, setEchoSetImages] = useState<Record<string, string>>({}); // set_key -> image
  const [echoImages, setEchoImages] = useState<Record<number, string>>({}); // echo_id -> image
  const [echoSpecificSetImages, setEchoSpecificSetImages] = useState<Record<number, string>>({}); // echo_id -> its set image
  const [echoMetadata, setEchoMetadata] = useState<Record<number, { passive1: string; passive2: string; cooldown: number }>>({});
  const [assetResolverReady, setAssetResolverReady] = useState(false);
  const [form, setForm] = useState({
    primary_set_key: null as string | null,
    secondary_set_key: null as string | null,
    primary_set_pieces: 5,
    secondary_set_pieces: 0,
    overall_quality: '',
    notes: '',
  });

  // Initialize asset resolver first (non-blocking)
  useEffect(() => {
    const initAssetResolver = async () => {
      try {
        await invoke('init_asset_resolver');
        setAssetResolverReady(true);
      } catch (err) {
        // If initialization fails, still try to load assets without resolver
        console.warn('Asset resolver initialization failed, will try loading assets directly:', err);
        setAssetResolverReady(true);
      }
    };
    initAssetResolver();
  }, []);

  // Load echo sets from backend asset mappings
  useEffect(() => {
    if (assetResolverReady) {
      loadEchoSets();
    }
  }, [assetResolverReady]);

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

  // Auto-select first echo when echoes list changes (but don't auto-select on mount)
  useEffect(() => {
    if (echoes.length === 0) {
      setSelectedEchoId(null);
    } else if (selectedEchoId && !echoes.find(e => e.id === selectedEchoId)) {
      // If selected echo was deleted, select first available
      setSelectedEchoId(echoes[0]?.id || null);
    }
    // Don't auto-select first echo - let user click to expand
  }, [echoes, selectedEchoId]);

  // Load echo images when echoes change AND when echoSets/echoSetImages are available
  useEffect(() => {
    if (assetResolverReady && echoes.length > 0 && echoSets.length > 0 && Object.keys(echoSetImages).length > 0) {
      loadEchoImages();
    } else {
    }
  }, [echoes, assetResolverReady, echoSets, echoSetImages]);

  const loadEchoSets = async () => {
    try {
      const sets = await safeInvoke<EchoSetData[]>('get_all_echo_sets');
      setEchoSets(sets);
      
      // Load images for all echo sets using the echo_set asset type
      const images: Record<string, string> = {};
      for (const set of sets) {
        try {
          const base64 = await invoke<string>('get_asset', {
            assetType: 'echo_set',
            name: set.key,
          });
          images[set.key] = `data:image/webp;base64,${base64}`;
        } catch (err) {
          console.error(`Failed to load sonata effect image for ${set.key}:`, err);
        }
      }
      setEchoSetImages(images);
    } catch (err) {
      console.error('Failed to load sonata effects:', err);
    }
  };

  const loadEchoImages = async () => {
    const images: Record<number, string> = {};
    const metadata: Record<number, { passive1: string; passive2: string; cooldown: number }> = {};
    
    for (const echo of echoes) {
      if (!echo.echo_name) continue;
      
      // Image loading (keep existing logic)
      try {
        // Try multiple strategies to get the echo image
        let base64: string | null = null;
        let successStrategy: string | null = null;
        
        // Strategy 1: Try using asset resolver to get filename
        try {
          const filename = await invoke<string | null>('get_asset_filename', {
            identifier: echo.echo_name,
          });
          if (filename) {
            const cleanName = filename.replace('.webp', '').replace('.png', '');
            base64 = await invoke<string>('get_asset', {
              assetType: 'echo',
              name: cleanName,
            });
            successStrategy = 'resolver';
          }
        } catch (resolverErr) {
        }
        
        // Strategy 2: Try direct lookup by converting name to ID format
        if (!base64) {
          try {
            const nameId = echo.echo_name.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '');
            base64 = await invoke<string>('get_asset', {
              assetType: 'echo',
              name: nameId,
            });
            successStrategy = 'name_to_id';
          } catch (directErr) {
          }
        }
        
        // Strategy 3: Try using the echo name directly as-is
        if (!base64) {
          try {
            base64 = await invoke<string>('get_asset', {
              assetType: 'echo',
              name: echo.echo_name,
            });
            successStrategy = 'as_is';
          } catch (asIsErr) {
          }
        }
        
        if (base64) {
          images[echo.id] = `data:image/webp;base64,${base64}`;
        } else {
          console.warn(`[Failed] All strategies failed for: "${echo.echo_name}"`);
        }
      } catch (err) {
        console.error(`[Error] Exception loading echo image for "${echo.echo_name}":`, err);
      }

      // Metadata fetching (independent of image loading)
      try {
        
        // Use get_echo_metadata_direct - accesses hardcoded mappings directly
        const echoMetadata = await invoke<any>('get_echo_metadata_direct', {
          echoName: echo.echo_name,
        });
        
        
        if (echoMetadata) {
          const { passive1, passive2, cooldown } = echoMetadata;
          
          
          metadata[echo.id] = { passive1, passive2, cooldown };
        } else {
        }
      } catch (metadataErr) {
        console.error(`[Metadata Error] Failed to load metadata for "${echo.echo_name}":`, metadataErr);
      }
    }
    
    // Load echo set images for each echo
    const setImages: Record<number, string> = {};
    for (const echo of echoes) {
      if (echo.echo_set) {
        // Find the set key that matches this echo's set name
        const matchingSet = echoSets.find(set => set.name === echo.echo_set);
        if (matchingSet && echoSetImages[matchingSet.key]) {
          setImages[echo.id] = echoSetImages[matchingSet.key];
        }
      }
    }
    
    setEchoImages(images);
    setEchoMetadata(metadata);
    setEchoSpecificSetImages(setImages);
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

  // Handle echo selection - toggle to deselect if same echo clicked
  const handleEchoClick = (echoId: number) => {
    if (selectedEchoId === echoId) {
      setSelectedEchoId(null); // Deselect if clicking the same echo
    } else {
      setSelectedEchoId(echoId); // Select the new echo
    }
  };

  // Handle configuration change (5pc or 3pc+2pc only, removed 2pc+3pc)
  const handleConfigurationChange = (config: '5pc' | '3pc+2pc') => {
    if (config === '5pc') {
      setForm({
        ...form,
        primary_set_pieces: 5,
        secondary_set_pieces: 0,
        primary_set_key: null,  // Clear primary set selection
        secondary_set_key: null,
      });
    } else if (config === '3pc+2pc') {
      setForm({
        ...form,
        primary_set_pieces: 3,
        secondary_set_pieces: 2,
        primary_set_key: null,  // Clear primary set selection
        secondary_set_key: null, // Clear secondary set selection
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

  // Calculate total echo cost
  const getTotalCost = () => {
    return echoes.reduce((sum, echo) => sum + (echo.cost || 0), 0);
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

  // Calculate allowed echo set names based on build configuration
  const allowedEchoSetNames: string[] = [];
  if (primarySet) {
    allowedEchoSetNames.push(primarySet.name);
  }
  if (secondarySet && isMixedBuild) {
    allowedEchoSetNames.push(secondarySet.name);
  }

  const totalCost = getTotalCost();
  const costOverLimit = totalCost > 12;

  return (
    <div className="relative h-full flex flex-col">
      {/* Atmospheric Background similar to Forte tab */}
      <div className="relative bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 shadow-2xl flex-1 flex flex-col overflow-hidden">
        {/* Central atmospheric glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-300/5 rounded-full blur-2xl"></div>
        
        {/* Stars/sparkles effect */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[30%] right-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[60%] left-[25%] w-0.5 h-0.5 bg-blue-200 rounded-full shadow-[0_0_3px_rgba(191,219,254,0.8)]"></div>
          <div className="absolute bottom-[25%] right-[30%] w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_3px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute top-[45%] right-[15%] w-0.5 h-0.5 bg-blue-100 rounded-full shadow-[0_0_3px_rgba(219,234,254,0.8)]"></div>
          <div className="absolute bottom-[40%] left-[35%] w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
        </div>

        {/* Original Content */}
        <div className="relative z-10 flex gap-6 p-6 h-full">
      {/* Left Side - Echo Icons */}
      <div className="w-48 flex-shrink-0 space-y-4">
        {/* Cost Warning */}
        {costOverLimit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-400">
              <div className="font-semibold">Cost Limit Exceeded!</div>
              <div className="mt-0.5">Total: {totalCost}/12</div>
            </div>
          </div>
        )}

        {/* Echo Icons - CIRCULAR LAYOUT (CENTERED, NO NAMES, NO BOX) */}
        <div className="space-y-3">
          {echoes.map(echo => (
            <button
              key={echo.id}
              onClick={() => handleEchoClick(echo.id)}
              className="w-full flex justify-center transition-all p-2 hover:scale-105"
              title={echo.echo_name || 'Echo'}
            >
              {/* Circular Echo Icon - Centered */}
              <div className="relative flex-shrink-0">
                {/* Underglow effect */}
                <div className="absolute inset-[-4px] bg-slate-200/15 rounded-full blur-lg -z-10"></div>
                
                {/* Main Circle - Increased size from w-14 h-14 to w-20 h-20 */}
                <div className={`w-20 h-20 rounded-full bg-slate-900 border-2 overflow-hidden relative flex items-center justify-center transition-all ${
                  selectedEchoId === echo.id
                    ? 'border-yellow-300 shadow-[0_0_20px_rgba(226,232,240,0.4)]'
                    : 'border-yellow-400/30 shadow-[0_0_12px_rgba(226,232,240,0.2)]'
                }`}>
                  {echoImages[echo.id] ? (
                    <img
                      src={echoImages[echo.id]}
                      alt={echo.echo_name || 'Echo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="animate-pulse bg-slate-700 w-full h-full" />
                  )}
                </div>

                {/* Cost Badge - Top Left - Increased size */}
                <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{echo.cost || 1}</span>
                </div>

                {/* Echo Set Icon - Top Right */}
                {echoSpecificSetImages[echo.id] && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                    <img
                      src={echoSpecificSetImages[echo.id]}
                      alt={echo.echo_set || 'Set'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Level Badge - Bottom Right - Increased size */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{echo.level || 0}</span>
                </div>
              </div>
            </button>
          ))}

          {/* Add New Echo Button */}
          {canAddMoreEchoes && (
            <button
              onClick={addNewEcho}
              className="w-full flex justify-center transition-all hover:scale-105"
            >
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 bg-slate-800/30 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all flex items-center justify-center">
                <Plus size={24} className="text-slate-500" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Middle - Selected Echo Details */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto">
        {selectedEchoId && echoes.find(e => e.id === selectedEchoId) ? (
          <EchoItem
            echo={echoes.find(e => e.id === selectedEchoId)!}
            substats={echoSubstats[selectedEchoId] || []}
            onUpdate={onUpdate}
            echoImage={echoImages[selectedEchoId]}
            echoSetImage={echoSpecificSetImages[selectedEchoId]}
            echoMetadata={echoMetadata[selectedEchoId]}
            allowedEchoSets={allowedEchoSetNames}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Shield size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No echo selected</p>
              <p className="text-slate-600 text-sm mt-1">Click an echo to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Echo Set Info */}
      <div className="relative w-80 flex-shrink-0 bg-slate-800/30 backdrop-blur-sm rounded-lg border-2 border-slate-200/30 shadow-[0_0_20px_rgba(226,232,240,0.15)] flex flex-col h-full overflow-hidden">
        {/* Underglow effect */}
        <div className="absolute inset-0 -z-10 bg-slate-200/10 rounded-lg blur-xl"></div>
        
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-yellow-400" />
            Sonata Effect
          </h3>
          {/* Edit/Save/Cancel Buttons */}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded transition-colors"
            >
              <Edit2 size={16} className="text-white-400" />
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors"
              >
                <Save size={16} className="text-green-400" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 bg-slate-600/20 hover:bg-slate-600/30 rounded transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
        {editing ? (
          <div className="space-y-4">
            {/* Configuration Selection */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Configuration</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfigurationChange('5pc')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.primary_set_pieces === 5
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  5-Piece
                </button>
                <button
                  onClick={() => handleConfigurationChange('3pc+2pc')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.primary_set_pieces === 3
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  3pc + 2pc
                </button>
              </div>
            </div>

            {/* Primary Set Selection - GRID OF CLICKABLE ICONS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400">
                  Primary Set ({form.primary_set_pieces} pieces)
                </label>
              </div>
              <div className="grid grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-1">
                {getAvailablePrimarySets().map(set => {
                  const selected = form.primary_set_key === set.key;

                  return (
                    <button
                      key={set.key}
                      onClick={() =>
                        setForm({
                          ...form,
                          primary_set_key: selected ? null : set.key,
                        })
                      }
                      className="relative aspect-square flex items-center justify-center focus:outline-none"
                      title={set.name}
                    >
                      <div
                        className={`w-full h-full rounded-full transition-opacity ${
                          selected
                            ? "opacity-100"
                            : "opacity-40 hover:opacity-70"
                        }`}
                      >
                        {echoSetImages[set.key] ? (
                          <img
                            src={echoSetImages[set.key]}
                            alt={set.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center rounded-full">
                            <Shield size={20} className="text-slate-600" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              
              {/* Show primary set effect */}
              {primarySet && (
                <div className="mt-2 bg-slate-800/30 border border-slate-700/50 rounded-lg p-2.5 space-y-2">
                  <div className="text-xs font-semibold text-white">{primarySet.name}</div>
                  {/* For 5pc sets: show 2pc bonus first */}
                  {form.primary_set_pieces === 5 && primarySet.has_2pc && primarySet.two_piece_bonus && (
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-400 leading-relaxed">
                        {primarySet.two_piece_bonus}
                      </div>
                    </div>
                  )}
                  
                  {/* Main bonus for the selected configuration */}
                  {form.primary_set_pieces === 5 && primarySet.has_2pc && primarySet.two_piece_bonus && (
                    <div className="border-t border-slate-700/30 pt-2" />
                  )}
                  {/* Only show the main bonus section if there's actually content */}
                  {((form.primary_set_pieces === 5 && primarySet.five_piece_bonus) ||
                    (form.primary_set_pieces === 3 && primarySet.two_piece_bonus) ||
                    (form.primary_set_pieces === 2 && primarySet.two_piece_bonus)) && (
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-400 leading-relaxed">
                        {form.primary_set_pieces === 5 && primarySet.five_piece_bonus}
                        {form.primary_set_pieces === 3 && primarySet.two_piece_bonus}
                        {form.primary_set_pieces === 2 && primarySet.two_piece_bonus}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary Set Selection (only shown for mixed builds) - GRID OF CLICKABLE ICONS */}
            {isMixedBuild && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-400">
                    Secondary Set ({form.secondary_set_pieces} pieces)
                  </label>
                </div>
                <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {getAvailableSecondarySets().map(set => {
                    const selected = form.secondary_set_key === set.key;

                    return (
                      <button
                        key={set.key}
                        onClick={() =>
                          setForm({
                            ...form,
                            secondary_set_key: selected ? null : set.key,
                          })
                        }
                        className="relative aspect-square flex items-center justify-center focus:outline-none"
                        title={set.name}
                      >
                        <div
                          className={`w-full h-full rounded-full transition-opacity ${
                            selected
                              ? "opacity-100"
                              : "opacity-40 hover:opacity-70"
                          }`}
                        >
                          {echoSetImages[set.key] ? (
                            <img
                              src={echoSetImages[set.key]}
                              alt={set.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center rounded-full">
                              <Shield size={20} className="text-slate-600" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                
                {/* Show secondary set effect */}
                {secondarySet && isMixedBuild && (
                  <div className="mt-2 bg-slate-800/30 border border-slate-700/50 rounded-lg p-2.5">
                    <div className="text-xs font-semibold text-white mb-1">{secondarySet.name}</div>
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-400 leading-relaxed">
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
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
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
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 min-h-[60px]"
                placeholder="Additional build notes..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {primarySet ? (
              <>
                {/* Primary Set Display */}
                <div>
                  <div className="flex items-center gap-2">
                    {echoSetImages[primarySet.key] && (
                      <img
                        src={echoSetImages[primarySet.key]}
                        alt={primarySet.name}
                        className="w-5 h-5 object-cover rounded-lg border border-slate-700"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-white font-semibold text-base">
                        {primarySet.name} <span className="text-yellow-400 text-sm">({form.primary_set_pieces}pc)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-2.5 space-y-2">
                  {/* For 5pc sets: show 2pc bonus first */}
                  {form.primary_set_pieces === 5 && primarySet.has_2pc && primarySet.two_piece_bonus && (
                    <>
                      <div className="text-yellow-400 text-xs font-semibold">2-Piece Bonus</div>
                      <div className="text-white-400 text-xs leading-relaxed">
                        {primarySet.two_piece_bonus}
                      </div>
                      <div className="border-t border-slate-700/30 pt-2 mt-2">
                        <div className="text-yellow-400 text-xs font-semibold">5-Piece Bonus</div>
                        <div className="text-white-400 text-xs leading-relaxed mt-1">
                          {primarySet.five_piece_bonus}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* For 3pc or 2pc sets: show only the appropriate bonus */}
                  {form.primary_set_pieces !== 5 && (
                    <>
                      <div className="text-yellow-400 text-xs font-semibold">
                        {form.primary_set_pieces === 3 ? '3-Piece Bonus' : '2-Piece Bonus'}
                      </div>
                      <div className="text-white-400 text-xs leading-relaxed">
                        {primarySet.two_piece_bonus}
                      </div>
                    </>
                  )}
                </div>

                {/* Secondary Set Display (for mixed builds) */}
                {secondarySet && isMixedBuild && (
                  <>
                    <div className="border-t border-slate-700/50 my-3" />
                    <div>
                      <div className="flex items-center gap-2">
                        {echoSetImages[secondarySet.key] && (
                          <img
                            src={echoSetImages[secondarySet.key]}
                            alt={secondarySet.name}
                            className="w-5 h-5 object-cover rounded-lg border border-slate-700"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base">
                            {secondarySet.name} <span className="text-yellow-400 text-sm">({form.secondary_set_pieces}pc)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-2.5">
                      <div className="text-yellow-400 text-xs font-semibold">
                        {form.secondary_set_pieces === 3 ? '3-Piece Bonus' : '2-Piece Bonus'}
                      </div>
                      <div className="text-white-400 text-xs leading-relaxed mt-1">
                        {secondarySet.two_piece_bonus}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Shield size={40} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No sonata effect selected</p>
                <p className="text-slate-600 text-xs mt-1">Click edit to choose a set</p>
              </div>
            )}

            {form.overall_quality && (
              <>
                <div className="border-t border-slate-700/50" />
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-1.5">Build Quality</div>
                  <div className="text-yellow-400 font-semibold text-sm">{form.overall_quality}</div>
                </div>
              </>
            )}

            {form.notes && (
              <>
                <div className="border-t border-slate-700/50" />
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-1.5">Notes</div>
                  <p className="text-slate-300 text-xs italic whitespace-pre-line">{form.notes}</p>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
        </div>
      </div>
  );
}