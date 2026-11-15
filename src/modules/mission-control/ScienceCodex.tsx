import React, { useEffect, useRef, useState } from 'react';
import { useExplorationDialog } from './useExplorationDialog';
import { ExternalLink, LockKeyhole, X } from 'lucide-react';
import type { RegionId } from '@/modules/outpost-3d/worldRegions';
import { WORLD_REGIONS } from '@/modules/outpost-3d/worldRegions';
import ImpactPracticePanel from './ImpactPracticePanel';
import type { ScientificElement } from '@/modules/outpost-3d/scienceCatalog';

export type ScienceEntry = ScientificElement;

export interface ScienceCodexProps {
  isOpen: boolean;
  entries: readonly ScienceEntry[];
  collectedIds: readonly string[];
  selectedEntryId: string | null;
  activeRegionId: RegionId | 'home';
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const ScienceCodex: React.FC<ScienceCodexProps> = ({ isOpen, entries, collectedIds, selectedEntryId, activeRegionId, onSelect, onClose }) => {
  const [filterRegion, setFilterRegion] = useState<RegionId | null>(activeRegionId === 'home' ? null : activeRegionId);
  const [practiceEntryId, setPracticeEntryId] = useState<string | null>(null);
  const practiceFocusReturnRef = useRef(false);
  const practiceLaunchRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const unlocked = new Set(collectedIds);
  const selected = entries.find((entry) => entry.id === selectedEntryId && unlocked.has(entry.id));
  useEffect(() => {
    if (selectedEntryId) {
      const selectedRegion = entries.find((entry) => entry.id === selectedEntryId)?.regionId;
      if (selectedRegion) setFilterRegion(selectedRegion);
    }
  }, [selectedEntryId, entries]);
  useEffect(() => { if (activeRegionId !== 'home') setFilterRegion(activeRegionId); }, [activeRegionId]);
  useEffect(() => {
    const currentEntry = entries.find((entry) => entry.id === practiceEntryId);
    if (practiceEntryId !== null && (!isOpen || selectedEntryId !== practiceEntryId || !currentEntry || currentEntry.regionId !== 'impact' || !collectedIds.includes(practiceEntryId))) {
      setPracticeEntryId(null);
    }
  }, [isOpen, practiceEntryId, selectedEntryId, entries, collectedIds]);
  const practiceActive = isOpen && practiceEntryId !== null && selected?.id === practiceEntryId && selected.regionId === 'impact';
  const exitPractice = () => {
    if (!practiceActive) return;
    practiceFocusReturnRef.current = true;
    setPracticeEntryId(null);
  };
  const startPractice = () => {
    if (!isOpen || !selected || selected.regionId !== 'impact') return;
    practiceFocusReturnRef.current = false;
    setPracticeEntryId(selected.id);
  };
  const selectEntry = (id: string) => {
    if (id !== selectedEntryId) {
      practiceFocusReturnRef.current = false;
      if (practiceEntryId !== null) setPracticeEntryId(null);
    }
    onSelect(id);
  };
  const closeCodex = () => {
    practiceFocusReturnRef.current = false;
    setPracticeEntryId(null);
    onClose();
  };
  const handleDialogEscape = () => {
    if (practiceActive) exitPractice();
    else closeCodex();
  };
  useEffect(() => {
    if (isOpen && !practiceActive && practiceFocusReturnRef.current) {
      practiceFocusReturnRef.current = false;
      practiceLaunchRef.current?.focus();
    }
  }, [isOpen, practiceActive]);
  useExplorationDialog(isOpen, handleDialogEscape, dialogRef);
  if (!isOpen) return null;
  const selectedRegion = filterRegion;
  const listed = entries.filter((entry) => selectedRegion === null || entry.regionId === selectedRegion);
  const activeRegionName = selectedRegion === null ? 'All regions' : WORLD_REGIONS.find((region) => region.id === selectedRegion)?.name ?? selectedRegion;
  return <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-[#080a0b]/85 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCodex(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="science-codex-title" className="flex min-w-0 max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-amber-100/25 bg-[#171a1c] text-white shadow-[0_12px_36px_rgba(0,0,0,.55)]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0 max-w-full"><h2 id="science-codex-title" className="text-lg font-semibold text-[#f1e1d3]">NASA Scientific Inspection</h2><p className="text-lg text-[#e4d4c7]">{collectedIds.length} of {entries.length} discoveries recorded</p></div>
        <button type="button" onClick={closeCodex} aria-label="Close science codex" className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><X className="h-5 w-5" /></button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-y-auto md:grid-cols-[minmax(14rem,.75fr)_minmax(0,1.25fr)]">
        <nav aria-label="Discoveries in this region" className="min-w-0 max-w-full border-b border-white/10 p-3 md:border-b-0 md:border-r">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-2" aria-label="Filter science notes by region">
            <button type="button" aria-pressed={selectedRegion === null} onClick={() => setFilterRegion(null)} className="min-h-10 shrink-0 rounded border border-white/15 px-2 text-xs text-[#e3d2c4] hover:bg-white/5">All</button>
            {WORLD_REGIONS.map((region) => <button key={region.id} type="button" aria-pressed={selectedRegion === region.id} onClick={() => setFilterRegion(region.id)} className="min-h-12 shrink-0 rounded border border-white/20 px-3 text-base text-[#f1e1d3] hover:bg-white/5">{region.id}</button>)}
          </div>
          <h3 className="px-2 pb-2 text-base font-semibold text-[#e3d2c4]">{activeRegionName} field notes</h3>
          <ul className="space-y-1">
            {listed.map((entry) => { const isUnlocked = unlocked.has(entry.id); return <li key={entry.id}><button type="button" disabled={!isUnlocked} onClick={() => selectEntry(entry.id)} aria-current={selected?.id === entry.id ? 'true' : undefined} className={`flex min-h-12 w-full items-center gap-2 rounded-md px-3 text-left text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed ${selected?.id === entry.id ? 'bg-amber-200/10 text-amber-50' : isUnlocked ? 'text-[#e3d2c4] hover:bg-white/5' : 'text-[#a4978c]'}`}>
              {isUnlocked ? <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-300" /> : <LockKeyhole aria-hidden="true" className="h-4 w-4" />}<span className="truncate">{isUnlocked ? entry.title : 'Undiscovered field note'}</span>
            </button></li>; })}
            {listed.length === 0 && <li className="px-2 py-3 text-sm text-[#b5a89d]">No entries for this region yet.</li>}
          </ul>
        </nav>
        <article className="min-h-48 min-w-0 max-w-full p-4 sm:p-6">
          {practiceActive ? <ImpactPracticePanel onExit={exitPractice} /> : selected ? <>
            <div className="mb-1 text-sm font-medium text-cyan-100">{selected.kind} · {selected.regionId}</div>
            <h3 className="text-2xl font-semibold text-[#f4e2d2]">{selected.title}</h3>
            <section className="mt-3 border-t border-white/10 pt-4" aria-labelledby="science-field-notes">
              <h4 id="science-field-notes" className="text-base font-semibold text-[#f1d5be]">Field Notes</h4>
              <p className="mt-2 text-lg leading-relaxed text-[#f1e1d3]"><strong>Science clue:</strong> {selected.summary}</p>
              <p className="mt-2 text-lg leading-relaxed text-[#e2d3c7]"><strong>Formation and scientific value:</strong> {selected.explanation}</p>
            </section>
            {selected.regionId === 'impact' && <div className="mt-5 border-t border-white/10 pt-4">
              <button ref={practiceLaunchRef} type="button" data-testid="start-impact-practice" onClick={startPractice} className="min-h-12 rounded-md border border-amber-200/40 px-4 text-lg font-semibold text-[#f4e2d2] hover:bg-amber-100/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Practice impact evidence</button>
              <p className="mt-2 text-sm text-[#cbb7a6]">Optional practice · not saved · does not affect supplies or exploration progress.</p>
            </div>}
            <div className="mt-5 border-t border-white/10 pt-4">
              <h4 className="text-base font-semibold text-[#f1d5be]">Source and attribution</h4>
              <p className="mt-1 text-base text-[#f1e1d3]">{selected.sourceTitle}{selected.sourceDate ? ` · ${selected.sourceDate}` : ''} · {selected.credit}</p>
              <p className="mt-2 text-lg leading-relaxed text-[#e2d3c7]"><strong>NASA observation and scope:</strong> {selected.sourceObservation} This citation is not a NASA endorsement of the authored scene.</p>
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-12 items-center gap-2 text-base text-cyan-100 underline decoration-cyan-200/60 underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Read NASA source <ExternalLink className="h-4 w-4" /></a>
            </div>
            <p className="mt-4 rounded-md border border-white/15 bg-black/25 p-3 text-lg leading-relaxed text-[#f1e1d3]"><strong>Evidence boundary:</strong> {selected.scienceBoundary}</p>
          </> : <div className="flex h-full min-h-48 flex-col items-center justify-center text-center"><LockKeyhole className="mb-3 h-6 w-6 text-[#bfae9f]" /><h3 className="text-sm font-semibold text-[#e5d7cb]">No recorded discovery selected</h3><p className="mt-1 max-w-sm text-sm text-[#b5a89d]">Explore nearby features and inspect them in the field to reveal their sourced notes.</p></div>}
        </article>
      </div>
    </section>
  </div>;
};

export default ScienceCodex;
