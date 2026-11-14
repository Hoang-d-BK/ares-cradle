import React, { useState } from 'react';
import { useMissionStore } from '../state/store';
import { ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Mountain, Layers } from 'lucide-react';

interface Layer {
  id: string;
  name: string;
  texture: string;
  clue: string;
  color: string;
}

const LAYERS: Layer[] = [
  {
    id: 'A',
    name: 'Flow Unit A (Vesicular Basalt)',
    texture: 'Ropey pahoehoe texture with trapped volcanic gas vesicles',
    clue: 'Flow morphology features gas vesicles. Stratigraphic contact reveals it spilled over oxidized red soil, but is capped by vertical basalt columns.',
    color: '#4A5568'
  },
  {
    id: 'B',
    name: 'Flow Unit B (Oxidized Red Regolith)',
    texture: 'Iron-rich oxidized weathered paleosol bench',
    clue: 'Ancient weathered soil bench. Microscopic inspection reveals a thermal contact bake zone along its top surface where hot lava passed over.',
    color: '#C53030'
  },
  {
    id: 'C',
    name: 'Flow Unit C (Columnar Jointed Cap)',
    texture: 'Dark grey polygonal vertical cooling basalt columns',
    clue: 'Polygonal cooling joints. Directly exposed to space with zero overlying deposits, exhibiting unweathered angular edges.',
    color: '#1A202C'
  },
  {
    id: 'D',
    name: 'Flow Unit D (Dense Olivine Base)',
    texture: 'High-density green-black crystalline volcanic basement bedrock',
    clue: 'Coarse crystalline rock forming the lowest canyon floor. Deepest foundational basement unit observed across the entire gorge.',
    color: '#2D3748'
  }
];

export const VolcanoStratigraphy: React.FC = () => {
  const completeMinigame = useMissionStore((s) => s.completeMinigame);
  const surveys = useMissionStore((s) => s.surveys);
  const perks = surveys.volcano.unlockedPerkIds;

  const hasEdgePerk = perks.includes('perk_volcano_edge');
  const hasCutPerk = perks.includes('perk_volcano_cut');

  // Initial shuffled order (e.g. B, C, D, A)
  const [orderedIds, setOrderedIds] = useState<string[]>(['B', 'C', 'D', 'A']);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...orderedIds];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setOrderedIds(next);
    setErrorNotice(null);
  };

  const moveDown = (index: number) => {
    if (index === orderedIds.length - 1) return;
    const next = [...orderedIds];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setOrderedIds(next);
    setErrorNotice(null);
  };

  const handleVerify = () => {
    // Law of superposition:
    // Top index 0 is YOUNGEST (Unit C)
    // Next index 1 is Unit A
    // Next index 2 is Unit B
    // Bottom index 3 is OLDEST (Unit D)
    const expectedFromTopToBottom = ['C', 'A', 'B', 'D'];

    let isCorrect = true;
    for (let i = 0; i < 4; i++) {
      if (orderedIds[i] !== expectedFromTopToBottom[i]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      completeMinigame('volcano');
    } else {
      setErrorNotice('Stratigraphic chronology contains superposition violations. Remember: younger lava flows cap older layers. Review bake zones.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1C2026] text-[#F4F1EA] p-6 rounded-lg font-sans border-2 border-[#E63946]/40 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4F1EA]/10 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#E63946] uppercase font-bold">Scientific Activity — Black Rock Terrace</span>
          <h2 className="text-2xl font-bold text-[#F4F1EA]">Lava Layer Chronology Ordering</h2>
          <p className="text-sm text-[#F4F1EA]/70">
            Arrange the 4 geological flow units from YOUNGEST (Top-most) to OLDEST (Deepest) using the Law of Superposition.
          </p>
        </div>
        <Mountain className="w-8 h-8 text-[#E63946]" />
      </div>

      {/* Perks Badge if unlocked */}
      {(hasEdgePerk || hasCutPerk) && (
        <div className="flex gap-2 mb-4">
          {hasEdgePerk && (
            <span className="px-2 py-1 bg-[#00D2FF]/20 border border-[#00D2FF] text-[#00D2FF] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Contact Margin Trace Active
            </span>
          )}
          {hasCutPerk && (
            <span className="px-2 py-1 bg-[#FFB800]/20 border border-[#FFB800] text-[#FFB800] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Cross-Section Schematic Active
            </span>
          )}
        </div>
      )}

      {/* Stratigraphic Stack Reorder */}
      <div className="space-y-3 my-auto max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between text-xs font-mono text-[#00D2FF] uppercase px-2">
          <span>▲ Top / Youngest (Exposed to Sky)</span>
          <Layers className="w-4 h-4" />
        </div>

        {orderedIds.map((id, index) => {
          const layer = LAYERS.find((l) => l.id === id)!;
          return (
            <div
              key={layer.id}
              className="p-4 rounded-lg border border-[#F4F1EA]/20 bg-[#16191E] flex items-center justify-between gap-4 transition-all shadow-md"
              style={{ borderLeftWidth: '6px', borderLeftColor: layer.color }}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-black/60 text-[#F4F1EA]">
                    Layer {layer.id}
                  </span>
                  <span className="font-bold text-sm text-[#F4F1EA]">{layer.name}</span>
                </div>
                <p className="text-xs text-[#F4F1EA]/70 italic">{layer.texture}</p>
                <p className="text-xs text-[#FFB800] bg-[#FFB800]/10 p-1.5 rounded border border-[#FFB800]/20">
                  🔍 {layer.clue}
                </p>
              </div>

              {/* Up / Down Controls */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveUp(index)}
                  className="p-2 bg-[#252A33] hover:bg-[#323945] disabled:opacity-30 disabled:cursor-not-allowed rounded border border-[#F4F1EA]/20 text-[#F4F1EA]"
                  title="Move layer up (younger)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === orderedIds.length - 1}
                  onClick={() => moveDown(index)}
                  className="p-2 bg-[#252A33] hover:bg-[#323945] disabled:opacity-30 disabled:cursor-not-allowed rounded border border-[#F4F1EA]/20 text-[#F4F1EA]"
                  title="Move layer down (older)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between text-xs font-mono text-[#00D2FF] uppercase px-2">
          <span>▼ Bottom / Oldest (Deep Canyon Floor)</span>
        </div>
      </div>

      {/* Error Notice */}
      {errorNotice && (
        <div className="mt-4 p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#F4F1EA]/10 flex items-center justify-between">
        <span className="text-xs text-[#F4F1EA]/60 font-mono">
          Principle: Steno's Law of Superposition — younger strata cap older rock units.
        </span>

        <button
          type="button"
          onClick={handleVerify}
          className="px-6 py-2.5 bg-[#E63946] hover:bg-[#ff4d5e] text-white font-bold text-sm tracking-wider uppercase rounded transition-all shadow-lg"
        >
          Verify Stratigraphic Sequence
        </button>
      </div>
    </div>
  );
};
