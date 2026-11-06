# Technical Architecture Document
## Ares Cradle: Extraterrestrial Outpost Simulator

**Target Version:** 1.0 (Demo Release)  
**Deployment Platform:** Vercel Static Hosting (GitHub CI/CD)  
**Primary Tech Stack:** React 18, Three.js / React Three Fiber, Framer Motion, Tailwind CSS, Zustand  
**Backend Readiness:** Modular Service Adapter Architecture (Decoupled for Django REST Framework)

---

### 1. Architectural Philosophy & Overview

The architecture delivers **high-fidelity 3D graphics** and **low-latency tactile UI** on standard classroom hardware without server dependencies for the demo. It adopts a **Service Adapter Pattern**: the frontend core communicates exclusively through an abstract `IMissionService` interface. Today, a pure client-side simulation driver fulfills this interface; tomorrow, a Django backend driver plugs in without touching UI or 3D modules.

```mermaid
graph TD
    subgraph Presentation_Layer [Presentation Layer]
        HUD[Framer Motion Mission Control HUD]
        Canvas3D[Three.js / React Three Fiber Diorama]
        AudioEngine[Web Audio Sound Synthesizer]
    end

    subgraph State_and_Coordination [State & Coordination Layer]
        Store[Zustand Outpost Store]
        EventBus[Simulation Tick & Event Bus]
    end

    subgraph Domain_Simulation [Domain Simulation Engine]
        Engine[Mars Physics & Resource Calculator]
        Stages[Stage Progression Rules]
    end

    subgraph Service_Adapter_Layer [Service Adapter Layer]
        Interface[<<interface>> IMissionService]
        MockService[MockClientMissionService (Active Demo)]
        DjangoService[DjangoRestMissionService (Roadmap Branch)]
    end

    subgraph External_Future_Backend [Future Backend feat/django-backend]
        Django[Django 5.x + DRF REST API]
        Database[(PostgreSQL Database)]
    end

    HUD --> Store
    Canvas3D --> Store
    Store --> EventBus
    EventBus --> Engine
    Engine --> Stages
    Store --> Interface
    Interface -.-> MockService
    Interface -.-> DjangoService
    DjangoService -.-> Django
    Django --> Database
```

---

### 2. Module Directory Structure

The codebase is organized into isolated feature modules to ensure clean separation of concerns, testability, and painless debugging:

```
ares-cradle/
├── public/
│   ├── assets/models/         # Compressed GLTF/GLB models (Hab dome, Solar array, Rover)
│   ├── assets/textures/       # Mars surface normals, dust particle sprite, skybox
│   └── audio/                 # UI click & telemetry audio chimes (WAV/MP3)
├── src/
│   ├── modules/
│   │   ├── outpost-3d/        # Three.js 3D Viewport & Interactive Scene
│   │   │   ├── MarsCanvas.tsx          # R3F canvas root with camera controls & post-fx
│   │   │   ├── MarsTerrain.tsx         # Procedural heightmap Martian ground & rocks
│   │   │   ├── HabitatDome.tsx         # Pressurized dome with inner bioluminescence
│   │   │   ├── SolarArray.tsx          # Interactive panels with dust accumulator mesh
│   │   │   ├── DustStormParticles.tsx  # Dynamic particle system for Mars weather
│   │   │   └── LightingRig.tsx         # Dynamic sun directional light + ambient tint
│   │   ├── mission-control/   # Framer Motion Hallmark UI / HUD
│   │   │   ├── MissionControlOverlay.tsx # Main HUD wrapper
│   │   │   ├── ResourceDial.tsx          # Tactile gauge for Power, O2, and Temp
│   │   │   ├── PowerDistributor.tsx      # Interactive allocation sliders/toggles
│   │   │   ├── StageBanner.tsx           # Mission objective & Sol timer ticker
│   │   │   ├── EventModal.tsx            # Emergency alert card with sound cue
│   │   │   └── DebriefModal.tsx          # Stage completion scorecard & trade-off explanation
│   │   ├── simulation-engine/ # Deterministic Game Math & Loop
│   │   │   ├── gameLoop.ts               # Tick processor (Sol daytime vs night progression)
│   │   │   ├── formulas.ts               # Energy balance, thermal decay, and O2 scrub math
│   │   │   ├── stages.ts                 # Stage 1-3 configuration, events, win/loss rules
│   │   │   └── types.ts                  # Domain telemetry & stage definitions
│   │   ├── audio/             # Web Audio sound engine
│   │   │   ├── soundEngine.ts            # Sound effects synthesizer and player
│   │   │   └── audioAssets.ts            # Audio clips, frequencies, and haptic chimes
│   │   └── store/             # Reactive state management
│   │       ├── useOutpostStore.ts        # Zustand store driving 3D and HUD states
│   │       └── storeTypes.ts             # State actions and selectors
│   ├── services/
│   │   ├── api/
│   │   │   ├── IMissionService.ts        # Service interface contract
│   │   │   ├── MockMissionService.ts     # Active client-side simulation adapter
│   │   │   └── DjangoMissionService.ts   # Future REST client adapter (Axios / Fetch)
│   └── styles/
│       ├── hallmark-tokens.css # Color palettes, shadows, borders, anti-slop rules
│       └── index.css           # Tailwind base & utilities
├── vercel.json                # Vercel deployment & routing config
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

### 3. Simulation Engine & Mathematics

The simulation runs on a deterministic tick loop (1 Sol = 60 real seconds, partitioned into Morning, Noon, Sunset, Night).

#### 3.1 Resource Mathematical Formulas
- **Net Power Balance ($\Delta P$):**
  $$\Delta P = P_{\text{solar}} \times (1 - \text{Dust}) \times \text{SunlightFactor} - (P_{\text{hab\_base}} + P_{\text{oxygen}} + P_{\text{thermal}})$$
- **Battery Reserve ($B_{t+1}$):**
  $$B_{t+1} = \max\left(0, \min\left(B_{\text{capacity}}, B_t + \Delta P \times \Delta t\right)\right)$$
- **Habitat Temperature ($T_{t+1}$):**
  $$T_{t+1} = T_t + \left(k_{\text{heat}} \cdot P_{\text{thermal}} - k_{\text{loss}} \cdot (T_t - T_{\text{mars\_ambient}})\right) \times \Delta t$$
- **Oxygen Saturation ($O_{2, t+1}$):**
  $$O_{2, t+1} = O_{2, t} + \left(k_{\text{oxy}} \cdot P_{\text{oxygen}} - \text{CrewConsumption} - \text{LeakRate}\right) \times \Delta t$$

---

### 4. Service Adapter Contract (`IMissionService`)

All game state persistence, stage definitions, and high scores flow through the interface:

```typescript
export interface IMissionService {
  getStageConfig(stageId: number): Promise<StageConfig>;
  submitStageResult(result: StageDebriefData): Promise<SubmissionResponse>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}
```

- In **Demo v1.0**, `MockMissionService` satisfies this contract instantly from in-memory fixtures.
- In **Backend v2.0**, `DjangoMissionService` satisfies this contract via standard `fetch` calls to `/api/v1/...`.

---

### 5. Future Django Backend Roadmap (`feat/django-backend`)

When migrating to a full-stack deployment, the Django backend branch will introduce:

#### 5.1 Django Architecture & Apps
- `core`: Base settings, CORS configuration, authentication (optional).
- `simulation`: Mission stages, dynamic weather scenarios, resource curve definitions.
- `telemetry`: Cadet session logs, trade-off decisions tracking, class analytics for teachers.

#### 5.2 Core Django REST Endpoints
- `GET /api/v1/stages/`: List all available mission scenarios and difficulty curves.
- `GET /api/v1/stages/{id}/`: Retrieve initial parameters, environmental events, and thresholds.
- `POST /api/v1/sessions/{id}/turn/`: Record turn telemetry for teacher analytics.
- `POST /api/v1/sessions/{id}/complete/`: Store mission grade and engineering debrief.

---

### 6. Vercel Deployment & Build Architecture

1. **Build Tool:** Vite + React 18 TypeScript.
2. **Configuration (`vercel.json`):**
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```
3. **Asset Optimization:**
   - 3D Geometry: Draco-compressed low-poly meshes.
   - Textures: WebP format, 1024x1024 max resolution.
   - Target bundle size: Initial JS payload < 300KB (gzipped).
