import React, { useState } from 'react';
import { useMissionStore } from '../state/store';
import { Camera, CheckCircle2, Crosshair, MapPin, ZoomIn, Sliders, AlertCircle } from 'lucide-react';

interface Target {
  id: string;
  name: string;
  targetType: string;
  clue: string;
}

const TARGETS: Target[] = [
  {
    id: 'tgt-01',
    name: 'Target Alpha: Laminated Delta Siltstone',
    targetType: 'Sedimentary Lake Clay',
    clue: 'Fine rhythmite layers deposited at the mouth of the dried river delta.'
  },
  {
    id: 'tgt-02',
    name: 'Target Beta: Carbonate Crust Margin',
    targetType: 'Chemical Evaporite Precipitate',
    clue: 'Mineral crust precipitated as the paleolake shrank during global climate desiccation.'
  },
  {
    id: 'tgt-03',
    name: 'Target Gamma: Potential Biosignature Matrix',
    targetType: 'Reduced Organic-Bearing Mudstone',
    clue: 'Dark organic candidate requiring witness tube blank verification before caching.'
  }
];

export const LakeContextSurvey: React.FC = () => {
  const completeMinigame = useMissionStore((s) => s.completeMinigame);
  const surveys = useMissionStore((s) => s.surveys);
  const perks = surveys.lake.unlockedPerkIds;

  const hasFilterPerk = perks.includes('perk_lake_filter');
  const hasChecklistPerk = perks.includes('perk_lake_check');

  const [activeTargetId, setActiveTargetId] = useState<string>(TARGETS[0].id);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 10x
  const [focusError, setFocusError] = useState<string | null>(null);

  // Track captured records: targetId -> { wide: boolean; macro: boolean; gps: boolean }
  const [captured, setCaptured] = useState<Record<string, { wide: boolean; macro: boolean; gps: boolean }>>({
    'tgt-01': { wide: false, macro: false, gps: false },
    'tgt-02': { wide: false, macro: false, gps: false },
    'tgt-03': { wide: false, macro: false, gps: false },
  });

  const activeTarget = TARGETS.find((t) => t.id === activeTargetId)!;
  const activeRecord = captured[activeTargetId];

  const handleCaptureWide = () => {
    if (zoomLevel > 2.5) {
      setFocusError('Field of view is too narrow! Set camera zoom to Wide range (1.0x – 2.5x) to frame surrounding landscape context.');
      return;
    }
    setFocusError(null);
    setCaptured((prev) => ({
      ...prev,
      [activeTargetId]: { ...prev[activeTargetId], wide: true }
    }));
  };

  const handleCaptureMacro = () => {
    if (zoomLevel < 7) {
      setFocusError('Magnification insufficient! Zoom camera into Macro range (7.0x – 10.0x) to resolve microscopic mineral cross-bedding.');
      return;
    }
    setFocusError(null);
    setCaptured((prev) => ({
      ...prev,
      [activeTargetId]: { ...prev[activeTargetId], macro: true }
    }));
  };

  const handleCaptureGps = () => {
    setFocusError(null);
    setCaptured((prev) => ({
      ...prev,
      [activeTargetId]: { ...prev[activeTargetId], gps: true }
    }));
  };

  // Check if all 3 targets have all 3 documentation types
  const allComplete = TARGETS.every((t) => {
    const r = captured[t.id];
    return r.wide && r.macro && r.gps;
  });

  const handleCommit = () => {
    if (allComplete) {
      completeMinigame('lake');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1C2026] text-[#F4F1EA] p-6 rounded-lg font-sans border-2 border-[#2A9D8F]/40 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4F1EA]/10 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#2A9D8F] uppercase font-bold">Scientific Activity — Ancient Lake Shore</span>
          <h2 className="text-2xl font-bold text-[#F4F1EA]">Context-Rich Target Documentation</h2>
          <p className="text-sm text-[#F4F1EA]/70">
            Survey 3 priority geological targets with Mast Camera Wide View, Arm Micro-Texture, and Spatial Coordinates.
          </p>
        </div>
        <Camera className="w-8 h-8 text-[#2A9D8F]" />
      </div>

      {/* Perks Badge if unlocked */}
      {(hasFilterPerk || hasChecklistPerk) && (
        <div className="flex gap-2 mb-4">
          {hasFilterPerk && (
            <span className="px-2 py-1 bg-[#00D2FF]/20 border border-[#00D2FF] text-[#00D2FF] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Target High-Contrast Reticle Active
            </span>
          )}
          {hasChecklistPerk && (
            <span className="px-2 py-1 bg-[#FFB800]/20 border border-[#FFB800] text-[#FFB800] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Automatic Verification Checklist Active
            </span>
          )}
        </div>
      )}

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Left: Target Selection Tabs */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase text-[#2A9D8F] font-bold tracking-wider">1. Select Geological Target</h3>
          {TARGETS.map((t) => {
            const isSelected = t.id === activeTargetId;
            const rec = captured[t.id];
            const isDone = rec.wide && rec.macro && rec.gps;

            return (
              <div
                key={t.id}
                onClick={() => {
                  setActiveTargetId(t.id);
                  setFocusError(null);
                }}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#2A9D8F] bg-[#2A9D8F]/15 shadow-md'
                    : 'border-[#F4F1EA]/20 bg-[#16191E] hover:border-[#F4F1EA]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#F4F1EA]">{t.name}</span>
                  {isDone ? (
                    <span className="text-green-400 font-bold text-xs">✓ Certified</span>
                  ) : (
                    <span className="text-xs text-[#F4F1EA]/40 font-mono">
                      {[rec.wide, rec.macro, rec.gps].filter(Boolean).length}/3
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#2A9D8F] block font-mono">{t.targetType}</span>
              </div>
            );
          })}

          <div className="p-3 bg-black/40 rounded border border-[#F4F1EA]/10 text-xs text-[#F4F1EA]/70 mt-4">
            <span className="text-[#FFB800] font-bold block mb-1">💡 Scientific Rule:</span>
            A potential biosignature candidate must never be claimed from a single photo without surrounding stratigraphic context and witness tube verification.
          </div>
        </div>

        {/* Center & Right: Mastcam Optical Viewfinder & Calibration Controls */}
        <div className="md:col-span-2 space-y-4 flex flex-col">
          {/* Target Banner */}
          <div className="flex items-center justify-between bg-[#16191E] p-3 rounded border border-[#F4F1EA]/20">
            <div>
              <span className="text-xs font-mono text-[#00D2FF]">Active Sensor Focus</span>
              <h4 className="font-bold text-sm text-[#F4F1EA]">{activeTarget.name}</h4>
              <p className="text-xs text-[#F4F1EA]/70">{activeTarget.clue}</p>
            </div>
            <Crosshair className={`w-6 h-6 ${hasFilterPerk ? 'text-[#00D2FF] animate-pulse' : 'text-[#2A9D8F]'}`} />
          </div>

          {/* Interactive Optical Zoom Calibration Slider */}
          <div className="p-4 bg-[#12151A] rounded-lg border border-[#F4F1EA]/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#00D2FF] font-bold">
                <Sliders className="w-3.5 h-3.5" /> Mastcam-Z Optical Focal Length:
              </span>
              <strong className="text-sm text-[#F4F1EA]">{zoomLevel.toFixed(1)}x Magnification</strong>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={zoomLevel}
              onChange={(e) => {
                setZoomLevel(parseFloat(e.target.value));
                setFocusError(null);
              }}
              className="w-full accent-[#2A9D8F] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-[#F4F1EA]/50">
              <span className={zoomLevel <= 2.5 ? 'text-green-400 font-bold' : ''}>1.0x (Wide Angle)</span>
              <span>5.0x (Mid-Range)</span>
              <span className={zoomLevel >= 7 ? 'text-green-400 font-bold' : ''}>10.0x (Macro Imager)</span>
            </div>
          </div>

          {/* Error / Feedback notification */}
          {focusError && (
            <div className="p-3 bg-yellow-950/80 border border-yellow-500 text-yellow-200 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400" />
              <span>{focusError}</span>
            </div>
          )}

          {/* Three Documentation Capture Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* 1. Wide Angle Context */}
            <div className={`p-4 rounded border flex flex-col justify-between ${
              activeRecord.wide ? 'border-green-500 bg-green-950/20' : 'border-[#F4F1EA]/20 bg-[#16191E]'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#00D2FF]">A. Landscape Context</span>
                  {activeRecord.wide && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xs text-[#F4F1EA]/70">
                  Requires Wide Range (1.0x – 2.5x). Frames sedimentary layers and surrounding delta bedding.
                </p>
              </div>

              <button
                type="button"
                disabled={activeRecord.wide}
                onClick={handleCaptureWide}
                className={`mt-4 w-full py-2 px-3 rounded text-xs font-bold font-mono uppercase flex items-center justify-center gap-1 ${
                  activeRecord.wide
                    ? 'bg-green-700/50 text-green-200 cursor-default'
                    : 'bg-[#2A9D8F] hover:bg-[#34bba9] text-black shadow'
                }`}
              >
                <Camera className="w-3 h-3" />
                {activeRecord.wide ? 'Captured ✓' : 'Capture Wide Shot'}
              </button>
            </div>

            {/* 2. Microscopic Arm Texture */}
            <div className={`p-4 rounded border flex flex-col justify-between ${
              activeRecord.macro ? 'border-green-500 bg-green-950/20' : 'border-[#F4F1EA]/20 bg-[#16191E]'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#00D2FF]">B. Micro-Texture</span>
                  {activeRecord.macro && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xs text-[#F4F1EA]/70">
                  Requires Macro Range (7.0x – 10.0x). Resolves sub-millimeter smectite clay grain laminations.
                </p>
              </div>

              <button
                type="button"
                disabled={activeRecord.macro}
                onClick={handleCaptureMacro}
                className={`mt-4 w-full py-2 px-3 rounded text-xs font-bold font-mono uppercase flex items-center justify-center gap-1 ${
                  activeRecord.macro
                    ? 'bg-green-700/50 text-green-200 cursor-default'
                    : 'bg-[#2A9D8F] hover:bg-[#34bba9] text-black shadow'
                }`}
              >
                <ZoomIn className="w-3 h-3" />
                {activeRecord.macro ? 'Captured ✓' : 'Inspect Microscopic'}
              </button>
            </div>

            {/* 3. Spatial Coordinates */}
            <div className={`p-4 rounded border flex flex-col justify-between ${
              activeRecord.gps ? 'border-green-500 bg-green-950/20' : 'border-[#F4F1EA]/20 bg-[#16191E]'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#00D2FF]">C. Spatial Coordinates</span>
                  {activeRecord.gps && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xs text-[#F4F1EA]/70">
                  Logs rover orientation azimuth, sun sensor vector, and witness tube blank verification tag.
                </p>
              </div>

              <button
                type="button"
                disabled={activeRecord.gps}
                onClick={handleCaptureGps}
                className={`mt-4 w-full py-2 px-3 rounded text-xs font-bold font-mono uppercase flex items-center justify-center gap-1 ${
                  activeRecord.gps
                    ? 'bg-green-700/50 text-green-200 cursor-default'
                    : 'bg-[#2A9D8F] hover:bg-[#34bba9] text-black shadow'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {activeRecord.gps ? 'Recorded ✓' : 'Log Coordinates'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#F4F1EA]/10 flex items-center justify-between">
        <span className="text-xs text-[#F4F1EA]/60 font-mono">
          Perseverance Astrobiology Standard: All samples require Macro texture, Landscape context, and Witness tube provenance.
        </span>

        <button
          type="button"
          disabled={!allComplete}
          onClick={handleCommit}
          className={`px-6 py-2.5 font-bold text-sm tracking-wider uppercase rounded transition-all shadow-lg ${
            allComplete
              ? 'bg-[#2A9D8F] hover:bg-[#36c7b4] text-black ring-2 ring-[#2A9D8F]'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          {allComplete ? 'Commit Survey Documentation' : 'Complete All Targets First'}
        </button>
      </div>
    </div>
  );
};
