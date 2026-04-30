import { useState, useEffect, useCallback } from 'react';
import { Check, Edit2, MapPin } from 'lucide-react';
import { ExplorationSegment, ExplorationRegion, ExplorationArea } from '../types';
import { safeInvoke } from '../utils';
import { useAssets } from '../hooks/useAssets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AreaFormState {
  exploration_percent: number;
  notes: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Segment card: square-ish aspect ratio to suit 256×256 icon assets.
 * Name overlaid at the bottom. White border, more saturated when selected.
 */
function SegmentCard({
  segment,
  imageB64,
  selected,
  onClick,
}: {
  segment: ExplorationSegment;
  imageB64: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all text-left w-full
        shadow-[0_0_12px_rgba(226,232,240,0.08)]
        ${selected
          ? 'border-white shadow-lg shadow-white/20'
          : 'border-white/30 hover:border-white/60'}
      `}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Background image or fallback */}
      {imageB64 ? (
        <img
          src={`data:image/webp;base64,${imageB64}`}
          alt={segment.segment_name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/80" />
      )}

      {/* Dark scrim for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* Name — bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 px-3 py-2">
        <span className="text-white font-bold text-sm drop-shadow-md leading-tight line-clamp-2">
          {segment.segment_name}
        </span>
      </div>
    </button>
  );
}

/**
 * Area card: landscape aspect ratio to suit 688×328 banner assets.
 * Name overlaid in the center. Edit overlay (plan B) on top of the image.
 * White border, more saturated when in edit mode (selected).
 */
function AreaCard({
  area,
  form,
  isEditing,
  onEdit,
  onSave,
  onFormChange,
  imageB64,
}: {
  area: ExplorationArea;
  form: AreaFormState;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onFormChange: (next: AreaFormState) => void;
  imageB64: string | null;
}) {
  return (
    <div
      className={`
        relative rounded-xl border-2 transition-all w-full
        shadow-[0_0_10px_rgba(226,232,240,0.06)]
        ${isEditing
          ? 'border-white shadow-lg shadow-white/20 overflow-visible'
          : 'border-white/20 overflow-hidden'}
      `}
      style={isEditing ? {} : { aspectRatio: '688 / 328' }}
    >
      {/* Background */}
      {imageB64 ? (
        <img
          src={`data:image/webp;base64,${imageB64}`}
          alt={area.area_name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-800/80" />
      )}

      {/* Base scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* ── View state ── */}
      {!isEditing && (
        <>
          {/* Name — center */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-3 text-center pointer-events-none">
            <span
              className="text-white font-bold text-sm leading-tight line-clamp-2"
              style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
            >
              {area.area_name}
            </span>
          </div>

          {/* Progress bar + % — bottom strip */}
          <div className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between mb-1">
              <span className="text-yellow-400 font-bold text-xs">{form.exploration_percent}%</span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-600 h-full transition-all duration-300"
                style={{ width: `${form.exploration_percent}%` }}
              />
            </div>
            {form.notes && (
              <p className="text-xs text-slate-300 italic mt-1 line-clamp-1">{form.notes}</p>
            )}
          </div>

          {/* Edit button — top-right */}
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 p-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded shadow"
          >
            <Edit2 className="w-3 h-3 text-white" />
          </button>
        </>
      )}

      {/* ── Edit overlay (plan B) ── */}
      {isEditing && (
        <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-xl flex flex-col gap-3 p-3">
          <div className="space-y-2">
            <p className="text-white font-bold text-xs truncate">{area.area_name}</p>
            <div>
              <label className="text-xs text-slate-300">Exploration %</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={form.exploration_percent}
                onChange={e =>
                  onFormChange({
                    ...form,
                    exploration_percent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-700 border border-slate-500 rounded px-2 py-1 text-sm mt-1 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <textarea
              value={form.notes}
              onChange={e => onFormChange({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-500 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-yellow-500 resize-none"
              rows={2}
              placeholder="Notes..."
            />
          </div>
          <button
            onClick={onSave}
            className="self-end p-1.5 bg-green-500 hover:bg-green-600 rounded shadow"
          >
            <Check className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ExplorationTab({
  segments,
  onUpdate,
}: {
  segments: ExplorationSegment[];
  onUpdate: () => void;
}) {
  const { getAsset } = useAssets();

  // Selection state
  const [selectedSegment, setSelectedSegment] = useState<ExplorationSegment | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ExplorationRegion | null>(null);

  // Data fetched on demand
  const [regions, setRegions] = useState<ExplorationRegion[]>([]);
  const [areas, setAreas] = useState<ExplorationArea[]>([]);

  // Image caches — keyed by asset_filename
  const [segmentImages, setSegmentImages] = useState<Record<string, string | null>>({});
  const [areaImages, setAreaImages] = useState<Record<string, string | null>>({});

  // Edit state
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [areaForms, setAreaForms] = useState<Record<number, AreaFormState>>({});

  // ── Load segment images on mount ─────────────────────────────────────────
  useEffect(() => {
    segments.forEach(seg => {
      if (!seg.asset_filename) return;
      if (seg.asset_filename in segmentImages) return;
      getAsset('exploration', seg.asset_filename).then(b64 => {
        setSegmentImages(prev => ({ ...prev, [seg.asset_filename!]: b64 }));
      });
    });
  }, [segments]);

  // ── Load areas by parent id (region or segment) ───────────────────────────
  const loadAreas = useCallback(async (parentId: number) => {
    try {
      const data = await safeInvoke('get_exploration_areas', { parentId }) as ExplorationArea[];
      setAreas(data);

      const forms: Record<number, AreaFormState> = {};
      data.forEach(a => {
        forms[a.id] = {
          exploration_percent: a.exploration_percent,
          notes: a.notes ?? '',
        };
      });
      setAreaForms(forms);

      data.forEach(area => {
        if (!area.asset_filename) return;
        if (area.asset_filename in areaImages) return;
        getAsset('exploration', area.asset_filename).then(b64 => {
          setAreaImages(prev => ({ ...prev, [area.asset_filename!]: b64 }));
        });
      });
    } catch (err) {
      console.error('Error loading areas:', err);
    }
  }, [areaImages, getAsset]);

  // ── When a segment is selected: fetch regions (or load flat areas) ────────
  useEffect(() => {
    setSelectedRegion(null);
    setRegions([]);
    setAreas([]);
    setEditingAreaId(null);
    if (!selectedSegment) return;

    if (selectedSegment.is_flat) {
      // Flat segment: areas hang directly off the segment — skip region fetch
      loadAreas(selectedSegment.id);
    } else {
      safeInvoke('get_exploration_regions', { segmentId: selectedSegment.id })
        .then(data => setRegions(data as ExplorationRegion[]))
        .catch(err => console.error('Error loading regions:', err));
    }
  }, [selectedSegment]);

  // ── When a region is selected: fetch its areas ────────────────────────────
  useEffect(() => {
    setAreas([]);
    setEditingAreaId(null);
    if (!selectedRegion) return;
    loadAreas(selectedRegion.id);
  }, [selectedRegion]);

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSaveArea = async (area: ExplorationArea) => {
    try {
      const form = areaForms[area.id];
      await safeInvoke('update_exploration_area', {
        id: area.id,
        explorationPercent: form.exploration_percent,
        notes: form.notes || null,
      });
      setEditingAreaId(null);
      onUpdate();
      // Reload areas using the correct parent: region (nested) or segment (flat)
      const parentId = selectedRegion ? selectedRegion.id : selectedSegment?.id;
      if (parentId !== undefined) loadAreas(parentId);
    } catch (err) {
      alert('Failed to update area: ' + err);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleSegmentClick = (seg: ExplorationSegment) => {
    setSelectedSegment(prev => (prev?.id === seg.id ? null : seg));
  };

  const handleRegionClick = (region: ExplorationRegion) => {
    setSelectedRegion(prev => (prev?.id === region.id ? null : region));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Segment cards (top row) ──────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(segments.length, 6)}, 6rem)` }}>
          {segments.map(seg => (
            <SegmentCard
              key={seg.id}
              segment={seg}
              imageB64={seg.asset_filename ? (segmentImages[seg.asset_filename] ?? null) : null}
              selected={selectedSegment?.id === seg.id}
              onClick={() => handleSegmentClick(seg)}
            />
          ))}
        </div>
      </div>

      {/* ── Content area below segments ──────────────────────────────────── */}
      {selectedSegment && (
        <>
          {/* ── Flat segment: full-width area grid ── */}
          {selectedSegment.is_flat && (
            <AreaGrid
              areas={areas}
              areaForms={areaForms}
              areaImages={areaImages}
              editingAreaId={editingAreaId}
              setEditingAreaId={setEditingAreaId}
              setAreaForms={setAreaForms}
              onSave={handleSaveArea}
            />
          )}

          {/* ── Nested segment: region row + area grid ── */}
          {!selectedSegment.is_flat && (
            <div className="flex flex-col gap-4">

              {/* Region row — centered, wraps naturally if many regions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {regions.map(region => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionClick(region)}
                    className={`
                      text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium
                      ${selectedRegion?.id === region.id
                        ? 'bg-slate-700/80 border-white text-white shadow shadow-white/10'
                        : 'bg-slate-900/50 border-white/30 text-slate-300 hover:border-white/60 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 shrink-0 opacity-60" />
                      <span>{region.region_name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Area grid — full width */}
              <div className="min-w-0">
                {selectedRegion && areas.length > 0 ? (
                  <AreaGrid
                    areas={areas}
                    areaForms={areaForms}
                    areaImages={areaImages}
                    editingAreaId={editingAreaId}
                    setEditingAreaId={setEditingAreaId}
                    setAreaForms={setAreaForms}
                    onSave={handleSaveArea}
                  />
                ) : selectedRegion ? (
                  <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                    No areas found for this region.
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                    Select a region to view its areas.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared area grid — used by both flat and nested layouts
// ---------------------------------------------------------------------------

function AreaGrid({
  areas,
  areaForms,
  areaImages,
  editingAreaId,
  setEditingAreaId,
  setAreaForms,
  onSave,
}: {
  areas: ExplorationArea[];
  areaForms: Record<number, AreaFormState>;
  areaImages: Record<string, string | null>;
  editingAreaId: number | null;
  setEditingAreaId: (id: number | null) => void;
  setAreaForms: React.Dispatch<React.SetStateAction<Record<number, AreaFormState>>>;
  onSave: (area: ExplorationArea) => void;
}) {
  if (areas.length === 0) return null;

  return (
    // Responsive: 1 col base → 2 on sm → 3 on lg → 4 on xl
    // Area cards are wide (688×328), so fewer columns than segment cards
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {areas.map(area => {
        const form = areaForms[area.id] ?? {
          exploration_percent: area.exploration_percent,
          notes: area.notes ?? '',
        };
        return (
          <AreaCard
            key={area.id}
            area={area}
            form={form}
            isEditing={editingAreaId === area.id}
            imageB64={area.asset_filename ? (areaImages[area.asset_filename] ?? null) : null}
            onEdit={() => setEditingAreaId(area.id)}
            onSave={() => onSave(area)}
            onFormChange={next =>
              setAreaForms(prev => ({ ...prev, [area.id]: next }))
            }
          />
        );
      })}
    </div>
  );
}