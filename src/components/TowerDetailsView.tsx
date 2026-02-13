import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Trophy, Edit2, Save, X, Plus, Trash2, Star } from 'lucide-react';
import { TowerOfAdversity, TowerDetails, TowerFloor, TowerAreaEffect, TowerTeam } from '../types';
import { safeInvoke, calculateTowerAstrite } from '../utils';
import CharacterPortrait from './CharacterPortrait';
import { CurrencyIcon } from './CurrencyIcon';
import ConfirmDialog from './ConfirmDialog';
import { createPortal } from 'react-dom';

// ─── CharDropdown ────────────────────────────────────────────────────────────
// Self-contained: owns all its own state so nothing depends on a parent
// render cycle. Position is measured synchronously in event handlers so the
// portal jumps instantly when switching inputs.
//
// backdrop-filter (backdrop-blur) on ancestors breaks position:fixed by
// creating a new containing block. We work around this by measuring the true
// viewport rect via getBoundingClientRect and using position:fixed with the
// 4px gap baked directly into `top`, so no CSS margin is needed.
interface CharDropdownProps {
  value: string;
  onChange: (v: string) => void;
  towerType: string;
  floorNum: number;
  placeholder: string;
  config: { border_inactive: string; focus: string };
  availableCharacters: string[];
  vigorConsumedMap: Record<string, number>;
}

function CharDropdown({
  value, onChange,
  towerType, floorNum, placeholder, config,
  availableCharacters, vigorConsumedMap,
}: CharDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const MAX_VIGOR = 10;
  const cost = towerType === 'hazard' ? 5 : floorNum;

  // Process characters: consolidate Rover variants.
  const roverVariants = availableCharacters.filter(c => c.startsWith('Rover'));
  const nonRoverChars  = availableCharacters.filter(c => !c.startsWith('Rover'));
  const processedChars: Array<{ display: string; actual: string; isRover: boolean }> = [];
  const seenRover = new Set<string>();
  nonRoverChars.forEach(c => processedChars.push({ display: c, actual: c, isRover: false }));
  roverVariants.forEach(rover => {
    const el = rover.replace('Rover', '').trim().replace(/^-\s*/, '').replace(/^\(\s*/, '').replace(/\s*\)$/, '');
    const display = el ? `Rover (${el})` : 'Rover';
    if (!seenRover.has(display)) { seenRover.add(display); processedChars.push({ display, actual: rover, isRover: true }); }
  });

  const filtered = processedChars.filter(c => c.display.toLowerCase().includes(search.toLowerCase()));

  // Measure and determine if dropdown should flip up
  const measurePosition = () => {
    if (!inputRef.current) return null;
    const r = inputRef.current.getBoundingClientRect();
    const width = Math.max(r.width, 220);
    const gap = 4;
    
    // Calculate dropdown height
    let dropdownHeight: number;
    if (dropdownRef.current && dropdownRef.current.offsetHeight > 0) {
      // Use actual measured height if available
      dropdownHeight = dropdownRef.current.offsetHeight;
    } else {
      // Estimate based on number of items
      const itemHeight = 28; // py-1.5 + text height
      const itemCount = filtered.length + 1; // +1 for "None" option
      const maxHeight = 176; // max-h-44 in pixels
      dropdownHeight = Math.min(itemCount * itemHeight, maxHeight);
    }
    
    // Check if there's enough space below
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    
    // Flip up if not enough space below AND there's more space above
    const flipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    return {
      top: flipUp ? r.top - dropdownHeight - gap : r.bottom + gap,
      left: r.left,
      width
    };
  };

  // Initial position calculation when opening
  useLayoutEffect(() => {
    if (open && inputRef.current) {
      const newPos = measurePosition();
      if (newPos) setPos(newPos);
    }
  }, [open]);

  // Update position when content changes
  useLayoutEffect(() => {
    if (open && inputRef.current) {
      const newPos = measurePosition();
      if (newPos) setPos(newPos);
    }
  }, [open, filtered.length]);

  // Keep position fresh while open (scroll / resize).
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const newPos = measurePosition();
      if (newPos) setPos(newPos);
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const displayValue = () => {
    if (!value) return '';
    if (value.startsWith('Rover')) {
      const el = value.replace('Rover', '').trim().replace(/^-\s*/, '').replace(/^\(\s*/, '').replace(/\s*\)$/, '');
      return el ? `Rover (${el})` : 'Rover';
    }
    return value;
  };

  const vigorOf = (charObj: { actual: string; isRover: boolean }) => {
    if (charObj.isRover) {
      const consumed = roverVariants.reduce((s, rv) => s + (vigorConsumedMap[rv] || 0), 0);
      return MAX_VIGOR - consumed;
    }
    return MAX_VIGOR - (vigorConsumedMap[charObj.actual] || 0);
  };

  const close = () => { setOpen(false); setSearch(''); };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? search : displayValue()}
        onChange={(e) => {
          const v = e.target.value;
          setSearch(v);
          if (!open) setOpen(true);
          if (!v.trim() || v.toLowerCase() === 'none') {
            onChange('');
          } else {
            const exact = processedChars.find(c => c.display.toLowerCase() === v.toLowerCase());
            onChange(exact ? exact.actual : v.trim());
          }
        }}
        onFocus={() => {
          setSearch(value ? displayValue() : '');
          setOpen(true);
        }}
        onBlur={(e) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!relatedTarget || relatedTarget.tagName !== 'INPUT') {
            setTimeout(close, 200);
          } else {
            close();
          }
        }}
        className={`w-full bg-slate-700 border ${config.border_inactive} rounded px-2 py-1 text-sm focus:outline-none ${config.focus}`}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-slate-800 border border-slate-600 rounded shadow-lg max-h-44 overflow-y-auto"
        >
          <button
            onMouseDown={() => { onChange(''); close(); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-700 transition-colors"
          >
            — None —
          </button>
          {filtered.map(charObj => {
            const remaining = vigorOf(charObj);
            const canUse    = remaining >= cost;
            const depleted  = remaining <= 0;
            return (
              <button
                key={charObj.display}
                onMouseDown={depleted ? undefined : () => { onChange(charObj.actual); close(); }}
                disabled={depleted}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  depleted   ? 'text-slate-600 cursor-not-allowed'
                  : canUse  ? 'hover:bg-slate-700 text-slate-200'
                  :            'hover:bg-slate-700/50 text-slate-400'
                }`}
              >
                <span className="truncate">{charObj.display}</span>
                <span className={`ml-2 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  remaining <= 0 ? 'bg-red-500/30 text-red-500'
                  : remaining < cost ? 'bg-orange-500/30 text-orange-400'
                  : 'bg-slate-600 text-slate-400'
                }`}>
                  {remaining}/{MAX_VIGOR}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

interface TowerDetailsViewProps {
  towerInfo: TowerOfAdversity | null;
  towerDetails: TowerDetails[];
  towerFloors: Record<string, TowerFloor[]>;
  towerEffects: TowerAreaEffect[];
  towerTeams: TowerTeam[];
  selectedTower: string | null;
  onTowerSelect: (tower: string | null) => void;
  onUpdate: () => void;
  onInitializeFloors?: () => void;
  availableCharacters?: string[];
}

type TowerType = 'echoing' | 'resonant' | 'hazard' | null;

export default function TowerDetailsView({
  towerInfo,
  towerDetails,
  towerFloors,
  towerEffects,
  towerTeams,
  selectedTower,
  onTowerSelect,
  onUpdate,
  onInitializeFloors,
  availableCharacters = []
}: TowerDetailsViewProps) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingTower, setEditingTower] = useState(false);
  const [editingEffect, setEditingEffect] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [addingTeam, setAddingTeam] = useState(false);
  const [saving, setSaving] = useState(false);
  const [floorsCollapsed, setFloorsCollapsed] = useState(false);
  const [deleteTeamDialog, setDeleteTeamDialog] = useState<number | null>(null);

  // Overview edit states
  const [editOverviewNotes, setEditOverviewNotes] = useState('');

  // Tower detail edit states
  const [editStarsAchieved, setEditStarsAchieved] = useState(0);
  const [editTowerNotes, setEditTowerNotes] = useState('');

  // Effect edit states
  const [editFloorRange, setEditFloorRange] = useState('');
  const [editEffectDesc, setEditEffectDesc] = useState('');

  // Team edit states
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editChar3, setEditChar3] = useState('');
  const [newTeamFloor, setNewTeamFloor] = useState(1);



  // Compute per-character vigor consumed across ALL towers
  // Echoing/Resonant: vigor consumed = floor number used on. Hazard: 5 per floor used on.
  const computeVigorMap = (): Record<string, number> => {
    const consumed: Record<string, number> = {};
    const towerTypes = ['echoing', 'resonant', 'hazard'];
    for (const tt of towerTypes) {
      const floors = towerFloors[tt] || [];
      const teams = towerTeams.filter(t => t.tower_type === tt);
      for (const team of teams) {
        const floor = floors.find(f => f.floor_number === team.floor_number);
        if (!floor || floor.stars === 0) continue; // floor not cleared, no vigor consumed
        const cost = tt === 'hazard' ? 5 : team.floor_number;
        for (const char of [team.character1, team.character2, team.character3]) {
          if (char && char !== 'None') {
            consumed[char] = (consumed[char] || 0) + cost;
          }
        }
      }
    }
    return consumed;
  };

  const vigorConsumedMap = computeVigorMap();

  const getTowerConfig = (type: string) => {
    const configs: Record<string, { name: string; color: string; bg: string; border_active: string; border_inactive: string; bar: string; hover: string; focus: string }> = {
      'echoing': { 
        name: 'Echoing Tower', 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-500/20', 
        border_active: 'border-cyan-500/[0.75] backdrop-blur-sm border-2',
        border_inactive: 'border-cyan-500/[0.35] backdrop-blur-sm border-2',
        bar: 'bg-cyan-500',
        hover: 'hover:border-cyan-500/[0.75]',
        focus: 'focus:border-cyan-500/[0.75]'
      },
      'resonant': { 
        name: 'Resonant Tower', 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/20', 
        border_active: 'border-emerald-500/[0.75] backdrop-blur-sm border-2',
        border_inactive: 'border-emerald-500/[0.35] backdrop-blur-sm border-2',
        bar: 'bg-emerald-500',
        hover: 'hover:border-emerald-500/[0.75]',
        focus: 'focus:border-emerald-500/[0.75]'
      },
      'hazard': { 
        name: 'Hazard Tower', 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        border_active: 'border-red-500/[0.75] backdrop-blur-sm border-2',
        border_inactive: 'border-red-500/[0.35] backdrop-blur-sm border-2',
        bar: 'bg-red-500',
        hover: 'hover:border-red-500/[0.75]',
        focus: 'focus:border-red-500/[0.75]'
      }
    };
    return configs[type] || configs['echoing'];
  };

  const startEditOverview = () => {
    if (towerInfo) {
      setEditOverviewNotes(towerInfo.notes || '');
      setEditingOverview(true);
    }
  };

  const saveOverview = async () => {
    setSaving(true);
    try {
      const calculatedAstrite = calculateTowerAstrite(towerInfo?.total_stars || 0);
      await safeInvoke('update_tower_of_adversity', {
        totalStars: towerInfo?.total_stars || 0,
        astriteEarned: calculatedAstrite,
        notes: editOverviewNotes || null
      });
      setEditingOverview(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tower overview:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const startEditTower = (detail: TowerDetails) => {
    setEditStarsAchieved(detail.stars_achieved);
    setEditTowerNotes(detail.notes || '');
    setEditingTower(true);
  };

  const saveTowerDetails = async (detail: TowerDetails) => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_details', {
        id: detail.id,
        starsAchieved: editStarsAchieved,
        notes: editTowerNotes || null
      });
      
      // Recalculate total stars and astrite from all tower details
      const allDetails = await safeInvoke('get_tower_details') as TowerDetails[];
      const totalStars = allDetails.reduce((sum, td) => sum + (td.stars_achieved || 0), 0);
      const calculatedAstrite = calculateTowerAstrite(totalStars);
      
      // Update the tower overview with new totals
      await safeInvoke('update_tower_of_adversity', {
        totalStars: totalStars,
        astriteEarned: calculatedAstrite,
        notes: towerInfo?.notes || null
      });
      
      setEditingTower(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tower details:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateFloorStars = async (floorId: number, stars: number) => {
    try {
      await safeInvoke('update_tower_floor_stars', {
        id: floorId,
        stars: stars
      });
      
      // Fetch fresh floor data from database to get accurate totals
      const towerTypes = ['echoing', 'resonant', 'hazard'];
      const floorResults = await Promise.all(
        towerTypes.map(type => safeInvoke('get_tower_floors', { towerType: type }))
      );
      
      // Calculate total stars from fresh data
      const allFreshFloors = floorResults.flat();
      const totalStars = allFreshFloors.reduce((sum: number, floor: any) => sum + (floor.stars || 0), 0);
      const calculatedAstrite = calculateTowerAstrite(totalStars);
      
      // Update the tower overview with new totals
      await safeInvoke('update_tower_of_adversity', {
        totalStars: totalStars,
        astriteEarned: calculatedAstrite,
        notes: towerInfo?.notes || null
      });
      
      await onUpdate();
    } catch (error) {
      console.error('Failed to update floor stars:', error);
      alert('Failed to update stars');
    }
  };

  const startEditEffect = (effect: TowerAreaEffect) => {
    setEditFloorRange(effect.floor_range);
    setEditEffectDesc(effect.effect_description);
    setEditingEffect(effect.id);
  };

  const saveEffect = async (effectId: number, towerType: string) => {
    setSaving(true);
    try {
      await safeInvoke('update_tower_area_effect', {
        id: effectId,
        towerType,
        floorRange: editFloorRange,
        effectDescription: editEffectDesc
      });
      setEditingEffect(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update effect:', error);
      alert('Failed to save effect');
    } finally {
      setSaving(false);
    }
  };

  const startEditTeam = (team: TowerTeam) => {
    setEditChar1(team.character1);
    setEditChar2(team.character2);
    setEditChar3(team.character3);
    setEditingTeam(team.id);
  };

  const saveTeam = async (id: number) => {
    // Validate no duplicates
    const chars = [editChar1, editChar2, editChar3].filter(c => c && c !== 'None' && c !== '');
    const uniqueChars = new Set(chars);
    if (chars.length !== uniqueChars.size) {
      alert('Cannot use the same character more than once in a team');
      return;
    }
    
    setSaving(true);
    try {
      await safeInvoke('update_tower_team', {
        id,
        character1: editChar1 || 'None',
        character2: editChar2 || 'None',
        character3: editChar3 || 'None'
      });
      setEditingTeam(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update team:', error);
      alert('Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = async (id: number) => {
    setDeleteTeamDialog(id);
  };

  const confirmDeleteTeam = async () => {
    if (deleteTeamDialog === null) return;
    
    try {
      await safeInvoke('delete_tower_team', { id: deleteTeamDialog });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team');
    } finally {
      setDeleteTeamDialog(null);
    }
  };

  const addTeam = async () => {
    // Validate no duplicates
    const chars = [editChar1, editChar2, editChar3].filter(c => c && c !== 'None' && c !== '');
    const uniqueChars = new Set(chars);
    if (chars.length !== uniqueChars.size) {
      alert('Cannot use the same character more than once in a team');
      return;
    }
    
    setSaving(true);
    try {
      await safeInvoke('add_tower_team', {
        towerType: selectedTower,
        floorNumber: newTeamFloor,
        character1: editChar1 || 'None',
        character2: editChar2 || 'None',
        character3: editChar3 || 'None'
      });
      setAddingTeam(false);
      setEditChar1('');
      setEditChar2('');
      setEditChar3('');
      setNewTeamFloor(1);
      onUpdate();
    } catch (error) {
      console.error('Failed to add team:', error);
      alert('Failed to add team');
    } finally {
      setSaving(false);
    }
  };

  const handleTowerClick = (towerType: string) => {
    if (selectedTower === towerType) {
      onTowerSelect(null);
    } else {
      onTowerSelect(towerType);
    }
  };

  if (!towerInfo) return null;

  const renderStarSelector = (floor: TowerFloor) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((starNum) => (
          <button
            key={starNum}
            onClick={() => updateFloorStars(floor.id, starNum === floor.stars ? 0 : starNum)}
            className={`transition-colors ${
              starNum <= floor.stars 
                ? 'text-yellow-400 hover:text-yellow-300' 
                : 'text-slate-600 hover:text-slate-500'
            }`}
            title={`${starNum} star${starNum !== 1 ? 's' : ''}`}
          >
            <Star className="w-4 h-4" fill={starNum <= floor.stars ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  // Reordered tower types: Resonant, Hazard, Echoing
  const orderedTowerTypes = ['resonant', 'hazard', 'echoing'];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30 shadow-[0_0_12px_rgba(226,232,240,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-cyan-400" />
            Tower of Adversity Overview
          </h3>
          {!editingOverview && (
            <button
              onClick={startEditOverview}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingOverview ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Notes</label>
              <textarea
                value={editOverviewNotes}
                onChange={(e) => setEditOverviewNotes(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                rows={3}
                placeholder="General notes about tower progress..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingOverview(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveOverview}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Total Stars</p>
              <p className="text-2xl font-bold text-yellow-400">{towerInfo.total_stars} / 36</p>
            </div>
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Astrite Earned</p>
              <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <CurrencyIcon currencyName="astrite" className="w-6 h-6" />
                {towerInfo.astrite_earned} / 800
              </p>
            </div>
            <div className="rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Completion</p>
              <p className="text-2xl font-bold text-yellow-400">
                {((towerInfo.astrite_earned / 800) * 100).toFixed(1)}%
              </p>
            </div>
            {towerInfo.notes && (
              <div className="col-span-1 md:col-span-3 bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Notes</p>
                <p className="text-sm">{towerInfo.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual Tower Cards - Reordered: Resonant, Hazard, Echoing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orderedTowerTypes.map((towerType) => {
          const detail = towerDetails.find(d => d.tower_type === towerType);
          if (!detail) return null;
          
          const config = getTowerConfig(detail.tower_type);
          const isSelected = selectedTower === detail.tower_type;
          return (
            <div
              key={detail.id}
              onClick={() => handleTowerClick(detail.tower_type)}
              className={`bg-slate-900/50 rounded-xl p-4 border transition-all cursor-pointer ${
                isSelected 
                  ? `${config.border_active} shadow-lg ` 
                  : `${config.border_inactive} rounded-xl p-6 shadow-[0_0_12px_rgba(226,232,240,0.08)] ${config.hover}`
              }`}
            >
              <h4 className={`text-lg font-bold ${config.color} mb-3`}>
                {config.name}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Stars:</span>
                  <span className="font-semibold">{detail.stars_achieved} / 12</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div 
                    className={`${config.bar} h-full rounded-full transition-all`}
                    style={{ width: `${(detail.stars_achieved / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tower Details */}
      {selectedTower && (() => {
        const detail = towerDetails.find(d => d.tower_type === selectedTower);
        if (!detail) return null;

        const config = getTowerConfig(selectedTower);
        const floors = towerFloors[selectedTower] || [];
        const teams = towerTeams.filter(t => t.tower_type === selectedTower);
        const MAX_TEAMS = 4;
        const canAddTeam = teams.length < MAX_TEAMS;

        return (
          <div className={`bg-slate-900/50 rounded-xl p-6 border ${config.border_active}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${config.color}`}>{config.name} Details</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className={`w-4 h-4 ${config.color}`} fill="currentColor" />
                  <span className={`text-sm font-semibold ${config.color}`}>{detail.stars_achieved}/12</span>
                </div>
                {!editingTower && (
                  <button
                    onClick={() => startEditTower(detail)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {editingTower ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Notes</label>
                  <textarea
                    value={editTowerNotes}
                    onChange={(e) => setEditTowerNotes(e.target.value)}
                    className={`w-full bg-slate-700 border ${config.border_inactive} rounded px-3 py-2 focus:outline-none ${config.focus}`}
                    rows={2}
                    placeholder="Notes about this tower..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingTower(false)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => saveTowerDetails(detail)}
                    disabled={saving}
                    className={`px-3 py-2 ${config.bg} hover:opacity-80 rounded flex items-center gap-2 text-sm ${config.color}`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : detail.notes ? (
              <div className="mb-6 bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Notes</p>
                <p className="text-sm">{detail.notes}</p>
              </div>
            ) : null}

            {/* Area Effects */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-md font-semibold ${config.color}`}>Area Effects</h4>
              </div>
              <div className="space-y-2">
                {towerEffects
                  .filter(e => e.tower_type === selectedTower)
                  .map((effect) => {
                    const isEditingThis = editingEffect === effect.id;
                    return (
                      <div key={effect.id} className={`${config.bg} rounded-lg p-3 border ${config.border_active}`}>
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Floor Range</label>
                              <input
                                type="text"
                                value={editFloorRange}
                                onChange={(e) => setEditFloorRange(e.target.value)}
                                className={`w-full bg-slate-700 border ${config.border_inactive} rounded px-2 py-1 text-sm focus:outline-none ${config.focus}`}
                                placeholder="e.g., 1-2"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Effect Description</label>
                              <textarea
                                value={editEffectDesc}
                                onChange={(e) => setEditEffectDesc(e.target.value)}
                                className={`w-full bg-slate-700 border ${config.border_inactive} rounded px-2 py-1 text-sm focus:outline-none ${config.focus}`}
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingEffect(null)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEffect(effect.id, selectedTower)}
                                disabled={saving}
                                className={`px-2 py-1 ${config.bg} hover:opacity-80 rounded text-xs flex items-center gap-1 ${config.color}`}
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-semibold ${config.color}`}>
                                Floors {effect.floor_range}
                              </span>
                              <button
                                onClick={() => startEditEffect(effect)}
                                className="p-1 hover:bg-slate-600 rounded transition-colors"
                                title="Edit effect"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-300">{effect.effect_description}</p>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Floors & Teams */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setFloorsCollapsed(!floorsCollapsed)}
                  className={`flex items-center gap-2 text-md font-semibold ${config.color} hover:opacity-80 transition-opacity`}
                >
                  <span>Floors & Teams</span>
                  <span className="text-sm">{floorsCollapsed ? '▶' : '▼'}</span>
                </button>
                {!floorsCollapsed && canAddTeam && !addingTeam && (
                  <button
                    onClick={() => setAddingTeam(true)}
                    className={`flex items-center gap-2 px-3 py-2 ${config.bg} hover:opacity-80 ${config.color} rounded-lg transition-opacity text-sm`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Team
                  </button>
                )}
              </div>

              {!floorsCollapsed && (
                <div className="space-y-3">
                  {addingTeam && (
                    <div className={`${config.bg} rounded-lg p-3 border ${config.border_active} space-y-2`}>
                      <p className="text-sm font-semibold">Add New Team</p>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Floor Number</label>
                        <input
                          type="number"
                          value={newTeamFloor}
                          onChange={(e) => setNewTeamFloor(parseInt(e.target.value) || 1)}
                          className={`w-full bg-slate-700 border ${config.border_inactive} rounded px-2 py-1 text-sm focus:outline-none ${config.focus}`}
                          min="1"
                          max="4"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <CharDropdown value={editChar1} onChange={setEditChar1} towerType={selectedTower!} floorNum={newTeamFloor} placeholder="Char 1" config={config} availableCharacters={availableCharacters} vigorConsumedMap={vigorConsumedMap} />
                        <CharDropdown value={editChar2} onChange={setEditChar2} towerType={selectedTower!} floorNum={newTeamFloor} placeholder="Char 2" config={config} availableCharacters={availableCharacters} vigorConsumedMap={vigorConsumedMap} />
                        <CharDropdown value={editChar3} onChange={setEditChar3} towerType={selectedTower!} floorNum={newTeamFloor} placeholder="Char 3" config={config} availableCharacters={availableCharacters} vigorConsumedMap={vigorConsumedMap} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setAddingTeam(false);
                            setEditChar1('');
                            setEditChar2('');
                            setEditChar3('');
                            setNewTeamFloor(1);
                          }}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          onClick={addTeam}
                          disabled={saving}
                          className={`px-2 py-1 ${config.bg} hover:opacity-80 rounded text-xs flex items-center gap-1 ${config.color}`}
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {floors.map((floor) => {
                    const floorTeam = teams.find(t => t.floor_number === floor.floor_number);
                    const isEditingThisTeam = editingTeam === floorTeam?.id;

                    return (
                      <div key={floor.id} className={`${config.bg} rounded-lg p-3 border ${config.border_active} space-y-2`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className={`text-sm font-semibold ${config.color}`}>
                              Floor {floor.floor_number}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {floor.stars === 0 ? 'Not cleared' : `${floor.stars}/3 stars`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStarSelector(floor)}
                            {floorTeam && !isEditingThisTeam && (
                              <>
                                <button
                                  onClick={() => startEditTeam(floorTeam)}
                                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                                  title="Edit team"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteTeam(floorTeam.id)}
                                  className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
                                  title="Delete team"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {floorTeam ? (
                          isEditingThisTeam ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <CharDropdown value={editChar1} onChange={setEditChar1} towerType={selectedTower!} floorNum={floor.floor_number} placeholder="Char 1" config={config} availableCharacters={availableCharacters} vigorConsumedMap={vigorConsumedMap} />
                                <CharDropdown value={editChar2} onChange={setEditChar2} towerType={selectedTower!} floorNum={floor.floor_number} placeholder="Char 2" config={config} availableCharacters={availableCharacters} vigorConsumedMap={vigorConsumedMap} />
                                <CharDropdown value={editChar3} onChange={setEditChar3} towerType={selectedTower!} floorNum={floor.floor_number} placeholder="Char 3" config={config} availableCharacters={availableCharacters} vigorConsumedMap={vigorConsumedMap} />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingTeam(null)}
                                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveTeam(floorTeam.id)}
                                  disabled={saving}
                                  className={`px-2 py-1 ${config.bg} hover:opacity-80 rounded text-xs flex items-center gap-1 ${config.color}`}
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-1 min-w-0">
                              {[floorTeam.character1, floorTeam.character2, floorTeam.character3]
                                .filter(char => char && char !== 'None')
                                .map((char, idx) => (
                                  <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded min-w-0 flex-1">
                                    <CharacterPortrait characterName={char} size="md" className="flex-shrink-0" />
                                    <span className="text-xs text-slate-300 truncate">{char}</span>
                                  </div>
                                ))
                              }
                            </div>
                          )
                        ) : (
                          canAddTeam && (
                            <button
                              onClick={() => {
                                setEditChar1('');
                                setEditChar2('');
                                setEditChar3('');
                                setNewTeamFloor(floor.floor_number);
                                setAddingTeam(true);
                              }}
                              className="w-full py-2 border border-dashed border-slate-600 hover:border-slate-500 rounded text-xs text-slate-500 hover:text-slate-400 transition-colors"
                            >
                              + Add team for this floor
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
          </div>
        </div>
      );
    })()}

    <ConfirmDialog
      isOpen={deleteTeamDialog !== null}
      title="Delete Team"
      message="Are you sure you want to delete this team? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      onConfirm={confirmDeleteTeam}
      onCancel={() => setDeleteTeamDialog(null)}
    />
  </div>
);
}