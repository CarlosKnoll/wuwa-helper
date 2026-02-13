import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { PortalDropdownOption, DropPos } from '../types';
import { PortalDropdownProps, CharacterDropdownProps } from '../props';

function usePortalPos(
  open: boolean,
  inputRef: React.RefObject<HTMLElement>,
  itemCount: number,
): DropPos | null {
  const [pos, setPos] = useState<DropPos | null>(null);

  const compute = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    const width = Math.max(r.width, 220);
    const gap = 4;
    const estHeight = Math.min((itemCount + 1) * 28, 176);
    const flipUp = window.innerHeight - r.bottom < estHeight && r.top > window.innerHeight - r.bottom;
    setPos({
      top: flipUp ? r.top - estHeight - gap : r.bottom + gap,
      left: r.left,
      width,
    });
  };

  // Sync immediately on open or when item count changes (avoids paint-delay)
  useLayoutEffect(() => {
    if (open) compute();
  }, [open, itemCount]);

  // Stay fresh while open (scroll / resize)
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open]);

  return pos;
}

export function PortalDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  clearLabel,
  emptyMessage = 'No options found.',
  className = '',
  disabled = false,
  loading = false,
  showChevron = false,
  closeImmediatelyOnInputTab = false,
}: PortalDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const pos = usePortalPos(open, inputRef, filtered.length);

  // Display label for the current value
  const displayLabel = options.find(o => o.value === value)?.label ?? value ?? '';

  const close = () => { setOpen(false); setSearch(''); };

  const handleSelect = (opt: PortalDropdownOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    close();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? search : displayLabel}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
          // Propagate exact matches in real time so callers get live feedback
          const exact = options.find(o => o.label.toLowerCase() === e.target.value.toLowerCase());
          if (exact && !exact.disabled) onChange(exact.value);
          else if (!e.target.value.trim()) onChange('');
        }}
        onFocus={() => {
          if (disabled || loading) return;
          setSearch(displayLabel);
          setOpen(true);
        }}
        onBlur={(e) => {
          if (closeImmediatelyOnInputTab && (e.relatedTarget as HTMLElement)?.tagName === 'INPUT') {
            close();
          } else {
            setTimeout(close, 200);
          }
        }}
        disabled={disabled || loading}
        placeholder={loading ? 'Loading…' : placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-yellow-500 ${showChevron ? 'pr-7' : ''} ${className}`}
        autoComplete="off"
      />
      {showChevron && (
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
          disabled={disabled || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      )}

      {open && pos && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {clearLabel !== undefined && (
            <button
              onMouseDown={() => { onChange(''); close(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-700 transition-colors"
            >
              {clearLabel}
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 text-xs">{emptyMessage}</div>
          ) : (
            filtered.map((opt, i) => (
              <button
                key={`${opt.value}-${i}`}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                disabled={opt.disabled}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  opt.disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : opt.dim
                    ? 'hover:bg-slate-700/50 text-slate-400'
                    : 'hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.badge ? (
                  <span className={`ml-2 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${opt.badge.className}`}>
                    {opt.badge.text}
                  </span>
                ) : opt.meta ? (
                  <span className="ml-2 flex-shrink-0 text-slate-400 text-[10px]">{opt.meta}</span>
                ) : null}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function CharacterDropdown({
  value,
  onChange,
  availableCharacters,
  placeholder = 'Select character',
  className = '',
  disabled = false,
  vigorConfig,
}: CharacterDropdownProps) {
  // Deduplicate Rover variants into a single display entry per element
  const roverVariants = availableCharacters.filter(c => c.startsWith('Rover'));
  const nonRoverChars  = availableCharacters.filter(c => !c.startsWith('Rover'));

  const processedChars: Array<{ display: string; actual: string; isRover: boolean }> = [];
  const seenRover = new Set<string>();

  nonRoverChars.forEach(c => processedChars.push({ display: c, actual: c, isRover: false }));
  roverVariants.forEach(rover => {
    const el = rover.replace('Rover', '').trim()
      .replace(/^-\s*/, '').replace(/^\(\s*/, '').replace(/\s*\)$/, '');
    const display = el ? `Rover (${el})` : 'Rover';
    if (!seenRover.has(display)) {
      seenRover.add(display);
      processedChars.push({ display, actual: rover, isRover: true });
    }
  });

  const getVigorRemaining = (charObj: { actual: string; isRover: boolean }): number | null => {
    if (!vigorConfig) return null;
    if (charObj.isRover) {
      const consumed = roverVariants.reduce(
        (sum, rv) => sum + (vigorConfig.vigorConsumedMap[rv] || 0), 0
      );
      return vigorConfig.getMaxVigor(charObj.actual) - consumed;
    }
    return vigorConfig.getMaxVigor(charObj.actual) - (vigorConfig.vigorConsumedMap[charObj.actual] || 0);
  };

  const options: PortalDropdownOption[] = processedChars.map(charObj => {
    const vigorRemaining = getVigorRemaining(charObj);
    const depleted = vigorRemaining !== null && vigorRemaining <= 0;
    const canUse = vigorRemaining === null || vigorRemaining >= (vigorConfig?.vigorCost ?? 0);

    let badge: PortalDropdownOption['badge'] | undefined;
    if (vigorRemaining !== null && vigorConfig) {
      badge = {
        text: `${vigorRemaining}/${vigorConfig.getMaxVigor(charObj.actual)}`,
        className: depleted
          ? 'bg-red-500/30 text-red-500'
          : !canUse
          ? 'bg-orange-500/30 text-orange-400'
          : 'bg-slate-600 text-slate-400',
      };
    }

    return {
      label: charObj.display,
      value: charObj.actual,
      disabled: depleted,
      dim: !depleted && !canUse,
      badge,
    };
  });

  return (
    <PortalDropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      clearLabel="— None —"
      className={`bg-slate-700 border-slate-600 focus:border-yellow-500 ${className}`}
      disabled={disabled}
      closeImmediatelyOnInputTab
    />
  );
}