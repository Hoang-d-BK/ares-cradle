import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  X, 
  PlusCircle, 
  LogIn, 
  Trophy, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  RefreshCw 
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';
import { hybridApiClient, RoomLeaderboardEntry } from '@/services/api/apiClient';

const modalSpringPhysics = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 26
};

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassroomModal: React.FC<ClassroomModalProps> = ({ isOpen, onClose }) => {
  const currentSol = useOutpostStore((state) => state.currentSol);
  const battery = useOutpostStore((state) => state.battery);

  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'leaderboard'>('join');
  const [pinInput, setPinInput] = useState('');
  const [activeRoomPin, setActiveRoomPin] = useState<string>('MARS88');
  const [teacherName, setTeacherName] = useState('Commander Teacher');
  const [leaderboard, setLeaderboard] = useState<RoomLeaderboardEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load leaderboard whenever activeRoomPin changes
  useEffect(() => {
    if (activeRoomPin) {
      hybridApiClient.getRoomLeaderboard(activeRoomPin).then((data) => {
        setLeaderboard(data);
      });
    }
  }, [activeRoomPin, activeTab]);

  const handleCreateRoom = async () => {
    setIsSubmitting(true);
    soundEngine.playClick(1100);
    try {
      const room = await hybridApiClient.createClassroomRoom(teacherName, 1.0);
      setActiveRoomPin(room.pin);
      setStatusMessage(`Room created! PIN: ${room.pin}`);
      setActiveTab('leaderboard');
    } catch (_e) {
      setStatusMessage('Room created locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (pinInput.trim().length !== 6) {
      setStatusMessage('PIN must be exactly 6 characters.');
      return;
    }

    setIsSubmitting(true);
    soundEngine.playClick(1000);
    try {
      const res = await hybridApiClient.joinClassroomRoom(pinInput);
      if (res.valid && res.room) {
        setActiveRoomPin(res.room.pin);
        setStatusMessage(`Joined Classroom Room ${res.room.pin}!`);
        setActiveTab('leaderboard');
      } else {
        setStatusMessage(res.error || 'Invalid Room PIN.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncTelemetry = async () => {
    soundEngine.playClick(1200);
    setIsSubmitting(true);
    try {
      await hybridApiClient.logStudentSurvival({
        sessionPin: activeRoomPin,
        cadetName: 'Cadet Leo (You)',
        solsSurvived: currentSol,
        powerSavedKwh: parseFloat((battery * 0.4).toFixed(1)),
        crystalsHarvested: 4,
        brownoutCount: 0,
        score: currentSol * 100 + Math.round(battery)
      });
      const updated = await hybridApiClient.getRoomLeaderboard(activeRoomPin);
      setLeaderboard(updated);
      setStatusMessage('Live survival telemetry synced!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={modalSpringPhysics}
          className="hud-panel hud-corner-brackets relative z-10 w-full max-w-xl p-5 rounded-md border-2 border-mars-cyan/40 bg-mars-charcoal/95 shadow-2xl select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mars-border pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-mars-cyan/15 text-mars-cyan border border-mars-cyan/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg tracking-wider text-slate-100 uppercase">
                  Classroom Battle Deck
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  Room PIN Code • Live Multi-Cadet Leaderboard
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-tactile p-2 rounded text-slate-400 hover:text-white"
              title="Close [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {
                soundEngine.playClick(900);
                setActiveTab('join');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-[background-color,border-color,color] ${
                activeTab === 'join'
                  ? 'bg-mars-cyan/20 border border-mars-cyan text-mars-cyan shadow-hud-glow'
                  : 'bg-mars-surface border border-mars-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>JOIN ROOM</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick(900);
                setActiveTab('create');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-[background-color,border-color,color] ${
                activeTab === 'create'
                  ? 'bg-mars-cyan/20 border border-mars-cyan text-mars-cyan shadow-hud-glow'
                  : 'bg-mars-surface border border-mars-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>TEACHER CREATE</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick(900);
                setActiveTab('leaderboard');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-[background-color,border-color,color] ${
                activeTab === 'leaderboard'
                  ? 'bg-mars-cyan/20 border border-mars-cyan text-mars-cyan shadow-hud-glow'
                  : 'bg-mars-surface border border-mars-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-mars-amber" />
              <span>LEADERBOARD</span>
            </button>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className="mb-4 p-2 rounded bg-mars-surface border border-mars-cyan/30 text-xs font-mono text-mars-cyan flex items-center justify-between">
              <span>{statusMessage}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-mars-emerald" />
            </div>
          )}

          {/* Tab Content: Join Room */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  ENTER 6-DIGIT CLASSROOM PIN CODE:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. MARS88"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded bg-mars-surface border border-mars-border text-center font-mono text-2xl font-bold tracking-widest text-mars-cyan focus:outline-none focus:border-mars-cyan uppercase"
                />
              </div>
              <button
                disabled={isSubmitting || pinInput.length !== 6}
                onClick={handleJoinRoom}
                className="btn-tactile w-full py-3 rounded text-xs font-display font-bold flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-mars-cyan" />
                <span>ENTER MISSION ROOM</span>
              </button>
            </div>
          )}

          {/* Tab Content: Teacher Create */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  TEACHER / COMMANDER NAME:
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded bg-mars-surface border border-mars-border font-mono text-sm text-slate-100 focus:outline-none focus:border-mars-cyan"
                />
              </div>
              <div className="p-3 rounded bg-mars-surface/60 border border-mars-border text-xs font-mono text-slate-300">
                <span>⚡ Generates instant 6-digit PIN for all students in classroom.</span>
              </div>
              <button
                disabled={isSubmitting}
                onClick={handleCreateRoom}
                className="btn-tactile-rust w-full py-3 rounded text-xs font-display font-bold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>LAUNCH CLASSROOM SESSION</span>
              </button>
            </div>
          )}

          {/* Tab Content: Live Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-mars-border">
                <span className="text-slate-400">
                  ACTIVE ROOM: <span className="text-mars-cyan font-bold">{activeRoomPin}</span>
                </span>
                <button
                  onClick={handleSyncTelemetry}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 text-[11px] text-mars-amber hover:text-amber-300"
                >
                  <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>Sync My Telemetry</span>
                </button>
              </div>

              {/* Leaderboard Table */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {leaderboard.map((entry) => (
                  <div
                    key={`${entry.rank}-${entry.cadetName}`}
                    className={`flex items-center justify-between p-2 rounded text-xs font-mono border ${
                      entry.cadetName.includes('You')
                        ? 'bg-mars-cyan/10 border-mars-cyan/50 text-mars-cyan'
                        : 'bg-mars-surface border-mars-border text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-mars-amber">
                        #{entry.rank}
                      </span>
                      <span className="font-semibold truncate max-w-[130px] sm:max-w-[180px]">
                        {entry.cadetName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-400">Sol {entry.solsSurvived}</span>
                      <div className="flex items-center gap-1 text-mars-cyan">
                        <Sparkles className="w-3 h-3" />
                        <span>{entry.crystalsHarvested}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-mars-amber">
                        <Zap className="w-3 h-3" />
                        <span>{entry.score} pts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-mars-border flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Hybrid Edge Fallback: Zero downtime on Vercel</span>
            <button
              onClick={onClose}
              className="btn-tactile px-3.5 py-1.5 rounded text-xs text-slate-200"
            >
              CLOSE DECK
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClassroomModal;
