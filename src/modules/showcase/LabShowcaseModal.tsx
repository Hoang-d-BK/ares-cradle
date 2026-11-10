import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TactileResourceDial,
  TactileButton,
  KineticTextSpring,
  TextTypeWriter,
  HolographicArtifactViewer,
  BadgeCelebrationModal,
  SolarSystemOrrery,
  AsteroidSmashArcade,
  ArtifactSpecimen,
} from '@/modules/extracted-ui-kit';
import { soundEngine } from '@/modules/audio/soundEngine';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { useStoryStore } from '@/modules/store/useStoryStore';

export interface LabShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ExtendedSpecimen extends ArtifactSpecimen {
  nasaMission: string;
  earthSpec: string;
  marsSpec: string;
  resourceRewardText?: string;
  applyReward: () => void;
}

type ShowcaseTab = 'controls' | 'typography' | 'hologram' | 'celebration' | 'celestial';

export const LabShowcaseModal: React.FC<LabShowcaseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('controls');
  const [inspectingSpecimen, setInspectingSpecimen] = useState<ExtendedSpecimen | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [typeKey, setTypeKey] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Live Zustand Outpost Store
  const battery = useOutpostStore((state) => state.battery);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const solarIntake = useOutpostStore((state) => state.solarIntake);
  const netPower = useOutpostStore((state) => state.netPower);
  const powerPriorityOxygen = useOutpostStore((state) => state.powerPriorityOxygen);
  const powerPriorityHeaters = useOutpostStore((state) => state.powerPriorityHeaters);
  const setPowerPriorities = useOutpostStore((state) => state.setPowerPriorities);
  const cleanDust = useOutpostStore((state) => state.cleanDust);
  const emergencyPowerSaver = useOutpostStore((state) => state.emergencyPowerSaver);
  const toggleEmergencySaver = useOutpostStore((state) => state.toggleEmergencySaver);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const toggleDrivingRover = useOutpostStore((state) => state.toggleDrivingRover);
  const openBackpack = useOutpostStore((state) => state.openBackpack);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const SPECIMENS: ExtendedSpecimen[] = [
    {
      id: 'specimen-hematite',
      name: 'Hematite Blueberries',
      category: 'mineral',
      icon: '🫐',
      discoverySol: 5,
      missionLore: 'Spherical hematite concretions found in Crater Alpha, formed by ancient water billions of years ago. High density iron-oxide matrix.',
      refinementYield: '+25 Structural Alloy Plates & +15 kWh Battery Reserve',
      purityScore: 94,
      nasaMission: 'NASA Opportunity Rover (Meridiani Planum)',
      marsSpec: 'Diameter 1-3mm • 68% Fe2O3 • Vacuum Hardened',
      earthSpec: 'Sedimentary iron nodules found in Utah desert',
      applyReward: () => {
        useOutpostStore.setState((prev) => ({
          battery: Math.min(100, prev.battery + 15),
          batteryKwh: Math.min(prev.batteryCapacityKwh, prev.batteryKwh + 15),
        }));
        useStoryStore.getState().triggerFieldToast({
          title: 'Hematite Refined',
          fact: '+15 kWh Auxiliary Battery Restored',
          icon: '🫐',
          badge: 'LAB SYNTHESIS SUCCESS'
        });
      },
    },
    {
      id: 'specimen-permafrost',
      name: 'North Glacier Ice Core',
      category: 'ice',
      icon: '🧊',
      discoverySol: 9,
      missionLore: 'Drilled 1.5m below surface basalt in the North Glacier Trench. Pure crystalline H2O ice mixed with silicates.',
      refinementYield: '+50L Purified Water & Refills 100% Oxygen Reserves',
      purityScore: 98,
      nasaMission: 'NASA Phoenix Mars Lander & Mars Express OMEGA',
      marsSpec: 'Subsurface permafrost at -78°C • Zero liquid water',
      earthSpec: 'Antarctic sub-glacial ice core (Lake Vostok)',
      applyReward: () => {
        useOutpostStore.setState({ oxygen: 21.0 });
        useStoryStore.getState().triggerFieldToast({
          title: 'Water & O2 Extracted',
          fact: 'Glacier ice purified! Base oxygen buffer restored to 21.0%.',
          icon: '🧊',
          badge: 'LAB EXTRACTION SUCCESS'
        });
      },
    },
    {
      id: 'specimen-moxie',
      name: 'MOXIE Extracted O2 Gas',
      category: 'atmosphere',
      icon: '🧪',
      discoverySol: 12,
      missionLore: 'Solid oxide electrolysis converting Martian 95% carbon dioxide (CO2) into breathable oxygen molecules (O2).',
      refinementYield: '+40% O2 Scrubber Efficiency Buffer',
      purityScore: 99,
      nasaMission: 'NASA Perseverance Rover (MOXIE Instrument)',
      marsSpec: '95.3% CO2 atmosphere • Pressure 610 Pascals (0.006 atm)',
      earthSpec: '78% Nitrogen • 21% Oxygen • Pressure 101,325 Pa (1.0 atm)',
      applyReward: () => {
        setPowerPriorities(70, powerPriorityHeaters);
        useOutpostStore.setState({ oxygen: 22.5 });
        useStoryStore.getState().triggerFieldToast({
          title: 'MOXIE Electrolysis Boost',
          fact: 'Atmospheric testbed boosted base oxygen scrubbers (+70% Priority).',
          icon: '🧪',
          badge: 'LAB UPGRADE SUCCESS'
        });
      },
    },
    {
      id: 'specimen-microgreens',
      name: 'Hydroponic Microgreens',
      category: 'food',
      icon: '🌱',
      discoverySol: 20,
      missionLore: 'Radish and pea microgreens cultivated in Bio-Dome aeroponic racks using filtered ice water and LED growth spectra.',
      refinementYield: 'Restores Cadet Leo Health & Boosts Base Morale',
      purityScore: 91,
      nasaMission: 'NASA ISS Veggie & Space Crop Production (Kennedy Space Center)',
      marsSpec: 'Zero organic soil • Grown in basalt perlite with nutrient solution',
      earthSpec: 'Traditional nitrogen-rich agricultural soil',
      applyReward: () => {
        useStoryStore.getState().triggerFieldToast({
          title: 'Fresh Crop Harvested',
          fact: 'Hydroponics yielded fresh greens! Colony survival score boosted.',
          icon: '🌱',
          badge: 'BIO-DOME YIELD'
        });
      },
    },
  ];

  // Keyboard shortcut listener: ESC or F2 to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F2') {
        if (inspectingSpecimen) {
          e.preventDefault();
          setInspectingSpecimen(null);
        } else if (isOpen) {
          e.preventDefault();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inspectingSpecimen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 select-none font-mono pointer-events-auto">
          {/* Semi-transparent Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          />

          {/* Main Showcase Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-5xl h-[90vh] rounded-3xl bg-gray-950/95 border-2 border-amber-500/40 shadow-[0_0_60px_rgba(255,126,41,0.25)] flex flex-col overflow-hidden text-gray-100 z-10"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-gray-900 via-amber-950/40 to-gray-900">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base md:text-lg font-black tracking-wider text-white uppercase">
                      Ares Cradle • Tactical UI/UX & Live In-Game Workbench
                    </h1>
                    <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                      v3.0 LIVE GAME WIRED
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans">
                    Buttons & Dials directly control the live base! Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-amber-300">F2</kbd> or <kbd className="px-1 py-0.5 bg-gray-800 rounded text-amber-300">ESC</kbd> to return to Mars.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick(800);
                  onClose();
                }}
                className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all active:scale-95 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Action Feedback Banner (Toast) */}
            <AnimatePresence>
              {actionFeedback && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-black px-6 py-2 text-xs font-bold font-mono flex items-center justify-between shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <span>⚡ COMMAND EXECUTED:</span>
                    <span>{actionFeedback}</span>
                  </span>
                  <span className="text-[10px] opacity-80">Syncing telemetry...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800/80 bg-black/40 overflow-x-auto">
              {[
                { id: 'controls', label: 'Tactile Controls', icon: '🎛️' },
                { id: 'hologram', label: 'NASA Specimens & Refine', icon: '🔬' },
                { id: 'typography', label: 'Kinetic Typography', icon: '✨' },
                { id: 'celebration', label: 'Badge Celebration', icon: '🏆' },
                { id: 'celestial', label: '3D Orrery & Arcade', icon: '🔭' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playClick(1100);
                    setActiveTab(tab.id as ShowcaseTab);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(255,126,41,0.25)]'
                      : 'border border-transparent hover:border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* TAB 1: TACTILE CONTROLS */}
              {activeTab === 'controls' && (
                <div className="space-y-6">
                  {/* Live Base Telemetry Ticker */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 text-[10px]">LIVE BATTERY</div>
                      <div className="text-base font-bold text-amber-400">{battery.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px]">LIVE OXYGEN</div>
                      <div className="text-base font-bold text-cyan-400">{oxygen.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px]">SOLAR INTAKE & DUST</div>
                      <div className="text-base font-bold text-yellow-300">
                        {solarIntake.toFixed(1)} kW <span className="text-[10px] text-gray-400">({(dustCoverage * 100).toFixed(0)}% dust)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px]">NET GRID LOAD</div>
                      <div className={`text-base font-bold ${netPower >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {netPower >= 0 ? '+' : ''}{netPower.toFixed(1)} kW
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                      1. Live Resource Dials (Drag Arc or Press [-] / [+] to reallocate live base power)
                    </h2>
                    <p className="text-xs text-gray-400 font-sans">
                      These dials directly adjust your real Martian life support allocations!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                    <TactileResourceDial
                      label="Sabatier O2 Scrubber Priority"
                      subLabel={`Live O2 Level: ${oxygen.toFixed(1)}%`}
                      value={powerPriorityOxygen}
                      onChange={(newVal) => {
                        setPowerPriorities(newVal, powerPriorityHeaters);
                        showToast(`O2 Priority adjusted to ${newVal}% (Heaters: ${powerPriorityHeaters}%)`);
                      }}
                      unit="%"
                      icon="🫁"
                      onSoundClick={() => soundEngine.playClick(1400)}
                    />
                    <TactileResourceDial
                      label="Thermal Heaters Priority"
                      subLabel={`Live Base Temp: ${temperature > 0 ? '+' : ''}${temperature.toFixed(1)}°C`}
                      value={powerPriorityHeaters}
                      onChange={(newVal) => {
                        setPowerPriorities(powerPriorityOxygen, newVal);
                        showToast(`Heaters Priority adjusted to ${newVal}% (O2: ${powerPriorityOxygen}%)`);
                      }}
                      unit="%"
                      icon="🔥"
                      onSoundClick={() => soundEngine.playClick(1200)}
                    />
                  </div>

                  {/* Real Action Buttons */}
                  <div className="pt-4 border-t border-gray-800 space-y-3">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      2. Live Outpost Command Actions (Click to trigger in-game commands)
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <TactileButton
                        variant="primary"
                        icon="🧹"
                        onClick={() => {
                          cleanDust(0.6);
                          soundEngine.playSuccessChime();
                          showToast('Sonic Wiper triggered! Cleared 60% of solar panel dust deposits.');
                        }}
                        onSoundTrigger={() => soundEngine.playClick(1000)}
                      >
                        Wipe Solar Array (Clean Dust)
                      </TactileButton>

                      <TactileButton
                        variant="cyan"
                        icon="🚜"
                        onClick={() => {
                          toggleDrivingRover();
                          soundEngine.playClick(1200);
                          showToast(isDrivingRover ? 'Dismounted Rover. Switched to EVA walking mode!' : 'Mounted Exploration Rover!');
                        }}
                        onSoundTrigger={() => soundEngine.playClick(1200)}
                      >
                        {isDrivingRover ? 'Dismount Rover (Walk)' : 'Drive Exploration Rover'}
                      </TactileButton>

                      <TactileButton
                        variant="hazard"
                        icon="⚠️"
                        onClick={() => {
                          toggleEmergencySaver();
                          soundEngine.playAlarm();
                          showToast(emergencyPowerSaver ? 'Emergency Power Saver deactivated.' : 'EMERGENCY POWER SAVER ENGAGED (-15% base drain)!');
                        }}
                        onSoundTrigger={() => soundEngine.playAlarm()}
                      >
                        {emergencyPowerSaver ? 'Disable Power Saver' : 'Engage Power Saver'}
                      </TactileButton>

                      <TactileButton
                        variant="glass"
                        icon="🎒"
                        onClick={() => {
                          soundEngine.playClick(900);
                          onClose();
                          openBackpack();
                        }}
                        onSoundTrigger={() => soundEngine.playClick(900)}
                      >
                        Open Survival Backpack [E]
                      </TactileButton>

                      <TactileButton
                        variant="secondary"
                        icon="🔋"
                        onClick={() => {
                          useOutpostStore.setState((prev) => ({
                            battery: Math.min(100, prev.battery + 20),
                            batteryKwh: Math.min(prev.batteryCapacityKwh, prev.batteryKwh + 20),
                          }));
                          soundEngine.playSuccessChime();
                          showToast('Emergency +20 kWh battery buffer dispatched!');
                        }}
                        onSoundTrigger={() => soundEngine.playClick(750)}
                      >
                        Emergency +20 kWh Battery
                      </TactileButton>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: NASA SPECIMENS & REFINE */}
              {activeTab === 'hologram' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                      2.5D Holographic Artifact Inspection & Bio-Dome Refinement
                    </h2>
                    <p className="text-xs text-gray-400 font-sans">
                      Click any specimen below to inspect NASA data and refine it directly into your outpost reserves!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {SPECIMENS.map((specimen) => (
                      <HolographicArtifactViewer
                        key={specimen.id}
                        artifact={specimen}
                        onSoundTrigger={() => soundEngine.playClick(1300)}
                        onInspect={() => {
                          soundEngine.playSuccessChime();
                          setInspectingSpecimen(specimen);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: KINETIC TYPOGRAPHY */}
              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                        Kinetic Spring Typography & Mechanical Typewriter
                      </h2>
                      <p className="text-xs text-gray-400 font-sans">
                        Word-by-word spring entrance eliminates reading fatigue for cadets aged 7–12.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playClick(1100);
                        setTypeKey((k) => k + 1);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 hover:border-amber-400 text-xs text-amber-300 font-bold transition-all active:scale-95"
                    >
                      🔄 Replay Animations
                    </button>
                  </div>

                  {/* Kinetic Word Spring Card */}
                  <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
                    <div className="text-[11px] text-amber-400/80 uppercase tracking-widest">
                      [Comic Prologue Briefing Header]
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white leading-snug">
                      <KineticTextSpring
                        key={`word-${typeKey}`}
                        text="SOL 1: FIRST LIGHT OVER ELYSIUM PLANITIA. ESTABLISH PRIMARY SOLAR POWER ARRAY BEFORE SUNSET!"
                        mode="word"
                        delay={0.15}
                      />
                    </div>
                  </div>

                  {/* Typewriter Dialogue Card */}
                  <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
                    <div className="text-[11px] text-cyan-400/80 uppercase tracking-widest">
                      [Chipi-Bot Radio Comms Telemetry]
                    </div>
                    <div className="text-sm sm:text-base text-cyan-200">
                      <TextTypeWriter
                        key={`type-${typeKey}`}
                        text="Beep-boop! Cadet Leo, thermal readings indicate -60°C outside. Suit oxygen reserves are at 5/5 bubbles. Use your Sonic Wiper [E] to clear panel dust from a distance!"
                        typingSpeed={25}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BADGE CELEBRATION */}
              {activeTab === 'celebration' && (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                      NASA Badge & STEM Score Milestone Celebration
                    </h2>
                    <p className="text-xs text-gray-400 font-sans">
                      Dual golden/cyan canvas confetti cannons, 3D floating badge halo, and rolling score tally driving the dopamine reward loop for Sol completion.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-900/60 border border-amber-500/30 text-center space-y-4">
                    <div className="text-4xl">🏅</div>
                    <h3 className="text-lg font-bold text-white">Test Mission Debrief Celebration</h3>
                    <p className="text-xs text-gray-400 font-sans">
                      Click the button below to test the full celebration sequence with sound and confetti!
                    </p>
                    <button
                      onClick={() => {
                        soundEngine.playSuccessChime();
                        setIsCelebrationOpen(true);
                      }}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(255,126,41,0.5)] transition-all cursor-pointer active:scale-95"
                    >
                      🎉 Fire Badge Celebration Modal
                    </button>
                  </div>

                  <BadgeCelebrationModal
                    isOpen={isCelebrationOpen}
                    onClose={() => setIsCelebrationOpen(false)}
                    badgeTitle="Hematite Prospector"
                    badgeSubtitle="Cadet Leo successfully surveyed Crater Alpha and refined mineral alloy plates in the Bio-Dome Lab."
                    badgeIcon="🫐"
                    scoreAwarded={300}
                    missionSol={5}
                    onSoundTrigger={() => soundEngine.playSuccessChime()}
                  />
                </div>
              )}

              {/* TAB 5: 3D ORRERY & ARCADE */}
              {activeTab === 'celestial' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                      Celestial Telescope & Planetary Defense Arcade
                    </h2>
                    <p className="text-xs text-gray-400 font-sans">
                      Live Three.js Keplerian orbit simulation & retro space defense arcade running offline via public directory assets.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                        NASA Live Solar System Orrery
                      </h3>
                      <SolarSystemOrrery className="w-full h-[420px] rounded-2xl border border-cyan-500/30 overflow-hidden" />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                        Ares Defense: Asteroid Smash Training Simulation
                      </h3>
                      <AsteroidSmashArcade className="w-full h-[420px] rounded-2xl border border-amber-500/30 overflow-hidden" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-800 bg-black/60 flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Active Sol Simulation Running in Background</span>
              </span>
              <span className="text-amber-400 font-bold">Press [F2] anytime to resume EVA</span>
            </div>
          </motion.div>

          {/* SPECIMEN INSPECTOR & REFINEMENT MODAL */}
          <AnimatePresence>
            {inspectingSpecimen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setInspectingSpecimen(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-lg rounded-3xl p-6 bg-gray-950 border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(0,240,255,0.3)] text-white font-mono z-10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                        {inspectingSpecimen.icon}
                      </div>
                      <div>
                        <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase">
                          NASA DATA CAPSULE • SOL {inspectingSpecimen.discoverySol}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-wide">
                          {inspectingSpecimen.name}
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setInspectingSpecimen(null)}
                      className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-gray-300 font-sans leading-relaxed mb-4">
                    {inspectingSpecimen.missionLore}
                  </p>

                  {/* Comparative NASA Data */}
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-gray-800 space-y-2 mb-4 text-xs">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      NASA SCIENTIFIC MISSION DATA
                    </div>
                    <div className="text-gray-300 text-[11px]">
                      <span className="text-gray-400">Mission: </span>
                      <span className="font-semibold text-white">{inspectingSpecimen.nasaMission}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-800/80 text-[11px]">
                      <div>
                        <span className="text-red-400 font-bold">🔴 Mars: </span>
                        <span className="text-gray-300">{inspectingSpecimen.marsSpec}</span>
                      </div>
                      <div>
                        <span className="text-blue-400 font-bold">🔵 Earth: </span>
                        <span className="text-gray-300">{inspectingSpecimen.earthSpec}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Yield Banner */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs mb-5">
                    <span className="text-gray-400">Bio-Dome Refinement Yield:</span>
                    <span className="font-bold text-amber-300">{inspectingSpecimen.refinementYield}</span>
                  </div>

                  {/* Refinement Action CTA */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setInspectingSpecimen(null)}
                      className="px-4 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playSuccessChime();
                        inspectingSpecimen.applyReward();
                        showToast(`Refined ${inspectingSpecimen.name}! Outpost resources replenished.`);
                        setInspectingSpecimen(null);
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-black font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer active:scale-95"
                    >
                      🔬 Refine into Bio-Dome Outpost
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LabShowcaseModal;
