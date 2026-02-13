import { ChevronDown, ChevronUp } from 'lucide-react';
import { SectionHeaderProps } from '../props';


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