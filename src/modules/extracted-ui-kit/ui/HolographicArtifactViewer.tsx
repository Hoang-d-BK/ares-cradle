import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface ArtifactSpecimen {
  id: string;
  name: string;
  category: 'mineral' | 'ice' | 'atmosphere' | 'food';
  icon: string;
  discoverySol: number;
  missionLore: string;
  refinementYield: string;
  purityScore: number;
}

export interface HolographicArtifactViewerProps {
  artifact: ArtifactSpecimen;
  className?: string;
  onInspect?: (artifact: ArtifactSpecimen) => void;
  onSoundTrigger?: () => void;
}

const CATEGORY_THEMES = {
  mineral: {
    accent: '#FF7E29',
    glow: 'rgba(255, 126, 41, 0.45)',
    border: 'border-amber-500/50',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    label: 'MINERAL REGOLITH',
  },
  ice: {
    accent: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.45)',
    border: 'border-cyan-500/50',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    label: 'PERMAFROST ICE CORE',
  },
  atmosphere: {
    accent: '#A78BFA',
    glow: 'rgba(167, 139, 250, 0.45)',
    border: 'border-purple-500/50',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    label: 'MOXIE CO2 GAS',
  },
  food: {
    accent: '#10B981',
    glow: 'rgba(16, 185, 129, 0.45)',
    border: 'border-emerald-500/50',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    label: 'BIO-DOME CROPS',
  },
};

/**
 * 2.5D Tactile Holographic Artifact Viewer
 * Pure CSS perspective & scanlines (Zero WebGL overhead, 0% Context Loss on Chromebooks).
 */
export const HolographicArtifactViewer: React.FC<HolographicArtifactViewerProps> = ({
  artifact,
  className = '',
  onInspect,
  onSoundTrigger,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const theme = CATEGORY_THEMES[artifact.category] || CATEGORY_THEMES.mineral;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setRotate({ x: -y * 12, y: x * 12 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (onSoundTrigger) onSoundTrigger();
    if (onInspect) onInspect(artifact);
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className={`inline-block select-none cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: `0 12px 36px 0 ${theme.glow}`,
        }}
        className={`relative w-72 sm:w-80 rounded-2xl p-5 bg-gray-950/90 backdrop-blur-xl border ${theme.border} text-gray-100 overflow-hidden font-mono`}
      >
        {/* Animated Laser Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%]" />
        
        {/* Moving Laser Beam */}
        <motion.div
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 pointer-events-none z-20"
        />

        {/* Header Tags */}
        <div className="flex items-center justify-between mb-4 relative z-20">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider ${theme.badge}`}>
            {theme.label}
          </span>
          <span className="text-[11px] text-gray-400">SOL {artifact.discoverySol}</span>
        </div>

        {/* 3D Floating Icon Chamber */}
        <div
          style={{ transform: 'translateZ(30px)' }}
          className="w-full h-32 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center relative mb-4 overflow-hidden"
        >
          {/* Radial Backlight */}
          <div
            className="absolute inset-0 opacity-40 blur-xl pointer-events-none"
            style={{ background: theme.accent }}
          />
          <motion.div
            animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            {artifact.icon}
          </motion.div>
        </div>

        {/* Specimen Description */}
        <div style={{ transform: 'translateZ(20px)' }} className="space-y-2 relative z-20">
          <h3 className="font-bold text-base text-white tracking-wide">{artifact.name}</h3>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-sans">
            {artifact.missionLore}
          </p>

          {/* Refinement Conversion Yield */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Bio-Dome Yield:</span>
            <span className="font-bold text-amber-300">{artifact.refinementYield}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Purity Rating:</span>
            <div className="flex items-center gap-1 font-bold text-cyan-400">
              <span>{artifact.purityScore}%</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HolographicArtifactViewer;
