import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface TactileResourceDialProps {
  label: string;
  subLabel?: string;
  value: number; // 0 to 100
  onChange: (value: number) => void;
  unit?: string;
  icon?: string;
  step?: number;
  disabled?: boolean;
  className?: string;
  onSoundClick?: () => void;
}

/**
 * Tactile Resource Dial for Elementary & Middle School Cadets
 * Visualizes the 2-Resource Engineering Trade-off (Power vs. O2/Heat)
 * Dual-Mode: Circular touch/mouse drag + Big Tactile [-] / [+] Stepper Buttons.
 */
export const TactileResourceDial: React.FC<TactileResourceDialProps> = ({
  label,
  subLabel = 'Allocation',
  value,
  onChange,
  unit = '%',
  icon = '⚡',
  step = 5,
  disabled = false,
  className = '',
  onSoundClick,
}) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // SVG parameters
  const size = 160;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Arc angle (270 degrees arc from 135deg to 405deg)
  const arcLength = circumference * 0.75;
  const progressOffset = arcLength - (value / 100) * arcLength;

  // Dynamic Color Shifting
  const getColor = (val: number) => {
    if (val <= 20) return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)', status: 'CRITICAL DRAIN' };
    if (val <= 45) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', status: 'CAUTION DRAIN' };
    return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', status: 'OPTIMAL STABLE' };
  };

  const statusInfo = getColor(value);

  const handleStep = (delta: number) => {
    if (disabled) return;
    if (onSoundClick) onSoundClick();
    const nextVal = Math.min(100, Math.max(0, value + delta));
    onChange(nextVal);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateFromPointer(e);
  };

  const updateFromPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Angle in degrees from top
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Map 45deg to 315deg (270 deg range)
    let percent = 0;
    if (angle >= 45 && angle <= 315) {
      percent = ((angle - 45) / 270) * 100;
    } else if (angle > 315) {
      percent = 100;
    } else {
      percent = 0;
    }

    const rounded = Math.round(percent / step) * step;
    const finalVal = Math.min(100, Math.max(0, rounded));
    if (finalVal !== value) {
      if (onSoundClick) onSoundClick();
      onChange(finalVal);
    }
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (isDragging) updateFromPointer(e);
    };
    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, value]);

  return (
    <div
      className={`p-5 rounded-2xl bg-gray-950/85 backdrop-blur-xl border border-gray-800 shadow-xl flex flex-col items-center select-none font-mono ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">{label}</span>
      </div>

      {/* Dial SVG */}
      <div
        ref={dialRef}
        onPointerDown={handlePointerDown}
        className="relative cursor-pointer touch-none my-1"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="transform rotate-[135deg]">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1F2937"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Dynamic Fill Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={statusInfo.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.25s ease, stroke 0.25s ease',
              filter: `drop-shadow(0 0 8px ${statusInfo.glow})`,
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            key={value}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            className="text-3xl font-black text-white tracking-tighter"
          >
            {value}
            <span className="text-xs font-bold text-gray-400 ml-0.5">{unit}</span>
          </motion.span>
          <span className="text-[10px] text-gray-400 font-sans tracking-wide mt-0.5">
            {subLabel}
          </span>
        </div>
      </div>

      {/* Status Warning Tag */}
      <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: statusInfo.stroke }}>
        {statusInfo.status}
      </div>

      {/* Tactile Big Stepper Buttons */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={() => handleStep(-step)}
          disabled={disabled || value <= 0}
          className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 text-white font-bold text-lg transition-all disabled:opacity-40"
          aria-label="Decrease"
        >
          −
        </button>
        <button
          onClick={() => handleStep(step)}
          disabled={disabled || value >= 100}
          className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 text-white font-bold text-lg transition-all disabled:opacity-40"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default TactileResourceDial;
