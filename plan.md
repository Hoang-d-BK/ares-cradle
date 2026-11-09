# Development Execution Plan (v2.0 - Survival Action & Advanced Enhancements)
## Ares Cradle: Extraterrestrial Outpost Simulator & Explorer

---

### Module 1: Core Game Loop & Prototype Engine (COMPLETED - ARCHIVED)
> [!NOTE]
> Toàn bộ các hạng mục nền tảng của Prototype (Phase 1 đến Phase 7) gồm: Character WASD controller, Isometric Camera rig, Không gian kép Interior/Exterior & cửa Airlock, Minimal HUD Minecraft, Web Audio Arcade Synth, Hệ thống tinh thể rơi & nâng cấp trạm, Robot đồng hành Chipi-Bot, và kiểm tra build TypeScript đã hoàn thành và kiểm chứng thành công. Module này được đóng gói lưu trữ nhằm giải phóng token context.

---

### Module 2: Advanced Ecosystem Enhancements (ACTIVE)

> [!IMPORTANT]
> **Quy Tắc Mở Rộng Động (Dynamic Tool Adoption Invariant):**
> Trong suốt quá trình thực thi các split task dưới đây, nếu Antigravity hoặc bất kỳ Agent/Harness nào tìm thấy công cụ, thư viện, hoặc repository tối ưu hơn trên GitHub/Web so với công cụ được liệt kê, Agent có toàn quyền chủ động tải về (`curl`/`git`) và tích hợp trực tiếp vào dự án.

#### Phase 8: UI/UX Tactile Polish & Anti-AI-Slop Gate (Trụ Cột 1)
- [x] **8.1 Thiết lập Token-Based Design System & Linter chống Slop (`Nutlope/hallmark`)**
  - Chuyển đổi toàn bộ màu sắc hard-coded sang hệ thống CSS variables / Tailwind tokens (`--color-mars-rust`: `#C1440E`, `--color-cyan-visor`: `#00F0FF`, `--color-amber-hazard`: `#FFB020`).
  - Kiểm định theo tiêu chuẩn của Hallmark: loại bỏ triệt để `transition: all`, cấm animate thuộc tính layout (`width`, `height`), cấm gradient AI tím-xanh rập khuôn.
- [x] **8.2 Thẩm Định Visual Hierarchy & Trạng Thái Xúc Giác (`pbakaus/impeccable`)**
  - Hoàn thiện 6 trạng thái xúc giác chuẩn (default, hover, active, focus-visible, disabled, loading skeletons) cho nút bấm, slot ô đồ balo và công tắc trạm.
  - Tích hợp các mẫu thiết kế nhận diện từ [namethatui.com](https://namethatui.com) và linh kiện tactile từ [uiverse.io](https://uiverse.io) / [21st.dev](https://21st.dev).
- [x] **8.3 Chuyển Động Vật Lý Lò Xo & Pháo Hoa Ăn Mừng (`framer-motion` & `canvas-confetti`)**
  - Áp dụng spring physics cho thao tác bung mở Balo Minecraft và hiệu ứng nổ pháo hoa đa sắc khi vượt qua đợt bão cát hoặc mở rương quà.

---

#### Phase 9: 3D Graphics, Low-Poly Assets & R3F Performance (Trụ Cột 2)
- [x] **9.1 Tích Hợp Mô Hình 3D Low-Poly Bản Quyền CC0 (Kenney Space Kit & `pmndrs/gltfjsx`)**
  - Tải bộ mô hình không gian CC0 từ Kenney (astronaut, solar array, rover, craters, minerals) và biên dịch sang component React Three Fiber typed bằng `gltfjsx`.
- [x] **9.2 Nhúng Mô Hình NASA Chính Thống Làm Hologram Blueprint (`nasa/NASA-3D-Resources`)**
  - Nhúng mô hình 3D rover Perseverance / trạm InSight lander từ NASA 3D Resources vào màn hình tương tác trong trạm để học sinh khám phá.
- [x] **9.3 Tối Ưu Hóa Pipeline Hậu Kỳ & Shader Bão Bụi (`pmndrs/react-postprocessing` & `pmndrs/drei`)**
  - Tích hợp `Sparkles`, `Billboard` từ `@react-three/drei` và hiệu ứng GPU hậu kỳ (Bloom tinh thể, Noise/Grain bão bụi, Vignette cảnh báo sụt điện).
  - Tích hợp `pmndrs/leva` (chế độ query `?debug=true`) để cân chỉnh ánh sáng và camera trực tiếp trên trình duyệt.

---

#### Phase 10: Storyline, Educational Lore & NASA Real-Time Telemetry (Trụ Cột 3)
- [x] **10.1 Tích Hợp Dữ Liệu Thời Tiết Sao Hỏa Thời Gian Thực (NASA InSight Weather API)**
  - Kết nối NASA Open API lấy dữ liệu nhiệt độ và tốc độ gió thực tế từ Elysium Planitia, biến đổi thành thông số bão cát động trong game.
- [x] **10.2 Cây Hội Thoại Hài Hước & Bài Học Khoa Học Cho Chipi-Bot (JSON Dialogue Engine)**
  - Viết bộ kịch bản thoại ngắn ngộ nghĩnh (< 10 từ/câu) giải thích dễ hiểu các thử thách kỹ thuật của NASA (chu trình O₂ Sabatier, điện hạt nhân Kilopower, bảo dưỡng pin mặt trời).
- [x] **10.3 Bầu Trời Đêm Vũ Trụ Với Quỹ Đạo Mặt Trăng Phobos (NASA Eyes on Mars)**
  - Mô phỏng chuyển động của mặt trăng Phobos và chòm sao theo góc nhìn từ vòm kính trạm quan sát.

---

#### Phase 11: Backend, Classroom Room-PIN & Live Leaderboard (Trụ Cột 4)
- [x] **11.1 Xây Dựng API Phòng Đấu Thi Đấu Lớp Học (Classroom Room PIN Code)**
  - Nâng cấp backend Django (`backend/apps/simulation/`): Giáo viên tạo phòng thi đấu với mã PIN 6 số để học sinh cùng tham gia một đợt bão cát thử thách.
- [x] **11.2 Bảng Xếp Hạng & Telemetry Đánh Giá Kỹ Năng Kỹ Thuật (`backend/apps/telemetry/`)**
  - Ghi nhận telemetry: lượng điện tiết kiệm, thời gian phản ứng khi có bão, số Sol sinh tồn cao nhất. Xuất báo cáo tóm tắt cho giáo viên.
- [x] **11.3 Kiến Trúc Hybrid Fallback Hoàn Toàn Tự Động**
  - Tự động chuyển đổi mượt sang LocalStorage / Vercel Edge Serverless khi không có kết nối server Django cục bộ, đảm bảo zero-downtime cho người chơi web.

---

#### Phase 12: Automated Canvas Regression & Multi-Device Verification (Trụ Cột 5)
- [x] **12.1 Kiểm Thử Tự Động Canvas WebGL Bằng Playwright / Puppeteer**
  - Viết kịch bản tự động chụp ảnh màn hình canvas 3D định kỳ sau các commit, kiểm tra tụt frame (< 60 FPS) hoặc lỗi tràn vỡ mesh.
- [x] **12.2 Xác Minh Đa Thiết Bị (Chromebook, iPad, Tablet Cảm Ứng)**
  - Đảm bảo trải nghiệm mượt mà 60 FPS trên GPU tích hợp Intel UHD và tương thích 100% giữa bàn phím WASD và Joystick cảm ứng.

---

#### Phase 13: NASA Space Apps Visual & Orbital Upgrades (Học từ `NASA-Live-Orrery`)
> [!NOTE]
> Bám sát `prd.md`: Giữ nguyên mô hình 2 tài nguyên cốt lõi (**Energy** vs. **Life Support: O₂ & Thermal**) cho học sinh 7–12 tuổi, nâng cấp chiều sâu thị giác và tính chân thực khoa học từ dự án Global Finalist `D:\nasa-meteor-rizzlers`.

- [x] **13.1 Quỹ Đạo Kepler Thực Tế & Bầu Trời Đêm Sao Hỏa (`SpaceSkybox.tsx` & `marsWeatherService.ts`)**
  - Áp dụng thuật toán Julian Date & phương trình Kepler từ `NASA-Live-Orrery/nasa-api.js` để mô phỏng chính xác vị trí 2 mặt trăng **Phobos & Deimos** cùng góc chiếu Mặt Trời theo giờ Sol thực tế (trực tiếp điều phối sản lượng điện **Solar Array** trong `prd.md` mục 3.1).
  - Thêm lớp Procedural Canvas Fallback Texture (như `createProceduralTexture` trong `solar-system.js`) đảm bảo mặt đất Sao Hỏa và bầu trời luôn sắc nét 60 FPS ngay cả khi offline hoặc nghẽn mạng trên Chromebook trường học.
- [x] **13.2 Shader Khí Quyển & Hiệu Ứng Quầng Sáng Năng Lượng (`SolarArray.tsx` & `HabitatDome.tsx`)**
  - Tích hợp lớp phát xạ BackSide Corona/Atmospheric Glow (`MeshBasicMaterial` + `THREE.BackSide`) quanh vòm kính trạm: chuyển màu trực quan theo nhiệt độ trong trạm (`+20°C` Cyan ấm áp sang `-60°C` băng giá hoặc Đỏ cảnh báo khi sụt Oxy < 19.5%).
  - Mở rộng địa hình sao Hỏa (`MarsTerrain.tsx`) kéo rộng bề mặt bán kính 38m, bổ sung cụm đá va chạm và vùng thám hiểm.
  - Tích hợp xe tự hành Mars Rover (`MarsRover.tsx`) có thể điều khiển trực tiếp (WASD, hotkey R) với hệ thống đèn pha và bánh xe Rocker-Bogie quay theo vận tốc.
  - Thêm chế độ quan sát bầu trời tự do Orrery Sky View (hotkey V) trên `CameraRig.tsx`.

---

#### Phase 14: Tactile Micro-Interactions & Anti-Slop Motion System (Học từ `PremiumButton`, `Navigation`, `animations.js`)
- [x] **14.1 Hệ Thống Nút Bấm Từ Tính & Phản Hồi Xúc Giác (`PowerDistributor.tsx` & `TactileButton.tsx`)**
  - Nâng cấp các nút điều phối **Power Router**, **Emergency Power Saver** và **Dust Wiper** (mục 3.3 `prd.md`) với hiệu ứng **Magnetic Hover** (`deltaX * 0.15`), **Click Ripple** và **Apple-style Skew Shimmer** học từ `PremiumButton.js` & `PremiumCard.css`.
- [x] **14.2 Chuẩn Hóa Đường Cong Chuyển Động Bezier & Fluid Typography (`hallmark-tokens.css`)**
  - Áp dụng bộ Bezier easing chuẩn `[0.6, 0.05, 0.01, 0.9]` từ `utils/animations.js` và thang chữ co giãn `clamp()` từ `premium-typography.css` cho `StageBanner.tsx` và các đồng hồ `ResourceDial.tsx`.

---

#### Phase 15: Cơ Chế "Space Quiz Cứu Nguy" & AI AstroBot Ngữ Cảnh (Học từ `AsteroidSmash` & `UniversalChatbot.js`)
- [x] **15.1 Mini-Quiz STEM Cứu Nguy Khi Sụt Nguồn (`BrownoutQuizModal.tsx`)**
  - Học từ cơ chế *Answer Space Quiz for Extra Heart (5s)* của `AsteroidSmash/main.js`: Khi Pin căn cứ chạm `0%` ban đêm (Emergency Brownout — mục 3.1 `prd.md`), trước khi xử thua, hệ thống mở thử thách câu hỏi trắc nghiệm nhanh 10 giây về khoa học Sao Hỏa (chu trình Sabatier, pin mặt trời, bão bụi). Trả lời đúng sẽ kích hoạt **Pin Dự Phòng Khẩn Cấp (+20% kWh)** kèm giải thích kỹ thuật cho học sinh.
- [x] **15.2 Nâng Cấp Chipi-Bot Thành Trợ Lý Hỏi Đáp Đa Tầng (`AstroBotCompanion.tsx`)**
  - Học kiến trúc 2 tầng của `UniversalChatbot.js`: Kết hợp lời thoại kịch bản nhanh (< 10 từ) với chế độ hỏi đáp khoa học có **Smart Offline Keyword Fallback**, giúp học sinh hỏi trực tiếp *"Tại sao bão cát làm giảm điện?"* hoặc *"Làm sao giữ ấm ban đêm mà không hết Oxy?"* ngay trong giờ học mà không sợ lỗi mất mạng hay hết quota API.

---

#### Phase 16: Radar Địa Hình & Vòng Đai Ảnh Hưởng Bão Bụi (Học từ `SimulationPage.js` & `NEOAnalysis.js`)
- [x] **16.1 Mini-Radar Quét Tâm Bão Bụi Đa Vòng Tròn (`StormRadarHUD.tsx`)**
  - Chuyển hóa cơ chế vẽ các vòng tròn đồng tâm bán kính ảnh hưởng (`fireball_km`, `shockwave_km`, `thermal_radius_km` trong `SimulationPage.js`) thành **Mini-Radar Khí Tượng Sao Hỏa** góc màn hình: hiển thị 3 vòng đai bão bụi đang tiến vào căn cứ (Vòng Cảnh Báo Sớm → Vòng Giảm 30% Điện Mặt Trời → Tâm Bão Giảm 60% Điện & Tụt Nhiệt Độ ở Stage 2 *Sol 5: Red Dust Approaching*).
  - Giúp học sinh 7–12 tuổi nhìn thấy trực quan nhân-quả địa lý trước khi bão ập tới để chủ động tích trữ pin và bật chế độ tiết kiệm điện.
