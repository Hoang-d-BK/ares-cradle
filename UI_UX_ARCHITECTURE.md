# Ares Cradle — UI/UX, 3D Simulation & Equipment Architecture Index (v3.0 Prompt Pack Edition)

> **Purpose for AI Models / Coding Agents & Developers**: This document provides a complete, deterministic map of every **UI**, **UX**, **Design Token**, **3D Viewport**, **24-Item Industrial Aerospace Catalog**, **Locomotion/Physics**, **Audio**, and **State Store** file in the codebase, followed by the **v3.0 Prompt Pack Implementation Changelog** detailing all completed upgrades.

---

## 1. Quick File Locator by Domain

### A. Root Entry & Global Styles (UI Theme & Design Tokens)
| File Path | Role & Responsibility | Key Symbols / CSS Tokens |
| :--- | :--- | :--- |
| `/index.html` | HTML entry point, Google Fonts (`Rajdhani`, `Share Tech Mono`, `Fira Code`, `Inter`), dark root shell | `#root`, font preconnects |
| `/src/main.tsx` | React DOM mount & global stylesheet imports | `App` mount |
| `/src/App.tsx` | Top-level viewport layout combining the 3D WebGL canvas (`MarsCanvas`) and 2D HUD overlay (`MissionControlOverlay`) | `App` |
| `/src/styles/hallmark-tokens.css` | **Primary Design System & Dynamic HUD Color Themes** (`solar-amber`, `cerenkov-cyan`, `biodome-emerald`, `phobos-plasma`), tactile button states, inventory slots, and fluid typography | `--hud-bg`, `--hud-surface`, `--hud-border`, `--hud-accent`, `--hud-accent-2`, `--hud-glow`, `--hud-text`, `.hud-theme-shell`, `.hud-panel`, `.btn-tactile`, `.slot-tactile` |
| `/src/styles/index.css` | Tailwind CSS base directives, scrollbar suppression, and global layout resets | `@tailwind base/components/utilities` |
| `/tailwind.config.js` | Tailwind theme extensions (`mars-rust`, `mars-charcoal`, `mars-cyan`, `mars-amber`, font families) | `theme.extend.colors` |

---

### B. Primary HUD & Mission Control Overlays (`/src/modules/mission-control/`)
| File Path | Role & Responsibility | Key State / Hotkeys |
| :--- | :--- | :--- |
| `/src/modules/mission-control/MissionControlOverlay.tsx` | **Master 2D HUD Orchestrator** over the 3D canvas. Renders Visor Corner Frame, Top Telemetry Bar, Bottom Dock + Quickbar `[1–5]`, Desktop Locomotion Deck, Physics Hitbox Legend, Mobile Joystick, and Modals | Hotkeys: `[1–5]` Quickbar, `[E]` Backpack, `[R]` Rover, `[F]` Flashlight, `[G]` Codex, `[F2]` Showcase, `[H]` Hide HUD, `[B]` 3D Hitboxes, `[T]` HUD Color Theme |
| `/src/modules/mission-control/HorizontalDatapadHUD.tsx` | **Bottom Telemetry Dock + 5-Slot Quickbar (`[1–5]`)**: Displays `Battery %` (`batteryKwh` truth), `O₂ %`, `Temp °C`, `Power Router`, `Storm Shutter`, and the **5-Slot Quickbar (`[1–5]`)** with live `ItemActionResult` feedback toast | `quickbarSlots`, `executeItemAction`, `lastItemActionResult` |
| `/src/modules/mission-control/AstronautDatapad.tsx` | **Engineering Datapad** containing Power Allocation sliders, Solar Array maintenance, and system diagnostics | `powerPriorityOxygen`, `powerPriorityHeaters` |
| `/src/modules/mission-control/CockpitDrivingDeck.tsx` | **Rover Cockpit HUD** displayed when `isDrivingRover === true` (speed, heading, low/high beam toggle `[F]`, dismount `[R]`) | `isDrivingRover`, `roverHeadlightMode` |
| `/src/modules/mission-control/PowerDistributor.tsx` | Interactive O2 Generator vs. Thermal Heater power priority allocation controls & Emergency Power Saver toggle | `powerPriorityOxygen`, `powerPriorityHeaters`, `emergencyPowerSaver` |
| `/src/modules/mission-control/ResourceDial.tsx` | Circular/radial SVG telemetry gauge for Battery %, Oxygen %, and Temperature °C | `ResourceDial` |
| `/src/modules/mission-control/TactileButton.tsx` | Mechanical push-button component with 6 tactile states, ripple wave, and audio click feedback | `TactileButton` |
| `/src/modules/mission-control/EventModal.tsx` | Emergency hazard alert modal (Dust storms, solar flares, seal leaks) | `activeEvents` |
| `/src/modules/mission-control/DebriefModal.tsx` | End-of-Sol victory or mission failure summary report with STEM takeaways | `debriefReport`, `isVictory`, `isGameOver` |

---

### C. 24-Item Industrial Aerospace Catalog & Survival UI (`/src/modules/survival-ui/`)
| File Path | Role & Responsibility | Key Symbols / Contracts |
| :--- | :--- | :--- |
| `/src/modules/survival-ui/itemRegistry.ts` | **24-Item Industrial Aerospace Catalog & Transaction Engine**: Defines all 24 items (`1–12` active MVP items, `18–21` identity-tracked scientific specimens, `13–17` & `22–24` Phase-2 engineering specs), `ItemActionResult` contract, `evaluateItemTransaction`, `evaluateCargoTransfer`, and `doesSpecimenMatchObjective` | `ITEM_CATALOG`, `MVP_EQUIPMENT_IDS`, `BLUEPRINT_CATALOG_IDS`, `evaluateItemTransaction`, `evaluateCargoTransfer` |
| `/src/modules/survival-ui/itemRegistry.test.ts` | **Automated Unit Test Suite (`7/7` tests)** validating the 24-item catalog, reusable tools (`consumed: 0`), `batteryKwh` source of truth, `space_apple` cabin stamina restoration, `space_tape` / `sonic_wiper` precondition guards, Rover cargo conservation, and specimen objective matching | Run via `npx tsx --test src/modules/survival-ui/itemRegistry.test.ts` |
| `/src/modules/survival-ui/AerospaceItemIcon.tsx` | **Code-Authored SVG Industrial Aerospace Silhouettes**: Custom multi-stop SVG hardware vector icons for all 24 items (anodized aluminum, hazard amber, Kapton gold, cryogenic cyan) | `AerospaceItemIcon` |
| `/src/modules/survival-ui/BackpackModal.tsx` | **EVA Field Equipment & Specimen Manifest (`[E]`)**: 3-tab manifest (`EVA Suit Pack (12)`, `Rover Cargo`, `Phase-2 Specs (8)`), **3-Slot Hermetic Specimen Vial Rack**, **Right-hand Equipment Inspector** (separating Select/Inspect from Use/Activate), Quickbar `[1–5]` pin assignment, and Rover Cargo transfer | `role="dialog"`, `executeItemAction`, `transferCargoItem`, `assignQuickbarSlot` |
| `/src/modules/survival-ui/AstroBotCompanion.tsx` | Floating Chipi-Bot robotic companion hint widget | `AstroBotCompanion` |
| `/src/modules/survival-ui/BrownoutQuizModal.tsx` | Emergency STEM rescue quiz triggered before a fatal night brownout (`role="dialog"`) | `isBrownoutQuizOpen` |
| `/src/modules/survival-ui/ClassroomModal.tsx` | Classroom session PIN modal for teacher/student telemetry sync (`role="dialog"`) | `isClassroomOpen` |
| `/src/modules/survival-ui/RewardCelebration.tsx` | Confetti & star-rating celebration modal upon Sol completion | `RewardCelebration` |

---

### D. Story Engine, Visor HUD & Bio-Dome Lab (`/src/modules/story-engine/`)
| File Path | Role & Responsibility | Key State / Features |
| :--- | :--- | :--- |
| `/src/modules/story-engine/components/CockpitVisorHUD.tsx` | **Top Visor Telemetry Bar**: Sol phase badge, synchronized 24h Martian clock (`cycleTime = solTime % 60`), Current Objective pill, **3-Tier Graphics Quality Switcher (`LOW / MED / HIGH`)**, **4-Swatch HUD Color Palette Selector**, `[B]` Hitbox toggle, `[E]` Backpack, `[R]` Rover, `[F]` Flashlight, `[G]` Codex, `[F2]` Showcase, and Audio Mute | `graphicsQuality`, `setGraphicsQuality`, `hudColorTheme`, `isPhysicsDebugVisible` |
| `/src/modules/story-engine/components/MinimapRadar.tsx` | **Top-Right Radar Compass**: Live player/rover coordinates, Habitat & Specimen blips, and 360° camera orientation | Uses `.hud-theme-shell` & `--hud-accent` |
| `/src/modules/story-engine/components/BioDomeLabStation.tsx` | **Interior Bio-Dome Specimen Refinement Lab (`role="dialog"`)**: Refines carried specimen vials (`carriedVials`) into **honest category-specific yields** (`mineral` -> `+Sorted Regolith Ore & +1.2°C cladding`, `ice` -> `+Purified Water Canister & +3.5% O2`, `atmosphere` -> `+4.0% MOXIE O2`, `food` -> `+Hydroponic Ration Pack`) and unlocks corresponding NASA Science Capsules | `refineAllCarriedVials`, `openScienceCard` |
| `/src/modules/story-engine/components/MissionCommsBriefing.tsx` | Sortie mission briefing modal (`role="dialog"`) with Commander Aria dialogue & objective checklist | `isBriefingOpen` |
| `/src/modules/story-engine/components/FieldGuideModal.tsx` | Encyclopedia of collected Martian geological & atmospheric specimens + Live 3D Orrery (`role="dialog"`) | `isCodexOpen`, `dataCapsules` |
| `/src/modules/story-engine/components/ScienceCardModal.tsx` | Detailed 3-Tier STEM educational card modal (`role="dialog"`) with interactive check quiz | `isScienceCardOpen`, `activeCapsule` |
| `/src/modules/story-engine/components/FieldSpecimenToast.tsx` | Non-blocking toast notification when collecting field specimens or when 3/3 vials are full | `toastSpecimen` |
| `/src/modules/story-engine/components/ChapterSelectModal.tsx` | Sol / Chapter selector modal (`role="dialog"`, passkey `ARES2026`) | `isChapterSelectOpen` |

---

### E. Character Locomotion, Camera & Touch UX (`/src/modules/character/`)
| File Path | Role & Responsibility | Physics / UX Parameters |
| :--- | :--- | :--- |
| `/src/modules/character/AstronautPlayer.tsx` | **Player Controller & 3D EVA Visuals**: Handles `WASD`/Arrow movement, `Shift` Ion Thruster Sprint (`6.6 m/s`), `Space` Jump & `Space ×2` Mid-Air Jetpack Double-Jump, 3D dual ion thruster plumes, shockwave ring, habitat airlock transitions, and **Unified Modal Input Gate** (flushes held keys when any dialog opens) | `WALK_SPEED = 4.2`, `SPRINT_SPEED = 6.6`, `thrusterEnergy (0-100%)` |
| `/src/modules/character/physicsEngine.ts` | **3D Collision & Vertical Physics Engine**: Circle-vs-Sphere, Circle-vs-OBB, and Habitat Dome shell ring collision with wall-sliding, step-up (`0.22m`), gravity (`9.8 m/s²`), Coyote Time (`0.14s`), Jump Buffer (`0.14s`), and Double-Jump (`5.2 m/s`) | `stepPlayerPhysics`, `STATIC_WORLD_COLLIDERS` |
| `/src/modules/character/physicsEngine.test.ts` | Automated unit test suite (`5/5` tests) verifying wall blocking, Space jump onto platforms, dome airlock doorway vs. solid wall, fall gravity, and double-jump + inertia | Run with `npx tsx --test src/modules/character/physicsEngine.test.ts` |
| `/src/modules/character/CameraRig.tsx` | **3rd-Person Orbital Camera Rig**: Pointer drag 360° yaw/pitch orbit, mouse wheel zoom, keyboard `Q` / `C` yaw orbit (no longer conflicts with `E` Backpack), exponential follow damping, and sprint FOV pull-back | `cameraYaw` |
| `/src/modules/character/VirtualJoystick.tsx` | **Mobile/Touch Only UX (`coarse` pointer / `<1024px`)**: Left virtual thumbstick + Right `⚡ BOOST` thruster button and `▲▲ JUMP / JET ×2` button. Unmounted on desktop | `setJoystickVector`, `setSprintInput`, `requestJump` |

---

### F. 3D Outpost Scene, Grounded Field Caches & Quality Pipeline (`/src/modules/outpost-3d/`)
| File Path | Role & Responsibility | Key Details |
| :--- | :--- | :--- |
| `/src/modules/outpost-3d/MarsCanvas.tsx` | **Main React Three Fiber (`<Canvas>`)**: Connects `graphicsQuality` (`low` \| `medium` \| `high`) to Canvas DPR (`1` / `[1, 1.5]` / `[1, 2]`), shadow maps, antialiasing, and conditional `<PostProcessingPipeline>` | `[data-graphics-quality]` |
| `/src/modules/outpost-3d/ResourceDrops.tsx` | **Grounded Martian Field Supply Caches & Mineral Outcrops**: Replaces floating neon crystals with grounded **Industrial Li-S Power Cartridge Crates** and **Ferric-Basalt Mineral Outcrops**, indexed by stable `node.id` ref map and synchronous `collectedSetRef` guard | Calls `addBatteryKwh(6.0)` or adds `+1 backup_battery` when grid is full |
| `/src/modules/outpost-3d/LightingRig.tsx` | **Synchronized Diurnal Sun & Shadow Rig**: Uses `cycleTime = ((solTime % 60) + 60) % 60` (`0–32s` daylight arc, `32–60s` night) and disables `castShadow` when `graphicsQuality === 'low'` | `LightingRig` |
| `/src/modules/outpost-3d/SolarArray.tsx` | **Sun-Tracking Solar Array**: Tracks sun elevation using the identical `cycleTime = solTime % 60` arc (`0–32s`) and cleans dust on single click (`cleanDust` completes `'sol1-wipe-panels'`) | `SolarArray` |
| `/src/modules/outpost-3d/DustStormParticles.tsx` | **Quality-Scaled Dust Particle System**: Dynamically scales active particle draw range (`240` on `low`, `540` on `medium`, `900` on `high`) | `DustStormParticles` |
| `/src/modules/outpost-3d/SpecimenNode.tsx` | **3D Scientific Specimen Nodes**: Single-trigger collection guard (`!targetSpecimen.collected`) and proximity glow | `SpecimenNodesCollection` |
| `/src/modules/outpost-3d/MarsRover.tsx` | **Drivable 6-Wheel Mars Perseverance Rover**: Gated by Unified Modal Input Gate so driving stops when any dialog opens | `MarsRover` |
| `/src/modules/outpost-3d/PhysicsDebugHitboxes.tsx` | **3D Wireframe Hitbox & Bounding Box Visualizer (`[B]`)**: Color-coded 3D wireframes, ground footprints, jumpable top-surface planes, airlock pass-through corridor, and player capsule | `isPhysicsDebugVisible` |

---

## 2. Changelog — Выполненные задачи из `Ares_Cradle_Prompt_Pack.md` (Tóm tắt các hạng mục đã thực hiện)

### I. Prompt 1 — 3D Art, HUD Consolidation, Simulation Truth & Modal Input Gate
1. **Đồng bộ hóa chu kỳ Ngày/Đêm (`0–60s` Sol Cycle)**:
   - Chuẩn hóa `cycleTime = ((solTime % 60) + 60) % 60` đồng nhất giữa `LightingRig.tsx`, `SolarArray.tsx`, `formulas.ts` và đồng hồ 24h trên `CockpitVisorHUD.tsx` (`0–32s` ban ngày có nắng sạc pin, `32–60s` ban đêm).
2. **`batteryKwh` là nguồn dữ liệu chuẩn duy nhất (Single Source of Truth)**:
   - Mọi thao tác nạp/xả năng lượng (`tick`, `addBatteryKwh`, `executeItemAction`, `handleBrownoutQuizSuccess`) đều tính toán trên `batteryKwh` (`0..batteryCapacityKwh`) và tự động suy ra `battery % = (batteryKwh / batteryCapacityKwh) * 100`.
3. **Thay thế tinh thể bay lơ lửng bằng Hòm Tiếp Tế & Quặng Địa Chất Sao Hỏa (`ResourceDrops.tsx`)**:
   - Thay hoàn toàn các khối octahedron phát sáng bay lơ lửng bằng **Hòm Pin Li-S Công Nghiệp đặt trên mặt đất (Grounded Industrial Power Cartridge Cache)** và **Vỉa Quặng Sắt-Basalt (Ferric-Basalt Outcrop)**.
   - Sửa lỗi lệch index `groupRef.current.children[idx]` bằng `Map<string, THREE.Group>` theo `node.id` cố định và khóa chống nhặt kép `collectedSetRef`.
   - Sửa lỗi chồng tọa độ với Solar Array (`[-4.5, 0, 1.4]` -> dời sang `[-2.8, -0.36, 2.3]`).
4. **Hệ thống Chất lượng Đồ họa 3 Mức (`low` | `medium` | `high`)**:
   - Tích hợp `graphicsQuality` trong `useOutpostStore.ts` và nút chuyển trực tiếp **`GFX: LOW / MED / HIGH`** trên thanh `CockpitVisorHUD.tsx`.
   - Điều chỉnh thực tế DPR của `<Canvas>`, bật/tắt đổ bóng (`shadows`), số lượng hạt bão bụi (`240` / `540` / `900`), và tắt `<PostProcessingPipeline>` ở chế độ `low` để đảm bảo 60 FPS trên Chromebook/Mobile.
5. **Cổng Chặn Input & Tạm Dừng Mô Phỏng Khi Mở Modal (Unified Modal Pause & Input Gate)**:
   - Khi mở bất kỳ hộp thoại nào (`BackpackModal`, `MissionCommsBriefing`, `BioDomeLabStation`, `ScienceCardModal`, `ChapterSelectModal`, `ClassroomModal`, `BrownoutQuizModal`, `FieldGuideModal`), hệ thống tự động:
     - Tạm dừng tiêu hao O₂/Pin/Nhiệt độ trong `tick()` để người chơi đọc kiến thức STEM hoặc quản lý kho đồ mà không bị phạt.
     - Xóa ngay trạng thái giữ phím `WASD` / `Shift` / `Space` của Phi hành gia và xe Rover.
     - Đổi phím xoay camera phải từ `Shift+E` sang `C` (`Q` / `C`) để không bao giờ xung đột với phím `E` mở Balo.
     - Loại bỏ `backdrop-blur` đè lên WebGL canvas ở tất cả modal để tránh tụt FPS.

### II. Prompt 2 — Danh mục 24 Thiết bị Hàng không Vũ trụ, Hợp đồng Tác vụ Trung thực, Khay 3 Ống Mẫu & Khoang Hàng Rover
1. **Danh mục 24 Vật phẩm Chuẩn Hàng không Vũ trụ (`src/modules/survival-ui/itemRegistry.ts` & `AerospaceItemIcon.tsx`)**:
   - **12 thiết bị MVP khả dụng (`1–12`)**:
     - Nhóm Năng lượng: `backup_battery` (+15 kWh), `sonic_wiper` (quét sạch bụi pin mặt trời), `power_fuse` (+10 kWh & mở khóa cầu chì dự phòng).
     - Nhóm Sự sống & Sửa chữa: `space_tape` (vá rò rỉ áp suất / phục hồi +6.5% O₂), `gasket_set` (thay vòng đệm khí +8% O₂ & +1.5°C), `thermal_blanket` (+3.5°C nhiệt độ cabin), `space_apple` (+65% thể lực thruster EVA trong cabin), `water_canister` (+5% O₂ điện phân & +35% thể lực EVA).
     - Nhóm Dụng cụ Khảo sát tái sử dụng (`consumed: 0`): `flashlight` (bật/tắt đèn pha mũ bảo hiểm), `soil_analyzer` (quét quang phổ địa chất trong bán kính 12m), `sample_container` (kiểm tra khay 3 ống mẫu kín khí), `relay_beacon` (cắm mốc dẫn đường tới mục tiêu hiện tại).
   - **4 mẫu vật Khoa học định danh (`18–21`)**: `hematite_sample`, `permafrost_ice_sample`, `regolith_clay_sample`, `vesicular_basalt_sample` được lưu trong **Khay 3 Ống Mẫu Kín Khí (`carriedVials` tối đa 3/3)** với đầy đủ ID, tọa độ Sol thu thập, và danh mục.
   - **8 Bản vẽ Kỹ thuật Giai đoạn 2 (`13–17`, `22–24`)**: Hiển thị trong tab riêng **`Phase-2 Specs (8)`** với nhãn `PHASE-2 ENGINEERING BLUEPRINT` minh bạch.
2. **Tách biệt Chọn/Xem thông số (`Select`) và Kích hoạt (`Use/Activate`) trong `BackpackModal.tsx`**:
   - Nhấp vào ô vật phẩm chỉ mở bảng **Equipment Telemetry & Action Inspector** bên phải (`consumed: 0`).
   - Nút kích hoạt hiển thị rõ điều kiện tiên quyết và trả về `ItemActionResult` trung thực (`ok`, `reason`, `consumed`, `effects`, `message`). Nếu pin đã đầy hoặc tấm pin mặt trời đã sạch, vật phẩm **không bị trừ số lượng** (`consumed: 0`) và báo lý do cụ thể.
3. **Thanh Phím Tắt 5 Ô (`[1–5]` Quickbar) & Khoang Hàng Xe Tự Hành (`Rover Cargo Transfer`)**:
   - Thanh Quickbar `[1–5]` nằm cạnh cụm đồng hồ Telemetry dưới đáy màn hình, hỗ trợ nhấn phím số `1–5` hoặc click chuột để dùng nhanh thiết bị.
   - Tab **`Rover Cargo`** cho phép chuyển vật phẩm 2 chiều giữa Balo EVA và Khoang hàng của xe Rover khi đứng cách xe `<= 4.5m` (bảo toàn tổng số lượng `backpack + rover`).
4. **Trạm Nghiên cứu Sinh quyển (`BioDomeLabStation.tsx`)**:
   - Phân tích mẫu vật trả về tài nguyên chính xác theo từng loại mẫu (`mineral` -> Quặng Regolith & lớp cách nhiệt `+1.2°C`; `ice` -> Bình nước tinh khiết 25L & `+3.5% O₂`; `atmosphere` -> `+4.0% O₂`; `food` -> Khẩu phần dinh dưỡng Hydroponic) thay vì thông báo cố định sai lệch.
   - Mở khóa ngay Thẻ Khoa học NASA tương ứng với nút bấm mở trực tiếp trong phòng Lab.

### III. Prompt 3 — Kiểm thử Tự động (Unit Tests, Build, Lint & Browser Verification)
- **Unit Tests (`12/12 PASS`)**:
  - `src/modules/character/physicsEngine.test.ts` (5/5 pass)
  - `src/modules/survival-ui/itemRegistry.test.ts` (7/7 pass)
- **TypeScript & Anti-Slop Lint**: `compile_applet` & `lint_applet` vượt qua 100% không lỗi.
