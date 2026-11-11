import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import chaptersData from '../story-engine/content/chapters.json';
import anchorsData from '../story-engine/content/worldAnchors.json';
import {
  StoryChapter,
  DataCapsule,
  SpecimenDrop,
  WorldAnchor,
} from '../story-engine/types';
import { soundEngine } from '../audio/soundEngine';

// Import initial capsules
import regolithIron from '../story-engine/content/capsules/regolith_iron.json';
import hematiteBlueberries from '../story-engine/content/capsules/hematite_blueberries.json';
import permafrostIce from '../story-engine/content/capsules/permafrost_ice.json';
import dustDevil from '../story-engine/content/capsules/dust_devil_vortex.json';
import moxieOxygen from '../story-engine/content/capsules/moxie_atmosphere.json';
import hydroponicsGreenhouse from '../story-engine/content/capsules/hydroponics_greenhouse.json';

import { doesSpecimenMatchObjective } from '../survival-ui/itemRegistry';

const INITIAL_CAPSULES: DataCapsule[] = [
  regolithIron as DataCapsule,
  hematiteBlueberries as DataCapsule,
  permafrostIce as DataCapsule,
  dustDevil as DataCapsule,
  moxieOxygen as DataCapsule,
  hydroponicsGreenhouse as DataCapsule,
];

export interface CarriedVial {
  specimenId: string;
  name: string;
  category: 'mineral' | 'ice' | 'atmosphere' | 'food';
  icon: string;
  quickFact: string;
  capsuleId: string;
  solCollected?: number;
}

export interface FieldToastData {
  title: string;
  fact: string;
  icon: string;
  badge?: string;
}

export interface StoryStoreState {
  // Progression
  currentChapterIndex: number;
  chapters: StoryChapter[];
  unlockedSols: number[];
  stemScore: number;
  unlockedBadges: string[];
  
  // World Anchors & Specimens
  anchors: WorldAnchor[];
  specimens: SpecimenDrop[];
  carriedVials: CarriedVial[];
  dataCapsules: DataCapsule[];

  // Active Waypoint Navigation
  activeWaypointAnchorId: string;

  // Active Modals & Popups
  isBriefingOpen: boolean;
  isLabStationOpen: boolean;
  isChapterSelectOpen: boolean;
  isScienceCardOpen: boolean;
  activeCapsule: DataCapsule | null;
  fieldToast: FieldToastData | null;

  // Actions
  getCurrentChapter: () => StoryChapter;
  getActiveWaypointPosition: () => [number, number, number];
  
  // Chapter & Objective Actions
  startSol: (solNumber: number) => void;
  advanceToNextSol: () => void;
  unlockAllSolsWithCode: (code: string) => boolean;
  completeObjective: (objectiveId: string) => void;
  incrementObjectiveProgress: (objectiveId: string, amount?: number) => void;

  // Specimen & Field Actions
  collectSpecimen: (specimenId: string) => boolean;
  emptyVialsIntoLab: () => CarriedVial[];
  triggerFieldToast: (toast: FieldToastData) => void;
  dismissFieldToast: () => void;

  // Lab & Science Capsule Actions
  unlockDataCapsule: (capsuleId: string) => void;
  openScienceCard: (capsule: DataCapsule) => void;
  closeScienceCard: () => void;
  submitCapsuleQuiz: (capsuleId: string, chosenIndex: number) => boolean;

  // Modal Toggles
  setBriefingOpen: (open: boolean) => void;
  setLabStationOpen: (open: boolean) => void;
  setChapterSelectOpen: (open: boolean) => void;
}

export const useStoryStore = create<StoryStoreState>()(
  persist(
    (set, get) => ({
      currentChapterIndex: 0,
      chapters: chaptersData as StoryChapter[],
      unlockedSols: [1],
      stemScore: 100,
      unlockedBadges: [],

      anchors: anchorsData.anchors as WorldAnchor[],
      specimens: anchorsData.specimenDrops as SpecimenDrop[],
      carriedVials: [],
      dataCapsules: INITIAL_CAPSULES,

      activeWaypointAnchorId: 'anchor-solar',

      isBriefingOpen: true,
      isLabStationOpen: false,
      isChapterSelectOpen: false,
      isScienceCardOpen: false,
      activeCapsule: null,
      fieldToast: null,

      getCurrentChapter: () => {
        const { chapters, currentChapterIndex } = get();
        return chapters[currentChapterIndex] || chapters[0];
      },

      getActiveWaypointPosition: () => {
        const { anchors, activeWaypointAnchorId } = get();
        const found = anchors.find((a) => a.id === activeWaypointAnchorId);
        return found ? found.position : [0, 0, -8];
      },

      startSol: (solNumber: number) => {
        const { chapters, unlockedSols, specimens } = get();
        const index = chapters.findIndex((c) => c.sol === solNumber);
        if (index === -1) return;

        // Auto-set waypoint to first incomplete objective
        const targetChapter = chapters[index];
        const firstIncomplete = targetChapter.objectives.find((o) => !o.completed) || targetChapter.objectives[0];
        const firstObjAnchor = firstIncomplete?.targetAnchorId || 'anchor-solar';

        // Ensure specimens for this Sol are available if objective is not yet completed
        const resetSpecimens = specimens.map((s) =>
          s.solAvailable === solNumber && !targetChapter.objectives.every((o) => o.completed)
            ? { ...s, collected: false }
            : s
        );

        set({
          currentChapterIndex: index,
          activeWaypointAnchorId: firstObjAnchor,
          isBriefingOpen: true,
          specimens: resetSpecimens,
          unlockedSols: Array.from(new Set([...unlockedSols, solNumber])),
        });
      },

      advanceToNextSol: () => {
        const { currentChapterIndex, chapters, unlockedSols, stemScore } = get();
        const nextIndex = currentChapterIndex + 1;
        if (nextIndex < chapters.length) {
          const nextSol = chapters[nextIndex].sol;
          const nextAnchor = chapters[nextIndex].objectives[0]?.targetAnchorId || 'anchor-solar';
          set({
            currentChapterIndex: nextIndex,
            activeWaypointAnchorId: nextAnchor,
            unlockedSols: Array.from(new Set([...unlockedSols, nextSol])),
            stemScore: stemScore + 500,
            isBriefingOpen: true,
            carriedVials: [],
          });
        }
      },

      unlockAllSolsWithCode: (code: string) => {
        if (code.trim().toUpperCase() === 'ARES2026') {
          soundEngine.playSuccessChime();
          set({
            unlockedSols: [1, 5, 9, 12, 20],
            stemScore: get().stemScore + 1000,
          });
          return true;
        }
        return false;
      },

      completeObjective: (objectiveId: string) => {
        const { chapters, currentChapterIndex, stemScore } = get();
        const updatedChapters = [...chapters];
        const chapter = { ...updatedChapters[currentChapterIndex] };
        const objIndex = chapter.objectives.findIndex((o) => o.id === objectiveId);

        if (objIndex !== -1 && !chapter.objectives[objIndex].completed) {
          chapter.objectives[objIndex] = {
            ...chapter.objectives[objIndex],
            completed: true,
            currentCount: chapter.objectives[objIndex].requiredCount || 1,
          };
          updatedChapters[currentChapterIndex] = chapter;

          soundEngine.playSuccessChime();
          const reward = chapter.objectives[objIndex].scoreReward || 200;

          // Shift waypoint to next incomplete objective if available
          const nextIncomplete = chapter.objectives.find((o) => !o.completed);
          const nextAnchor = nextIncomplete?.targetAnchorId || 'anchor-base';

          set({
            chapters: updatedChapters,
            stemScore: stemScore + reward,
            activeWaypointAnchorId: nextAnchor,
          });
        }
      },

      incrementObjectiveProgress: (objectiveId: string, amount = 1) => {
        const { chapters, currentChapterIndex, completeObjective } = get();
        const chapter = chapters[currentChapterIndex];
        const obj = chapter.objectives.find((o) => o.id === objectiveId);

        if (obj && !obj.completed) {
          const newCount = (obj.currentCount || 0) + amount;
          const required = obj.requiredCount || 1;
          if (newCount >= required) {
            completeObjective(objectiveId);
          } else {
            const updatedChapters = [...chapters];
            const updatedChapter = { ...chapter };
            const idx = updatedChapter.objectives.findIndex((o) => o.id === objectiveId);
            updatedChapter.objectives[idx] = {
              ...obj,
              currentCount: newCount,
            };
            updatedChapters[currentChapterIndex] = updatedChapter;
            set({ chapters: updatedChapters });
          }
        }
      },

      collectSpecimen: (specimenId: string) => {
        const { specimens, carriedVials, currentChapterIndex, chapters, incrementObjectiveProgress } = get();
        const targetSpecimen = specimens.find((s) => s.id === specimenId);
        if (!targetSpecimen || targetSpecimen.collected) {
          return false; // Prevent duplicate pickup on double-click / pointerDown+click
        }

        if (carriedVials.length >= 3) {
          soundEngine.playClick(520);
          set({
            fieldToast: {
              title: 'Sample Vial Rack Full (3/3)',
              fact: 'Return to the Habitat Bio-Dome Chemical Analyzer to process your carried samples before collecting more.',
              icon: '🧪',
              badge: 'VIAL RACK FULL'
            }
          });
          return false;
        }

        soundEngine.playCrystalPickup();
        const activeChapter = chapters[currentChapterIndex];

        const newVial: CarriedVial = {
          specimenId: targetSpecimen.id,
          name: targetSpecimen.name,
          category: targetSpecimen.category,
          icon: targetSpecimen.icon,
          quickFact: targetSpecimen.quickFact,
          capsuleId: targetSpecimen.capsuleId,
          solCollected: activeChapter?.sol ?? targetSpecimen.solAvailable
        };

        // Mark specimen as collected in world
        const updatedSpecimens = specimens.map((s) =>
          s.id === specimenId ? { ...s, collected: true } : s
        );

        // Update related collect objective ONLY if targetSpecimenId matches this specimen
        const collectObj = activeChapter.objectives.find(
          (o) =>
            o.type === 'collect' &&
            !o.completed &&
            doesSpecimenMatchObjective(specimenId, o.targetSpecimenId)
        );
        if (collectObj) {
          incrementObjectiveProgress(collectObj.id, 1);
        }

        // Trigger field toast
        set({
          specimens: updatedSpecimens,
          carriedVials: [...carriedVials, newVial],
          fieldToast: {
            title: targetSpecimen.name,
            fact: targetSpecimen.quickFact,
            icon: targetSpecimen.icon,
            badge: `MISSION SAMPLE SEALED (${carriedVials.length + 1}/3 VIALS)`,
          },
        });

        return true;
      },

      emptyVialsIntoLab: () => {
        const { carriedVials } = get();
        set({ carriedVials: [] });
        return carriedVials;
      },

      triggerFieldToast: (toast: FieldToastData) => {
        set({ fieldToast: toast });
      },

      dismissFieldToast: () => {
        set({ fieldToast: null });
      },

      unlockDataCapsule: (capsuleId: string) => {
        const { dataCapsules, stemScore } = get();
        const updated = dataCapsules.map((c) =>
          c.id === capsuleId ? { ...c, unlocked: true } : c
        );
        set({
          dataCapsules: updated,
          stemScore: stemScore + 100,
        });
      },

      openScienceCard: (capsule: DataCapsule) => {
        set({
          isScienceCardOpen: true,
          activeCapsule: capsule,
        });
      },

      closeScienceCard: () => {
        set({
          isScienceCardOpen: false,
          activeCapsule: null,
        });
      },

      submitCapsuleQuiz: (capsuleId: string, chosenIndex: number) => {
        const { dataCapsules, stemScore } = get();
        const capsule = dataCapsules.find((c) => c.id === capsuleId);
        if (!capsule) return false;

        if (chosenIndex === capsule.checkQuestion.correctIndex) {
          soundEngine.playSuccessChime();
          set({ stemScore: stemScore + 150 });
          return true;
        } else {
          soundEngine.playClick(400);
          return false;
        }
      },

      setBriefingOpen: (open: boolean) => set({ isBriefingOpen: open }),
      setLabStationOpen: (open: boolean) => set({ isLabStationOpen: open }),
      setChapterSelectOpen: (open: boolean) => set({ isChapterSelectOpen: open }),
    }),
    {
      name: 'ares-cradle-story-v3',
      partialize: (state) => ({
        unlockedSols: state.unlockedSols,
        stemScore: state.stemScore,
        unlockedBadges: state.unlockedBadges,
      }),
    }
  )
);

export default useStoryStore;
