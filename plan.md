# Development Execution Plan
## Ares Cradle: Extraterrestrial Outpost Simulator (Demo)

This plan outlines the sequential tasks required to build, test, and deploy the demo version on Vercel, adhering to the Hallmark aesthetic and modular architecture.

---

### Phase 1: Project Scaffolding & Design Foundation
- [x] **1.1 Initialize Vite React 18 Application**
  - Setup TypeScript, Tailwind CSS, and Lucide React icons.
  - Configure path aliases (`@/modules/*`, `@/services/*`, `@/styles/*`).
- [x] **1.2 Install Core Runtime Dependencies**
  - Install `@react-three/fiber`, `@react-three/drei`, `three`, and `@types/three`.
  - Install `framer-motion` for tactile micro-interactions and UI animations.
  - Install `zustand` for high-performance reactive simulation state.
- [x] **1.3 Configure Hallmark & Impeccable Design Tokens**
  - Define Mars color palette (Martian rust, deep space charcoal, luminescent cyan, warning amber).
  - Implement tactile button styling, spring physics presets, and anti-slop CSS rules in `src/styles/hallmark-tokens.css`.

---

### Phase 2: Domain Simulation Engine & Service Layer
- [x] **2.1 Define Domain TypeScript Types**
  - Define `ResourceState` (Solar, Battery, O₂, Temperature, DustLevel).
  - Define `StageConfig`, `GameEvent`, and `DebriefReport` in `src/modules/simulation-engine/types.ts`.
- [x] **2.2 Implement Deterministic Resource Math**
  - Code `formulas.ts` implementing power generation, battery drain, thermal decay, and oxygen scrubbing.
  - Ensure zero division errors and strict clamping between 0 and maximum capacities.
- [x] **2.3 Create Zustand Outpost Store**
  - Implement `useOutpostStore.ts` managing active stage, Sol clock, resource values, and user allocations.
  - Implement time-step actions (`tick()`, `setPowerAllocation()`, `cleanDust()`, `emergencyCut()`).
- [x] **2.4 Build Modular Service Adapter**
  - Define `IMissionService.ts` contract.
  - Implement `MockMissionService.ts` supplying initial data for Stages 1, 2, and 3.

---

### Phase 3: Three.js Mars Outpost 3D Diorama
- [x] **3.1 Mars Canvas & Camera Rig**
  - Build `MarsCanvas.tsx` with customized OrbitControls (restricted elevation and zoom limits suitable for children).
  - Configure cinematic lighting (warm directional Martian sunlight + deep ambient sky fill).
- [x] **3.2 Outpost Procedural Assets & Meshes**
  - Build `MarsTerrain.tsx` with stylized Martian surface and crater formations.
  - Build `HabitatDome.tsx` with glowing interior bioluminescence showing life activity.
  - Build `SolarArray.tsx` with interactive click handler to wipe dust.
  - Build `BatteryBank.tsx` with dynamic visual LED charge indicators.
- [x] **3.3 Environmental Weather System**
  - Build `DustStormParticles.tsx` driven by store state (activates particle swirl when storm event triggers).
  - Implement smooth transition between daytime sky and cold starry night.

---

### Phase 4: Hallmark Mission Control UI & Tactile HUD
- [x] **4.1 Primary Telemetry Gauges**
  - Build `ResourceDial.tsx` with Framer Motion animated needles/arcs for Battery, O₂, and Temperature.
  - Add color-coded warning states (Emerald = Safe, Amber = Warning, Crimson = Critical).
- [x] **4.2 Tactile Power Distribution Deck**
  - Build `PowerDistributor.tsx` allowing players to prioritize Power to Life Support vs. Heaters.
  - Include spring-animated push toggles with haptic visual feedback.
- [x] **4.3 Sol Status & Objective Banner**
  - Build `StageBanner.tsx` displaying the current mission goal, Sol time-of-day clock, and day counter.
- [x] **4.4 Emergency Alert & Debrief Modals**
  - Build `EventModal.tsx` for pop-up hazard alerts (e.g., "Dust Storm Approaching!").
  - Build `DebriefModal.tsx` displaying the end-of-stage scorecard and trade-off lesson learned.

---

### Phase 5: Mission Stage Content & Web Audio Sound Engine
- [x] **5.1 Mission Stage 1: "Sol 1: The Frigid Night"**
  - Configure stage parameters: calm daytime transition into sub-zero night (-60°C).
  - Verify win condition (battery survived through sunrise) and loss condition (freezing/hypoxia).
- [x] **5.2 Mission Stage 2: "Sol 5: Red Dust Approaching"**
  - Trigger dust storm event at Sol 5 Noon; solar efficiency drops by 60%.
  - Require player to clean panels and throttle non-essential systems.
- [x] **5.3 Mission Stage 3: "Sol 12: Hull Micro-Fracture"**
  - Trigger oxygen leak event; oxygen depletes at double speed.
  - Require player to surge oxygen power while managing battery survival.
- [x] **5.4 Web Audio Synthesizer**
  - Build `soundEngine.ts` with synthesized sound effects (click chimes, power hum, warning sirens).
  - Add mute/unmute control in the top navigation bar.

---

### Phase 6: Verification, Performance & Vercel Deployment
- [x] **6.1 Quality & Accessibility Review**
  - Verify WCAG AAA color contrast on all text gauges and HUD elements.
  - Test responsive layout on mobile, tablet, and desktop viewports.
  - Confirm touch-screen compatibility for panel cleaning and slider controls.
- [x] **6.2 Performance Tuning & Asset Budget**
  - Verify 60 FPS rendering on integrated GPUs.
  - Confirm total bundle payload < 350KB initial gzipped JS.
- [x] **6.3 GitHub & Vercel Setup**
  - Create `vercel.json` with SPA routing and static caching headers.
  - Verify production build via `npm run build`.

---

### Phase 7: Django Backend Roadmap (`feat/django-backend`)
- [x] **7.1 Scaffold Django 5.x App**
  - Initialize Django with Django REST Framework (DRF) and `django-cors-headers`.
- [x] **7.2 Implement Models & Endpoints**
  - Create `StageConfig`, `CadetSession`, and `TelemetryLog` models.
  - Expose `/api/v1/stages/` and `/api/v1/sessions/` endpoints.
- [x] **7.3 Connect Django Service Adapter**
  - Implement `DjangoMissionService.ts` calling the DRF backend.
  - Toggle service selection via `VITE_USE_BACKEND=true` environment variable.
