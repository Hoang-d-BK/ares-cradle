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
