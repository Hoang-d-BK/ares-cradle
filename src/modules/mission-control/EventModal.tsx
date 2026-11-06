import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Wind, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  ThermometerSnowflake 
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { GameEvent } from '@/modules/simulation-engine/types';

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dust_storm: Wind,
  hull_leak: ShieldAlert,
  extreme_cold: ThermometerSnowflake,
  solar_flare: AlertTriangle
};

export const EventModal: React.FC = () => {
  const activeEvents = useOutpostStore((state) => state.activeEvents);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, boolean>>({});

  // Find the first active, unresolved, and unacknowledged event
  const currentEvent: GameEvent | undefined = activeEvents.find(
    (e) => e.active && !e.resolved && !acknowledgedIds[e.id]
  );

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => ({ ...prev, [id]: true }));
  };

  if (!currentEvent) return null;

  const Icon = eventIcons[currentEvent.type] || AlertTriangle;
  const isCritical = currentEvent.severity === 'critical';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: [0, -3, 3, -2, 2, 0] 
          }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1]
          }}
          className={`hud-panel max-w-md w-full p-5 rounded border-2 shadow-2xl ${
            isCritical
              ? 'border-mars-crimson bg-slate-950/95 shadow-[0_0_35px_rgba(239,68,68,0.35)]'
              : 'border-mars-amber bg-slate-950/95 shadow-[0_0_35px_rgba(255,176,32,0.35)]'
          }`}
        >
          {/* Header: Hazard Beacon & Level */}
          <div className="flex items-center gap-3 border-b border-mars-border pb-3 mb-4">
            <div
              className={`p-2.5 rounded-full ${
                isCritical ? 'bg-red-500/20 text-mars-crimson' : 'bg-amber-500/20 text-mars-amber'
              } animate-pulse`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border uppercase ${
                    isCritical
                      ? 'border-red-500/40 text-red-400 bg-red-950/40'
                      : 'border-amber-500/40 text-amber-400 bg-amber-950/40'
                  }`}
                >
                  {isCritical ? 'CRITICAL HAZARD' : 'TELEMETRY WARNING'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">OUTPOST PROTOCOL</span>
              </div>
              <h2 className="text-lg font-display font-bold tracking-wide text-slate-100 mt-0.5">
                {currentEvent.title}
              </h2>
            </div>
          </div>

          {/* Description Body */}
          <p className="text-sm font-sans text-slate-300 leading-relaxed mb-4">
            {currentEvent.description}
          </p>

          {/* Cadet Actionable Engineering Hint */}
          <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-start gap-2.5 mb-5">
            <HelpCircle className="w-4 h-4 text-mars-cyan shrink-0 mt-0.5" />
            <div className="text-xs font-mono text-slate-300">
              <span className="text-mars-cyan font-semibold uppercase block mb-0.5">
                CADET TACTICAL DIRECTIVE:
              </span>
              {currentEvent.hint}
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAcknowledge(currentEvent.id)}
            className={`w-full py-3 px-4 rounded text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 border shadow-lg ${
              isCritical ? 'btn-tactile-rust' : 'btn-tactile border-mars-amber text-amber-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ACKNOWLEDGE & ENGAGE PROTOCOL</span>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventModal;
