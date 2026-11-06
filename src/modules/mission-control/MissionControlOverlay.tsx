import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, Thermometer } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

import ResourceDial, { ResourceStatus } from './ResourceDial';
import PowerDistributor from './PowerDistributor';
import StageBanner from './StageBanner';
import EventModal from './EventModal';
import DebriefModal from './DebriefModal';

const springPhysics = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 28,
  mass: 0.8
};

export const MissionControlOverlay: React.FC = () => {
  const battery = useOutpostStore((state) => state.battery);
  const batteryKwh = useOutpostStore((state) => state.batteryKwh);
  const batteryCapacityKwh = useOutpostStore((state) => state.batteryCapacityKwh);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);

  // Determine color status for primary telemetry
  const batteryStatus: ResourceStatus = 
    battery > 40 ? 'safe' : battery > 15 ? 'warning' : 'critical';

  const oxygenStatus: ResourceStatus = 
    oxygen > 19.5 ? 'safe' : oxygen > 16.0 ? 'warning' : 'critical';

  const tempStatus: ResourceStatus = 
    temperature >= 10 && temperature <= 25
      ? 'safe'
      : temperature >= 0 && temperature <= 32
      ? 'warning'
      : 'critical';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5 overflow-hidden z-20">
      {/* Top Banner: Sol Clock, Phase, Directives & Dust Cleaner */}
      <StageBanner />

      {/* Floating Bottom Mission Control HUD: Gauges & Power Allocation */}
      <footer className="w-full max-w-5xl mx-auto pointer-events-auto flex flex-col lg:flex-row gap-2.5 sm:gap-3.5 items-stretch pb-1 sm:pb-0">
        {/* Core Resource Telemetry Gauges (3-Dial Deck) */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPhysics}
          className="hud-panel p-2 sm:p-3.5 rounded-sm flex-1 grid grid-cols-3 gap-1.5 sm:gap-2.5 shadow-2xl"
        >
          {/* Battery Telemetry Dial */}
          <ResourceDial
            label="Battery Grid"
            value={battery}
            displayValue={battery.toFixed(1)}
            unit="%"
            subtext={`${batteryKwh.toFixed(1)} / ${batteryCapacityKwh.toFixed(0)} kWh`}
            percentage={battery}
            status={batteryStatus}
            icon={Zap}
          />

          {/* Oxygen Saturation Dial */}
          <ResourceDial
            label="Oxygen Level"
            value={oxygen}
            displayValue={oxygen.toFixed(1)}
            unit="%"
            subtext="SAFE LIMIT: >19.5%"
            percentage={(oxygen / 25) * 100}
            status={oxygenStatus}
            icon={Heart}
          />

          {/* Habitat Temperature Dial */}
          <ResourceDial
            label="Thermal Balance"
            value={temperature}
            displayValue={`${temperature > 0 ? '+' : ''}${temperature.toFixed(1)}`}
            unit="°C"
            subtext="TARGET: +20.0°C"
            percentage={Math.max(0, Math.min(100, ((temperature + 40) / 75) * 100))}
            status={tempStatus}
            icon={Thermometer}
          />
        </motion.div>

        {/* Tactile Power Router & Priority Deck */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPhysics, delay: 0.06 }}
          className="hud-panel p-1 rounded-sm lg:w-96 shadow-2xl"
        >
          <PowerDistributor />
        </motion.div>
      </footer>

      {/* Emergency Event Pop-up Modal */}
      <EventModal />

      {/* Mission Debrief & Educational Scorecard Modal */}
      <DebriefModal />
    </div>
  );
};

export default MissionControlOverlay;
