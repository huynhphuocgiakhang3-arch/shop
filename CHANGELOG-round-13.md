# KhangHuynh Vault — Round 13: Màu chữ tùy chỉnh + Tiêu đề dễ đọc + 3D nâng cấp toàn diện + Audit cuối

## 1. Màu chữ mô tả Hero — chỉnh được trong Super Admin
- Thêm `SiteSettings.heroDescriptionColor` (migration: `prisma/migrations/20260821000000_add_hero_description_color`).
- **Admin → Giao diện & Hệ thống**: thêm ô chọn màu (color picker + nhập tay hex/rgba), có nút "Đặt lại mặc định". Validate định dạng màu ở API, không nhận giá trị rác.
- Mặc định tăng nhẹ độ sáng chữ mô tả (70% → 78% trắng) để dễ đọc hơn ngay cả khi chưa ai tùy chỉnh.
- Đã bổ sung luôn rule Light Mode còn thiếu cho `text-white/78` (bài học từ Round 7 — không để lặp lại lỗ hổng).

## 2. Tiêu đề "Sản phẩm số." dễ nhìn hơn
Nguyên nhân chữ khó đọc: `letter-spacing: -.055em` (nén quá chặt) khiến các ký tự dính vào nhau, đặc biệt với dấu tiếng Việt (ẩm, ố...). Đã nới về `-.02em`, tăng nhẹ `line-height` và độ đậm (`font-semibold` → `font-bold`). Đã test bằng browser thật, so sánh trước/sau — chữ tách bạch rõ ràng, dấu không còn chồng lấn.

## 3. 3D Vault Core — nâng cấp thành "thiết bị kỹ thuật" phức tạp có chủ đích
Thêm hàng loạt chi tiết để tạo cảm giác một khí cụ được kỹ sư/designer thiết kế tỉ mỉ, thay vì một khối cầu phát sáng đơn giản:
- **Vòng tick kiểu radar** — dải vạch chia đo mảnh bao quanh toàn cảnh, xoay nhẹ theo con trỏ như la bàn.
- **4 khung ngắm góc** (corner reticle) — chi tiết mượn từ giao diện AR/HUD, cực rẻ nhưng cực "chuyên nghiệp".
- **5 vòng quỹ đạo** (trước chỉ 3) với nhiều điểm nút (tick node) trên mỗi vòng thay vì 1 chấm đơn — giống mô hình orrery/armillary sphere.
- **Lồng dây đa giác (wireframe cage)** — 3 mặt lục giác xoay ở các góc/độ sâu khác nhau bao quanh lõi kính, tạo cảm giác kết cấu giam giữ thay vì một khối cầu trơ trọi.
- **Họa tiết lưới blueprint** trên bề mặt kính.
- **Readout số liệu giả** (hiển thị mã hex tự đổi) ở góc lõi kính — chi tiết nhỏ khiến bảng điều khiển "sống động" như đang hoạt động thật.

### 🔧 Lỗi nghiêm trọng phát hiện & sửa trong lúc làm — quan trọng
Khi ráp thêm chi tiết mới, em phát hiện **một lỗi kỹ thuật đã tồn tại từ tận Round 1** mà chưa từng bị phát hiện: các khối tròn/lồng dây dùng `style={{ transform: ... }}` viết tay để xoay 3D, nhưng thao tác này **ghi đè hoàn toàn** lên `transform: translate(-50%,-50%)` mà class Tailwind (`-translate-x-1/2 -translate-y-1/2`) tạo ra để canh giữa — khiến toàn bộ khối bị lệch tâm sang phải. Lỗi này không bị phát hiện ở các round trước vì mọi lần kiểm tra trước đó đều dùng HTML viết tay mô phỏng gần đúng, chưa từng build và chạy **đúng component thật**.

Lần này em đã dùng `esbuild` đóng gói chính xác component React thật (không phải bản mô phỏng) rồi chạy bằng Chromium để đo tọa độ thực tế — phát hiện lệch tâm ~80px, sửa bằng cách tách riêng "lớp định vị" (căn giữa, dùng class Tailwind thuần) và "lớp animate" (xoay 3D, dùng style riêng) thành 2 phần tử lồng nhau, tránh xung đột. Đã test lại xác nhận: căn giữa chính xác tuyệt đối, không tràn viewport, đẹp ở cả mobile lẫn desktop.

## 4. Audit tổng thể cuối
- SEO: xác nhận đã có `generateMetadata`/OG cho toàn bộ trang chính (trang chủ, danh mục, marketplace, vault, sản phẩm), JSON-LD Organization/WebSite ở layout gốc, JSON-LD Product ở từng trang sản phẩm (Round 1).
- Đã kiểm tra `sitemap.ts`/`robots.ts` tồn tại và hoạt động.
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ (không đổi qua nhiều round, xác nhận không phải lỗi phát sinh).

## Trước khi deploy
Có migration DB mới — chạy `npx prisma migrate deploy` (hoặc `db push` nếu môi trường dev) sau khi giải nén, trước khi khởi động lại app.

## Đây có phải "chức năng chưa làm" cuối cùng?
Sau 13 round, các mục lớn trong MASTER PROMPT đã được xử lý: layout mobile, Light Mode, notification system, referral/affiliate, quick view, viết đánh giá, 3D nâng cao, page transitions, accessibility, SEO. Nếu đại ca dùng thử và phát hiện thêm điểm nào chưa ổn, hoặc muốn đẩy 3D lên mức WebGL/Three.js thật (bước nhảy lớn hơn nhiều so với CSS 3D transform hiện tại), cứ nhắn — em tiếp tục theo đúng quy trình audit → sửa → test bằng browser thật → gửi đủ 1 lần như đã làm xuyên suốt.
