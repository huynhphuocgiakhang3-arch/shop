# KhangHuynh Vault — Fix Round 3 (Admin Dashboard + Mobile Sweep) + Full Source Package

Đây là bản đóng gói **toàn bộ source code hoàn chỉnh** sau 3 round chỉnh sửa (không phải patch nữa — giải nén ra là dùng được ngay, thay thế hoàn toàn thư mục dự án cũ).

## Trước khi chạy
```bash
npm install
npx prisma generate
npx prisma migrate deploy   # có migration mới từ Round 2 (referral program)
npm run dev                 # hoặc npm run build && npm start
```
Cấu hình `.env` (`DATABASE_URL`, `JWT_SECRET`, v.v.) giữ nguyên như dự án gốc — không có gì thay đổi ở phần bí mật/kết nối.

---

## Round 3 — nội dung mới trong bản này

### 1. Admin Dashboard — Doanh thu real-time
- `src/app/api/admin/overview/route.ts`: thêm 1 raw SQL query gom doanh thu + số đơn theo từng ngày trong 14 ngày gần nhất (1 round-trip DB thay vì lặp 14 lần).
- `src/components/admin/RevenueChart.tsx` (mới): biểu đồ vùng (area chart) bằng `recharts`, tooltip tùy chỉnh, format tiền rút gọn (vd: 1.2tr), khớp màu sắc design system (cam `#FF8A3D`).
- `src/app/admin/page.tsx`: gắn biểu đồ vào trang tổng quan, có badge **"Live"** nhấp nháy — dashboard tự động refetch mỗi 30 giây (`src/hooks/admin/useAdminOverview.ts`) nên số liệu luôn mới mà không cần F5.
- Thêm thư viện `recharts` vào `package.json`.

### 2. Quét & vá lỗi Mobile Responsive (dựa trên audit code thật, không sửa lan man)
Tìm được và xử lý dứt điểm **4 lỗi cụ thể**:

1. **Bảng "Danh mục" trong Admin bị cắt cụt trên mobile** (`admin/danh-muc`) — container bọc bảng dùng `overflow-hidden` thay vì `overflow-x-auto`, khiến bảng rộng hơn màn hình bị cắt mất phần bên phải, không cuộn được. → Đã sửa.

2. **Menu mobile (hamburger) của toàn site bị lỗi định vị trên iOS Safari** (`src/components/layout/SiteHeader.tsx`) — đây là lỗi nghiêm trọng nhất tìm được ở vòng này: menu di động nằm lồng bên trong thẻ `<header>` có `backdrop-blur-2xl`. Trên WebKit (Safari), một phần tử cha có `backdrop-filter` sẽ biến thành "containing block" mới cho các phần tử con `position: fixed` — **đúng class lỗi đã gây ra vụ widget nhạc/chat lệch vị trí ở Round 1**, lần này ảnh hưởng đến menu điều hướng chính của toàn bộ website trên mobile. Đã portal menu ra thẳng `document.body`.

3. **Modal tìm kiếm (⌘K / thanh search mobile)** (`src/components/search/SearchCommandPalette.tsx`) — cùng nguyên nhân: component này được render bên trong `<header>`. Đã portal ra `document.body`.

4. **`ConfirmDialog`** (hộp thoại xác nhận xóa, dùng ở hầu hết các trang admin) — không phát hiện lỗi thực tế ở các vị trí đang dùng, nhưng đã chủ động portal ra `document.body` để bất kỳ chỗ dùng nào trong tương lai (kể cả bên trong panel có hiệu ứng kính mờ) cũng không bao giờ dính lỗi này.

**Đã kiểm tra và xác nhận an toàn** (không cần sửa): sidebar Dashboard/Admin, các bảng còn lại trong Admin (đơn hàng, người dùng, sản phẩm, hỗ trợ, tải xuống, mã giảm giá, đánh giá, nhật ký hệ thống) đều đã dùng đúng pattern `overflow-x-auto`, các nút bấm đều đạt chuẩn touch target ≥44px, có padding an toàn cho notch/home-indicator (`env(safe-area-inset-*)`).

---

## Tổng hợp cả 3 round (để tiện tra cứu)
| Round | Nội dung chính |
|---|---|
| 1 | Fix widget nhạc/chat lệch vị trí · Nâng cấp 3D Vault Core (mobile-safe, chạm để xoay) · SEO SSR cho trang sản phẩm + JSON-LD |
| 2 | Hệ thống Giới thiệu bạn bè/Affiliate hoàn chỉnh · Nâng cấp Vault cá nhân (tìm kiếm/sắp xếp/thống kê) · Nâng cấp Wishlist |
| 3 | Biểu đồ doanh thu real-time cho Admin · Vá 4 lỗi responsive mobile (gồm 1 lỗi nghiêm trọng ở menu chính) |

## Đã kiểm tra lần cuối trên toàn bộ project
- `tsc --noEmit`: **0 lỗi**.
- `eslint`: **0 lỗi**, chỉ còn 4 warning không nghiêm trọng có sẵn từ trước khi bắt đầu (2 cảnh báo `<img>` nên dùng `next/image`, 2 cảnh báo `exhaustive-deps` ở các hook không liên quan đến các thay đổi) — không phải lỗi phát sinh từ các round sửa.
- Chưa chạy được `next build` đầy đủ trong sandbox vì không có `DATABASE_URL` thật — khuyến nghị đại ca chạy `npm run build` ở môi trường có DB trước khi deploy production.
