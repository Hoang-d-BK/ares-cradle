import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const catalog = await loadTsModule('../../src/modules/outpost-3d/scienceCatalog.ts', import.meta.url);
const sites = await loadTsModule('../../src/modules/outpost-3d/naturalSiteDefinitions.ts', import.meta.url);
const interaction = await loadTsModule('../../src/modules/outpost-3d/scienceInteraction.ts', import.meta.url);
const { SCIENTIFIC_ELEMENTS } = catalog;
const { NATURAL_INSPECTION_PROXIES } = sites;
const { SCIENCE_INTERACTION_RANGE, SCIENCE_GROUNDED_HEIGHT_TOLERANCE, getScientificInspectionCandidate, canInspectScientificElement, validateScientificInspection } = interaction;
const grounded = (x, z) => [x, world.sampleWorldGround(x, z), z];
const human = { isRemote: false, remoteRegionId: null, grounded: true };

test('shared selector applies 4.5m approach reach to visible proxy edges', () => {
  assert.equal(SCIENCE_INTERACTION_RANGE, 4.5);
  const element = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'ice.science-1');
  const proxy = NATURAL_INSPECTION_PROXIES.find((entry) => entry.scienceId === element.id && entry.radius < 3);
  const inside = grounded(proxy.position.x + proxy.radius + 4.499, proxy.position.z);
  const edge = grounded(proxy.position.x + proxy.radius + 4.5, proxy.position.z);
  const outside = grounded(proxy.position.x + proxy.radius + 4.5001, proxy.position.z);
  assert.equal(getScientificInspectionCandidate([element], inside, human)?.element.id, element.id);
  assert.equal(getScientificInspectionCandidate([element], edge, human)?.element.id, element.id);
  assert.equal(getScientificInspectionCandidate([element], outside, human), null);
  assert.equal(canInspectScientificElement(element, edge, human), true);
  assert.equal(validateScientificInspection(element, outside, human), 'too-far-from-element');
});

test('large visible footprints remain locally inspectable without a global radius', () => {
  const element = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'volcano.science-1');
  const proxy = NATURAL_INSPECTION_PROXIES.find((entry) => entry.scienceId === element.id && entry.radius > 10);
  const nearRim = grounded(proxy.position.x + proxy.radius + 4.49, proxy.position.z);
  const farBeyondFootprint = grounded(proxy.position.x + proxy.radius + SCIENCE_INTERACTION_RANGE + 0.01, proxy.position.z);
  assert.equal(getScientificInspectionCandidate([element], nearRim, human)?.proxy, proxy);
  assert.equal(getScientificInspectionCandidate([element], farBeyondFootprint, human), null);
});

test('the closest specific volcanic proxy wins inside the overlapping shield footprint', () => {
  const at = (x, z) => grounded(x, z);
  const ventCenter = at(-247, 254);
  const ventApproach = at(-242, 254);
  const tubeCenter = at(-260, 262);
  const shieldApproach = at(-268, 244);
  const candidate = (pose, options = human) => getScientificInspectionCandidate(SCIENTIFIC_ELEMENTS, pose, options);

  for (const pose of [ventCenter, ventApproach]) {
    const selected = candidate(pose);
    assert.equal(selected?.element.id, 'volcano.science-3');
    assert.equal(selected?.proxy.label, 'Fissure vent teaching feature');
    assert.equal(canInspectScientificElement(selected?.element, pose, human), true);
  }
  assert.equal(candidate(tubeCenter)?.element.id, 'volcano.science-2');
  assert.equal(candidate(shieldApproach, human)?.element.id, 'volcano.science-1');
  assert.equal(candidate(ventApproach, { isRemote: true, remoteRegionId: 'volcano', grounded: true })?.element.id, 'volcano.science-3');
  assert.equal(candidate(ventApproach, { isRemote: true, remoteRegionId: 'dust', grounded: true }), null);
});

test('each canonical collection point still selects its own science entry', () => {
  for (const element of SCIENTIFIC_ELEMENTS) {
    const pose = grounded(element.position.x, element.position.z);
    assert.equal(getScientificInspectionCandidate(SCIENTIFIC_ELEMENTS, pose, human)?.element.id, element.id, element.id);
  }
});

test('eligibility rejects airborne, wrong-sector, home, invalid height, and malformed contexts', () => {
  const element = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'impact.science-1');
  const proxy = NATURAL_INSPECTION_PROXIES.find((entry) => entry.scienceId === element.id);
  const atSite = grounded(proxy.position.x, proxy.position.z);
  assert.equal(getScientificInspectionCandidate([element], atSite, { ...human, grounded: false }), null);
  assert.equal(getScientificInspectionCandidate([element], atSite, { isRemote: true, remoteRegionId: 'ice', grounded: true }), null);
  assert.equal(getScientificInspectionCandidate([element], grounded(0, 0), human), null);
  assert.equal(getScientificInspectionCandidate([element], [atSite[0], atSite[1] + SCIENCE_GROUNDED_HEIGHT_TOLERANCE + 0.01, atSite[2]], human), null);
  assert.equal(validateScientificInspection(element, atSite, { isRemote: true, remoteRegionId: null, grounded: true }), 'invalid-context');
  assert.equal(getScientificInspectionCandidate([element], [Number.NaN, atSite[1], atSite[2]], human), null);
  assert.equal(validateScientificInspection(undefined, atSite, human), 'unknown-element');
});

test('remote inspection requires assigned rover and actual matching region', () => {
  const element = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'lake.science-2');
  const proxy = NATURAL_INSPECTION_PROXIES.find((entry) => entry.scienceId === element.id && entry.radius < 3);
  const pose = grounded(proxy.position.x, proxy.position.z);
  assert.equal(getScientificInspectionCandidate([element], pose, { isRemote: true, remoteRegionId: 'lake', grounded: true })?.element.id, element.id);
  assert.equal(getScientificInspectionCandidate([element], pose, { isRemote: true, remoteRegionId: 'dust', grounded: true }), null);
});
