import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SectionHeaderProps, SearchHeaderProps } from '../props';


export default function SectionHeader({
  icon,
  title,
  subtitle,
  collapsed = false,
  onToggleCollapse,
  actions,
  collapsible = false,
  color = 'text-purple-400',
}: SectionHeaderProps) {
  const CollapseButton = collapsible && onToggleCollapse ? (
    <button
      onClick={onToggleCollapse}
      className="p-1 hover:bg-slate-700 rounded transition-colors"
      title={collapsed ? 'Expand' : 'Collapse'}
    >
      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
    </button>
  ) : null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className={color}>{icon}</div>}
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {CollapseButton}
      </div>
    </div>
  );
}
// ─── SearchHeader ─────────────────────────────────────────────────────────────
// A search input paired with optional action buttons. Use this wherever a tab
// needs a filter bar and a primary action (e.g. "Add") in a single row.

export function SearchHeader({
  value,
  onChange,
  placeholder = 'Search...',
  actions,
}: SearchHeaderProps) {
  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/[0.4] rounded-lg focus:outline-none focus:border-yellow-400"
        />
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}