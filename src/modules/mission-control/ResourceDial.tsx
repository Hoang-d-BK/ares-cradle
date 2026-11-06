import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export type ResourceStatus = 'safe' | 'warning' | 'critical';

export interface ResourceDialProps {
  label: string;
  value: number;
  displayValue: string;
  unit: string;
  subtext?: string;
  percentage: number; // 0 to 100 for arc fill
  status: ResourceStatus;
  icon: LucideIcon;
  trend?: 'rising' | 'falling' | 'stable';
}

const statusColors: Record<ResourceStatus, { text: string; bg: string; stroke: string; glow: string; badge: string }> = {
  safe: {
    text: 'text-mars-emerald',
    bg: 'bg-mars-emerald/10',
    stroke: '#10B981',
    glow: 'rgba(16, 185, 129, 0.4)',
    badge: 'NOMINAL'
  },
  warning: {
    text: 'text-mars-amber',
    bg: 'bg-mars-amber/10',
    stroke: '#FFB020',
    glow: 'rgba(255, 176, 32, 0.4)',
    badge: 'CAUTION'
  },
  critical: {
    text: 'text-mars-crimson',
    bg: 'bg-mars-crimson/10',
    stroke: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.6)',
    badge: 'CRITICAL'
  }
};

export const ResourceDial: React.FC<ResourceDialProps> = ({
  label,
  displayValue,
  unit,
  subtext,
  percentage,
  status,
  icon: Icon
}) => {
  const currentStatus = statusColors[status] || statusColors.safe;
  const clampedPercent = Math.max(0, Math.min(100, percentage));

  // Circular gauge arc parameters
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  // Arc angle spans 240 degrees (leaving bottom 120 open)
  const arcLength = circumference * 0.72;
  const strokeDashoffset = arcLength - (arcLength * clampedPercent) / 100;

  return (
    <div className="relative flex flex-col items-center justify-between p-2 sm:p-3.5 bg-slate-900/60 border border-mars-border rounded-sm hover:border-mars-border-bright transition-colors select-none">
      {/* Top Header: Label & Status Indicator */}
      <div className="w-full flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1 sm:gap-1.5 text-slate-300">
          <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${currentStatus.text}`} />
          <span className="text-[9px] sm:text-[11px] font-display font-bold tracking-wider uppercase text-slate-200 truncate">
            {label}
          </span>
        </div>
        <span
          className={`text-[8px] sm:text-[9px] font-mono font-semibold px-1 sm:px-1.5 py-0.5 rounded ${currentStatus.bg} ${currentStatus.text} border border-current/20`}
        >
          {currentStatus.badge}
        </span>
      </div>

      {/* Center: Tactile Circular Arc Gauge */}
      <div className="relative w-18 h-18 sm:w-24 sm:h-24 flex items-center justify-center my-0.5">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 88 88">
          {/* Background Track Arc */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#1E293B"
            strokeWidth="5.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated Active Gauge Arc */}
          <motion.circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={currentStatus.stroke}
            strokeWidth="5.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{
              type: 'spring',
              stiffness: 140,
              damping: 20
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${currentStatus.glow})`
            }}
          />
        </svg>

        {/* Center Numerical Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono text-base sm:text-xl font-bold tracking-tight text-slate-100">
              {displayValue}
            </span>
            <span className="font-mono text-[9px] sm:text-[10px] text-slate-400">{unit}</span>
          </div>
        </div>
      </div>

      {/* Bottom Subtext */}
      {subtext && (
        <div className="w-full text-center mt-0.5 sm:mt-1 pt-1 sm:pt-1.5 border-t border-slate-800/80">
          <span className="text-[8px] sm:text-[10px] font-mono text-slate-400 tracking-wider truncate block">
            {subtext}
          </span>
        </div>
      )}
    </div>
  );
};

export default ResourceDial;
