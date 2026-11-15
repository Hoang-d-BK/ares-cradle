import { WORLD_REGIONS, type RegionId, type WorldPoint } from './worldRegions';

export interface ScientificElement {
  readonly id: string;
  readonly regionId: RegionId;
  readonly title: string;
  readonly kind:
    | 'impact-rock' | 'crater' | 'ejecta' | 'dust-devil' | 'dust-deposit' | 'wind-streak'
    | 'basalt' | 'strata' | 'lava-channel' | 'volcanic-vent' | 'ice' | 'ice-layer' | 'radar' | 'frost'
    | 'delta' | 'sediment' | 'mineral-outcrop' | 'sample-cache';
  readonly position: WorldPoint;
  readonly summary: string;
  readonly explanation: string;
  readonly sourceTitle: string;
  readonly sourceDate?: string;
  /** Method and location of the real NASA observation; never a claim about this authored scene. */
  readonly sourceObservation: string;
  readonly sourceUrl: string;
  readonly credit: string;
  readonly scienceBoundary: string;
}

type ElementCopy = Pick<ScientificElement, 'title' | 'kind' | 'summary' | 'explanation' | 'sourceTitle' | 'sourceDate' | 'sourceObservation' | 'sourceUrl' | 'credit' | 'scienceBoundary'>;

const REGION_COPY: Readonly<Record<RegionId, readonly [ElementCopy, ElementCopy, ElementCopy]>> = {
  impact: [
    {
      title: 'Impact-shocked rock', kind: 'impact-rock',
      summary: 'Some Martian impact craters have ejecta lobes shaped by interactions with volatile-rich ground.',
      explanation: 'Some Martian craters have continuous ejecta lobes interpreted as material fluidized over volatile-rich ground. A rock’s appearance alone cannot prove that it is a meteorite.',
      sourceTitle: 'Fluidized crater ejecta', sourceDate: 'December 14, 2002', sourceObservation: 'THEMIS visible-light image; ejecta lobes interpreted as fluidized over volatile-rich ground.', sourceUrl: 'https://science.nasa.gov/photojournal/fluidized-crater-ejecta/',
      credit: 'NASA/JPL/Arizona State University',
      scienceBoundary: 'Training depiction only; a rock’s appearance cannot establish meteorite origin or identify this fictional site.',
    },
    {
      title: 'Crater rim', kind: 'crater',
      summary: 'A crater rim records material displaced during an impact.',
      explanation: 'Impact craters form when an incoming body strikes the ground and ejects material. The shape shown here is illustrative, not a measurement of a mapped NASA crater.',
      sourceTitle: 'Fluidized crater ejecta', sourceDate: 'December 14, 2002', sourceObservation: 'THEMIS visible-light image; ejecta lobes interpreted as fluidized over volatile-rich ground.', sourceUrl: 'https://science.nasa.gov/photojournal/fluidized-crater-ejecta/',
      credit: 'NASA/JPL/Arizona State University',
      scienceBoundary: 'Training feature; no size, age, or impactor identity is inferred from this scene.',
    },
    {
      title: 'Ejecta blanket', kind: 'ejecta',
      summary: 'Ejecta is material thrown outward when an impact crater forms.',
      explanation: 'Some Martian craters have lobate ejecta patterns interpreted as impact material that flowed over volatile-bearing ground. That interpretation does not identify the exact composition beneath this fictional feature.',
      sourceTitle: 'Fluidized crater ejecta', sourceDate: 'December 14, 2002', sourceObservation: 'THEMIS visible-light image; ejecta lobes interpreted as fluidized over volatile-rich ground.', sourceUrl: 'https://science.nasa.gov/photojournal/fluidized-crater-ejecta/',
      credit: 'NASA/JPL/Arizona State University',
      scienceBoundary: 'A general Mars example, not a claim that this training feature has measured volatiles.',
    },
  ],
  ice: [
    {
      title: 'Subsurface water ice', kind: 'ice',
      summary: 'Orbital observations map areas where water ice may lie beneath Martian soil.',
      explanation: 'NASA’s Subsurface Water Ice Mapping project combines orbital measurements to locate likely buried ice. Subsurface ice is not surface water and is not ready to drink without extraction and treatment.',
      sourceTitle: 'SWIM Map Shows Subsurface Water Ice on Mars', sourceDate: 'October 26, 2023', sourceObservation: 'SWIM synthesis combines orbital mission data to map likely buried water ice; this is not a local measurement.', sourceUrl: 'https://science.nasa.gov/photojournal/swim-map-shows-subsurface-water-ice-on-mars/',
      credit: 'NASA/JPL-Caltech/Planetary Science Institute',
      scienceBoundary: 'A conceptual training marker; it does not report a local ice detection or an accessible water reserve.',
    },
    {
      title: 'Exposed ice layers', kind: 'ice-layer',
      summary: 'A bright scarp can expose layers beneath a dusty Martian surface.',
      explanation: 'Orbital observations show scarps where buried ice is exposed beneath a protective mantle. The pale strata here are an authored teaching feature, not an instrument reading.',
      sourceTitle: 'Glacial Ice Deposits in Mid-Latitudes of Mars', sourceDate: 'March 2, 2010', sourceObservation: 'Mars Reconnaissance Orbiter radar detected buried glacial ice beneath debris-covered slopes in Deuteronilus Mensae.', sourceUrl: 'https://science.nasa.gov/resource/glacial-ice-deposits-in-mid-latitudes-of-mars/',
      credit: 'NASA/JPL-Caltech/ASI/University of Rome/Southwest Research Institute',
      scienceBoundary: 'The scene shows no local ice detection or accessible water reserve; color alone cannot distinguish water ice from other material.'
    },
    {
      title: 'Seasonal frost', kind: 'frost',
      summary: 'Some overnight frost observed on Mars is mostly carbon-dioxide ice.',
      explanation: 'NASA observations found that frost in the studied locations was largely dry ice, not water ice. A pale surface or frost-like appearance cannot identify its composition by sight alone.',
      sourceTitle: 'Science at Sunrise: Solving the Mystery of Frost Hiding on Mars', sourceDate: 'May 5, 2022', sourceObservation: 'Mars Odyssey THEMIS dawn and infrared observations found much of the studied frost was carbon-dioxide ice.', sourceUrl: 'https://www.nasa.gov/missions/odyssey/science-at-sunrise-solving-the-mystery-of-frost-hiding-on-mars/',
      credit: 'NASA/JPL-Caltech/Arizona State University',
      scienceBoundary: 'A general observation; the training frost does not represent a measured local deposit.',
    },
  ],
  volcano: [
    {
      title: 'Basalt-like flow rock', kind: 'basalt',
      summary: 'Mars has broad lava-flow landforms, but color alone cannot identify a rock.',
      explanation: 'NASA images show volcanic flow landforms near Olympus Mons. This authored rock is only a basalt candidate: its appearance is not a mineral measurement.',
      sourceTitle: 'Lava Flow Near the Base of Olympus Mons', sourceDate: 'February 18, 2015', sourceObservation: 'Orbital image of a channel near Olympus Mons; discontinuities were interpreted as a possible lava tube, not a local sample.', sourceUrl: 'https://science.nasa.gov/resource/lava-flow-near-the-base-of-olympus-mons/',
      credit: 'NASA/JPL-Caltech/University of Arizona',
      scienceBoundary: 'Illustrated teaching outcrop; no local composition, instrument result, or eruption age is measured here.',
    },
    {
      title: 'Lava-tube opening model', kind: 'lava-channel',
      summary: 'A pit may expose an opening where a lava tube roof collapsed.',
      explanation: 'NASA describes a HiRISE pit in Arsia Mons interpreted as the mouth of an empty lava tube. Such openings help scientists investigate volcanic structures below the surface.',
      sourceTitle: 'HiRISE Spots the Mouth of a Martian Lava Tube', sourceDate: 'November 15, 2021', sourceObservation: 'HiRISE image shows a pit in Arsia Mons interpreted as an empty lava-tube opening; that feature is elsewhere.', sourceUrl: 'https://science.nasa.gov/resource/hirise-spots-the-mouth-of-a-martian-lava-tube/',
      credit: 'NASA/JPL-Caltech/University of Arizona',
      scienceBoundary: 'This fictional channel and opening are not the mapped Arsia Mons pit; the scene has no local subsurface measurement.'
    },
    {
      title: 'Ancient volcanic vent', kind: 'volcanic-vent',
      summary: 'Ancient Martian eruptions released gases, but this scene detects none.',
      explanation: 'NASA reports evidence for ancient explosive eruptions in Arabia Terra about 4 billion years ago. This teaching scene illustrates an ancient outgassing process rather than current activity.',
      sourceTitle: 'NASA Confirms Thousands of Massive, Ancient Volcanic Eruptions on Mars', sourceDate: 'September 15, 2021', sourceObservation: 'Geologic evidence for ancient super-eruptions in Arabia Terra about 4 billion years ago; no modern activity detected here.', sourceUrl: 'https://www.nasa.gov/solar-system/nasa-confirms-thousands-of-massive-ancient-volcanic-eruptions-on-mars/',
      credit: 'NASA Goddard Space Flight Center',
      scienceBoundary: 'The cited eruptions were in Arabia Terra, not this fictional region. No active eruption, hot gas, or present-day gas detection is represented.'
    },
  ],
  lake: [
    {
      title: 'Ancient delta', kind: 'delta',
      summary: 'A river delta can preserve sediments deposited where water entered a lake.',
      explanation: 'As general mission context, Perseverance studies the ancient Jezero delta as a record of past water and to investigate potential signs of ancient life. That mission goal is not evidence that life existed there or at this fictional site.',
      sourceTitle: 'Studying the Jezero Delta From a Distance', sourceDate: 'October 18, 2021', sourceObservation: 'Perseverance Mastcam-Z and SuperCam images and rover work document the Jezero delta; this authored outcrop is elsewhere.', sourceUrl: 'https://science.nasa.gov/blog/studying-the-jezero-delta-from-a-distance/',
      credit: 'NASA/JPL-Caltech/ASU/MSSS',
      scienceBoundary: 'General Jezero science context; the fictional lake margin is not Jezero or a confirmed biosignature site.',
    },
    {
      title: 'Layered sediment', kind: 'sediment',
      summary: 'Sedimentary layers can preserve evidence of changing environments.',
      explanation: 'Perseverance studies delta rocks to understand how sediments were transported and deposited in ancient Jezero. Layering can inform geological history, but does not by itself show biology.',
      sourceTitle: 'Studying the Jezero Delta From a Distance', sourceDate: 'October 18, 2021', sourceObservation: 'Perseverance Mastcam-Z and SuperCam images and rover work document the Jezero delta; this authored outcrop is elsewhere.', sourceUrl: 'https://science.nasa.gov/blog/studying-the-jezero-delta-from-a-distance/',
      credit: 'NASA/JPL-Caltech/ASU/MSSS',
      scienceBoundary: 'Training outcrop only; no sediment composition or biological evidence is claimed here.',
    },
    {
      title: 'Mineral-bearing outcrop', kind: 'mineral-outcrop',
      summary: 'A mineral vein can help compare how rock changed over time.',
      explanation: 'Perseverance studies Jezero delta rocks to understand past water and investigate potential signs of ancient life. This fictional outcrop is a comparison feature, not a returned sample or life detection.',
      sourceTitle: 'Studying the Jezero Delta From a Distance', sourceDate: 'October 18, 2021', sourceObservation: 'Perseverance Mastcam-Z and SuperCam images and rover work document the Jezero delta; this authored outcrop is elsewhere.', sourceUrl: 'https://science.nasa.gov/blog/studying-the-jezero-delta-from-a-distance/',
      credit: 'NASA/JPL-Caltech/ASU/MSSS',
      scienceBoundary: 'The outcrop is not at Jezero and shows no confirmed biosignature, mineral identification, or evidence that life existed.'
    },
  ],
  dust: [
    {
      title: 'Passing dust devil', kind: 'dust-devil',
      summary: 'Martian dust devils are whirlwinds observed moving across the ground.',
      explanation: 'Rover observations show dust devils as transient events linked to surface heating and atmospheric motion. They are not evidence of a permanent tornado-like storm at this site.',
      sourceTitle: 'Curiosity Observes Whirlwinds Carrying Martian Dust', sourceDate: 'February 27, 2017', sourceObservation: 'Curiosity Navigation Camera recorded distant transient dust devils on Sol 1607; this training plume is not live weather.', sourceUrl: 'https://science.nasa.gov/resource/curiosity-observes-whirlwinds-carrying-martian-dust/',
      credit: 'NASA/JPL-Caltech/TAMU',
      scienceBoundary: 'Training illustration; no live weather, wind speed, or dust-devil measurement is simulated.',
    },
    {
      title: 'Dust deposit', kind: 'dust-deposit',
      summary: 'Wind can move bright dust and expose darker ground beneath it.',
      explanation: 'NASA observations describe bright dust settling and wind removing thin dust veneers, changing the surface contrast. A color difference alone does not identify a mineral or deposit age.',
      sourceTitle: 'Wind Streaks Among Flows', sourceDate: 'December 17, 2004', sourceObservation: 'Mars Global Surveyor MOC image shows dark streaks from removal of thin bright dust over craters and lava-flow surfaces.', sourceUrl: 'https://science.nasa.gov/photojournal/wind-streaks-among-flows/',
      credit: 'NASA/JPL/Malin Space Science Systems',
      scienceBoundary: 'General wind-process example; this training patch has no measured composition or age.',
    },
    {
      title: 'Wind streak', kind: 'wind-streak',
      summary: 'Streak orientation can help scientists infer the direction of past winds.',
      explanation: 'Mapped Martian wind streaks form as wind redistributes a thin dust cover around surface features. The displayed orientation is not a local wind measurement or a real NASA image.',
      sourceTitle: 'Wind Streaks Among Flows', sourceDate: 'December 17, 2004', sourceObservation: 'Mars Global Surveyor MOC image shows dark streaks from removal of thin bright dust over craters and lava-flow surfaces.', sourceUrl: 'https://science.nasa.gov/photojournal/wind-streaks-among-flows/',
      credit: 'NASA/JPL/Malin Space Science Systems',
      scienceBoundary: 'Illustrative streak only; no precise wind vector or atmospheric strength is inferred.',
    },
  ],
};

export const SCIENTIFIC_ELEMENTS: readonly ScientificElement[] = WORLD_REGIONS.flatMap((region) =>
  REGION_COPY[region.id].map((item, index) => ({
    id: `${region.id}.science-${index + 1}`,
    regionId: region.id,
    title: item.title,
    kind: item.kind,
    sourceDate: item.sourceDate,
    position: region.discoveries[index],
    summary: item.summary,
    explanation: item.explanation,
    sourceTitle: item.sourceTitle,
    sourceObservation: item.sourceObservation,
    sourceUrl: item.sourceUrl,
    credit: item.credit,
    scienceBoundary: item.scienceBoundary,
  })),
);

export function getScientificElement(id: string): ScientificElement | undefined {
  return SCIENTIFIC_ELEMENTS.find((element) => element.id === id);
}
