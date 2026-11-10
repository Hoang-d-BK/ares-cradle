import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface CosmicNavbarProps {
  items: NavItem[];
  title?: string;
  badge?: string;
  className?: string;
}

export const CosmicNavbar: React.FC<CosmicNavbarProps> = ({
  items,
  title = 'ARES CRADLE',
  badge = 'v3.0 NASA SPEC',
  className = '',
}) => {
  return (
    <nav
      className={`w-full flex items-center justify-between px-6 py-3.5 bg-gray-950/80 backdrop-blur-xl border-b border-amber-500/20 text-gray-200 font-mono text-xs z-40 select-none ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-black font-bold shadow-[0_0_12px_rgba(255,126,41,0.4)]">
          🚀
        </div>
        <div>
          <span className="font-bold tracking-wider text-sm text-white">{title}</span>
          <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded">
            {badge}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              item.active
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(255,126,41,0.25)] font-bold'
                : 'border-transparent hover:border-gray-800 hover:bg-gray-900/60 text-gray-400 hover:text-gray-200'
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default CosmicNavbar;
