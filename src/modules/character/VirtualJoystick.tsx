import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

interface VirtualJoystickProps {
  className?: string;
}

/**
 * Task 12.2: Virtual Joystick for Touch Screens (Chromebooks, iPads, Mobile)
 * Hallmark-compliant design token styling with 60 FPS responsive input dispatch.
 * Also supports pointer/mouse dragging for automated headless testing.
 */
export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ className = '' }) => {
  const setJoystickVector = useOutpostStore((state) => state.setJoystickVector);

  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 45; // Max radius in px

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsActive(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || e.pointerId !== activePointerId.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
      setJoystickVector({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(distance, maxRadius);
    const normX = (deltaX / distance) * (clampedDist / maxRadius);
    const normY = (deltaY / distance) * (clampedDist / maxRadius);

    setKnobPos({
      x: normX * maxRadius,
      y: normY * maxRadius
    });

    // In 3D space: X is sideways, Y on screen maps to Z in 3D (forward/backward)
    setJoystickVector({
      x: normX,
      y: normY
    });
  }, [isActive, setJoystickVector]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId === activePointerId.current) {
      activePointerId.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      setJoystickVector({ x: 0, y: 0 });
    }
  }, [setJoystickVector]);

  // Clean up if window loses focus
  useEffect(() => {
    const handleWindowBlur = () => {
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      setJoystickVector({ x: 0, y: 0 });
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [setJoystickVector]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`relative w-28 h-28 rounded-full border-2 transition-colors select-none cursor-pointer flex items-center justify-center ${
        isActive
          ? 'border-mars-cyan bg-slate-900/80 shadow-[0_0_16px_rgba(0,240,255,0.4)]'
          : 'border-slate-700/60 bg-slate-950/40 hover:border-slate-500'
      } ${className}`}
      aria-label="Virtual Navigation Joystick"
      data-testid="virtual-joystick"
    >
      {/* Direction Crosshairs */}
      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/40 pointer-events-none" />
      <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 w-[1px] bg-slate-700/40 pointer-events-none" />

      {/* Center Tactile Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out'
        }}
        className={`w-12 h-12 rounded-full border flex items-center justify-center pointer-events-none ${
          isActive
            ? 'bg-mars-cyan border-white shadow-[0_0_12px_#00F0FF]'
            : 'bg-slate-800/80 border-slate-600 shadow-md'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full ${
            isActive ? 'bg-slate-950' : 'bg-mars-cyan/60'
          }`}
        />
      </div>
    </div>
  );
};

export default VirtualJoystick;
