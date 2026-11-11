/**
 * Ares Cradle — Industrial Aerospace Item Registry & Deterministic Action Contract
 * Implements the 24-Item Design Catalog (Prompt 2) with strict separation between:
 *  1. Outpost Telemetry (batteryKwh, habitat O2%, habitat temperature °C, solar dust)
 *  2. Countable Field Equipment & Consumables (Personal Backpack & Rover Cargo Bay)
 *  3. Identity-tracked Scientific Specimens (3 Sealed Vials mapped to NASA Data Capsules)
 */

export type ItemCategory =
  | 'tool'
  | 'maintenance'
  | 'power'
  | 'sustenance'
  | 'material'
  | 'specimen'
  | 'advanced_blueprint';

export type ItemStatusBadge =
  | 'Ready'
  | 'In use'
  | 'Depleted'
  | 'Needs target'
  | 'Stored in rover'
  | 'Mission sample'
  | 'Research unlocked';

export type ItemActionErrorCode =
  | 'OUT_OF_STOCK'
  | 'INVALID_TARGET'
  | 'NO_EFFECT'
  | 'UNAVAILABLE';

export type ItemActionResult =
  | {
      ok: true;
      itemId: string;
      consumed: number;
      feedback: string;
      actualDelta?: Record<string, number>;
    }
  | {
      ok: false;
      itemId: string;
      code: ItemActionErrorCode;
      reason: string;
    };

export interface CatalogItemDef {
  catalogNumber: number;
  id: string;
  name: string;
  category: ItemCategory;
  unitLabel: string;
  reusable: boolean;
  mvpActive: boolean;
  unlockSol: number;
  targetRequirement: string;
  costOrYieldLabel: string;
  description: string;
  scientificNote: string;
  svgIconId:
    | 'flashlight'
    | 'wiper'
    | 'patch'
    | 'battery'
    | 'ration'
    | 'water'
    | 'mineral'
    | 'aerogel'
    | 'analyzer'
    | 'vial'
    | 'gasket'
    | 'repair_kit'
    | 'beacon'
    | 'specimen_rock'
    | 'specimen_hematite'
    | 'specimen_ice'
    | 'specimen_gas'
    | 'blueprint';
}

export const ITEM_CATALOG: Record<string, CatalogItemDef> = {
  // ============================================================================
  // MVP 1-12: Active Countable Field Equipment & Outpost Supplies
  // ============================================================================
  flashlight: {
    catalogNumber: 1,
    id: 'flashlight',
    name: 'EVA LED Flood Torch',
    category: 'tool',
    unitLabel: 'unit (on/off)',
    reusable: true,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Anywhere on EVA or inside Habitat [Hotkey: F]',
    costOrYieldLabel: 'Reusable Tool (0 consumed)',
    description:
      'Anodized aluminum EVA hand torch with anti-slip grip ring and 26m forward flood beam for night sorties and shadowed crater ridges.',
    scientificNote:
      'Martian nights have no bright moon like Earth; Phobos reflects very little light, making directional LED optics essential for EVA navigation.',
    svgIconId: 'flashlight'
  },
  sonic_wiper: {
    catalogNumber: 2,
    id: 'sonic_wiper',
    name: 'Electrostatic Solar Wiper Kit',
    category: 'maintenance',
    unitLabel: 'maintenance charge',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Within 9m of Solar Array (or Base Maintenance Bus) when dust > 2%',
    costOrYieldLabel: 'Clears up to 100% panel regolith dust',
    description:
      'Portable acoustic & electrostatic brush head that repels fine iron-oxide dust particles clinging to photovoltaic glass.',
    scientificNote:
      'Electrostatic dust adhesion was a major challenge for NASA Opportunity and InSight landers on Mars.',
    svgIconId: 'wiper'
  },
  space_tape: {
    catalogNumber: 3,
    id: 'space_tape',
    name: 'Polymer Pressure Seal Patch',
    category: 'maintenance',
    unitLabel: 'blister patch',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Active hull micro-fracture leak or habitat airlock seal maintenance',
    costOrYieldLabel: 'Seals active breach & stops O₂ leak loss',
    description:
      'Multi-layer Kapton and fluorosilicone adhesive patch engineered to seal micrometeoroid punctures in pressurized habitat seams.',
    scientificNote:
      'Sealing a breach stops atmospheric depressurization so the habitat Sabatier/MOXIE life-support loop can restore nominal 20.9% O₂.',
    svgIconId: 'patch'
  },
  backup_battery: {
    catalogNumber: 4,
    id: 'backup_battery',
    name: 'Solid-State Li-S Power Cartridge',
    category: 'power',
    unitLabel: 'cartridge (15 kWh)',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Habitat Power Bus or Rover Aux Dock when Grid Battery < 99%',
    costOrYieldLabel: '+15.0 kWh to Outpost Battery Grid (clamped to capacity)',
    description:
      'High-density lithium-sulfur plug-in power cartridge with quick-lock bus terminals for emergency night brownout recovery.',
    scientificNote:
      'Gameplay parameter: 15 kWh emergency module. Real Mars surface systems pair solar arrays with high-cycle rechargeable Li-ion banks.',
    svgIconId: 'battery'
  },
  space_apple: {
    catalogNumber: 5,
    id: 'space_apple',
    name: 'Hydroponic Calorie Ration Pack',
    category: 'sustenance',
    unitLabel: 'sealed pouch',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Inside pressurized Habitat or Rover cabin when EVA stamina < 95%',
    costOrYieldLabel: 'Restores 100% Cadet EVA Thruster Stamina & +25 STEM Focus',
    description:
      'Vacuum-sealed freeze-dried fruit and microgreen ration grown in the Bio-Dome hydroponics bay for crew energy recovery.',
    scientificNote:
      'Crew food sustains the astronaut—it does not alter habitat cabin O₂ concentration or building thermal radiators.',
    svgIconId: 'ration'
  },
  water_canister: {
    catalogNumber: 6,
    id: 'water_canister',
    name: 'Purified Water Canister (25L)',
    category: 'sustenance',
    unitLabel: 'canister (25L)',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Inside Habitat Life-Support Loop or Hydroponics Feed',
    costOrYieldLabel: 'Supplies 25L H₂O to Electrolyzer (+1.8% Habitat O₂ buffer)',
    description:
      'Insulated stainless-steel 25L water drum refined from subsurface permafrost ice cores and filtered through multi-stage media.',
    scientificNote:
      'Gameplay parameter: 25L per canister. In ISRU habitats, purified water feeds both crew hydration and PEM water electrolysis.',
    svgIconId: 'water'
  },
  mineral_shard: {
    catalogNumber: 7,
    id: 'mineral_shard',
    name: 'Sorted Regolith & Hematite Ore',
    category: 'material',
    unitLabel: '2.5 kg sample',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Inside Habitat Bio-Dome Lab / Sintering Station',
    costOrYieldLabel: 'Sinters into structural ceramic shield (+1.5°C thermal retention)',
    description:
      'Graded iron-oxide and basaltic mineral aggregate collected from surface outcrops for thermal brick sintering and lab study.',
    scientificNote:
      'Raw mineral ore cannot be converted directly into electricity; it is used for radiation/thermal shielding and geological analysis.',
    svgIconId: 'mineral'
  },
  thermal_blanket: {
    catalogNumber: 8,
    id: 'thermal_blanket',
    name: 'Silica Aerogel Thermal Quilt',
    category: 'maintenance',
    unitLabel: 'insulation panel',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Habitat Thermal Bay when cabin temperature < 19.5°C',
    costOrYieldLabel: '+3.5°C Habitat Thermal Recovery & reduced heat loss',
    description:
      'Ultralight nanoporous silica aerogel blanket lined with gold MLI film to block conductive and radiative heat loss during -60°C nights.',
    scientificNote:
      'NASA Mars rovers use thin silica aerogel layers to insulate warm electronics boxes against extreme nocturnal cold.',
    svgIconId: 'aerogel'
  },
  soil_analyzer: {
    catalogNumber: 9,
    id: 'soil_analyzer',
    name: 'Handheld XRF Soil Spectrometer',
    category: 'tool',
    unitLabel: 'instrument',
    reusable: true,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Anywhere on Martian terrain or near Specimen Nodes',
    costOrYieldLabel: 'Reusable Tool (0 consumed) • Logs local mineral telemetry',
    description:
      'Portable X-ray fluorescence spectrometer with aperture shutter and OLED readout for non-destructive elemental analysis of rocks and ice.',
    scientificNote:
      'Modeled after PIXL on the Perseverance rover, which identifies elemental chemistry at sub-millimeter scale.',
    svgIconId: 'analyzer'
  },
  sample_container: {
    catalogNumber: 10,
    id: 'sample_container',
    name: 'Hermetic Titanium Sample Tube',
    category: 'tool',
    unitLabel: 'sterile tube',
    reusable: true,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Passive field rack capacity (3 sealed mission vials max)',
    costOrYieldLabel: 'Maintains sterile seal on 3 carried field specimens',
    description:
      'Precision-machined titanium sample tube with gold-plated crimp seal and laser-etched serial barcode for planetary protection compliance.',
    scientificNote:
      'Perseverance carries 43 ultra-clean sample tubes designed to preserve Martian rock and atmosphere cores.',
    svgIconId: 'vial'
  },
  gasket_set: {
    catalogNumber: 11,
    id: 'gasket_set',
    name: 'Fluorosilicone Airlock Gasket Set',
    category: 'maintenance',
    unitLabel: 'seal kit',
    reusable: false,
    mvpActive: true,
    unlockSol: 5,
    targetRequirement: 'Habitat Airlock when pressure leak is active or O₂ < 20.5%',
    costOrYieldLabel: 'Resolves seal leak & stabilizes airlock pressure (+2.0% O₂)',
    description:
      'Cold-rated elastomer ring seals designed to replace dust-abraded airlock door gaskets after heavy EVA traffic.',
    scientificNote:
      'Abrasive Martian dust (1–10 microns) can wear mechanical seals; redundant gasket rings prevent slow airlock bleed.',
    svgIconId: 'gasket'
  },
  rover_repair_kit: {
    catalogNumber: 12,
    id: 'rover_repair_kit',
    name: 'Rover Bogie & Actuator Service Kit',
    category: 'maintenance',
    unitLabel: 'field kit',
    reusable: false,
    mvpActive: true,
    unlockSol: 5,
    targetRequirement: 'Within 4.0m of Exploration Rover',
    costOrYieldLabel: 'Calibrates wheel actuators & cleans optical nav-cams (+50 PTS)',
    description:
      'Torque driver, dry-film lubricant, and optical brush kit for servicing the 6-wheel rocker-bogie suspension and Mastcam lenses.',
    scientificNote:
      'Liquid lubricants freeze on Mars; spacecraft mechanisms rely on dry molybdenum disulfide or Braycote aerospace greases.',
    svgIconId: 'repair_kit'
  },

  // ============================================================================
  // ITEMS 13-17 & 22-24: Phase-2 Engineering Blueprints (Inspectable, Non-Fake)
  // ============================================================================
  suit_o2_cartridge: {
    catalogNumber: 13,
    id: 'suit_o2_cartridge',
    name: 'PLSS High-Pressure O₂ Bottle',
    category: 'advanced_blueprint',
    unitLabel: 'bottle (blueprint)',
    reusable: false,
    mvpActive: false,
    unlockSol: 12,
    targetRequirement: 'Requires Dedicated Suit O₂ Reservoir Subsystem (Phase 2)',
    costOrYieldLabel: 'Blueprint Spec • Separate from Habitat O₂%',
    description:
      'Composite overwrapped pressure vessel (COPV) supplying personal breathing oxygen to the EVA backpack loop.',
    scientificNote:
      'Kept distinct from Habitat O₂ concentration so suit consumables never falsify building telemetry.',
    svgIconId: 'blueprint'
  },
  suit_co2_scrubber: {
    catalogNumber: 14,
    id: 'suit_co2_scrubber',
    name: 'Regenerable MetOx CO₂ Scrubber',
    category: 'advanced_blueprint',
    unitLabel: 'cartridge (blueprint)',
    reusable: true,
    mvpActive: false,
    unlockSol: 12,
    targetRequirement: 'Habitat Airlock Bake-Out Oven (Phase 2)',
    costOrYieldLabel: 'Blueprint Spec • Removes exhaled CO₂ from suit loop',
    description:
      'Porous silver-oxide canister that scrubs carbon dioxide from the astronaut ventilation loop and regenerates in the airlock oven.',
    scientificNote:
      'CO₂ scrubbers remove toxic carbon dioxide; they do not generate new oxygen.',
    svgIconId: 'blueprint'
  },
  suit_battery: {
    catalogNumber: 15,
    id: 'suit_battery',
    name: 'EVA Suit Aux Pack (850 Wh)',
    category: 'advanced_blueprint',
    unitLabel: 'pack (850 Wh)',
    reusable: true,
    mvpActive: false,
    unlockSol: 9,
    targetRequirement: 'EVA Suit Harness Dock (Phase 2)',
    costOrYieldLabel: 'Blueprint Spec • Measured in Wh (distinct from Grid kWh)',
    description:
      'Personal 28V lithium battery pack powering suit visor heaters, comms radio, and wrist telemetry display.',
    scientificNote:
      'Personal equipment energy is measured in Watt-hours (Wh), roughly 1/100th the scale of the habitat kWh grid.',
    svgIconId: 'blueprint'
  },
  dust_filter: {
    catalogNumber: 16,
    id: 'dust_filter',
    name: 'HEPA Electrostatic Intake Filter',
    category: 'advanced_blueprint',
    unitLabel: 'filter core',
    reusable: false,
    mvpActive: false,
    unlockSol: 5,
    targetRequirement: 'Airlock Dust Mitigation Manifold (Phase 2)',
    costOrYieldLabel: 'Blueprint Spec • Traps fine perchlorate dust at airlock',
    description:
      'High-efficiency particulate air filter cartridge that captures micron-scale regolith dust during post-EVA cabin repressurization.',
    scientificNote:
      'Replaces intake filtration without magically stopping planetary dust storms outside.',
    svgIconId: 'blueprint'
  },
  insulated_ice_container: {
    catalogNumber: 17,
    id: 'insulated_ice_container',
    name: 'Cryo-Insulated Core Transport Cask',
    category: 'advanced_blueprint',
    unitLabel: 'cryo cask',
    reusable: true,
    mvpActive: false,
    unlockSol: 9,
    targetRequirement: 'North Glacier Trench Sortie (Sol 9+)',
    costOrYieldLabel: 'Blueprint Spec • Prevents volatile sublimation in transit',
    description:
      'Double-walled vacuum flask that preserves subsurface ice core stratigraphy between the glacier trench and the Bio-Dome analyzer.',
    scientificNote:
      'Under low Martian atmospheric pressure (~6 mbar), exposed water ice sublimates directly into vapor when warmed.',
    svgIconId: 'blueprint'
  },

  // ============================================================================
  // ITEMS 18-21: Identity-Tracked Scientific Specimens (Mapped to 3 Vial Rack)
  // ============================================================================
  regolith_sample: {
    catalogNumber: 18,
    id: 'regolith_sample',
    name: 'Sealed Martian Regolith Core',
    category: 'specimen',
    unitLabel: 'sealed vial',
    reusable: false,
    mvpActive: true,
    unlockSol: 1,
    targetRequirement: 'Analyze in Habitat Bio-Dome Chemical Sample Analyzer',
    costOrYieldLabel: 'Unlocks Regolith Iron Oxide Data Capsule & +25 Alloy Sinter',
    description:
      'Fine reddish-brown basaltic regolith rich in ferric oxide (Fe₂O₃), collected from the Elysium Planitia solar array perimeter.',
    scientificNote:
      'Iron oxide dust coats the Martian surface and scatters red light into the thin CO₂ sky.',
    svgIconId: 'specimen_rock'
  },
  hematite_sample: {
    catalogNumber: 19,
    id: 'hematite_sample',
    name: 'Hematite Concretion ("Blueberry") Vial',
    category: 'specimen',
    unitLabel: 'sealed vial',
    reusable: false,
    mvpActive: true,
    unlockSol: 5,
    targetRequirement: 'Analyze in Habitat Bio-Dome Chemical Sample Analyzer',
    costOrYieldLabel: 'Unlocks Hematite Groundwater Data Capsule & +30 Mineral Yield',
    description:
      'Metallic gray iron-oxide spherules formed by ancient mineral-rich groundwater percolating through porous rock layers.',
    scientificNote:
      'Discovered by NASA Opportunity in 2004, these concretions provided direct geological evidence of ancient liquid water on Mars.',
    svgIconId: 'specimen_hematite'
  },
  ice_core_sample: {
    catalogNumber: 20,
    id: 'ice_core_sample',
    name: 'Subsurface Permafrost Ice Core',
    category: 'specimen',
    unitLabel: 'cryo vial',
    reusable: false,
    mvpActive: true,
    unlockSol: 9,
    targetRequirement: 'Refine in Habitat Bio-Dome Chemical Sample Analyzer',
    costOrYieldLabel: 'Refines into +1 Purified Water Canister (25L) & +3.5% O₂',
    description:
      'Crystalline water-ice core extracted from the North Glacier permafrost trench beneath a protective layer of dry regolith.',
    scientificNote:
      'Confirmed by NASA Phoenix Lander (2008); subsurface water ice is the cornerstone of In-Situ Resource Utilization (ISRU).',
    svgIconId: 'specimen_ice'
  },
  atmosphere_sample: {
    catalogNumber: 21,
    id: 'atmosphere_sample',
    name: 'MOXIE Solid-Oxide Catalyst & Gas Vial',
    category: 'specimen',
    unitLabel: 'gas cylinder',
    reusable: false,
    mvpActive: true,
    unlockSol: 12,
    targetRequirement: 'Analyze in Habitat Bio-Dome Chemical Sample Analyzer',
    costOrYieldLabel: 'Unlocks MOXIE Electrolysis Data Capsule & +4.0% Habitat O₂',
    description:
      'Pressurized gas sample and solid-oxide electrolysis cell test coupon from the East MOXIE atmospheric extraction tower.',
    scientificNote:
      'NASA Perseverance MOXIE demonstrated splitting Martian CO₂ at ~800°C into breathable O₂ and carbon monoxide.',
    svgIconId: 'specimen_gas'
  },

  // ============================================================================
  // ITEMS 22-24: Advanced Outpost Modules
  // ============================================================================
  electrolyzer_service_module: {
    catalogNumber: 22,
    id: 'electrolyzer_service_module',
    name: 'Solid-Oxide Electrolyzer Stack',
    category: 'advanced_blueprint',
    unitLabel: 'module stack',
    reusable: true,
    mvpActive: false,
    unlockSol: 12,
    targetRequirement: 'MOXIE Atmospheric Tower Bay (Sol 12+)',
    costOrYieldLabel: 'Blueprint Spec • Scales outpost O₂ synthesis rate',
    description:
      'Scandia-stabilized zirconia ceramic cell stack engineered for scaled-up outpost atmospheric oxygen production.',
    scientificNote:
      'Simplified gameplay module inspired by NASA JPL MOXIE solid-oxide electrolysis research.',
    svgIconId: 'blueprint'
  },
  hydroponic_seed_cartridge: {
    catalogNumber: 23,
    id: 'hydroponic_seed_cartridge',
    name: 'Bio-Dome Microgreen Seed Cassette',
    category: 'advanced_blueprint',
    unitLabel: 'seed cassette',
    reusable: false,
    mvpActive: false,
    unlockSol: 20,
    targetRequirement: 'Pressurized Hydroponic Greenhouse Rack (Sol 20)',
    costOrYieldLabel: 'Blueprint Spec • Grows fresh Mizuna & radish crops indoors',
    description:
      'Pre-seeded capillary mat cassette with controlled-release nutrient salts for closed-loop LED hydroponic cultivation.',
    scientificNote:
      'Plants require pressurized air, liquid water, and UV/radiation shielding inside a habitat—they cannot sprout on raw Martian soil.',
    svgIconId: 'blueprint'
  },
  relay_beacon: {
    catalogNumber: 24,
    id: 'relay_beacon',
    name: 'UHF Optical Waypoint Relay Beacon',
    category: 'tool',
    unitLabel: 'transponder',
    reusable: true,
    mvpActive: true,
    unlockSol: 5,
    targetRequirement: 'Deployable on field sorties or Mesa Landing Ridge (Sol 20)',
    costOrYieldLabel: 'Reusable Tool (0 consumed) • Pings active waypoint bearing',
    description:
      'Line-of-sight UHF radio and pulsed laser transponder that marks hazard perimeters and guides the Ares-1 landing approach.',
    scientificNote:
      'Replaces fictional "quantum instant uplinks" with realistic UHF/optical line-of-sight telemetry relays.',
    svgIconId: 'beacon'
  }
};

export const MVP_EQUIPMENT_IDS: string[] = [
  'flashlight',
  'sonic_wiper',
  'space_tape',
  'backup_battery',
  'space_apple',
  'water_canister',
  'mineral_shard',
  'thermal_blanket',
  'soil_analyzer',
  'sample_container',
  'gasket_set',
  'rover_repair_kit'
];

export const BLUEPRINT_CATALOG_IDS: string[] = [
  'relay_beacon',
  'suit_o2_cartridge',
  'suit_co2_scrubber',
  'suit_battery',
  'dust_filter',
  'insulated_ice_container',
  'electrolyzer_service_module',
  'hydroponic_seed_cartridge'
];

export interface ItemExecutionContext {
  inventory: Record<string, number>;
  roverInventory?: Record<string, number>;
  batteryKwh: number;
  batteryCapacityKwh: number;
  oxygen: number;
  temperature: number;
  dustCoverage: number;
  thrusterEnergy: number;
  isInsideHabitat: boolean;
  isDrivingRover: boolean;
  playerPos: [number, number, number];
  roverPos: [number, number, number];
  hasActiveLeakEvent: boolean;
  unlockedSols: number[];
}

export interface ItemStateMutation {
  result: ItemActionResult;
  nextInventory: Record<string, number>;
  nextBatteryKwh: number;
  nextBatteryPercent: number;
  nextOxygen: number;
  nextTemperature: number;
  nextDustCoverage: number;
  nextThrusterEnergy: number;
  resolveLeakEvents?: boolean;
  toggleFlashlight?: boolean;
  stemScoreBonus?: number;
}

/**
 * Pure, deterministic transaction evaluator for using/equipping any item in the catalog.
 * Never mutates inputs; guarantees batteryKwh is the single source of truth for battery%.
 */
export function evaluateItemTransaction(
  itemId: string,
  ctx: ItemExecutionContext
): ItemStateMutation {
  const def = ITEM_CATALOG[itemId];
  const baseBatteryKwh = Math.max(0, Math.min(ctx.batteryCapacityKwh, ctx.batteryKwh));
  const capacity = Math.max(0.001, ctx.batteryCapacityKwh);
  const baseBatteryPercent = Math.max(0, Math.min(100, (baseBatteryKwh / capacity) * 100));

  const unchanged = (result: ItemActionResult): ItemStateMutation => ({
    result,
    nextInventory: { ...ctx.inventory },
    nextBatteryKwh: baseBatteryKwh,
    nextBatteryPercent: baseBatteryPercent,
    nextOxygen: ctx.oxygen,
    nextTemperature: ctx.temperature,
    nextDustCoverage: ctx.dustCoverage,
    nextThrusterEnergy: ctx.thrusterEnergy
  });

  if (!def) {
    return unchanged({
      ok: false,
      itemId,
      code: 'UNAVAILABLE',
      reason: `Unknown equipment identifier "${itemId}".`
    });
  }

  if (!def.mvpActive) {
    return unchanged({
      ok: false,
      itemId,
      code: 'UNAVAILABLE',
      reason: `${def.name} is an engineering specification scheduled for Phase-2 subsystem integration.`
    });
  }

  // Reusable tools that do not require consumable stock if owned or standard issue
  const currentCount = ctx.inventory[itemId] ?? 0;
  if (!def.reusable && currentCount <= 0) {
    return unchanged({
      ok: false,
      itemId,
      code: 'OUT_OF_STOCK',
      reason: `No ${def.name} remaining in personal backpack.`
    });
  }

  const distToBase = Math.hypot(ctx.playerPos[0], ctx.playerPos[2]);
  const distToSolar = Math.hypot(ctx.playerPos[0] - -4.5, ctx.playerPos[2] - 1.4);
  const distToRover = Math.hypot(
    ctx.playerPos[0] - ctx.roverPos[0],
    ctx.playerPos[2] - ctx.roverPos[2]
  );

  switch (itemId) {
    case 'flashlight': {
      return {
        ...unchanged({
          ok: true,
          itemId,
          consumed: 0,
          feedback: 'Toggled EVA LED Flood Torch beam [Hotkey: F]. Reusable tool—0 units consumed.'
        }),
        toggleFlashlight: true
      };
    }

    case 'soil_analyzer': {
      return {
        ...unchanged({
          ok: true,
          itemId,
          consumed: 0,
          feedback: `XRF Spectrometer scan at [${ctx.playerPos[0].toFixed(1)}m, ${ctx.playerPos[2].toFixed(1)}m]: Fe₂O₃ 18.4%, SiO₂ 44.2%, basaltic regolith confirmed.`
        }),
        stemScoreBonus: 15
      };
    }

    case 'sample_container': {
      return unchanged({
        ok: true,
        itemId,
        consumed: 0,
        feedback: '3-Slot Hermetic Titanium Vial Rack verified sterile and ready for field collection.'
      });
    }

    case 'relay_beacon': {
      return {
        ...unchanged({
          ok: true,
          itemId,
          consumed: 0,
          feedback: 'UHF Optical Waypoint Transponder pinged: bearing locked on active mission target.'
        }),
        stemScoreBonus: 10
      };
    }

    case 'sonic_wiper': {
      if (ctx.dustCoverage <= 0.02) {
        return unchanged({
          ok: false,
          itemId,
          code: 'NO_EFFECT',
          reason: 'Solar array photovoltaic glass is already clean (dust coverage < 2%). Wiper charge preserved.'
        });
      }
      if (distToSolar > 10.5 && !ctx.isInsideHabitat && distToBase > 8.5) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: `Too far from Solar Array (${distToSolar.toFixed(1)}m). Move within 10m of the panels or Habitat Maintenance Bus.`
        });
      }
      const clearedPct = Math.round(ctx.dustCoverage * 100);
      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback: `Electrostatic wiper purged ${clearedPct}% regolith dust from the solar array! Solar intake restored.`,
          actualDelta: { dustCoverage: -ctx.dustCoverage }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: ctx.oxygen,
        nextTemperature: ctx.temperature,
        nextDustCoverage: 0,
        nextThrusterEnergy: ctx.thrusterEnergy
      };
    }

    case 'backup_battery': {
      if (baseBatteryKwh >= capacity - 0.25) {
        return unchanged({
          ok: false,
          itemId,
          code: 'NO_EFFECT',
          reason: `Outpost Battery Grid is already at capacity (${baseBatteryKwh.toFixed(1)} / ${capacity.toFixed(0)} kWh). Cartridge not consumed.`
        });
      }
      if (!ctx.isInsideHabitat && distToBase > 9.5 && distToRover > 4.5 && !ctx.isDrivingRover) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: 'Must be inside/near Habitat Power Bus (<9.5m) or Rover Aux Dock (<4.5m) to Discharge Li-S Cartridge.'
        });
      }
      const kwhToAdd = 15.0;
      const nextKwh = Math.min(capacity, baseBatteryKwh + kwhToAdd);
      const actualAddedKwh = nextKwh - baseBatteryKwh;
      const nextPct = Math.max(0, Math.min(100, (nextKwh / capacity) * 100));
      const actualAddedPct = nextPct - baseBatteryPercent;

      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback: `Installed Li-S Power Cartridge: +${actualAddedKwh.toFixed(1)} kWh (+${actualAddedPct.toFixed(0)}%) transferred to grid.`,
          actualDelta: { batteryKwh: actualAddedKwh, batteryPercent: actualAddedPct }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: nextKwh,
        nextBatteryPercent: nextPct,
        nextOxygen: ctx.oxygen,
        nextTemperature: ctx.temperature,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: ctx.thrusterEnergy
      };
    }

    case 'space_tape':
    case 'gasket_set': {
      const needsSealRepair = ctx.hasActiveLeakEvent || ctx.oxygen < 20.4;
      if (!needsSealRepair) {
        return unchanged({
          ok: false,
          itemId,
          code: 'NO_EFFECT',
          reason: 'All habitat seams and airlock gaskets are holding nominal pressure (20.9% O₂, 0 leaks).'
        });
      }
      if (!ctx.isInsideHabitat && distToBase > 9.5) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: `Return to the Habitat Airlock perimeter (<9.5m) to apply ${def.name}.`
        });
      }
      const o2Boost = itemId === 'space_tape' ? 2.2 : 2.0;
      const nextO2 = Math.min(20.9, ctx.oxygen + o2Boost);
      const actualO2Delta = nextO2 - ctx.oxygen;

      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback: `${def.name} applied to hull seam! Pressure leak sealed and habitat O₂ stabilized (+${actualO2Delta.toFixed(1)}% O₂).`,
          actualDelta: { oxygen: actualO2Delta }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: nextO2,
        nextTemperature: ctx.temperature,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: ctx.thrusterEnergy,
        resolveLeakEvents: true
      };
    }

    case 'space_apple': {
      if (!ctx.isInsideHabitat && !ctx.isDrivingRover && distToBase > 6.0) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: 'Cannot open helmet visor in raw Martian CO₂ atmosphere! Enter the pressurized Habitat or Rover cabin first.'
        });
      }
      const energyGain = Math.max(15, 100 - ctx.thrusterEnergy);
      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback:
            'Consumed Hydroponic Ration Pack inside pressurized cabin: Cadet EVA Stamina restored to 100% (+25 STEM Focus). Habitat O₂/Temp unchanged.',
          actualDelta: { thrusterEnergy: energyGain }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: ctx.oxygen,
        nextTemperature: ctx.temperature,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: 100,
        stemScoreBonus: 25
      };
    }

    case 'water_canister': {
      if (!ctx.isInsideHabitat && distToBase > 8.5) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: 'Must be inside or adjacent to the Habitat Life-Support Loop (<8.5m) to transfer 25L purified water.'
        });
      }
      const nextO2 = Math.min(21.5, ctx.oxygen + 1.8);
      const actualO2 = nextO2 - ctx.oxygen;
      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback: `Transferred 25L Purified H₂O into Habitat Electrolyzer: +${actualO2.toFixed(1)}% O₂ buffer & hydroponics irrigated.`,
          actualDelta: { oxygen: actualO2 }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: nextO2,
        nextTemperature: ctx.temperature,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: ctx.thrusterEnergy,
        stemScoreBonus: 30
      };
    }

    case 'mineral_shard': {
      if (!ctx.isInsideHabitat && distToBase > 8.5) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: 'Bring Regolith & Hematite Ore inside the Habitat Sintering Station (<8.5m) to fabricate thermal shielding.'
        });
      }
      const nextTemp = Math.min(22.0, ctx.temperature + 1.5);
      const actualTemp = nextTemp - ctx.temperature;
      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback: `Sintered 2.5 kg Regolith Ore into ceramic thermal cladding: Habitat heat retention improved (+${actualTemp.toFixed(1)}°C).`,
          actualDelta: { temperature: actualTemp }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: ctx.oxygen,
        nextTemperature: nextTemp,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: ctx.thrusterEnergy,
        stemScoreBonus: 35
      };
    }

    case 'thermal_blanket': {
      if (ctx.temperature >= 20.5) {
        return unchanged({
          ok: false,
          itemId,
          code: 'NO_EFFECT',
          reason: `Habitat cabin temperature is already warm (${ctx.temperature.toFixed(1)}°C). Save the Aerogel Quilt for cold night drops.`
        });
      }
      if (!ctx.isInsideHabitat && distToBase > 9.0) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: 'Must be at the Habitat Dome (<9.0m) to install the Silica Aerogel Thermal Quilt.'
        });
      }
      const nextTemp = Math.min(21.0, ctx.temperature + 3.5);
      const actualTemp = nextTemp - ctx.temperature;
      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback: `Installed Silica Aerogel Thermal Quilt on dome hull: +${actualTemp.toFixed(1)}°C cabin warmth recovered.`,
          actualDelta: { temperature: actualTemp }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: ctx.oxygen,
        nextTemperature: nextTemp,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: ctx.thrusterEnergy
      };
    }

    case 'rover_repair_kit': {
      if (distToRover > 4.5 && !ctx.isDrivingRover) {
        return unchanged({
          ok: false,
          itemId,
          code: 'INVALID_TARGET',
          reason: `Move within 4.5m of the Exploration Rover (currently ${distToRover.toFixed(1)}m away) to service its suspension.`
        });
      }
      return {
        result: {
          ok: true,
          itemId,
          consumed: 1,
          feedback:
            'Serviced Rover rocker-bogie actuators & brushed Mastcam-Z stereo optics (+50 STEM Engineering pts).',
          actualDelta: { thrusterEnergy: 100 - ctx.thrusterEnergy }
        },
        nextInventory: { ...ctx.inventory, [itemId]: currentCount - 1 },
        nextBatteryKwh: baseBatteryKwh,
        nextBatteryPercent: baseBatteryPercent,
        nextOxygen: ctx.oxygen,
        nextTemperature: ctx.temperature,
        nextDustCoverage: ctx.dustCoverage,
        nextThrusterEnergy: 100,
        stemScoreBonus: 50
      };
    }

    default:
      return unchanged({
        ok: false,
        itemId,
        code: 'UNAVAILABLE',
        reason: `${def.name} cannot be activated in the current context.`
      });
  }
}

/**
 * Pure, deterministic transfer evaluator between Personal Backpack and Rover Cargo Bay.
 * Preserves total item sum and requires proximity <= 4.5m to the Rover.
 */
export function evaluateCargoTransfer(params: {
  itemId: string;
  direction: 'to_rover' | 'to_backpack';
  personalInventory: Record<string, number>;
  roverInventory: Record<string, number>;
  playerPos: [number, number, number];
  roverPos: [number, number, number];
  isDrivingRover: boolean;
}): {
  ok: boolean;
  reason: string;
  nextPersonalInventory: Record<string, number>;
  nextRoverInventory: Record<string, number>;
} {
  const {
    itemId,
    direction,
    personalInventory,
    roverInventory,
    playerPos,
    roverPos,
    isDrivingRover
  } = params;

  const def = ITEM_CATALOG[itemId];
  if (!def) {
    return {
      ok: false,
      reason: 'Unknown item ID.',
      nextPersonalInventory: { ...personalInventory },
      nextRoverInventory: { ...roverInventory }
    };
  }

  if (def.reusable && itemId === 'sample_container') {
    return {
      ok: false,
      reason: 'Primary 3-Vial Specimen Rack is permanently mounted to your EVA suit.',
      nextPersonalInventory: { ...personalInventory },
      nextRoverInventory: { ...roverInventory }
    };
  }

  const dist = Math.hypot(playerPos[0] - roverPos[0], playerPos[2] - roverPos[2]);
  if (!isDrivingRover && dist > 4.5) {
    return {
      ok: false,
      reason: `Rover Cargo Bay out of reach (${dist.toFixed(1)}m away). Walk within 4.5m of the Rover to transfer supplies.`,
      nextPersonalInventory: { ...personalInventory },
      nextRoverInventory: { ...roverInventory }
    };
  }

  if (direction === 'to_rover') {
    const count = personalInventory[itemId] ?? 0;
    if (count <= 0) {
      return {
        ok: false,
        reason: `No ${def.name} in Personal Backpack to transfer.`,
        nextPersonalInventory: { ...personalInventory },
        nextRoverInventory: { ...roverInventory }
      };
    }
    return {
      ok: true,
      reason: `Transferred 1x ${def.name} to Rover Cargo Bay.`,
      nextPersonalInventory: { ...personalInventory, [itemId]: count - 1 },
      nextRoverInventory: { ...roverInventory, [itemId]: (roverInventory[itemId] ?? 0) + 1 }
    };
  } else {
    const count = roverInventory[itemId] ?? 0;
    if (count <= 0) {
      return {
        ok: false,
        reason: `No ${def.name} stored in Rover Cargo Bay.`,
        nextPersonalInventory: { ...personalInventory },
        nextRoverInventory: { ...roverInventory }
      };
    }
    return {
      ok: true,
      reason: `Retrieved 1x ${def.name} from Rover Cargo Bay.`,
      nextPersonalInventory: {
        ...personalInventory,
        [itemId]: (personalInventory[itemId] ?? 0) + 1
      },
      nextRoverInventory: { ...roverInventory, [itemId]: count - 1 }
    };
  }
}

/**
 * Helper to check if a collected specimen ID matches a chapter objective's targetSpecimenId.
 * Supports prefix matching (e.g. target "specimen-regolith" matches "specimen-regolith-1").
 */
export function doesSpecimenMatchObjective(
  specimenId: string,
  targetSpecimenId?: string
): boolean {
  if (!targetSpecimenId) return true;
  return (
    specimenId === targetSpecimenId ||
    specimenId.startsWith(`${targetSpecimenId}-`)
  );
}
