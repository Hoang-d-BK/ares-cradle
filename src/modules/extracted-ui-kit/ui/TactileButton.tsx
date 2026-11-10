import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface TactileButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'hazard' | 'cyan' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  magnetic?: boolean;
  shimmer?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  onSoundTrigger?: () => void;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  magnetic = true,
  shimmer = true,
  fullWidth = false,
  disabled = false,
  className = '',
  onSoundTrigger,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.18;
    const deltaY = (e.clientY - centerY) * 0.18;
    setMagneticPos({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setMagneticPos({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;

    if (onSoundTrigger) {
      onSoundTrigger();
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple: Ripple = { x, y, id: Date.now() };

    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onClick) {
      onClick(e);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold shadow-[0_0_15px_rgba(255,126,41,0.35)] border border-amber-300/40',
    secondary:
      'bg-gray-900/80 hover:bg-gray-800 text-gray-100 border border-gray-700/60 hover:border-gray-500',
    hazard:
      'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400/40',
    cyan:
      'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)] border border-cyan-300/40',
    glass:
      'bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-lg',
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={disabled}
      animate={{ x: magneticPos.x, y: magneticPos.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`relative overflow-hidden inline-flex items-center justify-center font-mono tracking-wide transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Shimmer sweep effect */}
      {shimmer && !disabled && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
      )}

      {/* Click ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/40 pointer-events-none animate-ping"
          style={{
            left: ripple.x - 12,
            top: ripple.y - 12,
            width: 24,
            height: 24,
          }}
        />
      ))}

      {icon && <span className="relative z-10 shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default TactileButton;
