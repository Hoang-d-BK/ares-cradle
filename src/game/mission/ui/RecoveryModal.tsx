import React from 'react';
import { useMissionStore } from '../state/store';
import { X, ShieldAlert, HeartHandshake } from 'lucide-react';

interface RecoveryModalProps {
  onClose: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({ onClose }) => {
  const currentRegion = useMissionStore((s) => s.currentRegion);
  const supportBaseId = useMissionStore((s) => s.supportBaseId);
  const bases = useMissionStore((s) => s.bases);
  const requestRecoverySupport = useMissionStore((s) => s.requestRecoverySupport);

  const activeBase = bases[supportBaseId] || bases[currentRegion];

  const handleConfirmRecovery = () => {
    requestRecoverySupport(activeBase.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#1C2026] border-2 border-[#FFB800] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-[#F4F1EA]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#F4F1EA]/10 bg-[#16191E]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-[#FFB800]" />
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wider text-[#F4F1EA] uppercase">
                Autonomous Safety Net Protocol (I04)
              </h2>
              <p className="text-xs text-[#F4F1EA]/70">
                Resupply assistance for {activeBase.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[#F4F1EA]/10 rounded-lg text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#F4F1EA]/90 leading-relaxed">
            Cadet Leo, outpost resources have fallen below the essential threshold required to run this shift.
          </p>

          <div className="p-4 bg-black/40 rounded-lg border border-[#F4F1EA]/10 space-y-2 text-xs font-mono">
            <span className="text-[#00D2FF] font-bold block uppercase">Current Outpost Reserves:</span>
            <div className="grid grid-cols-2 gap-2 text-[#F4F1EA]/80">
              <div>Energy: <strong className="text-[#FFB800]">{activeBase.resources.energy} EU</strong> (Need 2)</div>
              <div>Rations: <strong className="text-orange-400">{activeBase.resources.meals} Meals</strong> (Need 1)</div>
              <div>Water: <strong className="text-[#00D2FF]">{activeBase.resources.water} Portions</strong> (Need 1)</div>
              <div>Air: <strong className="text-cyan-300">{activeBase.resources.airPacks} Packs</strong> (Need 1)</div>
            </div>
          </div>

          <div className="p-3 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded text-xs text-[#FFB800] space-y-1">
            <span className="font-bold block">🛡️ Educational Safety Net Guarantee:</span>
            <span>
              NASA Junior Mission Trainer guarantees mistake-safe recovery. Requesting emergency assistance will safely replenish minimum required buffers without resetting your scientific observations or penalizing your score.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#16191E] border-t border-[#F4F1EA]/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#F4F1EA]/20 text-[#F4F1EA]/70 hover:bg-[#F4F1EA]/10 rounded text-xs font-mono uppercase"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmRecovery}
            className="px-6 py-2.5 bg-[#FFB800] hover:bg-[#ffc833] text-black font-bold font-mono text-xs uppercase rounded transition-all shadow-lg flex items-center gap-2"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Receive Emergency Resupply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
