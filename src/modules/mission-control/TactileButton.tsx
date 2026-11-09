import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '@/modules/audio/soundEngine';

export interface TactileButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'rust' | 'amber' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  shimmer?: boolean;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  audioFrequency?: number;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-gradient-to-b from-[#242D3F] to-[#171E2B] border-mars-border-bright text-slate-100 hover:border-mars-cyan hover:text-white',
  rust: 'btn-tactile-rust border-mars-rust text-white hover:border-[#FFA07A]',
  amber: 'bg-gradient-to-b from-amber-900/60 to-amber-950/80 border-mars-amber/50 text-amber-200 hover:border-mars-amber shadow-[0_0_8px_rgba(255,176,32,0.2)]',
  ghost: 'bg-transparent border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-white',
  outline: 'bg-slate-950/80 border-mars-border text-slate-300 hover:border-mars-cyan/60 hover:text-white'
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2.5 py-1 text-[11px] gap-1.5',
  md: 'px-3.5 py-2 text-xs gap-2',
  lg: 'px-4.5 py-2.5 text-sm gap-2.5'
};

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  magnetic = true,
  shimmer = true,
  disabled = false,
  loading = false,
  active = false,
  className = '',
  title,
  icon,
  audioFrequency = 1100
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || disabled || loading) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;

    setMagneticPos({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setMagneticPos({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple: Ripple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 550);
    }

    soundEngine.playClick(audioFrequency);
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      ref={buttonRef}
      title={title}
      disabled={disabled || loading}
      data-loading={loading}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: magneticPos.x,
        y: magneticPos.y
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 20,
        mass: 0.5
      }}
      whileTap={{ scale: 0.96 }}
      className={`btn-tactile relative overflow-hidden rounded inline-flex items-center justify-center font-display font-bold tracking-wider select-none border transition-[border-color,color,box-shadow] duration-150 ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${
        active ? 'border-mars-cyan text-white shadow-[0_0_12px_rgba(0,240,255,0.35)]' : ''
      } ${className}`}
    >
      {/* Apple-style Skew Shimmer Sweep Layer */}
      {shimmer && (
        <span className="tactile-shimmer-wrapper">
          <span className="tactile-shimmer-streak" />
        </span>
      )}

      {/* Tactile Click Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="tactile-ripple-wave"
          style={{
            left: ripple.x - 24,
            top: ripple.y - 24,
            width: 48,
            height: 48
          }}
        />
      ))}

      {/* Button Content */}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default TactileButton;
