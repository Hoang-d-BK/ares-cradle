import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Backpack, 
  X, 
  Sparkles, 
  Wrench, 
  BatteryCharging, 
  Apple, 
  Flame, 
  Microscope, 
  Lock, 
  Loader2 
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Task 8.3 & Task 8.2: Tactile Minecraft Backpack Inventory
 * Spring physics: stiffness 300, damping 25 (Mandatory Hallmark Standard)
 * Full 6 tactile states: default, hover, active, focus-visible, disabled, loading
 */
const backpackSpringPhysics = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25
};

interface InventorySlotDef {
  id: string;
  name: string;
  countKey?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  effectLabel: string;
  tactileState: 'normal' | 'disabled' | 'loading';
}

const INVENTORY_SLOTS: InventorySlotDef[] = [
  {
    id: 'sonic_wiper',
    name: 'Sonic Dust Sweeper',
    countKey: 'sonic_wiper',
    icon: Sparkles,
    description: 'High-frequency acoustic wave generator cleans dust from solar arrays in seconds.',
    effectLabel: 'Purges 100% dust',
    tactileState: 'normal'
  },
  {
    id: 'space_tape',
    name: 'Cosmic Sealant Tape',
    countKey: 'space_tape',
    icon: Wrench,
    description: 'Polymer aerospace adhesive patch seals micro-fractures in the habitat dome.',
    effectLabel: '+2.5% O2 Recovery',
    tactileState: 'normal'
  },
  {
    id: 'backup_battery',
    name: 'Reserve Battery Cell',
    countKey: 'backup_battery',
    icon: BatteryCharging,
    description: 'High-density solid-state lithium emergency cell for outpost power rationing.',
    effectLabel: '+25% Grid Power',
    tactileState: 'normal'
  },
  {
    id: 'space_apple',
    name: 'Martian Bio-Apple',
    countKey: 'space_apple',
    icon: Apple,
    description: 'Grown in the habitat hydroponics ring. Refreshes crew vitals instantly.',
    effectLabel: 'Stabilizes Vitals',
    tactileState: 'normal'
  },
  {
    id: 'thermal_blanket',
    name: 'Aerogel Thermal Quilt',
    icon: Flame,
    description: 'Ultralight NASA silica aerogel insulation keeps habitat temperature cozy.',
    effectLabel: 'Passive +2°C Warmth',
    tactileState: 'normal'
  },
  {
    id: 'soil_analyzer',
    name: 'XRF Soil Spectrometer',
    icon: Microscope,
    description: 'Analyzes iron oxide regolith composition for water ice traces.',
    effectLabel: 'Science Telemetry',
    tactileState: 'normal'
  },
  {
    id: 'rover_engine',
    name: 'Rover Turbo Thruster',
    icon: Lock,
    description: 'High-torque brushless motor upgrade. Locked until Sol 5 completion.',
    effectLabel: 'LOCKED (Sol 5)',
    tactileState: 'disabled'
  },
  {
    id: 'quantum_uplink',
    name: 'Deep Space Laser Uplink',
    icon: Loader2,
    description: 'Establishing orbital telemetry link with NASA Earth Ground Control...',
    effectLabel: 'SYNCING...',
    tactileState: 'loading'
  }
];

export const BackpackModal: React.FC = () => {
  const isBackpackOpen = useOutpostStore((state) => state.isBackpackOpen);
  const toggleBackpack = useOutpostStore((state) => state.toggleBackpack);
  const closeBackpack = useOutpostStore((state) => state.closeBackpack);
  const inventory = useOutpostStore((state) => state.inventory);
  const useItem = useOutpostStore((state) => state.useItem);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);
  const battery = useOutpostStore((state) => state.battery);

  // Global [E] key toggle & [Escape] close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        toggleBackpack();
      } else if (e.key === 'Escape' && isBackpackOpen) {
        e.preventDefault();
        closeBackpack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleBackpack, closeBackpack, isBackpackOpen]);

  return (
    <AnimatePresence>
      {isBackpackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={closeBackpack} />

          {/* Minecraft-Style Tactile Backpack Dialog with Spring Physics */}
          <motion.div
            data-testid="backpack-modal"
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={backpackSpringPhysics}
            className="hud-panel hud-corner-brackets relative z-10 w-full max-w-xl p-5 rounded-md border-2 border-mars-cyan/40 bg-mars-charcoal/95 shadow-2xl"
          >
            {/* Header: Title, Hotkey badge & Close button */}
            <div className="flex items-center justify-between border-b border-mars-border pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-mars-cyan/15 text-mars-cyan border border-mars-cyan/30">
                  <Backpack className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-lg tracking-wider text-slate-100 uppercase">
                      Cadet Field Backpack
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-surface border border-mars-border text-mars-cyan font-bold">
                      [KEY: E]
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    Minecraft-Style Grid • Tactile Equipment Deck
                  </p>
                </div>
              </div>

              {/* Close Button with Tactile State */}
              <button
                onClick={closeBackpack}
                className="btn-tactile p-2 rounded text-slate-400 hover:text-white"
                title="Close Backpack [Esc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-header: Quick Cadet Telemetry Vitals */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 p-2.5 rounded bg-mars-surface/80 border border-mars-border text-xs font-mono">
              <div className="flex items-center justify-between px-2">
                <span className="text-slate-400">O₂ SATURATION:</span>
                <span className="text-mars-cyan font-bold">{oxygen.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between px-2 border-x border-mars-border">
                <span className="text-slate-400">CABIN TEMP:</span>
                <span className="text-mars-rust font-bold">{temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-slate-400">GRID BATTERY:</span>
                <span className="text-mars-amber font-bold">{battery.toFixed(0)}%</span>
              </div>
            </div>

            {/* 8-Slot Inventory Grid (Demonstrating all 6 Tactile States) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {INVENTORY_SLOTS.map((slot) => {
                const count = slot.countKey ? (inventory[slot.countKey] ?? 0) : undefined;
                const IconComponent = slot.icon;
                const isOutOfStock = slot.countKey !== undefined && count === 0;

                const getSlotClasses = () => {
                  if (slot.tactileState === 'disabled' || isOutOfStock) {
                    return 'slot-tactile slot-locked';
                  }
                  if (slot.tactileState === 'loading') {
                    return 'slot-tactile slot-loading';
                  }
                  return 'slot-tactile';
                };

                return (
                  <button
                    key={slot.id}
                    disabled={slot.tactileState === 'disabled' || isOutOfStock}
                    onClick={() => {
                      if (slot.countKey && (inventory[slot.countKey] ?? 0) > 0) {
                        useItem(slot.id);
                      }
                    }}
                    className={`${getSlotClasses()} p-3 h-28 rounded group text-left`}
                  >
                    {/* Item Count Badge */}
                    {count !== undefined && (
                      <span className={`absolute top-1.5 right-1.5 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        count > 0 ? 'bg-mars-cyan/20 text-mars-cyan border border-mars-cyan/40' : 'bg-red-950 text-red-400'
                      }`}>
                        x{count}
                      </span>
                    )}

                    {/* Slot Icon */}
                    <div className="mb-1.5 p-2 rounded bg-slate-900/60 text-slate-300 group-hover:text-mars-cyan transition-colors">
                      <IconComponent className={`w-5 h-5 ${slot.tactileState === 'loading' ? 'animate-spin text-mars-amber' : ''}`} />
                    </div>

                    {/* Slot Title */}
                    <div className="text-[11px] font-display font-bold text-slate-200 truncate w-full text-center">
                      {slot.name}
                    </div>

                    {/* Effect Badge */}
                    <div className="text-[9px] font-mono text-mars-amber truncate w-full text-center mt-0.5">
                      {slot.effectLabel}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer: Cadet Leo Instructions */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-mars-border pt-3">
              <span>💡 Tap an item to use • Press [E] or [Esc] to exit</span>
              <button
                onClick={closeBackpack}
                className="btn-tactile px-4 py-1.5 rounded text-xs text-slate-200"
              >
                RESUME EXPEDITION
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BackpackModal;
