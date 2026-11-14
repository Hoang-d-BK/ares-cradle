import React, { useState } from 'react';
import { useMissionStore } from '../state/store';
import { Volume2, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface WaveformEvent {
  id: string;
  name: string;
  frequency: number;
  waveformType: string;
  craterDistance: string;
  correctPhoto: string;
  clue: string;
}

const EVENTS: WaveformEvent[] = [
  {
    id: 'ev-01',
    name: 'High-Frequency Chirp Event',
    frequency: 820,
    waveformType: 'sharp_peak',
    craterDistance: '42 km South-East',
    correctPhoto: 'photo_fresh_streak',
    clue: 'Sharp high-pitch acoustic signature points to a compact stony bolide crater.'
  },
  {
    id: 'ev-02',
    name: 'Dispersed Multi-Ring Rumble',
    frequency: 340,
    waveformType: 'broad_envelope',
    craterDistance: '128 km West Rim',
    correctPhoto: 'photo_nested_bowl',
    clue: 'Broad low-frequency reverberation reflects an impact into layered sedimentary crust.'
  },
  {
    id: 'ev-03',
    name: 'Double Blast Atmospheric Wave',
    frequency: 560,
    waveformType: 'twin_burst',
    craterDistance: '75 km North Mesa',
    correctPhoto: 'photo_cluster_pit',
    clue: 'Twin burst waveform shows meteoroid fragmentation before impacting as a crater cluster.'
  }
];

const PHOTOS = [
  {
    id: 'photo_fresh_streak',
    label: 'Crater A: High-Albedo Rayed Pit',
    desc: 'Deep central pit with bright radial ray rays extending 150m outward across red basalt.'
  },
  {
    id: 'photo_nested_bowl',
    label: 'Crater B: Layered Terraced Bowl',
    desc: 'Wide depression showing concentric rings exposed through stratified dust and bedrock.'
  },
  {
    id: 'photo_cluster_pit',
    label: 'Crater C: Twin Cluster Pits',
    desc: 'Two closely spaced impact depressions formed concurrently by split bolide fragments.'
  }
];

export const ImpactSeismology: React.FC = () => {
  const completeMinigame = useMissionStore((s) => s.completeMinigame);
  const surveys = useMissionStore((s) => s.surveys);
  const perks = surveys.impact.unlockedPerkIds;

  const hasPinsPerk = perks.includes('perk_impact_pins');
  const hasTagsPerk = perks.includes('perk_impact_tags');

  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedEventId, setSelectedEventId] = useState<string>(EVENTS[0].id);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const playSonification = (freq: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      setIsPlayingAudio(true);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => setIsPlayingAudio(false), 500);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  };

  const handleSelectPhoto = (photoId: string) => {
    setMatches((prev) => ({ ...prev, [selectedEventId]: photoId }));
    setErrorNotice(null);
  };

  const handleVerify = () => {
    let allCorrect = true;
    for (const ev of EVENTS) {
      if (matches[ev.id] !== ev.correctPhoto) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      completeMinigame('impact');
    } else {
      setErrorNotice('One or more waveform matches do not align with seismic distance and burst characteristics. Review clues and re-match.');
    }
  };

  const currentEvent = EVENTS.find((e) => e.id === selectedEventId) || EVENTS[0];
  const matchedCount = Object.keys(matches).length;

  return (
    <div className="flex flex-col h-full bg-[#1C2026] text-[#F4F1EA] p-6 rounded-lg font-sans border-2 border-[#FF5A1F]/40 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4F1EA]/10 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#FF5A1F] uppercase font-bold">Scientific Activity — Echo Crater</span>
          <h2 className="text-2xl font-bold text-[#F4F1EA]">Seismic Impact Waveform Matcher</h2>
          <p className="text-sm text-[#F4F1EA]/70">Correlate InSight seismic acoustic signals with MRO HiRISE orbital impact photographs.</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[#00D2FF]">Progress: {matchedCount}/3 Matched</span>
        </div>
      </div>

      {/* Perks Badge if unlocked */}
      {(hasPinsPerk || hasTagsPerk) && (
        <div className="flex gap-2 mb-4">
          {hasPinsPerk && (
            <span className="px-2 py-1 bg-[#00D2FF]/20 border border-[#00D2FF] text-[#00D2FF] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Wide/Close Alignment Aid Active
            </span>
          )}
          {hasTagsPerk && (
            <span className="px-2 py-1 bg-[#FFB800]/20 border border-[#FFB800] text-[#FFB800] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Provenance Tags Aid Active
            </span>
          )}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Left: Recorded Waveform Events */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase text-[#00D2FF] tracking-wider font-semibold">1. Select Seismic Event</h3>
          <div className="space-y-3">
            {EVENTS.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              const hasMatch = matches[ev.id];
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#FF5A1F] bg-[#FF5A1F]/10 shadow-md'
                      : 'border-[#F4F1EA]/20 bg-[#16191E] hover:border-[#F4F1EA]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#F4F1EA]">{ev.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSonification(ev.frequency);
                      }}
                      className="px-2 py-1 bg-[#00D2FF]/20 hover:bg-[#00D2FF]/40 border border-[#00D2FF] text-[#00D2FF] text-xs rounded flex items-center gap-1 font-mono"
                    >
                      <Volume2 className="w-3 h-3" /> {isPlayingAudio && isSelected ? 'Playing...' : 'Acoustic Sound'}
                    </button>
                  </div>

                  {/* SVG Waveform Visualization */}
                  <div className="h-12 bg-black/40 rounded p-1 mb-2 flex items-center justify-center">
                    <svg className="w-full h-full text-[#FF5A1F]" viewBox="0 0 200 40">
                      {ev.waveformType === 'sharp_peak' && (
                        <path d="M0,20 L40,20 L50,5 L60,35 L70,12 L80,26 L90,20 L200,20" fill="none" stroke="currentColor" strokeWidth="2" />
                      )}
                      {ev.waveformType === 'broad_envelope' && (
                        <path d="M0,20 Q30,5 60,20 T120,20 T180,20 L200,20" fill="none" stroke="currentColor" strokeWidth="2" />
                      )}
                      {ev.waveformType === 'twin_burst' && (
                        <path d="M0,20 L30,20 L40,8 L50,30 L60,20 L90,20 L100,10 L110,28 L120,20 L200,20" fill="none" stroke="currentColor" strokeWidth="2" />
                      )}
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#F4F1EA]/60 font-mono">
                    <span>Target Range: {ev.craterDistance}</span>
                    <span className={hasMatch ? 'text-green-400 font-bold' : 'text-gray-400'}>
                      {hasMatch ? `Matched → ${hasMatch.replace('photo_', '').toUpperCase()}` : 'Unmatched'}
                    </span>
                  </div>

                  {isSelected && hasTagsPerk && (
                    <p className="mt-2 text-xs text-[#FFB800] bg-[#FFB800]/10 p-2 rounded border border-[#FFB800]/20 font-mono">
                      🏷️ Provenance Tag Aid: {ev.clue}
                    </p>
                  )}
                  {isSelected && !hasTagsPerk && (
                    <p className="mt-2 text-xs text-[#F4F1EA]/50 font-mono italic">
                      Analyze acoustic pitch and shockwave envelope to infer meteoroid fragmentation and impact morphology.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Orbital Photo Candidates */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase text-[#00D2FF] tracking-wider font-semibold">
            2. Match with Orbital Crater Imagery
          </h3>
          <p className="text-xs text-[#F4F1EA]/70">
            Selected for: <strong className="text-[#FF5A1F]">{currentEvent.name}</strong>
          </p>

          <div className="space-y-3">
            {PHOTOS.map((photo) => {
              const isAssignedToCurrent = matches[currentEvent.id] === photo.id;
              return (
                <div
                  key={photo.id}
                  onClick={() => handleSelectPhoto(photo.id)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isAssignedToCurrent
                      ? 'border-[#00D2FF] bg-[#00D2FF]/10 ring-1 ring-[#00D2FF]'
                      : 'border-[#F4F1EA]/20 bg-[#16191E] hover:border-[#F4F1EA]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#F4F1EA]">{photo.label}</span>
                    {isAssignedToCurrent && (
                      <span className="px-2 py-0.5 bg-[#00D2FF] text-black text-xs font-bold rounded">Active Match</span>
                    )}
                  </div>
                  <p className="text-xs text-[#F4F1EA]/80 leading-relaxed">{photo.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error / Feedback Notice */}
      {errorNotice && (
        <div className="mt-4 p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="mt-6 pt-4 border-t border-[#F4F1EA]/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#F4F1EA]/60">
          <HelpCircle className="w-4 h-4" />
          <span>Need help? Listen to acoustic frequencies or check the distance notes.</span>
        </div>
        <button
          type="button"
          disabled={matchedCount < 3}
          onClick={handleVerify}
          className={`px-6 py-2.5 font-bold text-sm tracking-wider uppercase rounded transition-all shadow-lg ${
            matchedCount === 3
              ? 'bg-[#FF5A1F] hover:bg-[#ff723f] text-black ring-2 ring-[#FF5A1F]'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          Verify All 3 Matches
        </button>
      </div>
    </div>
  );
};
