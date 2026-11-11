# ARES CRADLE — BỘ PROMPT NÂNG CẤP GAME SAO HỎA

Soạn riêng từ mã nguồn trong `ares-cradle(1).zip`. Ngày tham khảo nguồn: 11/11/2026.

## Cách sử dụng

1. Đưa file ZIP dự án cho model có khả năng đọc/sửa nhiều file và chạy ứng dụng. Dán **Prompt 1** để nâng cấp diện mạo, thế giới 3D và trải nghiệm chơi.
2. Sau khi có bản nâng cấp chạy được, dán **Prompt 2** để làm sâu UI vật phẩm và inventory. Trong cuộc trò chuyện mới, gửi bản mã nguồn mới nhất cùng prompt này.
3. Dùng **Prompt 3** để model kiểm tra và sửa sản phẩm trước khi bàn giao. Prompt này cũng hữu ích nếu bản đầu trông đẹp nhưng thao tác hoặc tiến độ bị lỗi.

Chỉ copy nội dung giữa dòng BẮT ĐẦU và KẾT THÚC của prompt cần dùng. Không cần dán cả phần phân tích và nguồn ở cuối. Nếu model nhận file Markdown làm yêu cầu, có thể gửi luôn file này và nói: “Thực hiện Prompt 1 trước; Prompt 2 là giai đoạn kế tiếp; dùng Prompt 3 làm điều kiện kiểm chứng.”

Các prompt được viết để model **thực hiện thay đổi trong dự án**, không dừng ở việc tư vấn. Prompt 1 ưu tiên bản nâng cấp hoàn chỉnh về hình ảnh và vòng chơi; Prompt 2 mở rộng hệ vật phẩm có kiểm soát. Catalog 24 mục là hướng thiết kế; không phải yêu cầu xây 24 hệ thống mới cùng lúc.

### Những điểm đã xác định từ dự án

Game đã có React + TypeScript + Vite + Three.js/React Three Fiber, astronaut, rover, habitat, solar array, power allocation, storm, story, specimen, lab và inventory. Vì vậy một prompt chỉ bảo “làm game vũ trụ thật đẹp” sẽ bỏ qua phần giá trị đang có.

Đọc mã cho thấy các vấn đề cụ thể: item hiển thị nhưng chưa có hành động; loading được hardcode; đồ ăn hồi phục oxy/nhiệt độ căn cứ; crystal cộng điện; phần trăm pin có thể lệch kWh; các modal chưa có quyền điều khiển đầu vào thống nhất. Những nhận xét về độ chật và phân cấp HUD là suy luận từ bố cục trong mã; chưa phải kết quả đo giao diện đang chạy. Prompt yêu cầu model tiếp theo chạy game và xác minh bằng ảnh/thao tác thật.

---

## PROMPT 1 — NÂNG CẤP TỔNG THỂ: MỸ THUẬT 3D, HUD VÀ TRẢI NGHIỆM CHƠI

**BẮT ĐẦU PROMPT 1**

Bạn làm việc trực tiếp trên mã nguồn web game **Ares Cradle / Countdown to Ares‑1** tôi đính kèm. Hãy đảm nhiệm vai trò người phát triển game chính, có năng lực thiết kế mỹ thuật 3D, UI/UX game và triển khai React Three Fiber. Tôi cần một bản nâng cấp **chạy được, nhìn đẹp rõ rệt và chơi mạch lạc**, được tích hợp vào dự án hiện tại.

Hãy chủ động đọc repo, chạy bản gốc khi môi trường cho phép, ghi nhận những điểm cần sửa rồi thực hiện. Bạn có quyền đưa ra các lựa chọn thiết kế và sửa mã trong phạm vi này. Trình bày kế hoạch ngắn để tôi theo dõi và tiếp tục làm; không kết thúc chỉ bằng kế hoạch, moodboard, pseudocode hoặc vài component rời. Nếu một khả năng phụ chưa có trong môi trường, chọn cách triển khai phù hợp với công cụ thực có và nói rõ giới hạn đó.

### 1. Mục tiêu trải nghiệm

Tôi muốn cảm giác như đang điều khiển một tiền đồn nghiên cứu Sao Hỏa được thiết kế có chủ đích: cảnh quan có chiều sâu, thiết bị có công năng, nhân vật và rover dễ nhận diện, điều khiển có phản hồi và giao diện chỉ đưa đúng thông tin cần thiết. Cảm giác chủ đạo là **khám phá, tự tay sửa chữa và từng bước làm một nơi khắc nghiệt trở nên có thể sinh sống**.

Hãy làm người chơi muốn dừng lại nhìn căn cứ lúc hoàng hôn, muốn lái rover tới điểm nghiên cứu tiếp theo, và hiểu được tại sao việc lau bụi pin mặt trời hoặc phân bổ điện lại có ích. Độ đẹp phải xuất hiện trong cảnh chơi và hành động thường ngày; một màn hình đầu đẹp chưa đủ.

Game dành cho người học trẻ, khoảng 8–15 tuổi, với phiên chơi ngắn. Ưu tiên dễ đọc, dễ khám phá, hướng dẫn đúng lúc và kiến thức khoa học đáng tin. Giữ độ sâu từ quyết định có đánh đổi thay vì thêm nhiều thanh chỉ số khiến người chơi phải quản lý như bảng tính.

### 2. Hiểu đúng dự án trước khi sửa

Mốc kỹ thuật trong ZIP ban đầu:

- React 18, TypeScript 5.6, Vite 5.
- Three.js 0.168, React Three Fiber 8, Drei 9, có thư viện postprocessing.
- Zustand 5 cho state, Tailwind 3, Framer Motion 11, Lucide cho icon.
- Backend Django REST là tùy chọn; frontend có service mock và phải tiếp tục chạy độc lập.
- `src/App.tsx` đang ghép `MarsCanvas` với `MissionControlOverlay`; không giả định đây là ứng dụng có router và nhiều page sẵn.

Đọc tối thiểu các nhóm sau; nếu bản hiện tại đã được refactor thì tìm thành phần tương đương và dùng bản hiện tại làm chuẩn:

| Nhóm | Tệp cần hiểu |
|---|---|
| Entry và design tokens | `src/App.tsx`, `src/main.tsx`, `src/styles/index.css`, `src/styles/hallmark-tokens.css`, `tailwind.config.js` |
| Cảnh 3D | `src/modules/outpost-3d/MarsCanvas.tsx`, `LightingRig.tsx`, `MarsTerrain.tsx`, `HabitatDome.tsx`, `HabitatInterior.tsx`, `MarsRover.tsx`, `SolarArray.tsx`, `BatteryBank.tsx`, `SpaceSkybox.tsx` |
| UI gameplay | `src/modules/mission-control/MissionControlOverlay.tsx`, `HorizontalDatapadHUD.tsx`, `CockpitDrivingDeck.tsx`, `src/modules/story-engine/components/CockpitVisorHUD.tsx`, `MinimapRadar.tsx` |
| Nhân vật và camera | `src/modules/character/AstronautPlayer.tsx`, `CameraRig.tsx`, `VirtualJoystick.tsx`, `physicsEngine.ts` |
| Dữ liệu và mô phỏng | `src/modules/store/useOutpostStore.ts`, `useStoryStore.ts`, `src/modules/simulation-engine/formulas.ts`, `types.ts` |
| Item và khoa học | `src/modules/survival-ui/BackpackModal.tsx`, `src/modules/outpost-3d/ResourceDrops.tsx`, `SpecimenNode.tsx`, `src/modules/story-engine/components/BioDomeLabStation.tsx`, `ScienceCardModal.tsx` |
| Nội dung và dịch vụ | `src/modules/story-engine/content/chapters.json`, `worldAnchors.json`, `capsules/*.json`, `src/services/api/`, `README.md`, `SPEC.md`, `GAME_STORYLINE.md` |

README và SPEC là ý định thiết kế, cần đối chiếu với code và hành vi thực. Đừng lấy các câu “zero overlap”, “60 FPS”, “validated” hoặc số phiên bản trong tài liệu làm kết quả kiểm chứng.

### 3. Bản sắc và vòng chơi cần bảo toàn

Giữ tên Ares Cradle, Cadet Leo, Chipi‑Bot, mục tiêu chuẩn bị tiền đồn trước khi Ares‑1 đến. Giữ 5 mốc **Sol 1, Sol 5, Sol 9, Sol 12, Sol 20** và liên kết giữa tiến độ với thay đổi của habitat/rover.

Vòng chơi lõi: nhận nhiệm vụ tại habitat → chuẩn bị vật tư → di chuyển tới điểm nghiên cứu bằng EVA hoặc rover → thao tác/thu mẫu → quay về trong điều kiện có đánh đổi tài nguyên → phân tích và học → nhìn thấy căn cứ tiến bộ.

Giữ hai nhóm quyết định chính là **năng lượng** và **hỗ trợ sự sống**. Chỉ thêm chỉ số phụ khi có tác động thực sự, có dữ liệu đúng và giúp ra quyết định. Không mở rộng thành game combat, multiplayer, thế giới vô tận hay cây chế tạo hàng chục tầng trong lần nâng cấp này.

Phạm vi nhiệm vụ được thiết kế quanh bán kính 80m; cảnh trang trí có thể xa hơn. Hãy tạo cảm giác rộng bằng phối cảnh, lớp địa hình và hậu cảnh, đồng thời giữ tuyến nhiệm vụ gọn. Đừng hiểu bán kính 80m thành yêu cầu cắt cả cảnh quan ở một bức tường tròn. Các địa hình/địa danh được gom lại là bản đồ giáo dục hư cấu, cần tránh mô tả chúng như tọa độ thật nằm cạnh nhau trên Sao Hỏa.

### 4. Tham khảo có chọn lọc, chốt một hướng hình ảnh

Nếu có thể truy cập web, xem nguồn chính thức dưới đây và ảnh gameplay từ nguồn hợp lệ. Tạo một bảng tham khảo nhỏ: nguồn, đặc điểm quan sát, nguyên tắc muốn học, cách áp dụng riêng cho Ares Cradle. Nếu không thể xem ảnh, ghi rõ và tiếp tục theo đặc tả bằng chữ; không nói đã nghiên cứu screenshot khi chưa nhìn thấy.

| Tham khảo | Điều muốn học và chuyển hóa | Giới hạn áp dụng |
|---|---|---|
| Astroneer — `https://astroneer.space/` | Định hướng khám phá hành tinh, base/vehicle dạng module, hình khối dễ đọc; dùng làm điểm xuất phát để nghiên cứu silhouette và cách làm công cụ dễ nhận ra | Không sao chép nhân vật, asset hoặc gameplay đào địa hình quy mô lớn; không biến Mars thành hành tinh đồ chơi rực màu |
| Surviving Mars — trang chính thức Paradox về Domes & Life Support: `https://www.paradoxinteractive.com/games/surviving-mars-relaunched/news/domes-and-life-support` | Sự tương phản giữa cảnh quan khắc nghiệt và căn cứ có ánh sáng ấm; thiết bị năng lượng–nước–oxy tạo câu chuyện về vận hành | Không bê nguyên city-builder, độ dày menu hoặc biểu đồ vào phiên học ngắn |
| NASA/JPL — MOXIE: `https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/` | Căn cứ khoa học cho công nghệ khai thác tài nguyên tại chỗ; tham khảo hình thức thiết bị và thông tin khoa học có nguồn | Không coi MOXIE thật là máy hỗ trợ sự sống quy mô tiền đồn; thiết bị trong game là phiên bản hư cấu được giản lược |

Các cách chuyển hóa trong bảng là định hướng thiết kế cho dự án này. Hãy quan sát nguồn rồi quyết định chi tiết, thay vì gán mọi yêu cầu UI của tôi thành đặc điểm chính thức của game tham khảo.

Chốt một hướng thống nhất: **tiền đồn nghiên cứu công nghiệp trên Sao Hỏa, cách điệu vừa phải, vật liệu có độ thật và giao diện thiết bị hàng không vũ trụ**. Hình khối được tinh giản để đọc rõ và chạy mượt; vật liệu, ánh sáng và tỷ lệ làm chúng có sức thuyết phục. Toàn bộ world, HUD, icon item, briefing và science card phải cùng một hệ thẩm mỹ.

### 5. Đặc tả cảnh quan và mỹ thuật 3D

#### 5.1. Một khung cảnh mục tiêu

Hãy hình dung camera nhìn chéo qua vai phi hành gia: tiền cảnh có nền đất đỏ nâu và vài vệt bánh xe; phía giữa là rover sáu bánh, habitat trắng ngà bám bụi và các tấm solar xanh đen có mặt phẳng rõ; xa hơn có sườn crater, mesa và đường chân trời mềm vì bụi. Đèn airlock và cửa sổ habitat có màu ấm, tạo điểm về nhà. Một tuyến dấu chỉ hướng kín đáo dẫn tới điểm khoa học. HUD giữ các số quan trọng ở rìa, để cảnh còn không gian thở.

Khung cảnh này phải đọc được ở chất lượng trung bình và khi tắt bloom. Sự khác nhau giữa đất, kính, kim loại, vải và nhựa phải đến từ vật liệu/ánh sáng, không chỉ từ màu hex.

#### 5.2. Terrain: ba lớp thị giác và tuyến chơi rõ

- Tiền cảnh: biến thiên màu và độ nhám tinh tế, đá nhỏ được bố trí có nhịp, chi tiết đủ gợi tỷ lệ. Dùng instancing/texture/vertex color phù hợp thay vì hàng nghìn object React độc lập.
- Trung cảnh: mỗi POI có hình dáng riêng và đường tới rõ; solar ở vùng thoáng, khu crater có lớp đá, khu lấy băng có dấu nhận diện khác mà vẫn cùng ngôn ngữ Mars.
- Hậu cảnh: mesa, vách crater và haze tạo chiều sâu; không cần biến mọi chi tiết xa thành vật thể có collision.
- Tránh một mặt phẳng trống với các viên đá rải ngẫu nhiên đồng đều. Cũng tránh phủ chi tiết dày tới mức không thấy đồ cần nhặt.
- Giữ chung hàm cao độ hoặc contract terrain/collision. Không tạo ground visual mới khiến chân, bánh xe, sample hoặc airlock lơ lửng/chìm dưới đất.
- Nếu thêm vệt chân/vệt bánh xe, giới hạn số lượng và tuổi thọ; không để decal tích tụ vô hạn.
- Biên hoạt động được giải thích bằng phạm vi liên lạc/nhiệm vụ; feedback ngắn, thân thiện và không làm người chơi mất đồ.

#### 5.3. Habitat, solar và thiết bị căn cứ

Habitat cần có cấu trúc thấy được: khung chịu lực, panel, gioăng, airlock, cửa quan sát, đường dẫn điện/nước và khu bảo trì. Dùng chi tiết để kể công năng. Bụi bám ở vị trí có lý; cạnh vật thể có highlight vừa đủ. Một số chi tiết sáng hoặc chuyển động theo trạng thái vận hành thật.

Nội thất gọn và ấm, có lab đọc mẫu, khoang lưu trữ và khu nhà kính. Người chơi nhận ra đường ra/vào ngay. Giữ những nâng cấp theo Sol: ánh sáng hoạt động, nước lưu thông, cây trồng/quan sát, phụ kiện rover hoặc beacon. Không cho toàn bộ nâng cấp xuất hiện ngay đầu game chỉ vì muốn ảnh đẹp.

Solar array cần nhìn ra mặt pin, giá đỡ, độ nghiêng và bụi. Lau bụi phải có thay đổi vật liệu hoặc vùng bụi giảm nhìn thấy được, đồng thời thống kê công suất phản ánh đúng mô phỏng. Không dùng một hiệu ứng sáng chớp thay cho trạng thái thật.

Battery bank, module oxy và lab có nhãn ngắn, cổng kết nối, tay cầm/đế đỡ phù hợp tỷ lệ. Vị trí đặt tạo thành một tiền đồn có lý do vận hành; tránh các object tách rời không liên hệ với habitat.

#### 5.4. Rover và nhân vật

Rover phải có silhouette rõ: sáu bánh, chassis, khoang điều khiển, đèn, anten và điểm gắn module. Tăng độ hoàn thiện của mesh/material trong kiến trúc hiện tại. Kiểm tra bánh chạm địa hình và cảm giác tăng/giảm tốc. Chỉ bổ sung suspension/animation vừa đủ khi contract physics hiện tại hỗ trợ; đừng thay toàn bộ hệ vật lý nếu không cần.

Các attachment phải mở theo tiến độ, có vị trí lắp hợp lý và không cắt xuyên thân xe. Trạng thái đèn đồng bộ với công tắc. Camera chuyển giữa đi bộ và lái mượt, tránh xuyên rover/habitat, giữ mục tiêu điều hướng trong tầm nhìn. Có lựa chọn giảm camera shake/motion nếu thêm rung.

Phi hành gia có suit trắng ngà/graphite, điểm nhấn nhỏ, backpack EVA và visor dễ đọc; tỷ lệ thống nhất với cửa habitat và rover. Làm rõ tiếp đất, bước đi, tương tác và trạng thái đang cầm công cụ. Không phóng đại hiệu ứng nhảy/boost tới mức trái với trọng tâm nghiên cứu hiện tại; giữ các khả năng điều khiển đã có và kiểm tra lại chúng.

#### 5.5. Ánh sáng, bầu trời và thời tiết

- Dùng một mô hình thời gian chung cho ánh sáng, sky, sao, công suất solar và UI ngày/đêm.
- Có điểm sáng chính, ambient/fill đủ đọc địa hình và shadow mềm trong budget. Đêm phải có tương phản và đèn định hướng; không làm màn hình đen tới mức không chơi được.
- Haze tăng theo khoảng cách và thời tiết. Dust storm có khác biệt rõ về môi trường, công suất và cảnh báo; người chơi vẫn tìm được lối về bằng beacon/map/marker.
- Chỉ dùng bloom nhẹ cho đèn/điểm phát sáng có lý do. Hạn chế chromatic aberration, scanline toàn màn hình, vignette dày và blur làm mất độ nét chữ.
- Bầu trời phục vụ bối cảnh Sao Hỏa. Orrery/giáo cụ hệ Mặt Trời có thể ở lab hoặc màn hình kiến thức; không đưa mọi hành tinh khổng lồ lên bầu trời mặc định nếu đó chỉ là trang trí không có giải thích.
- Particle có mức chất lượng, culling và giới hạn; không để phong cách phụ thuộc vào hàng nghìn hạt trong suốt.

### 6. Hệ giao diện: thiết bị nhiệm vụ, phân cấp rõ

#### 6.1. Tokens, chữ và vật liệu UI

Hãy gom các quyết định hình thức vào hệ token có ngữ nghĩa; tận dụng `hallmark-tokens.css` rồi làm nhất quán những màu hardcode. Không thêm một bộ CSS song song khiến hai theme tranh nhau.

| Vai trò | Hướng màu/vật liệu |
|---|---|
| Nền panel | Graphite/charcoal gần `#111820`, đủ đặc để chữ đọc tốt trên mọi nền 3D |
| Bề mặt nâng | Xám xanh đậm gần `#1B2630`, chênh sáng tinh tế |
| Chữ chính | Trắng ngà gần `#EDF1EC`; chữ phụ xám đủ tương phản |
| Điểm nhấn thao tác | Teal/cyan giảm bão hòa, dùng cho chọn/focus/thông tin điều khiển |
| Nhận diện Mars | Rust/terracotta; ưu tiên ở môi trường và một số action thương hiệu |
| Tình trạng | Xanh lá = ổn/thành công; amber = cần chú ý; đỏ = khẩn cấp |
| Chi tiết | Viền mảnh, corner treatment nhỏ, nhãn kỹ thuật vừa đủ; ánh sáng bề mặt không lấn nội dung |

Các mã là định hướng, không phải bảng bắt buộc phải thay mọi token. Sau khi chốt, ghi giá trị thực và sử dụng nhất quán. Màu trạng thái giữ ý nghĩa khi đổi theme. Chuyển lựa chọn theme vào settings gọn; không biến HUD thành dải đèn nhiều màu.

Dùng sans dễ đọc cho đoạn hướng dẫn và tiếng Việt; mono/tabular numbers cho telemetry. Tối đa hai họ chữ chính trong màn chơi, có fallback đúng dấu tiếng Việt. Không dùng toàn chữ hoa cho đoạn dài. Số quan trọng khoảng 18–24px, nội dung thường khoảng 14–16px, nhãn phụ thường từ 12px ở scale mục tiêu; không ép các nhãn nhiệm vụ xuống 9px để vừa màn hình.

Thiết kế khoảng cách theo nhịp 4/8px. Icon có độ dày nét và kích thước nhất quán. Button có default/hover/pressed/focus/disabled; loading chỉ dành cho công việc đang chạy thực. Disabled phải có lý do đọc được mà không phụ thuộc hover.

#### 6.2. Bố cục HUD desktop

Tạo một hệ layout vùng dùng chung thay vì nhiều component tự `fixed` vào các tọa độ không biết nhau. Phân biệt thông tin cần nhìn liên tục, thông tin chỉ khi có ngữ cảnh và màn hình mở theo yêu cầu.

| Vùng | Nội dung chính | Cách xử lý khi hẹp |
|---|---|---|
| Trên trái | Sol, tên nhiệm vụ và một bước tiếp theo cụ thể | Giữ bước hiện tại; chi tiết mở trong mission panel |
| Trên phải | Minimap/compass, khoảng cách tới đích, nút settings nhỏ | Minimap thu gọn hoặc mở rộng khi cần; dành chỗ thật cho nó |
| Dưới trái | Trạng thái mode EVA/rover và gợi ý điều khiển ngắn | Chỉ hiện phím liên quan; hướng dẫn đầy đủ trong Help |
| Dưới giữa hoặc dải tài nguyên gọn | Pin, O₂ habitat, nhiệt độ habitat, power allocation khi được dùng | Thu gọn nhóm phụ; giữ trạng thái nguy cấp đọc được |
| Dưới phải | Quick access inventory và thao tác theo ngữ cảnh | Dùng action tray/overflow có nhãn, không nhồi mọi tính năng |
| Gần đối tượng đang nhắm | Tên đối tượng + thao tác khả dụng | Marker nhỏ, tránh che đối tượng hoặc nằm sau panel |
| Toast | Một kết quả vừa xảy ra | Xếp hàng/ghép sự kiện; tránh đè lên mục tiêu hoặc vùng đọc |

Giữ lề an toàn hợp lý, thường 16–24px trên desktop. Các kích thước panel phải thích ứng với màn hình thật. Thanh trên không được ép hết nội dung `shrink-0` rồi che minimap. Hợp nhất các nút trùng như theme/debug; developer hitbox và số liệu kỹ thuật nằm trong menu debug/dev, không chiếm HUD mặc định.

Người mới phải tìm được trong khoảng ba giây: tôi đang làm gì, đi hướng nào, điều gì đang cần chú ý. Tách cảnh báo cấp bách khỏi thông tin thường. Một cảnh báo gồm tên vấn đề, hậu quả ngắn và hành động khắc phục; không chỉ nháy một số màu đỏ.

Khi không mở modal, mục tiêu là giữ phần lớn vùng giữa để nhìn thế giới. Dùng ảnh thực để kiểm tra các panel đặc không chiếm quá khoảng một phần ba màn desktop thông thường; đây là mục tiêu bố cục, không được đạt bằng cách làm chữ quá nhỏ hoặc giấu cảnh báo.

#### 6.3. HUD theo trạng thái chơi

| Trạng thái | Thông tin được ưu tiên | Hành vi cần có |
|---|---|---|
| Đi bộ EVA | Đích, tương tác gần, vật tư đang chọn, cảnh báo liên quan | Không hiện bảng điều khiển rover thường trực |
| Lái rover | Tốc độ, hướng, địa hình/đích, nút xuống xe | Chuyển mode rõ, không chồng hai bộ hướng dẫn |
| Trong habitat | Power allocation, lab, tiến trình chuẩn bị nhiệm vụ | Cho người chơi xem và thao tác tài nguyên dễ hơn |
| Bão bụi/đêm | Lối về, đèn/beacon, tình trạng năng lượng và nguy cơ | Cảnh báo có ưu tiên, không mở nhiều popup đồng thời |
| Briefing/science/inventory | Nội dung đang đọc và action tương ứng | Khóa input điều khiển game, pause theo quy tắc dưới đây |
| Debrief | Kết quả, nguyên nhân, một điều học được, bước tiếp | Không rải nhiều badge/điểm thiếu ý nghĩa |

Không tự đổi các nhãn O₂ habitat thành SpO₂ hoặc oxy trong suit. Pin kWh của grid và công cụ cá nhân phải có danh tính rõ. Người chơi cần hiểu con số đo cái gì trước khi quyết định.

#### 6.4. Mobile và khả năng tiếp cận

Thiết kế lại bố cục theo breakpoint, không thu nhỏ nguyên HUD desktop. Ưu tiên mission ngắn, joystick bên trái, tương tác bên phải, inventory dễ chạm và tài nguyên gọn. Tránh joystick, action và datapad tranh cùng góc. Vùng chạm tối thiểu khoảng 44px; hỗ trợ safe area, chiều cao viewport động và màn dọc.

Panel dài cuộn bên trong; nút đóng và hành động chính luôn tìm được. Tooltip có bản tương đương khi chạm/focus. Giữ focus-visible, hỗ trợ keyboard cho menu, số liệu kết hợp màu + nhãn + icon. Motion/âm thanh có thể giảm/tắt và vẫn để lại phản hồi nhìn thấy được. Không tuyên bố hỗ trợ gamepad nếu chưa triển khai và kiểm tra Gamepad API.

### 7. Modal, phím tắt và quy tắc pause

Thiết lập một cơ chế thống nhất về lớp UI đang giữ quyền input. Một modal đang đọc/chọn vật phẩm phải chặn movement, jump, camera drag, quickbar và thao tác lái. Space/Enter trên button thực hiện button; không ép blur focus để nhân vật nhảy.

Mặc định cho trải nghiệm học: briefing, science card và inventory pause tiến trình mô phỏng đơn người chơi; toast và marker không pause. Settings/pause menu cũng dừng mô phỏng. Nếu một màn cần chạy thời gian thật vì nhiệm vụ, giải thích rõ trong UX và kiểm tra; không để người chơi vô tình hết tài nguyên khi đang đọc. Dùng pause reasons hoặc cơ chế tương đương để đóng một modal không tự resume khi modal khác vẫn mở.

Khi vào modal hoặc tab trình duyệt mất focus, xử lý held keys/pointer để không chạy kẹt sau khi quay lại. Escape chỉ đóng lớp trên cùng, khôi phục focus về nơi mở, rồi mới trả quyền điều khiển đúng mode. Không để hai modal chính che nhau vì mỗi component có boolean riêng.

Kiểm tra toàn keymap trước khi thêm phím. Bản gốc có E mở balô, F đèn, R rover; CameraRig còn dùng Shift+E xoay camera, dễ xung đột với listener mở balô. Ưu tiên giữ E/F/R và chuyển/loại bỏ tổ hợp camera xung đột, đồng thời cập nhật hướng dẫn thật. Bỏ qua shortcut gameplay khi người dùng gõ tên, PIN hoặc nội dung form.

### 8. Item trong đợt nâng cấp tổng thể

Trong giai đoạn này, làm inventory hiện tại trở nên đẹp, rõ và trung thực. Phần mở rộng catalog sâu được giao bằng một prompt riêng; không xây một hệ inventory cạnh tranh với state đang có.

| Điểm của bản gốc cần xác minh | Kết quả mong muốn |
|---|---|
| `thermal_blanket` và `soil_analyzer` có card nhưng thiếu action/count đầy đủ | Có hành động hợp lệ hoặc trạng thái Inspect/chưa khả dụng có lý do; không click im lặng |
| `rover_engine` khóa hardcode, `quantum_uplink` loading cố định | Unlock gắn tiến độ thật; không có spinner vĩnh viễn giả hoạt động |
| `space_apple` reset O₂ và nhiệt độ habitat | Khẩu phần đóng gói có công dụng hợp lý; bỏ mô tả và hiệu ứng “chữa” cả căn cứ, cập nhật cân bằng liên quan |
| `space_tape` chỉ cộng oxygen | Hành động sửa rò gắn với event/đối tượng; oxy hồi phục qua hệ thống có lý do |
| Crystal neon tự cộng điện | Chuyển thành supply cache/battery cartridge hợp chủ đề hoặc mẫu nghiên cứu; lượng tài nguyên nhận phải thống nhất |
| `water_canister`, `mineral_shard` được sinh nhưng không hiện đủ trong backpack | Registry/UI đọc được các ID thật, không mất dấu vật tư |

Chọn ô chỉ mở chi tiết; nút Use/Equip riêng mới thực hiện. Công cụ tái sử dụng không biến mất sau mỗi lần toggle. Mỗi action có điều kiện, đối tượng, kết quả và lý do thất bại. Giữ khoang ba mẫu khoa học từ `carriedVials` có danh tính riêng; không gộp mẫu nhiệm vụ thành đống vật liệu vô danh.

Icon item cần gợi vật thể cụ thể: pin cartridge, patch niêm phong, ống mẫu, đèn EVA, máy phân tích, can nước. Làm một bộ thumbnail đồng nhất bằng SVG/procedural/render asset tùy công cụ. Không cần canvas 3D cho từng ô. Asset trang trí không được giả làm button có thể dùng.

### 9. Học, kể chuyện và phản hồi có nguyên nhân

Briefing mỗi Sol cần trả lời ngắn: mục tiêu là gì, ở đâu, lấy/dùng công cụ nào, rủi ro nào cần để ý. Chipi‑Bot xuất hiện đúng lúc với câu ngắn; không liên tục nói và chiếm màn hình.

Science card có lớp thông tin: một câu dễ nhớ → cơ chế giải thích → thông tin NASA có nguồn khi muốn đọc sâu. Giữ câu hỏi và cơ chế thử lại hỗ trợ người học. Không nhồi cả bài giảng vào HUD đang lái.

Mỗi hành động quan trọng có chuỗi phản hồi thống nhất: đối tượng thay đổi → chỉ số/thông tin tương ứng cập nhật → âm thanh ngắn nếu được bật → một thông báo đủ hiểu. Ví dụ: lau solar làm lớp bụi giảm và công suất tăng theo điều kiện nắng; lấy mẫu làm ống mẫu vào khoang, node hết trạng thái nhặt và objective đúng loại tăng; về lab mở capsule và kết quả phù hợp mẫu vừa xử lý.

Đừng báo `+50L Water / 100% Oxygen` sau mọi mẫu đá. UI báo kết quả từ action thật. Sửa các mô tả khoa học sai khi gặp, đặc biệt nhầm công nghệ tạo O₂ từ CO₂ hoặc gọi oxygen habitat là sinh hiệu phi hành gia. Đối chiếu nguồn NASA cho các phát biểu kỹ thuật; ghi rõ hệ thống trong game được giản lược, không phải thiết kế hỗ trợ sự sống đã được chứng nhận.

Đừng thêm đói, khát, hư hỏng rover, CO₂ suit, phóng xạ hay bệnh tật chỉ để có thêm icon. Hãy làm vòng chơi hiện có thú vị hơn bằng đặt mục tiêu, trình bày hậu quả và cho thấy tiến bộ của căn cứ.

### 10. Các rủi ro tích hợp phải kiểm tra

Đây là phát hiện từ ZIP ban đầu, cần tái xác minh trước khi sửa. Ưu tiên các lỗi ảnh hưởng trực tiếp hình ảnh, UI và vòng chơi; tránh refactor không liên quan.

1. **Chu kỳ sáng tối:** simulation có dùng thời gian modulo chu kỳ, trong khi `LightingRig.tsx` so `solTime < 32` trực tiếp. Kiểm tra qua hơn một chu kỳ để solar, UI và cảnh không lệch ngày/đêm. Dùng hằng số/hàm thời gian chung.
2. **Nguồn chuẩn của pin:** `battery` phần trăm và `batteryKwh` có thể được cộng độc lập. Chọn kWh làm nguồn chuẩn, suy ra phần trăm từ capacity; clamp nhất quán. Kiểm tra logic trợ giúp ngoài căn cứ đang có để không tạo lệch số hoặc vô tình bỏ khả năng hỗ trợ người học.
3. **Nhặt mẫu trùng/sai objective:** action cần tự kiểm tra đã collected, capacity và specimen target. Kiểm tra trường hợp cả pointer down/click hoặc gọi action lặp; không cộng thưởng hai lần.
4. **Node theo index:** `ResourceDrops` đang có liên kết children index với mảng node gốc; sau khi bỏ node đã nhặt có thể sai. Dùng stable ID/ref cho animation/pickup.
5. **Save và retry:** story persist hiện chỉ lưu một phần unlock/score/badge, không phải full session. Nếu bổ sung Continue/inventory persistence, có version, migration, fallback dữ liệu hỏng và quy tắc new game/retry rõ. Không xóa tiến độ im lặng và không giả vờ mọi dữ liệu đã được lưu sẵn.
6. **Hai store tiến độ:** đồng bộ stage và Sol/chapter, kiểm tra luồng chọn chapter → briefing → nhiệm vụ → debrief → tiếp theo. HUD không hiển thị một tiến trình trong khi mô phỏng dùng tiến trình khác.
7. **Render tần suất cao:** player position/yaw và tick có thể khiến HUD render nhiều. Đo trước khi tối ưu; dùng selector phù hợp, refs cho animation, cập nhật telemetry nhìn thấy ở tần suất cần thiết. Không thêm `setState` hoặc tạo object/material không giới hạn mỗi frame.
8. **Dịch vụ ngoài:** giữ mock-first, lỗi backend/weather/media không làm kẹt game. Phân biệt dữ liệu mô phỏng, dữ liệu lịch sử và dữ liệu đang lấy thật; không gắn nhãn “live” cho thông số tự tạo.

### 11. Giới hạn kỹ thuật và tài sản

Giữ stack và cấu trúc chính trừ thay đổi nhỏ có lý do. Không chuyển sang Unity/Godot/Unreal, không đổi renderer sang WebGPU chỉ vì nguồn tham khảo dùng nó. Không cài framework workflow lớn để làm tác vụ này. Hạn chế dependency mới; tận dụng những gì đã có.

Giữ các view giáo dục bổ sung như Orrery, AsteroidSmash hoặc showcase truy cập được nếu đang hoạt động; đưa chúng vào ngữ cảnh phù hợp và tải theo yêu cầu thay vì tranh sự chú ý với nhiệm vụ chính. Không phá API/mock/backend contract chỉ để đổi skin.

Với asset: ưu tiên asset gọn có quyền sử dụng rõ, asset tự tạo hoặc hình học procedural có chủ đích. Ghi nguồn/license khi dùng bên ngoài. Không lấy model, logo, texture độc quyền từ game tham khảo. Nếu có công cụ tạo hình, có thể dùng cho concept/thumbnail/texture phù hợp; chữ UI, dữ liệu và biểu đồ cần dựng thật trong ứng dụng. Không dùng một ảnh HUD để giả cả giao diện tương tác.

Đóng gói asset có thể tái lập, có fallback khi mạng kém. Giữ tên/đường dẫn dễ hiểu. Đừng tải một thư viện model lớn để lấy một món nhỏ. Asset thiếu có fallback chỉnh chu, không để emoji khổng lồ hoặc placeholder demo ở màn bàn giao.

### 12. Hiệu năng và các mức chất lượng

Đo cảnh gốc và cảnh mới với cùng viewport, camera, mode, thời tiết và thời gian. Báo thiết bị/trình duyệt nếu biết, số đo nào lấy được và số đo nào chưa có. Không tuyên bố “60 FPS trên mọi máy” hoặc gọi build pass là chứng minh FPS.

Mục tiêu là điều khiển phản hồi tốt trên desktop, có cấu hình giảm tải cho mobile. Có thể đặt target 60 FPS desktop và 30 FPS ở thiết bị mobile tham chiếu, nhưng phải kèm điều kiện đo thực. Chưa đo thì ghi đó là mục tiêu thiết kế.

| Mức | Cơ chế thật cần khác nhau |
|---|---|
| Low | Giảm DPR/render scale, shadow map/độ xa đổ bóng, particle, hậu cảnh phụ; tắt postprocessing đắt |
| Medium | Cấu hình mặc định cân bằng, giữ silhouette/material/ánh sáng đủ đẹp và thao tác rõ |
| High | Tăng shadow/detail/post nhẹ trong budget; không thay đổi luật chơi |

Quality toggle phải thay tham số thật. Cảnh Low vẫn nhìn ra mục tiêu và vật phẩm. Hạn chế đèn đổ bóng động, transparencies chồng nhau và blur phủ WebGL. Reuse geometry/material, instancing object lặp, cull/defer công việc không cần. Phân biệt nghẽn CPU do React/mô phỏng và nghẽn GPU do shadow/overdraw/resolution trước khi sửa.

Đo bundle hiện tại trước khi đặt giới hạn. Một yêu cầu tổng JS gzip cực thấp không phù hợp toàn stack Three.js không phải lý do xóa gameplay. Ưu tiên giảm initial payload, lazy-load showcase/media và tránh dependency trùng; công bố số thực thay vì hứa con số đẹp.

### 13. Quy trình thực hiện và phối hợp

Nếu môi trường có sub-agent, dùng một nhóm nhỏ có trách nhiệm rõ: một agent nghiên cứu world/art/HUD, một agent kiểm tra item/state/input, một agent kiểm thử/performance và review. Bạn là người tích hợp và quyết định. Tránh cho nhiều agent cùng sửa store/CSS gốc một lúc; giao ranh giới file hoặc review chỉ đọc khi cần. Nếu không có sub-agent, thực hiện tuần tự và nói đúng khả năng đang có.

**Bước A — Baseline:** xác định lệnh chạy, entry point, controls, loop, dữ liệu lưu và test có thật. Chạy bản gốc nếu được; ghi lỗi có sẵn, chụp một vài góc/cảnh đại diện. Không dành toàn bộ thời gian lập tài liệu.

**Bước B — Chốt đặc tả ngắn:** ghi `DESIGN.md` về art/tokens/type/material và `EXPERIENCE.md` về HUD/mode/input/modal/player journey; có thể cập nhật tài liệu tương đương sẵn có. Chỉ ghi đủ để code và QA nhất quán, rồi triển khai ngay.

**Bước C — Một lát cắt chơi xuyên suốt:** hoàn thiện cảnh quanh habitat, HUD chính, một nhiệm vụ lấy mẫu, inventory, lab và kết quả. Tuyến này phải thực sự chơi được và có thay đổi đẹp rõ rệt. Có thể dùng fixture dev để đi tới trạng thái review, nhưng kiểm tra cả đường đi thật và không đưa cheat vào bản phát hành.

**Bước D — Mở rộng nhất quán:** đưa ngôn ngữ hình ảnh và component đã chốt qua các Sol, rover, đêm, storm, briefing/science/debrief, rồi xử lý responsive. Tập trung hierarchy/camera/material trước, hiệu ứng trang trí sau. Mỗi vòng sửa thay một nhóm vấn đề rõ để biết cải thiện đến từ đâu.

**Bước E — Kiểm tra và sửa:** so ảnh cùng trạng thái, chơi lại luồng, kiểm tra input/item/save/performance, khắc phục lỗi trong phạm vi. Không dừng ở việc báo lỗi mà bạn đã có khả năng sửa.

Nếu sắp hết cửa sổ làm việc, ưu tiên bàn giao một phiên bản tích hợp chạy được với các phần ưu tiên cao đã hoàn thiện; ghi phần còn lại thành việc cụ thể. Không tạo hàng loạt skeleton rồi đánh dấu hoàn thành vì tất cả file đã được sinh ra.

### 14. Điều kiện nghiệm thu

Chạy các script hiện có khi phù hợp: `npm run lint`, `npm run build`, `npm run lint:anti-slop`, và kiểm thử physics/gameplay có trong repo. ZIP ban đầu không kèm lockfile; chọn `npm install` hay `npm ci` theo tệp thực tế, không bịa `npm test` nếu script không tồn tại.

`npm run test:canvas` của bản gốc chứa giả định Windows (`npx.cmd`, PowerShell, đường dẫn Chrome hardcode, flags D3D11) và có logic dừng process đang dùng port. Đọc script trước. Nếu cần dùng ở hệ khác, làm portable bằng executable path/config và chỉ dọn process do phiên test tạo; không tùy tiện kill process người dùng trên port 3000. Báo rõ khi môi trường không có browser/GPU để chạy một check.

| Nhóm | Ca kiểm tra tối thiểu | Đạt khi |
|---|---|---|
| Hình ảnh | Exterior day/night, storm, interior, rover | Cảnh có chiều sâu, vật liệu phân biệt, mục tiêu dễ thấy; không chỉ đổi màu CSS |
| Responsive | 1920×1080, 1366×768, 1280×720, 768×1024, 390×844; thêm mobile ngang nếu hỗ trợ | Không overlap chức năng, tràn ngang, nút ngoài màn, chữ nhiệm vụ bị cắt mất ý |
| Core loop | Nhận nhiệm vụ → tới POI → thao tác/thu mẫu → về → lab → hoàn thành | Objective, item, capsule, score và tiến độ đồng bộ |
| Input | Mở inventory khi giữ WASD/Shift; Space/Enter/Tab/Escape; mất focus trình duyệt | Không input xuyên modal, không kẹt phím, focus đúng và camera không giật |
| Rover | Lên/xuống, lái, phanh, mở panel, trở về habitat | Mode/chỉ dẫn đúng, không bị chiếm input hoặc xuyên cảnh do thay hình |
| Item | Use hợp lệ/sai đối tượng, hết đồ, pin gần đầy, đèn toggle, pickup lặp | Tác dụng đúng, thất bại không trừ đồ, không reward trùng |
| Mẫu/lab | Ba ống đầy; mẫu sai objective; đá khác băng | Không overflow/duplicate; báo kết quả đúng mẫu và đúng dữ liệu |
| Thời gian | Qua hơn một chu kỳ và đóng/mở modal pause | Cảnh/solar/UI cùng chu kỳ; pause/resume đúng |
| Lưu tiến độ | Reload/continue nếu được triển khai; retry/new game; dữ liệu cũ/hỏng | Không wipe im lặng, không farm/reset nhầm vật tư nhiệm vụ |
| Khả năng tiếp cận | Keyboard, touch, reduced motion, mute | Nội dung/action không chỉ phụ thuộc hover, màu hoặc âm thanh |
| Hiệu năng | Cùng một cảnh trước/sau, Low/Medium/High | Thay đổi quality có hiệu lực, thao tác ổn, không leak rõ hoặc lỗi console mới |
| Frontend độc lập | Backend tắt, media/weather không tải được | Game chính vẫn bắt đầu và chơi được với trạng thái giải thích rõ |

Đối với ảnh so sánh, giữ cùng camera/viewport/Sol/ánh sáng khi muốn chứng minh thay đổi chất lượng. Ảnh bổ sung nghệ thuật có thể khác góc nhưng không thay bằng chứng so sánh. Ghi phân biệt lỗi baseline và regression mới. Không điền PASS cho kiểm thử chỉ đọc code hoặc chưa chạy.

### 15. Những kết quả tôi không chấp nhận

- Chỉ đổi palette, thêm glow và bo góc rồi gọi là overhaul.
- Một dashboard ngoài game hoặc landing page thay cho world gameplay.
- Rất nhiều panel, badge, số liệu kỹ thuật và menu nhỏ nhưng người chơi không biết làm gì.
- Item/card có vẻ dùng được nhưng click không có hành động hoặc lý do; spinner giả.
- Vật phẩm fantasy thay tên thành “space” nhưng công dụng vẫn vô lý với game khoa học.
- Cảnh đẹp chỉ khi bật hậu kỳ nặng, chữ bé, mobile không chơi được, hoặc physics/progression bị phá.
- Màn loading/prologue quá dài trong game học ngắn; chuyển cảnh hào nhoáng làm chậm thao tác thường ngày.
- Một bản demo tách khỏi state và nhiệm vụ thật, hoặc xóa tính năng đang chạy để tránh xử lý tích hợp.

### 16. Bàn giao

Sau khi triển khai, đưa: cách chạy, những thay đổi người chơi nhận thấy, nhóm file đã sửa, ảnh/gif trước–sau khi môi trường hỗ trợ, các kiểm thử đã chạy và kết quả chính xác. Kèm danh sách asset ngoài/license nếu có, trade-off kỹ thuật đáng chú ý và phần thực sự còn thiếu. Cập nhật tài liệu liên quan khi thay đổi control/state/luật chơi.

Hãy bắt đầu bằng audit ngắn, chọn art direction theo brief rồi thực hiện bản nâng cấp. Tôi cần sản phẩm có thể mở lên để đánh giá và tiếp tục phát triển.

**KẾT THÚC PROMPT 1**

---

## PROMPT 2 — UI VẬT PHẨM, TRANG BỊ VÀ KHO MẪU KHOA HỌC

**BẮT ĐẦU PROMPT 2**

Những khối lượng, dung lượng, chi phí và thời gian nếu được chọn trong yêu cầu này là tham số gameplay đề xuất; không trình bày chúng như thông số NASA đã xác nhận. Dùng mã nguồn mới nhất tôi gửi làm chuẩn. Nếu đã có bản nâng cấp hình ảnh từ giai đoạn trước, tiếp nối hệ thiết kế và component đó; không dựng một giao diện cạnh tranh hoặc khôi phục mã cũ. Nếu đây là lần đầu làm dự án, đọc cấu trúc hiện tại rồi áp dụng trong cùng stack.

Bạn tiếp tục làm trên repository Ares Cradle được đính kèm. Hãy thực thi việc nâng cấp UI vật phẩm và tích hợp với game hiện tại. Tôi muốn một hệ thống trang bị dành cho nhà thám hiểm Sao Hỏa, dễ đọc, có chất liệu và có quyết định sử dụng hợp lý. Đừng chỉ đặt thêm biểu tượng vào các ô có viền phát sáng.

### 1. Hiểu đúng dữ liệu hiện có trước khi sửa

Đọc tối thiểu các tệp:

- `src/modules/survival-ui/BackpackModal.tsx`.
- `src/modules/store/useOutpostStore.ts`: `inventory`, `useItem`, `addWater`, battery/kWh, trạng thái rover, datapad và retry.
- `src/modules/store/useStoryStore.ts`: `specimens`, `carriedVials`, `collectSpecimen`, `emptyVialsIntoLab`, tiến độ objective, persist.
- `src/modules/outpost-3d/ResourceDrops.tsx`, `SpecimenNode.tsx`.
- `src/modules/story-engine/components/BioDomeLabStation.tsx`.
- `src/modules/story-engine/types.ts`, `content/worldAnchors.json`, `content/chapters.json`.
- `src/modules/character/AstronautPlayer.tsx`, `src/modules/outpost-3d/MarsRover.tsx`, `src/modules/character/CameraRig.tsx` và các listener bàn phím liên quan.

Hiện có ba miền dữ liệu khác nhau. Phải giữ ranh giới rõ:

1. **Telemetry của căn cứ:** `batteryKwh`/`battery`, oxygen concentration trong habitat, nhiệt độ trong habitat, bụi trên solar array. Đây không phải vật phẩm trong balô và không phải sinh hiệu của phi hành gia. Không đổi nhãn `oxygen` thành SpO₂ hay bình oxy EVA.
2. **Vật tư đếm được:** `inventory: Record<string, number>` với `flashlight`, `sonic_wiper`, `space_tape`, `backup_battery`, `space_apple`; ngoài ra code còn sinh `water_canister` và `mineral_shard`.
3. **Mẫu nghiên cứu có danh tính:** specimen world ID, các `carriedVials` giới hạn ba ống và `capsuleId`. Không biến một mẫu nhiệm vụ thành stack khoáng thạch không có danh tính. Mỗi mẫu phải truy vết tới vị trí, Sol và tiến độ khoa học của nó.

Có thể trình bày cả ba miền trong cùng một datapad, nhưng không tạo thêm bản sao dữ liệu có thể lệch nhau. Ưu tiên một item registry và adapter/selector dùng dữ liệu hiện có; chỉ thay đổi schema ở mức cần thiết cho hành động thực sự được triển khai.

### 2. Phong cách mỹ thuật và cách tổ chức màn hình

Thiết kế theo tinh thần thiết bị công nghiệp vũ trụ: nhôm sơn trắng ngà, graphite, nhựa kỹ thuật, vải EVA, nhãn kỹ thuật, khóa cơ, seal cam. Màu xanh điện chỉ dùng cho phần đang được chọn, thông tin khoa học và trạng thái điều khiển. Bề mặt bình thường phải đủ tĩnh để icon vật phẩm và số liệu nổi bật.

Vật phẩm có silhouette riêng: pin dạng cartridge có đầu cắm; patch khí kín dạng vỉ; đèn pin thân ngắn có vòng chống trượt; ống mẫu niêm phong có mã; lõi băng nằm trong ống cách nhiệt; hộp khẩu phần dẹt; spectrometer có cửa đo và màn hình nhỏ. Không dùng đá pha lê phát sáng, kiếm thiên hà, đá mana, táo thần hay vật phẩm “quantum” chỉ để đặt tên cho ngầu.

**Desktop:** một cửa sổ balô đủ rộng, lưới khoảng 12–16 ô vật tư nhìn thấy ở giữa, bộ lọc/số lượng bên trên và bảng mô tả vật được chọn bên phải. Dải dưới có tối đa năm ô nhanh; đây là shortcut dùng item, không phải kho đồ thứ hai. Số ô nhìn thấy không tự tạo giới hạn sức chứa mới cho inventory; khi cần, dùng cuộn/phân trang rõ ràng. Một khoang riêng có đúng ba ống mẫu khoa học. Vật tư cá nhân và kho rover xuất hiện như hai tab có nhãn vị trí; tab rover chỉ cho phép chuyển khi người chơi đủ gần xe/dock.

**Mobile:** chuyển thành bảng chi tiết một cột với vùng cuộn; lưới co theo chiều rộng thực tế, ô chạm tối thiểu 44px; thanh hành động đặt cố định trong panel và tôn trọng safe area. Mô tả đầy đủ mở khi chạm, không phụ thuộc hover. Thanh nhanh hiển thị ba ô và nút mở rộng để truy cập đủ năm ô khi chật; không ép năm ô nhỏ tranh vị trí joystick. Không che nút đóng hoặc dùng kéo thả làm cách duy nhất để thao tác.

Mỗi ô chỉ chứa icon, lượng đang có, trạng thái và chỉ báo được ghim quickbar. Chọn ô mở chi tiết; **chọn không đồng nghĩa tiêu hao**. Bảng chi tiết hiển thị tên dễ hiểu, loại, vị trí lưu trữ, số lượng, tác dụng, đối tượng hợp lệ, chi phí, yêu cầu và một hành động chính rõ ràng. Có `Inspect`, `Assign to quickbar`, `Use/Equip/Install/Transfer` tùy loại. Không render tất cả các nút cho mọi vật.

Không cần một canvas 3D riêng cho từng ô. Làm icon SVG đồng bộ hoặc render thumbnail dùng chung; chỉ tạo preview 3D của vật được chọn nếu hiệu năng cho phép. Đồng bộ phối cảnh, nền, ánh sáng và mức chi tiết giữa các icon.

### 3. Catalog thiết kế: 24 mục, phát hành theo giai đoạn

12 mục đầu là phạm vi registry MVP. MVP phải có một số hành động xuyên suốt hoạt động thật: đèn, vệ sinh solar, lắp pin ở điểm hợp lệ, sửa leak khi có event, kiểm tra mẫu và thu/phân tích specimen. Các mục còn lại chỉ kích hoạt khi đã có mechanic đúng; đừng thêm một nút giả để đủ danh sách. Không yêu cầu tất cả có subsystem mới trong một lần nâng cấp. Vật nào chưa có hành động đúng thì được Inspect và có trạng thái giải thích cụ thể; không làm nút giả hoặc loading vô thời hạn.

Các mục 13–17 và 22–24 là đề xuất giai đoạn sau, mặc định không nhét vào inventory đầu game. Các mục 18–21 là cách biểu diễn loại mẫu khoa học: nếu mẫu tương ứng đã có trong story thì phải tích hợp và giữ hoạt động ngay trong MVP theo Sol hiện hữu. Các tên loại này không thay thế specimen ID/capsule ID thật và không tạo thêm stack vật tư đếm được cho cùng một mẫu.

| # | ID/ánh xạ | Tên và loại | Đơn vị hiển thị | Cách dùng hợp chủ đề và giới hạn |
|---|---|---|---|---|
| 1 | `flashlight` | Đèn EVA, công cụ tái sử dụng | chiếc; on/off | Bật/tắt đèn; không mất một đèn mỗi lần bấm. Giữ phím F. Chỉ hiển thị charge nếu có state thực. |
| 2 | `sonic_wiper` | Bộ vệ sinh pin mặt trời | lượt bảo trì | Giảm bụi trên array; cần ở đúng khu solar và có bụi. Có phản hồi before/after. Có thể giữ ID cũ, đổi tên hiển thị. |
| 3 | `space_tape` | Patch bịt rò áp suất | miếng | Sửa lỗ rò tại habitat/airlock; giải thích sửa nguồn rò thay vì tạo oxy từ băng dính. Cơ chế thay đổi phải cập nhật event, objective và balance. |
| 4 | `backup_battery` | Cartridge điện dự phòng | bộ; dung lượng kWh | Lắp vào dock/grid hợp lệ, cộng đúng kWh thực nhận và suy ra phần trăm. Không báo “+25%” nếu pin đã gần đầy. |
| 5 | `space_apple` | Khẩu phần nhà kính đóng gói | gói | Đổi hình ảnh theo thực phẩm kín. Ăn trong môi trường áp suất phù hợp; không làm oxygen habitat hoặc nhiệt độ căn cứ nhảy về chuẩn. Nếu chưa có cơ chế dinh dưỡng, hiển thị công dụng dự kiến thay vì giả lập chữa mọi thứ. |
| 6 | `water_canister` | Can nước đã xử lý | can và L/can | Trữ/chuyển hoặc nạp ở trạm. Đọc đúng lượng thực từ dữ liệu; không mặc định một can bằng 50L khi code không có quy ước đó. |
| 7 | `mineral_shard` | Mảnh vật liệu khoáng đã phân loại | mẫu hoặc kg khi có cân | Đưa vào kho vật liệu/lab; không tương đương một specimen nhiệm vụ. Không đổi khoáng trực tiếp ra điện khi không có quy trình. |
| 8 | `thermal_blanket` | Tấm cách nhiệt aerogel | tấm | Gắn vào khe bảo trì thermal hợp lệ để giảm thất thoát nhiệt. Nếu chưa có hệ thống module, chỉ Inspect/unavailable có lý do. |
| 9 | `soil_analyzer` | Máy phân tích mẫu cầm tay | chiếc | Dùng gần node phù hợp để mở thông tin đo hoặc chỉ dẫn khoa học; không tự sinh nước/oxy. Dụng cụ tái sử dụng. |
| 10 | `sample_container` | Ống chứa mẫu sạch | ống | Phụ kiện phục vụ thu mẫu; MVP giữ giới hạn ba vials hiện tại, không thêm điều kiện tiêu hao mới khiến nhiệm vụ cũ bị khóa. |
| 11 | `gasket_set` | Bộ gioăng kín tiêu chuẩn | bộ | Vật tư sửa seal/airlock nếu subsystem hỗ trợ. Dự phòng nếu không có patch; không tạo một hệ thống áp suất mới chỉ để có nút Use. |
| 12 | `rover_repair_kit` | Bộ bảo trì rover | bộ | Hành động theo trạm hoặc bước nhiệm vụ; nếu chưa có damage model, ghi rõ chưa có hỏng hóc cần sửa và không trừ kit. |
| 13 | `suit_o2_cartridge` | Bình O₂ dành riêng bộ EVA | bình; dung lượng theo thiết kế | Chỉ bổ sung khi có reservoir EVA riêng; không ánh xạ vào oxygen% habitat. |
| 14 | `suit_co2_scrubber` | Cartridge hấp thụ CO₂ | cartridge | Thay tại nơi an toàn; dùng cho subsystem CO₂ bộ đồ, không “tạo oxy”. |
| 15 | `suit_battery` | Pin thiết bị EVA | pack; Wh | Nạp thiết bị cá nhân; tách đơn vị Wh khỏi kWh của grid. |
| 16 | `dust_filter` | Lõi lọc bụi thiết bị | lõi | Vật tư bảo trì intake; không chữa toàn bộ bão bụi. |
| 17 | `insulated_ice_container` | Thùng bảo ôn mẫu băng | thùng | Hỗ trợ vận chuyển mẫu lạnh nếu mô phỏng thất thoát được triển khai; không tự đặt timer làm mất mẫu nhiệm vụ. |
| 18 | `regolith_sample` | Mẫu regolith niêm phong | ống mẫu, ID riêng | Đọc từ specimen identity thật; phân tích thành dữ liệu địa chất. |
| 19 | `hematite_sample` | Mẫu kết hạch hematite | ống mẫu, ID riêng | Mở thông tin quá khứ nước của Sao Hỏa; không gán màu tím/độ hiếm thần thoại. |
| 20 | `ice_core_sample` | Lõi băng dưới bề mặt | ống, g/kg nếu đã đo | Phân tích trước; tách nước cần quy trình và năng lượng, không một click sinh tài nguyên vô hạn. |
| 21 | `atmosphere_sample` | Bình lấy mẫu khí | bình mẫu, ID riêng | Phân tích khí quyển; không uống/hấp thụ trực tiếp. |
| 22 | `electrolyzer_service_module` | Module bảo trì điện phân | module | Lắp ở trạm đúng loại; là cơ chế gameplay hư cấu hợp lý, không gắn nhãn phụ tùng MOXIE xác thực nếu chưa có nguồn. |
| 23 | `hydroponic_seed_cartridge` | Cartridge hạt giống nhà kính | cartridge | Chỉ dùng trong nhà kính có nước, dưỡng chất, ánh sáng; không mọc cây trực tiếp trên đất Sao Hỏa. |
| 24 | `relay_beacon` | Beacon dẫn đường và chuyển tiếp | thiết bị | Đặt waypoint/điểm liên lạc nếu mechanic tồn tại; không “quantum uplink” truyền tin tức thời. |

Giữ ID cũ qua alias nếu đổi tên hiển thị. Không dùng độ hiếm common/epic/legendary làm trục chính. Dùng các trạng thái có ý nghĩa: `Ready`, `In use`, `Depleted`, `Needs target`, `Stored in rover`, `Mission sample`, `Research unlocked`. Nếu cần màu, màu biểu thị công dụng/tình trạng, không biến kho vật tư thành shop vật phẩm fantasy.

### 4. Hành động phải có hợp đồng rõ và phản hồi trung thực

Tạo một API dùng chung cho inventory UI, quickbar và tương tác thế giới. Ví dụ thiết kế:

```ts
type ItemActionResult =
  | { ok: true; consumed: number; feedback: string; actualDelta?: Record<string, number> }
  | { ok: false; code: 'OUT_OF_STOCK' | 'INVALID_TARGET' | 'NO_EFFECT' | 'UNAVAILABLE'; reason: string };
```

Đây là hướng thiết kế, được điều chỉnh để khớp types đang có. Việc kiểm tra số lượng, điều kiện, trừ vật phẩm và áp dụng hiệu ứng phải cùng một transaction ở tầng state/service. Button không tự trừ count rồi gọi hành động khác. Bấm đôi, tap nhanh hay hai callback của một pointer không được nhân đôi pickup/reward. Chỉ consumable mới bị trừ lượng quy định trong item definition sau khi action hợp lệ; công cụ tái sử dụng, Inspect và equip có `consumed: 0`. Action thất bại không phát success sound và không mất đồ.

Đối với pin, lấy `batteryKwh` làm giá trị chuẩn rồi suy ra `battery` từ capacity. Nếu giữ cả hai field để tương thích, cập nhật chúng bằng cùng một phép tính. Không cộng +5kWh nhưng đồng thời +10% trong mọi capacity. Hiện `ResourceDrops.tsx` có kiểu cộng này; phải xử lý trước khi thêm transfer/crafting.

Đối với nước, hiện `addWater(_amount)` không dùng tham số và thêm một `water_canister` kèm O₂. Hãy thiết kế đơn vị một cách tường minh trước khi hiển thị L hay thêm công thức lọc. Không chỉ đổi text UI thành số lít khác.

Đối với sealant, sửa event/lưu lượng rò mới là tác dụng chính. Oxygen hồi phục qua hệ thống hỗ trợ sự sống và thời gian mô phỏng; patch không tự sinh thêm oxy. Giữ tương thích ID/save khi thay mechanic, đồng thời điều chỉnh objective/balance để Sol liên quan vẫn hoàn thành được. Không khôi phục hiệu ứng cộng O₂ vô điều kiện chỉ để giữ hành vi cũ.

Không thêm thanh hunger, suit pressure, rover durability, tool durability hay mass penalty chỉ để lấp UI. Chỉ render trường thật có dữ liệu. Trọng lượng có thể là metadata nghiên cứu; nếu thêm giới hạn mang vác, để toàn bộ ngưỡng trong config và chứng minh người chơi luôn có khả năng mang đủ ba mẫu để hoàn thành nhiệm vụ.

### 5. Mẫu nghiên cứu, lab và crafting

Khoang mẫu phải hiển thị ba ống thật với ID, tên, Sol thu thập nếu có, trạng thái niêm phong và badge `Mission sample`. Mẫu nhiệm vụ không bị bỏ nhầm, bán nhầm hay tiêu hao trong công thức. Nếu thêm kho rover, transfer specimen phải di chuyển cùng danh tính và cập nhật đúng query “carried samples” mà lab/objective dùng. MVP có thể chỉ cho transfer vật tư thường để giảm rủi ro.

Lab dùng công thức dữ liệu hóa và báo yield theo kết quả thật. Không báo `+50L Water / 100% Oxygen` khi vừa phân tích một mẫu đá. Xử lý xong mẫu nào mới mở capsule của mẫu đó; không phát nhiều phần thưởng cho một sample ID. Không dùng khoáng sắt hoặc khối băng như vật phẩm “heal all”.

MVP ưu tiên ba quy trình ngắn: thu mẫu → quay về lab → phân tích và mở data capsule; bảo trì solar → giảm dust thật; lắp pin dự phòng → tăng kWh thật. Inspect ngoài thực địa chỉ mở quick fact/nhận diện, không tự cấp capsule hoàn chỉnh, quiz reward hay bỏ qua bước quay về lab nếu chương đang yêu cầu bước đó.

Giữ luồng băng → lab → kết quả/chuyển tiến độ của Sol 9 ngay trong lần nâng cấp; sửa báo cáo và conversion để khớp dữ liệu cấu hình thật. Việc mở rộng một reservoir nước có đơn vị đầy đủ, tổn thất và nhiều công thức tách/lọc có thể để giai đoạn sau, nhưng không được vô hiệu hóa nhiệm vụ băng đã có. Crafting tùy chọn cần input, output, station, power cost và thời gian rõ; thiếu input thì nút giải thích được lý do. Không bắt triển khai cây công nghệ 50 node trong đợt UI này.

World pickup nên là đá tự nhiên, mẫu băng đúng vùng, hộp vật tư hoặc cartridge bị thất lạc. Dấu nhận diện là một outline/ring nhẹ khi gần hoặc đang scan. Giữ đường tiếp cận và visibility tốt; thay bỏ pha lê neon không có nghĩa giấu đồ khiến người chơi tìm không thấy.

### 6. Keyboard, controller và UI ownership

Giữ `E` mở balô, `F` bật đèn, `R` lên/xuống rover theo mapping hiện có; kiểm tra toàn bộ keymap trước khi thêm shortcut. CameraRig của bản gốc dùng Shift+E xoay phải trong khi balô bắt mọi E; sửa xung đột bằng cách chuyển/bỏ tổ hợp camera đó hoặc route input nhất quán, cập nhật hướng dẫn thật. `Escape` đóng lớp trên cùng, trả focus về nơi mở, không đóng đồng thời nhiều modal. Các phím 1–5 có thể dùng quickbar nếu chưa bị chiếm, nhưng chỉ hoạt động trong gameplay, không khi gõ tên/PIN hoặc mở modal.

Chặn movement, jump, camera drag và rover input khi một modal cần focus đang mở. Xóa held-key state khi modal lấy quyền điều khiển để đóng modal không khiến nhân vật tiếp tục chạy. Space trên button phải kích hoạt button; không blur button để bắt người chơi nhảy như listener hiện tại. Dùng keyboard event routing tập trung hoặc một input gate tối thiểu có test.

Trong chế độ học đơn người chơi, inventory và modal đọc/briefing/science pause mô phỏng; toast không pause. Dùng pause reasons hoặc cơ chế tương đương để đóng inventory không tự resume khi một modal hoặc pause menu khác vẫn đang mở. Nếu game đã ở trạng thái pause trước đó, phải giữ trạng thái này. Khi tab mất focus, dọn held keys và xử lý thời gian resume để không chạy kẹt hoặc trừ tài nguyên bằng một delta lớn. Nếu phần này đã được làm trong giai đoạn trước, tích hợp với cơ chế hiện có thay vì thêm pause flag độc lập.

Kéo thả là tiện ích phụ; luôn có nút Assign/Transfer cho bàn phím và touch. Controller là giai đoạn bổ sung nếu project chưa có Gamepad API: giữ UI đủ focusable, không tuyên bố đã hỗ trợ controller khi chỉ có navigation Tab. Nếu thêm, D-pad di chuyển slot, confirm chọn/action, back trở về, và glyph đổi theo input thực.

Có `role="dialog"`, tên có thể đọc, focus trap, focus-visible, label đầy đủ và mô tả cho trạng thái khóa. Tooltip không là chỗ duy nhất chứa lý do không dùng được. `prefers-reduced-motion` giảm bounce/float; sound mute vẫn có visual feedback. Không flash đỏ liên tục vì item thiếu điều kiện.

### 7. Tương thích, giới hạn và kiểm chứng

Không sửa backend API chỉ để làm inventory trông đẹp. Giữ contract `missionService`, stage/sol progression, quiz, capsule và âm thanh hiện có. Hãy quyết định rõ retry reset vật tư như thế nào trước khi sửa: hiện `setStage` không reset inventory. Đừng tự ý biến một lần reset thành nguồn farm đồ hoặc mất vĩnh viễn vật phẩm nhiệm vụ. `useStoryStore` hiện chỉ persist một phần tiến độ; nếu thêm inventory persistence cần version/migration và tách dữ liệu phiên đang chơi khỏi unlock lâu dài.

Sửa đúng các lỗi giao nhau với tính năng mới: collected specimen phải được kiểm tra tại action; objective collect phải khớp target specimen, không hoàn thành mục tiêu sai vì nhặt bất kỳ mẫu nào; pickup trong `ResourceDrops` cần định danh theo ID thay vì index children sau khi phần tử bị loại. Không sửa tràn lan toàn repo.

Hoàn thành khi:

- Inventory không mất đồ khi chỉ chọn/Inspect; unknown ID có fallback an toàn.
- Pin không vượt capacity, count không âm, battery% khớp kWh.
- Đèn không bị tiêu hao, quickbar dùng cùng action với balô.
- Chuyển kho bảo toàn tổng số, xa rover thì giải thích lý do không chuyển.
- Mỗi mẫu được thu một lần, vẫn tối đa ba vials và không làm objective sai loại.
- Lab báo đúng vật tư thực nhận và capsule thực mở; thử mẫu đá riêng và mẫu băng riêng.
- Mở balô khi đang giữ WASD/Shift rồi đóng không gây chạy/boost kẹt; Space không nhảy trong dialog; Escape chỉ xử lý lớp trên cùng.
- Ở 390×844 và 1366×768, nút đóng/action đọc được, không cắt chữ quan trọng hoặc tràn ngang.
- Chạy các script kiểm tra thực sự có trong package.json, build/typecheck phù hợp và báo chính xác kết quả; bổ sung test state cần thiết cho transaction/pickup/transfer, tránh snapshot chỉ xác nhận markup của chính mình.

Kết quả bàn giao cần có code tích hợp thật, catalog registry, giải thích file đã sửa, ảnh trước/sau nếu có môi trường chạy, các bước manual test và danh sách hạng mục để giai đoạn sau. Không kết thúc ở moodboard, mô tả ý tưởng hoặc bản demo tách rời không nối vào game.

**KẾT THÚC PROMPT 2**

---

## PROMPT 3 — REVIEW NGHIÊM TÚC VÀ SỬA BẢN NÂNG CẤP

**BẮT ĐẦU PROMPT 3**

Hãy kiểm tra bản Ares Cradle hiện tại như một người review độc lập có trách nhiệm bàn giao một web game chơi được. Mục tiêu là tìm và sửa các vấn đề còn lại sau lần nâng cấp, đặc biệt những chỗ trông hoàn thiện trong ảnh nhưng hành vi thực sai. Làm trên mã nguồn mới nhất tôi gửi. Không mở rộng thêm tính năng trong lượt này trừ phần tối thiểu cần để hoàn thành hành vi đã hứa trong UI.

Đọc yêu cầu thiết kế có trong repo, xác định lệnh chạy và trạng thái phiên bản hiện tại. Nếu bạn cũng là model vừa viết code, vẫn kiểm tra lại bằng hành vi nhìn thấy và state thực, không suy từ ý định của mình. Có thể dùng sub-agent độc lập cho kiểm tra mã/state và review thị giác nếu môi trường hỗ trợ; bạn tổng hợp kết luận và sửa tích hợp.

### 1. Tách chứng cứ khỏi giả định

Mỗi kết luận quan trọng cần có cách tái hiện, expected/actual, mức độ ảnh hưởng, tệp liên quan và cách xác minh sau sửa. Phân biệt rõ:

- Đã chạy kiểm thử tự động.
- Đã chơi/thao tác và nhìn kết quả trong trình duyệt.
- Chỉ đọc code, chưa có môi trường chạy.
- Số đo hiệu năng thật hoặc mục tiêu chưa đo.

Không đánh PASS cho ca chưa thực hiện. Không tự cho điểm 9/10 rồi kết luận mọi thứ tốt. Ghi vấn đề có từ baseline riêng với regression mới; ưu tiên sửa những vấn đề đang làm người chơi kẹt hoặc hiểu sai.

### 2. Chơi một vòng nhiệm vụ thật

Thực hiện nhận briefing → ra habitat → di chuyển hoặc lên rover → tới POI → thao tác/thu mẫu → quay về → lab → trả lời/hoàn tất → xem kết quả/chuyển mốc. Theo dõi các state tương ứng thay vì chỉ chụp màn hình.

Kiểm tra tối thiểu một mốc đầu game và một mốc sau đã có nâng cấp bằng fixture dev nếu cần. Fixture dùng để tiếp cận trạng thái review, không thay việc kiểm tra tiến trình thật. Khả năng đón Ares‑1 và các mốc Sol 1/5/9/12/20 không được bị skin mới làm rơi mất.

Chú ý: objective collect phải khớp specimen được yêu cầu; vào lab không tự hoàn thành sai mẫu; nút Continue/Retry không trỏ sang một stage khác với chapter HUD đang hiển thị.

### 3. Rà hình ảnh trên cùng trạng thái

Chụp/so sánh các cảnh: ngoài căn cứ ban ngày, cùng khu đó ban đêm, storm, interior/lab, rover đang lái, inventory với item được chọn, science/briefing, debrief. Giữ cùng viewport và góc camera khi đánh giá một thay đổi.

Xem ở 1920×1080, 1366×768, 1280×720, 768×1024 và 390×844; nếu thiếu thiết bị thật, ghi rõ dùng browser emulation. Kiểm tra:

- Nhận ra nhân vật, rover, habitat, tuyến đi và POI ngay ở chất lượng Medium/Low.
- Text có dấu tiếng Việt không lỗi glyph, cắt mất ý hoặc quá nhỏ; telemetry có đơn vị.
- Panel/action/toast/minimap/joystick không che lẫn chức năng; modal cuộn được và nút đóng luôn truy cập được.
- Visual style thống nhất từ world tới item/science card; không có component demo khác phong cách hoặc nhãn như “Minecraft-style”, “UI kit”, “debug” nằm trong trải nghiệm người chơi thông thường.
- Không có mesh lơ lửng, clipping nặng, nhấp nháy z-fighting, outline luôn phát sáng hoặc bloom che vật thể.
- Khi tắt hậu kỳ, cảnh vẫn có bố cục, vật liệu và độ sâu. Nếu không, sửa ánh sáng/material trước khi tăng effect.

Đối với thẩm mỹ chưa tốt, nêu vấn đề nhìn thấy cụ thể như “ba panel có cùng mức tương phản nên mục tiêu bị chìm” hoặc “rover và nền cùng độ sáng nên mất silhouette”, rồi sửa đúng nguyên nhân. Tránh chỉ thêm glow/gradient.

### 4. Kiểm tra inventory bằng các ca có thể làm mất hoặc nhân đôi đồ

| Thao tác | Bất biến cần giữ |
|---|---|
| Chọn/Inspect item nhiều lần | Count, tài nguyên và quest không đổi |
| Dùng item hết số lượng hoặc sai mục tiêu | Thất bại có lý do; không trừ đồ, không phát âm thanh thành công |
| Double-click/tap nhanh và dispatch lặp | Một pickup/reward chỉ xảy ra một lần; tool toggle không đăng ký effect lặp |
| Pin gần đầy | Clamp đúng capacity, báo lượng nhận thực; kWh và phần trăm khớp |
| Flashlight | Bật/tắt đúng đèn, không tiêu hao cả item |
| Patch khi không có leak | Không mất patch; khi có leak, tác dụng vào nguyên nhân rò đúng mô tả |
| Lau solar ở quá xa hoặc không còn bụi | Không thao tác từ mọi nơi, không phí vật tư khi không có tác dụng |
| Vial đã đầy hoặc nhặt sai mẫu | Không overflow; không mất node/vật phẩm hoặc cộng sai objective |
| Chuyển kho nếu có | Nguồn + đích bảo toàn tổng lượng/danh tính; xa rover không transfer |
| Load save cũ, ID lạ, dữ liệu hỏng | Fallback/migration rõ; không crash hoặc wipe tiến độ im lặng |
| Retry/new game | Reset theo contract, không farm vô hạn hoặc mất mẫu nhiệm vụ vĩnh viễn |

Lab cần thử riêng mẫu đá và mẫu băng. Kiểm tra báo cáo lấy từ kết quả thật thay vì text success hardcode. Không có món đồ ăn nào làm oxygen concentration hoặc nhiệt độ toàn habitat phục hồi vô điều kiện. Các item chưa có mechanic phải thể hiện đúng trạng thái, không giả loading hay action có thể bấm.

### 5. Input, focus và pause

Mở inventory/briefing khi đang giữ W/Shift, thử Space/Enter trên button, Tab qua các control, Escape, đổi tab trình duyệt rồi quay lại. Thử đóng một modal trong khi một modal khác vẫn đang giữ pause reason.

Yêu cầu: không đi/lái/nhảy/đổi quickbar khi dialog giữ input; không kẹt phím; không có Shift+E đồng thời xoay camera và mở balô; Escape chỉ đóng lớp trên cùng và focus trở lại nơi hợp lệ. Các shortcut gameplay không tác động khi nhập tên/PIN. Đọc UI trong chế độ học không vô tình làm cạn tài nguyên.

Đi qua hơn một chu kỳ ngày/đêm để kiểm tra ánh sáng, solar, UI phase và timer đồng bộ. Kiểm tra pause dài không tạo một bước simulation delta khổng lồ khi resume.

### 6. Hiệu năng và độ tin cậy

Đo cùng cảnh với cùng thiết lập. Xem console/runtime errors, thời gian frame nếu đo được, React render tần suất cao, draw calls/triangles nếu công cụ có, và tài nguyên sau khi đóng/mở modal nhiều lần. Phân biệt CPU và GPU trước khi cắt chất lượng.

Kiểm tra Low/Medium/High thực sự khác render scale/shadow/particle/detail. Tối ưu ưu tiên geometry/material reuse, instancing, culling, throttled telemetry và lazy loading; không xóa cảnh báo, action hoặc gameplay để FPS nhìn đẹp hơn. Backend/mock và lỗi weather/media không được chặn luồng chơi chính.

Chạy đúng script hiện có: typecheck/lint/build/anti-slop và test liên quan. Đọc script canvas trước khi chạy vì bản gốc có phần phụ thuộc Windows và dừng process theo port. Sửa cách khởi chạy/cleanup portable nếu cần; chỉ dọn tiến trình test do bạn sở hữu. Không bịa kết quả browser khi môi trường thiếu browser/GPU.

### 7. Sửa và bàn giao

Ưu tiên lần lượt: crash/softlock/mất đồ → logic state/input/progression sai → đọc/điều khiển khó → hình ảnh/nhất quán → hiệu năng. Với lỗi có thể sửa trong phạm vi, thực hiện sửa và chạy lại đúng ca tái hiện. Không chỉ nêu vấn đề rồi dừng.

Bàn giao ngắn nhưng có chứng cứ:

1. Những lỗi đáng kể đã sửa và ảnh hưởng với người chơi.
2. Bảng kiểm tra: ca test, môi trường/viewport, cách kiểm, kết quả thật.
3. Một vài ảnh so sánh/cảnh đại diện khi có thể tạo, không dùng ảnh concept thay ảnh game đang chạy.
4. Cách chạy, file quan trọng đã đổi, hạn chế thực sự còn lại và cách kiểm tiếp.

Hãy review và sửa cho tới khi phiên bản hiện tại đủ nhất quán để tôi tiếp tục phát triển trên đó.

**KẾT THÚC PROMPT 3**

---

## Nguồn tham khảo và cách đã chuyển hóa vào bộ prompt

Các nguồn dưới đây đã được mở đọc. Đây là tài liệu tham khảo cho việc soạn prompt, không phải yêu cầu cài thêm plugin/framework vào dự án. Nội dung yêu cầu đã được viết lại và điều chỉnh theo mã Ares Cradle; không chép nguyên một “siêu prompt” chung trên mạng.

| Nguồn | Loại tài liệu thực tế | Phần được vận dụng |
|---|---|---|
| [MengTo — Design-first UI prompting](https://github.com/MengTo/Skills/blob/main/agent-skills/ui/design-first-ui-prompting/SKILL.md) | Playbook soạn yêu cầu UI | Chuyển yêu cầu “đẹp hơn” thành bố cục, chữ, vật liệu, màu, hierarchy và ràng buộc có thể triển khai; giữ hệ thiết kế nhất quán |
| [MengTo — Build game inventory](https://github.com/MengTo/Skills/blob/main/agent-skills/game-development/build-game-inventory/SKILL.md) | Workflow xây/sửa item và kho đồ | Registry có ID ổn định; tách definition và ownership; validate transfer/use trước khi commit; không mất/nhân đôi, có migration |
| [MengTo — Test playable web games](https://github.com/MengTo/Skills/blob/main/agent-skills/game-development/test-playable-web-games/SKILL.md) | Workflow kiểm thử game trình duyệt | Kiểm tra cả hành trình chơi và chuyển trạng thái; dùng fixture tái lập; báo chứng cứ thay vì lấy build pass làm bằng chứng chơi tốt |
| [MengTo — Optimize Three.js games](https://github.com/MengTo/Skills/blob/main/agent-skills/game-development/optimize-threejs-games/SKILL.md) | Workflow đo và tối ưu | So sánh cùng cảnh/thiết bị, phân biệt CPU/GPU, giảm phần trang trí trước khi ảnh hưởng khả năng điều khiển |
| [Three.js Awesome Graphics Agent Skills](https://github.com/scottstts/threejs-awesome-graphics-agent-skills) | Bộ tài liệu và ví dụ triển khai đồ họa | Đầu vào tái lập, tham số hình ảnh có tên, mức chất lượng có tác dụng thật, cảnh vẫn đọc tốt khi tắt hậu kỳ |
| [BMad Game Dev Studio](https://github.com/bmad-code-org/bmad-module-game-dev-studio) | Framework quy trình thiết kế/phát triển game | Tách đặc tả diện mạo `DESIGN.md` khỏi hành vi UI/input/player journey trong `EXPERIENCE.md`; chỉ lấy cách tổ chức, không bắt cài framework |
| [Astroneer — trang game chính thức](https://astroneer.space/) | Nguồn game tham khảo | Bối cảnh khám phá hành tinh, base/vehicle và khả năng chế tạo sáng tạo; dùng làm điểm xuất phát để nghiên cứu art direction |
| [Surviving Mars — Domes & Life Support](https://www.paradoxinteractive.com/games/surviving-mars-relaunched/news/domes-and-life-support) | Developer diary chính thức | Mối quan hệ giữa diện mạo habitat, cảnh quan và hệ năng lượng–nước–oxy; truyền cảm giác căn cứ có vận hành |
| [NASA/JPL — MOXIE completes Mars mission](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) | Nguồn khoa học chính thức | Công nghệ tạo oxy từ khí quyển Mars đã được thử nghiệm; phân biệt thí nghiệm thật với hệ thống tiền đồn hư cấu trong game |

Những chỉ dẫn về bố cục riêng, palette đề xuất, 24 item, phạm vi MVP, phím tắt, lỗi cần kiểm tra và ma trận nghiệm thu là phần tổng hợp dành cho dự án này. Các con số dung lượng/khối lượng/yield được thêm khi triển khai phải được gắn nhãn tham số gameplay nếu chưa có mô hình và nguồn khoa học tương ứng.
