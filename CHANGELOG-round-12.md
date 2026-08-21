# KhangHuynh Vault — Round 12: Page Transitions + Accessibility audit

## 1. Page Transitions toàn site (mục 24 MASTER PROMPT)
Trước đây chỉ Dashboard/Admin có hiệu ứng chuyển trang, các trang công khai (trang chủ, marketplace, sản phẩm...) chuyển trang "cứng" không hiệu ứng.

**File mới:** `src/components/layout/RouteTransition.tsx` — bọc toàn bộ nội dung mọi trang tại `RootLayout`, tạo hiệu ứng mờ dần + trượt nhẹ (8px, 180ms) mỗi khi chuyển route. Nhanh, tinh tế — đúng tinh thần "fast + cinematic" chứ không phải màn hình chờ. Tự tắt hoàn toàn khi bật "Giảm chuyển động".

**Quan trọng — phòng ngừa đúng lỗi đã gặp nhiều lần:** trước khi thêm wrapper này, em portal luôn `MobileBottomNav` ra `document.body` (giống nút nhạc/chat/menu/search đã làm ở các round trước). Vì wrapper transition mới có `transform` khi đang chạy hiệu ứng, nếu thanh điều hướng dưới không portal, nó sẽ dính lại đúng lỗi containing-block đã sửa nhiều lần — đã test bằng browser thật để chắc chắn không tái diễn.

## 2. Accessibility — bổ sung `aria-label` cho nút chỉ có icon
Quét toàn bộ codebase tìm nút chỉ có icon (không có chữ) mà thiếu `aria-label` — người dùng đọc màn hình (screen reader) sẽ không biết nút đó làm gì. Tìm thấy và sửa **9 nút thật sự thiếu**:

- Chat: nút quay lại, nút gửi tin nhắn, nút đóng (`ChatPanel.tsx`)
- Music player: đóng, phát ngẫu nhiên, bài trước, phát/tạm dừng, bài tiếp theo, lặp lại (`FloatingWidgets.tsx`) — 2 nút toggle (shuffle/repeat) còn thêm `aria-pressed` để screen reader biết trạng thái bật/tắt.
- Admin: nút gửi tin nhắn (`admin/tin-nhan`)
- Nút đăng xuất khi sidebar thu gọn (chỉ còn icon) (`DashboardSidebar.tsx`)

Đã kiểm tra thêm 2 trường hợp nghi ngờ khác — xác nhận là an toàn (đã có chữ label đi kèm), không sửa để tránh thay đổi không cần thiết.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ.
- Test bằng browser thật: xác nhận bottom nav không bị lệch vị trí khi trang có hiệu ứng transition đang chạy.

## Còn lại
Audit SEO cho các trang còn lại (danh mục, trang chủ) — trang chủ đã có OG/structured data cơ bản từ đầu, trang sản phẩm đã SSR đầy đủ từ Round 1. Nhắn "tiếp tục" nếu đại ca muốn em rà nốt phần này, hoặc cho em biết còn khúc mắc gì khác.
