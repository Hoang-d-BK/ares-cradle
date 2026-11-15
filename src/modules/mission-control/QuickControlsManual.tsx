import React, { useRef } from 'react';
import { useExplorationDialog } from './useExplorationDialog';
import { Eye, Keyboard, MousePointer2, Package, ScanSearch, X } from 'lucide-react';
import type { SceneReadiness } from '@/modules/outpost-3d/sceneReadiness';

export interface QuickControlsManualProps {
  isOpen: boolean;
  onStart: () => void;
  onClose: () => void;
  sceneReadiness?: SceneReadiness;
}

export const QuickControlsManual: React.FC<QuickControlsManualProps> = ({ isOpen, onStart, onClose, sceneReadiness = 'idle' }) => {
  const readinessText = sceneReadiness === 'ready'
    ? 'First scene frame observed. Loading may continue.'
    : sceneReadiness === 'limited'
      ? '3D view unavailable. You can still start exploring.'
      : '3D scene preparing. Start exploring is available.';
  const readinessLabel = sceneReadiness === 'ready' ? 'Scene frame observed' : sceneReadiness === 'limited' ? 'Limited view' : 'Preparing scene';
  const dialogRef = useRef<HTMLElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  useExplorationDialog(isOpen, onClose, dialogRef, startRef);
  if (!isOpen) return null;

  const control = (icon: React.ReactNode, title: string, description: string) => (
    <div className="flex items-start gap-3 border-b border-white/10 py-3 last:border-0">
      <span aria-hidden="true" className="mt-0.5 text-amber-200">{icon}</span>
      <div><h3 className="text-sm font-semibold text-[#f4e2d2]">{title}</h3><p className="mt-0.5 text-sm leading-relaxed text-[#dfcfc1]">{description}</p></div>
    </div>
  );

  return <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-[#080a0b]/85 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="exploration-manual-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col rounded-xl border border-amber-200/30 bg-[#171a1c] p-5 text-white shadow-[0_12px_36px_rgba(0,0,0,.55)] sm:p-6">
      <header className="mb-2 flex shrink-0 items-start justify-between gap-4">
        <div className="flex items-start gap-3"><svg aria-hidden="true" viewBox="0 0 96 64" className="h-16 w-24 shrink-0 text-amber-200"><path d="M2 54h92M9 54c7-15 13-18 20-10 7-22 15-27 23-10 8 11 17 13 25 5 6-5 11-4 17 3" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M9 54h85" fill="none" stroke="currentColor" strokeOpacity=".45" strokeDasharray="2 4"/><circle cx="52" cy="34" r="2.5" fill="currentColor"/></svg><div><h2 id="exploration-manual-title" className="text-xl font-semibold tracking-tight text-[#f3e1d1]">A field guide to moving around</h2><p className="mt-1 text-sm text-[#cbb7a6]">Leave the screens behind. The landscape is the interface.</p></div></div>
        <button type="button" onClick={onClose} aria-label="Close controls and help" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><X className="h-5 w-5" /></button>
      </header>
      <div className="mb-3 flex shrink-0 items-center gap-3 border-y border-white/10 py-2" aria-live="polite" data-scene-readiness={sceneReadiness}>
        <span className={`h-2.5 w-2.5 rounded-full ${sceneReadiness === 'ready' ? 'bg-emerald-300' : sceneReadiness === 'limited' ? 'bg-amber-300' : 'bg-[#cbb7a6]'}`} aria-hidden="true" />
        <div><p className="text-base font-semibold text-[#f3e1d1]">{readinessLabel}</p><p className="text-sm text-[#cbb7a6]">{readinessText}</p></div>
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        {control(<Keyboard className="h-5 w-5" />, 'W A S D', 'Walk across the terrain. Hold Shift to sprint; press Space to jump, and Space again in the air for a short EVA boost.')}
        {control(<MousePointer2 className="h-5 w-5" />, 'Look around', 'Drag the scene with the mouse to orbit around your astronaut or remote rover. Touch players can drag to look around. The camera follows from behind without moving your character.')}
        {control(<ScanSearch className="h-5 w-5" />, 'Inspect the field', 'Walk close to a marked scientific feature and press F to inspect it. Discoveries are recorded in your codex.')}
        {control(<Eye className="h-5 w-5" />, 'Remote rover', 'At a rover relay in a regional field, press R to drive the rover remotely. W/S move, A/D steer, and release the keys to stop. Drag to orbit the rover camera; remote viewing does not teleport you.')}
        {control(<Package className="h-5 w-5" />, 'Field tools', 'Open your backpack with E, map with M, and science codex with G. Use the buttons on screen whenever you need a reminder.')}
      </div>
      <footer className="mt-4 flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="min-h-12 rounded-lg border border-white/20 px-4 text-sm text-[#e5d4c5] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Back to the field</button>
        <button type="button" onClick={onStart} className="min-h-12 rounded-lg border border-amber-200/45 bg-[#8b4d2b] px-5 text-sm font-semibold text-[#fff4e9] shadow-[0_3px_12px_rgba(0,0,0,.28)] hover:bg-[#a45e35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Start exploring</button>
      </footer>
    </section>
  </div>;
};

export default QuickControlsManual;
