import React, { useState, useEffect } from 'react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

import EventModal from './EventModal';
import DebriefModal from './DebriefModal';
import BackpackModal from '@/modules/survival-ui/BackpackModal';
import RewardCelebration from '@/modules/survival-ui/RewardCelebration';
import AstroBotCompanion from '@/modules/survival-ui/AstroBotCompanion';
import ClassroomModal from '@/modules/survival-ui/ClassroomModal';
import BrownoutQuizModal from '@/modules/survival-ui/BrownoutQuizModal';
import VirtualJoystick from '@/modules/character/VirtualJoystick';
import LabShowcaseModal from '@/modules/showcase/LabShowcaseModal';
import CockpitVisorHUD from '@/modules/story-engine/components/CockpitVisorHUD';
import MinimapRadar from '@/modules/story-engine/components/MinimapRadar';
import HorizontalDatapadHUD from './HorizontalDatapadHUD';
import CockpitDrivingDeck from './CockpitDrivingDeck';
import FieldSpecimenToast from '@/modules/story-engine/components/FieldSpecimenToast';
import MissionCommsBriefing from '@/modules/story-engine/components/MissionCommsBriefing';
import BioDomeLabStation from '@/modules/story-engine/components/BioDomeLabStation';
import ScienceCardModal from '@/modules/story-engine/components/ScienceCardModal';
import ChapterSelectModal from '@/modules/story-engine/components/ChapterSelectModal';
import FieldGuideModal from '@/modules/story-engine/components/FieldGuideModal';

export const MissionControlOverlay: React.FC = () => {
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [isTouchOrMobile, setIsTouchOrMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 1024 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  });

  // Detect viewport resize or touch interaction to switch between Desktop WASD and Mobile Joystick
  useEffect(() => {
    const mqlWidth = window.matchMedia('(max-width: 1023px)');
    const mqlPointer = window.matchMedia('(pointer: coarse)');

    const updateDeviceMode = () => {
      const mobileViewport = window.innerWidth < 1024 || mqlWidth.matches;
      const coarsePointer = mqlPointer.matches;
      setIsTouchOrMobile(mobileViewport || coarsePointer);
    };
    const handleTouchStart = () => {
      if (window.innerWidth < 1280) {
        setIsTouchOrMobile(true);
      }
    };

    updateDeviceMode();
    window.addEventListener('resize', updateDeviceMode);
    mqlWidth.addEventListener('change', updateDeviceMode);
    mqlPointer.addEventListener('change', updateDeviceMode);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      window.removeEventListener('resize', updateDeviceMode);
      mqlWidth.removeEventListener('change', updateDeviceMode);
      mqlPointer.removeEventListener('change', updateDeviceMode);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const isClassroomOpen = useOutpostStore((state) => state.isClassroomOpen);
  const closeClassroom = useOutpostStore((state) => state.closeClassroom);
  const isPlayerGrounded = useOutpostStore((state) => state.isPlayerGrounded);
  const isPlayerBlocked = useOutpostStore((state) => state.isPlayerBlocked);
  const blockedByLabel = useOutpostStore((state) => state.blockedByLabel);
  const standingOnLabel = useOutpostStore((state) => state.standingOnLabel);
  const playerPos = useOutpostStore((state) => state.playerPos);
  const requestJump = useOutpostStore((state) => state.requestJump);
  const isPhysicsDebugVisible = useOutpostStore((state) => state.isPhysicsDebugVisible);
  const togglePhysicsDebug = useOutpostStore((state) => state.togglePhysicsDebug);
  const isSprinting = useOutpostStore((state) => state.isSprinting);
  const thrusterEnergy = useOutpostStore((state) => state.thrusterEnergy);
  const playerSpeedMps = useOutpostStore((state) => state.playerSpeedMps);
  const airJumpsLeft = useOutpostStore((state) => state.airJumpsLeft);
  const hudColorTheme = useOutpostStore((state) => state.hudColorTheme);
  const cycleHudColorTheme = useOutpostStore((state) => state.cycleHudColorTheme);

  const themeLabels: Record<typeof hudColorTheme, string> = {
    'solar-amber': 'SOLAR AMBER',
    'cerenkov-cyan': 'CRYO CYAN',
    'biodome-emerald': 'BIO EMERALD',
    'phobos-plasma': 'PHOBOS PLASMA'
  };

  // Sync initial data-hud-theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-hud-theme', hudColorTheme);
  }, [hudColorTheme]);

  // Keyboard Shortcuts: F2 Showcase, G Codex, H HUD Collapse, B Hitboxes, T Color Theme, [1-5] Quickbar
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const isDialogActive =
        useOutpostStore.getState().isBackpackOpen ||
        Boolean(document.querySelector('[role="dialog"]'));

      if (!isDialogActive && ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        e.preventDefault();
        const slotIdx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        const slotItemId = useOutpostStore.getState().quickbarSlots[slotIdx];
        if (slotItemId) {
          useOutpostStore.getState().executeItemAction(slotItemId);
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        soundEngine.playClick(1000);
        setIsShowcaseOpen((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        soundEngine.playClick(1100);
        setIsCodexOpen((prev) => !prev);
      } else if (!isDialogActive && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        soundEngine.playClick(950);
        setIsHudCollapsed((prev) => !prev);
      } else if (!isDialogActive && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        togglePhysicsDebug();
      } else if (!isDialogActive && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        cycleHudColorTheme();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePhysicsDebug, cycleHudColorTheme]);

  const altitudeAboveGround = Math.max(0, playerPos[1] - -0.4);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 overflow-hidden z-20">
      {/* Subtle Holographic Visor Perimeter Frame (Tinted by active HUD Color Theme) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          boxShadow: 'inset 0 0 65px rgba(0,0,0,0.45)'
        }}
      >
        <div
          className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg opacity-50"
          style={{ borderColor: 'var(--hud-accent)' }}
        />
        <div
          className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg opacity-50"
          style={{ borderColor: 'var(--hud-accent)' }}
        />
        <div
          className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg opacity-50"
          style={{ borderColor: 'var(--hud-accent)' }}
        />
        <div
          className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-lg opacity-50"
          style={{ borderColor: 'var(--hud-accent)' }}
        />
      </div>

      {/* Top Command Visor */}
      {!isHudCollapsed && (
        <CockpitVisorHUD
          onOpenShowcase={() => setIsShowcaseOpen(true)}
          onOpenCodex={() => setIsCodexOpen(true)}
        />
      )}

      {/* Top-Right Scalable Minimap Radar (25m / 50m / 80m) */}
      {!isHudCollapsed && <MinimapRadar />}

      {/* Non-Overlapping Bottom Horizontal Datapad HUD with Anchored Micro-Lessons */}
      {!isHudCollapsed && <HorizontalDatapadHUD />}

      {/* On-Screen Cockpit Driving Deck (When in Rover Mode) */}
      <CockpitDrivingDeck />

      {/* Live Physics Hitbox & Bounding Box Legend Banner (When Hitboxes are ON) */}
      {isPhysicsDebugVisible && (
        <div
          data-testid="physics-hitbox-legend"
          className="fixed top-14 left-3 z-30 pointer-events-auto flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-xl hud-theme-shell font-mono text-[10px]"
        >
          <span className="font-bold text-cyan-300 uppercase tracking-wider">
            3D HITBOXES ACTIVE [B]
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />
            <span>Wall / Object Bound</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />
            <span>Blocking Collision</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />
            <span>Passable Door / Standing</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            POS: [{playerPos[0].toFixed(1)}, {playerPos[1].toFixed(2)}, {playerPos[2].toFixed(1)}]
          </span>
        </div>
      )}

      {/* Live Physics Obstacle Collision & Jump Prompt Banner */}
      {isPlayerBlocked && blockedByLabel && (
        <div
          data-testid="physics-blocked-banner"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/95 border-2 border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.35)] font-mono text-xs text-amber-200"
        >
          <span className="px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/60 text-amber-300 font-bold text-[10px]">
            OBSTACLE BLOCKED
          </span>
          <span className="font-semibold text-white">{blockedByLabel}</span>
          <button
            type="button"
            onClick={() => requestJump()}
            className="px-2 py-0.5 rounded bg-cyan-500/25 border border-cyan-400 text-cyan-200 font-bold text-[10px] hover:bg-cyan-500/40 cursor-pointer"
          >
            PRESS [SPACE] TO JUMP ▲
          </button>
        </div>
      )}

      {/* Adaptive Controls, Thruster Locomotion & Palette Bar (Bottom-Left) */}
      {isTouchOrMobile ? (
        /* Mobile / Tablet Viewport: Show Touch Virtual Joystick + Boost/Jump Buttons + Hitbox & Theme Toggles */
        <div
          data-testid="mobile-controls-container"
          className="fixed bottom-16 left-3 sm:bottom-20 sm:left-5 pointer-events-auto z-30 flex flex-col items-start gap-2"
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePhysicsDebug}
              data-testid="mobile-hitbox-toggle"
              className={`px-2 py-1 rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer ${
                isPhysicsDebugVisible
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'hud-theme-shell text-slate-200'
              }`}
            >
              {isPhysicsDebugVisible ? 'HITBOX: ON' : 'HITBOX [B]'}
            </button>
            <button
              type="button"
              onClick={cycleHudColorTheme}
              data-testid="mobile-theme-toggle"
              className="px-2 py-1 rounded-lg hud-theme-shell font-mono text-[10px] font-bold cursor-pointer"
            >
              🎨 {themeLabels[hudColorTheme]}
            </button>
          </div>
          <VirtualJoystick />
        </div>
      ) : (
        /* Desktop Viewport: Hide Virtual Joystick, Show Locomotion + Thruster + Theme HUD Pill */
        <div
          data-testid="desktop-controls-pill"
          className="fixed bottom-3 left-3 z-30 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl hud-theme-shell font-mono text-[11px]"
        >
          {/* WASD Move */}
          <div className="flex items-center gap-1">
            <kbd
              className="px-1.5 py-0.5 rounded bg-black/60 border text-[10px] font-bold"
              style={{ borderColor: 'var(--hud-border)', color: 'var(--hud-accent)' }}
            >
              WASD
            </kbd>
            <span className="text-slate-300">Move</span>
          </div>

          <span className="text-slate-600">·</span>

          {/* SHIFT Sprint + Live Thruster Energy Gauge */}
          <div className="flex items-center gap-1.5" title="Hold [Shift] for EVA Ion Thruster Sprint (6.6 m/s)">
            <kbd
              className={`px-1.5 py-0.5 rounded border text-[10px] font-bold transition-colors ${
                isSprinting
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : 'bg-black/60 border-slate-700 text-amber-300'
              }`}
            >
              SHIFT
            </kbd>
            <div className="w-12 h-2 rounded-full bg-black/70 border border-white/15 overflow-hidden">
              <div
                data-testid="thruster-energy-bar"
                style={{
                  width: `${thrusterEnergy}%`,
                  background: 'linear-gradient(90deg, var(--hud-accent), var(--hud-accent-2))'
                }}
                className="h-full transition-all duration-100"
              />
            </div>
          </div>

          <span className="text-slate-600">·</span>

          {/* SPACE Jump & Double-Jump */}
          <button
            type="button"
            onClick={() => requestJump()}
            className="flex items-center gap-1 hover:text-white cursor-pointer"
            title="Press Spacebar to Jump, press again in mid-air for EVA Jetpack Double-Jump"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-amber-300 font-bold text-[10px]">
              SPACE
            </kbd>
            <span className="text-slate-300">
              {!isPlayerGrounded && airJumpsLeft > 0 ? 'Jet ×2' : 'Jump'}
            </span>
          </button>

          <span className="text-slate-600">·</span>

          {/* Live Velocity + Ground/Airborne State */}
          <div
            data-testid="physics-ground-state"
            className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
              !isPlayerGrounded
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                : standingOnLabel
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                : 'bg-black/50 text-slate-200 border border-white/10'
            }`}
          >
            <span>
              {!isPlayerGrounded
                ? `AIRBORNE +${altitudeAboveGround.toFixed(1)}m`
                : standingOnLabel
                ? `ON: ${standingOnLabel.toUpperCase()}`
                : 'GROUNDED'}
            </span>
            <span className="text-slate-500">|</span>
            <span style={{ color: 'var(--hud-accent)' }}>{playerSpeedMps.toFixed(1)} m/s</span>
          </div>

          <span className="text-slate-600">·</span>

          {/* Hitboxes Toggle [B] */}
          <button
            type="button"
            onClick={togglePhysicsDebug}
            data-testid="desktop-hitbox-toggle"
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${
              isPhysicsDebugVisible
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                : 'bg-black/60 hover:bg-black/80 border-slate-700 text-cyan-300 hover:text-white'
            }`}
            title="Toggle 3D Physics Hitboxes & Bounding Boxes [B]"
          >
            {isPhysicsDebugVisible ? 'HITBOXES: ON [B]' : 'HITBOXES [B]'}
          </button>

          {/* Creative Color Theme Switcher [T] */}
          <button
            type="button"
            onClick={cycleHudColorTheme}
            data-testid="desktop-theme-toggle"
            style={{
              borderColor: 'var(--hud-border)',
              color: 'var(--hud-accent)'
            }}
            className="px-2 py-0.5 rounded bg-black/60 hover:bg-black/80 border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            title="Cycle Aerospace Color Palette Theme [T]"
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: 'var(--hud-accent)' }}
            />
            <span>{themeLabels[hudColorTheme]} [T]</span>
          </button>

          {/* Collapse HUD [H] */}
          <button
            type="button"
            onClick={() => setIsHudCollapsed((prev) => !prev)}
            className="px-1.5 py-0.5 rounded bg-black/60 hover:bg-black/80 border border-slate-700 text-slate-400 hover:text-white text-[10px] cursor-pointer"
            title="Toggle HUD Visibility [H]"
          >
            {isHudCollapsed ? 'SHOW [H]' : 'HIDE [H]'}
          </button>
        </div>
      )}

      {/* Emergency Event Pop-up Modal */}
      <EventModal />

      {/* Mission Debrief & Educational Scorecard Modal */}
      <DebriefModal />

      {/* Tactile Minecraft Backpack Inventory Modal */}
      <BackpackModal />

      {/* Canvas Confetti Reward Celebration */}
      <RewardCelebration />

      {/* Task 10.2: Chipi-Bot AI Companion with NASA Lore Dialogue */}
      {!isHudCollapsed && <AstroBotCompanion />}

      {/* Phase 15.1: Emergency Brownout STEM Quiz Modal */}
      <BrownoutQuizModal />

      {/* Task 11.1 & 11.2: Classroom Room-PIN & Live Leaderboard Modal */}
      <ClassroomModal isOpen={isClassroomOpen} onClose={closeClassroom} />

      {/* Field Specimen Collected Toast */}
      <FieldSpecimenToast />

      {/* v3.0 Story Engine Modals */}
      <MissionCommsBriefing />
      <BioDomeLabStation />
      <ChapterSelectModal />
      <ScienceCardModal />
      <FieldGuideModal isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} />

      {/* Tactical UI/UX & Effects Showcase Modal (Hotkey: F2) */}
      <LabShowcaseModal isOpen={isShowcaseOpen} onClose={() => setIsShowcaseOpen(false)} />
    </div>
  );
};

export default MissionControlOverlay;
