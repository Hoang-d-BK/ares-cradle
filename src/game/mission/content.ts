import type { RegionDefinition, RegionId } from './contract';

export const REGION_IDS: RegionId[] = ['impact', 'dust', 'volcano', 'ice', 'lake'];

export const SOURCES = [
  {
    id: 'nasa-insight-impacts',
    title: 'NASA InSight hears meteoroid impacts',
    url: 'https://www.nasa.gov/missions/insight/nasas-insight-hears-its-first-meteoroid-impacts-on-mars/',
    note: 'Impact signals and images are evidence for comparison, not proof from sound alone.',
  },
  {
    id: 'nasa-martian-dust',
    title: 'NASA: Fact and fiction of Martian dust storms',
    url: 'https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/',
    note: 'Dust can affect light and equipment without behaving like an Earth hurricane.',
  },
  {
    id: 'nasa-lava-flow',
    title: 'NASA Science: Lava flow near Olympus Mons',
    url: 'https://science.nasa.gov/resource/lava-flow-near-the-base-of-olympus-mons/',
    note: 'Layer relationships support relative order, not an exact age.',
  },
  {
    id: 'nasa-glacial-ice',
    title: 'NASA Science: Glacial ice deposits',
    url: 'https://science.nasa.gov/resource/glacial-ice-deposits-in-mid-latitudes-of-mars/',
    note: 'Subsurface ice evidence is distinct from treated drinking water.',
  },
  {
    id: 'nasa-dry-ice',
    title: 'NASA Science: Dry ice on Mars',
    url: 'https://science.nasa.gov/resource/dry-ice-on-mars/',
    note: 'Water ice and carbon-dioxide ice require evidence-based distinction.',
  },
  {
    id: 'nasa-iss-water-recovery',
    title: 'NASA: Water recovery on the ISS',
    url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
    note: 'Recovered water needs treatment and checks before it is clean water.',
  },
  {
    id: 'nasa-potential-biosignature',
    title: 'NASA: Potential biosignature report',
    url: 'https://www.nasa.gov/news-release/nasa-says-mars-rover-discovered-potential-biosignature-last-year/',
    note: 'A potential biosignature is a clue to study, not confirmed life.',
  },
  {
    id: 'nasa-mars-rock-samples',
    title: 'NASA Science: Mars rock samples',
    url: 'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/',
    note: 'Context, sample records, and witness tubes help protect scientific interpretation.',
  },
  {
    id: 'nasa-space-communications',
    title: 'NASA Goddard: Space communications',
    url: 'https://www.nasa.gov/centers-and-facilities/goddard/space-communications-7-things-you-need-to-know/',
    note: 'Communication has distance and delay; this campaign simplifies it for play.',
  },
] as const;

const observation = (
  id: string,
  title: string,
  clue: string,
  position: [number, number],
  tool: string,
) => ({ id, title, clue, position, tool });

const branch = (id: string, title: string, clue: string, position: [number, number]) => ({
  id,
  title,
  clue,
  position,
});

const operation = (id: string, title: string, benefit: string, deferred: string) => ({
  id,
  title,
  benefit,
  deferred,
});

export const REGIONS: RegionDefinition[] = [
  {
    id: 'impact',
    name: 'Impact Ridge',
    subtitle: 'Craters, ejecta, and signal clues',
    question: 'Which observations connect a crater event to the ground and samples nearby?',
    center: [-200, -170],
    color: '#FF6B35',
    observations: [
      observation('impact-h1', 'Crater rim and ejecta', 'Wide and close views show the rim, slope, and material around it.', [-186, -154], 'mast camera'),
      observation('impact-h2', 'Before and after orbit images', 'Two dated images show a change that can be compared with the signal record.', [-216, -160], 'image comparator'),
      observation('impact-h3', 'Candidate and local rock', 'Shape and measurements are clues, but appearance alone cannot identify origin.', [-204, -188], 'sample lens'),
    ],
    branches: [
      branch('impact-b1', 'Rim overlook', 'Pin a wide view beside a close view to keep the landform context.', [-180, -182]),
      branch('impact-b2', 'Sample care station', 'Keep location and time beside the joined signal profile.', [-223, -190]),
    ],
    operations: [
      operation('impact-protected', 'Protected sample store', 'Protected sample layout for later analysis.', 'Accessible analysis rack deferred.'),
      operation('impact-accessible', 'Accessible analysis rack', 'Accessible sample layout for comparison during the shift.', 'Protected sample store deferred.'),
    ],
    sourceIds: ['nasa-insight-impacts', 'nasa-mars-rock-samples'],
  },
  {
    id: 'dust',
    name: 'Wind Basin',
    subtitle: 'Dust traces and equipment care',
    question: 'What do dust traces reveal, and how can dust change equipment work?',
    center: [0, 0],
    color: '#D89B46',
    observations: [
      observation('dust-d1', 'Sand around a blocker', 'Compare the sheltered and exposed sides of one rock.', [15, 10], 'field camera'),
      observation('dust-d2', 'Clean and dusty equipment', 'A sensor window and a solar panel show different surface conditions.', [-14, 12], 'inspection camera'),
      observation('dust-d3', 'Dust at two scales', 'Local tracks and a broad image give different views of the same environment.', [0, -18], 'scale viewer'),
    ],
    branches: [
      branch('dust-b1', 'Dune overlook', 'Mark the model inlet and outlet before running the dust path.', [25, -8]),
      branch('dust-b2', 'Weather note', 'Compare a dust storm model with space-weather notes without mixing them.', [-26, -10]),
    ],
    operations: [
      operation('dust-clean-panels', 'Clean solar panels', 'Panels are clean and the post-shift record adds 2 EU.', 'Recovered-water treatment deferred.'),
      operation('dust-water-treatment', 'Treat recovered water', 'Two recovered portions become two clean-water units after checks.', 'Solar-panel cleaning deferred.'),
    ],
    sourceIds: ['nasa-martian-dust', 'nasa-iss-water-recovery'],
  },
  {
    id: 'volcano',
    name: 'Blackstone Steps',
    subtitle: 'Cooled flows and layer order',
    question: 'What can overlapping cooled flows tell us about relative formation order?',
    center: [-210, 180],
    color: '#D94F4F',
    observations: [
      observation('volcano-v1', 'Overlapping flow edge', 'Two angles show one cooled flow covering another.', [-194, 194], 'low camera'),
      observation('volcano-v2', 'Cooled flow channel', 'A terrain view and a map sketch share the same channel shape.', [-228, 190], 'terrain lamp'),
      observation('volcano-v3', 'Local material comparison', 'A local rock can be compared with a reference without assigning an exact age.', [-210, 160], 'sample viewer'),
    ],
    branches: [
      branch('volcano-b1', 'Flow-channel overlook', 'Highlight one covering edge to make the relation easier to read.', [-188, 168]),
      branch('volcano-b2', 'Shelter cross-section', 'Open a cross-section that distinguishes insulation from shielding.', [-232, 172]),
    ],
    operations: [
      operation('volcano-passive', 'Passive insulation', 'Insulation panels help the work bay retain heat in the model.', 'Supplemental heater deferred.'),
      operation('volcano-active', 'Supplemental heater', 'A heater warms the sample bench quickly during the shift.', 'Passive insulation deferred.'),
    ],
    sourceIds: ['nasa-lava-flow'],
  },
  {
    id: 'ice',
    name: 'Enclosed Ice Wall',
    subtitle: 'Cores, labels, and clean water',
    question: 'How can a core keep its context, and why is ice not automatically drinking water?',
    center: [210, -180],
    color: '#63C7D8',
    observations: [
      observation('ice-i1', 'Layered cover', 'Surface cover and a cross-section show a layered material record.', [224, -164], 'core camera'),
      observation('ice-i2', 'Terrain and radar', 'The terrain profile matches a simplified radar section.', [190, -176], 'radar viewer'),
      observation('ice-i3', 'Water ice and carbon-dioxide ice', 'Evidence, not color alone, distinguishes the two kinds of ice.', [214, -202], 'sample tester'),
    ],
    branches: [
      branch('ice-b1', 'Recovery-water station', 'Keep the Advance, Check, and Seal steps visible beside the water line.', [232, -194]),
      branch('ice-b2', 'Food preparation note', 'Show why treated water and a labeled core follow different paths.', [188, -202]),
    ],
    operations: [
      operation('ice-core-analysis', 'Analyze the core', 'Add a scanned layer and cross-section record to the core file.', 'Recovered-water treatment deferred.'),
      operation('ice-water-treatment', 'Treat recovered water', 'Two recovered portions become two clean-water units after checks.', 'Core analysis deferred.'),
    ],
    sourceIds: ['nasa-glacial-ice', 'nasa-dry-ice', 'nasa-iss-water-recovery'],
  },
  {
    id: 'lake',
    name: 'Old Lake Shore',
    subtitle: 'Context-rich rover records',
    question: 'What belongs in an observation record before a clue can be studied further?',
    center: [200, 170],
    color: '#4D9EC7',
    observations: [
      observation('lake-l1', 'Layered rock', 'Wide and close views show a useful geological relationship.', [216, 186], 'rover camera'),
      observation('lake-l2', 'Rover tool check', 'Camera, arm, wheels, and safe position are checked at the field target.', [184, 180], 'rover arm'),
      observation('lake-l3', 'Sample record', 'A location and witness-tube note preserve context around a sample.', [202, 154], 'record console'),
    ],
    branches: [
      branch('lake-b1', 'Dry-channel overlook', 'Use the channel direction to plan the next wide image.', [224, 156]),
      branch('lake-b2', 'Context checklist', 'Keep wide image, close image, and position together in the record.', [176, 164]),
    ],
    operations: [
      operation('lake-summary-inspection', 'Short transmission and rover check', 'Send a checked summary and complete the rover inspection record.', 'Full science transmission deferred.'),
      operation('lake-full-transmit', 'Full science transmission', 'Send the complete image and context package for later review.', 'Short transmission and rover inspection deferred.'),
    ],
    sourceIds: ['nasa-potential-biosignature', 'nasa-mars-rock-samples', 'nasa-space-communications'],
  },
];

export const regionById = (id: RegionId): RegionDefinition =>
  REGIONS.find((region) => region.id === id) ?? REGIONS[0];
