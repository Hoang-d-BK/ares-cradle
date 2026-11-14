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
import { OpeningStep } from '@/modules/outpost-3d/OpeningSequence3D';

interface MissionControlOverlayProps {
  openingStep: OpeningStep;
  onOpeningAdvance: () => void;
  onOpeningSkip: () => void;
}

export const MissionControlOverlay: React.FC<MissionControlOverlayProps> = ({
  openingStep,
  onOpeningAdvance,
  onOpeningSkip,
}) => {
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);

  // Keyboard Shortcuts: F2 for Showcase, G for Mars Codex
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'F2') {
        e.preventDefault();
        soundEngine.playClick(1000);
        setIsShowcaseOpen((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        soundEngine.playClick(1100);
        setIsCodexOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const isClassroomOpen = useOutpostStore((state) => state.isClassroomOpen);
  const closeClassroom = useOutpostStore((state) => state.closeClassroom);

  if (openingStep !== 'complete') {
    if (openingStep === 'landing') {
      return (
        <div className="absolute inset-0 z-40 pointer-events-none text-white" aria-live="polite">
          <div className="absolute inset-x-0 top-0 h-[8vh] min-h-12 bg-gradient-to-b from-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[15vh] min-h-24 bg-gradient-to-t from-black/95 to-transparent" />
          <div className="absolute left-5 top-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-amber-200 sm:left-8 sm:top-7 sm:text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            CRADLE-01  /  ATMOSPHERIC ENTRY
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
            <p className="max-w-xl text-sm font-medium leading-6 text-white/90 sm:text-base">
              “Descent corridor locked. Habitat beacon acquired.”
            </p>
            <button
              type="button"
              onClick={onOpeningSkip}
              className="pointer-events-auto min-h-11 shrink-0 rounded-xl border border-white/30 bg-black/45 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            >Skip cinematic</button>
          </div>
        </div>
      );
    }

    const copy = {
      eyebrow: 'ARES CRADLE · JUNIOR ASTRONAUT MISSION TRAINER',
      title: 'Five Frontiers Before Ares-1 Arrival',
      body: 'Touchdown confirmed, Cadet Leo. Five robotic stations are deployed across the survey grid. Explore the sectors, gather authentic field observations, solve engineering trade-offs, and certify a habitat before the Ares-1 crew arrives.',
      action: 'Enter Survey Grid',
    };

    return (
      <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-4 sm:p-8 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d12]/90 via-[#090d12]/30 to-[#090d12]/5" />
        <section
          aria-live="polite"
          className="relative pointer-events-auto w-full max-w-xl rounded-2xl border border-white/15 bg-[#101720]/90 p-5 sm:p-7 text-white shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b]" />
            {copy.eyebrow}
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-prose text-sm leading-6 text-slate-200 sm:text-base">{copy.body}</p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"><b className="text-white">WASD</b> / arrows · drive</span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"><b className="text-white">R</b> · exit rover</span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"><b className="text-white">CLEAN</b> · clear solar dust</span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">Joystick · touch</span>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              One objective · essential controls
            </span>
            <button
              type="button"
              onClick={onOpeningAdvance}
              className="min-h-11 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >{copy.action} <span aria-hidden="true">→</span></button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 overflow-hidden z-20">
      {/* Top Command Visor */}
      <CockpitVisorHUD
        onOpenShowcase={() => setIsShowcaseOpen(true)}
        onOpenCodex={() => setIsCodexOpen(true)}
      />

      {/* Top-Right Scalable Minimap Radar (25m / 50m / 80m) */}
      <MinimapRadar />

      {/* Non-Overlapping Bottom Horizontal Datapad HUD with Anchored Micro-Lessons */}
      <HorizontalDatapadHUD />

      {/* On-Screen Cockpit Driving Deck (When in Rover Mode) */}
      <CockpitDrivingDeck />

      {/* Emergency Event Pop-up Modal */}
      <EventModal />

      {/* Mission Debrief & Educational Scorecard Modal */}
      <DebriefModal />

      {/* Tactile Minecraft Backpack Inventory Modal */}
      <BackpackModal />

      {/* Canvas Confetti Reward Celebration */}
      <RewardCelebration />

      {/* Task 10.2: Chipi-Bot AI Companion with NASA Lore Dialogue */}
      <AstroBotCompanion />

      {/* Task 12.2: Touch Virtual Joystick (Always active for touch / mobile / testing) */}
      <div className="absolute bottom-28 left-4 sm:bottom-32 sm:left-6 pointer-events-auto z-30">
        <VirtualJoystick />
      </div>

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
