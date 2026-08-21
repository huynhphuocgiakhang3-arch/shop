# KhangHuynh Vault — Round 11: Nâng cấp 3D Spatial World (ưu tiên theo yêu cầu)

## 1. Atmosphere Field — không gian 3D trải rộng cả Hero
**File mới:** `src/components/home/AtmosphereField.tsx`

Trước đây các hạt sáng (particle) chỉ nằm bên trong khối Vault Core nhỏ. Giờ thêm một lớp không gian bao phủ **toàn bộ khu vực Hero**:
- 16 hạt sáng nhỏ trôi nổi nhẹ nhàng khắp màn hình (một nửa tự ẩn trên mobile để nhẹ máy).
- 3 tấm "glass shard" (mảnh kính mờ, xoay nghiêng, viền cam/xanh) trôi phía sau nội dung, tạo chiều sâu không gian thật sự thay vì chỉ có 1 vật thể 3D đơn độc trên nền phẳng.
- Vị trí sinh theo công thức toán xác định (không dùng `Math.random()` khi render) → **server và client luôns khớp nhau tuyệt đối, không lỗi hydration**.
- Tất cả chỉ animate `opacity`/`transform` (GPU, không tốn layout/paint) — tự tắt hoàn toàn khi bật "Giảm chuyển động".
- Đã kiểm tra: không tràn viewport ngang trên mobile 390px.

## 2. Camera chuyển động theo cuộn trang (cinematic scroll)
**File:** `src/components/home/VaultCore3D.tsx`

Trước đây khối 3D chỉ phản hồi con trỏ/chạm, đứng yên khi cuộn trang. Giờ thêm hiệu ứng "camera" thật: khi cuộn qua Hero, khối 3D tự **nghiêng nhẹ, thu nhỏ và mờ dần** — cảm giác như máy quay đang lùi ra xa, không phải vật thể đột ngột biến mất khỏi màn hình. Kết hợp mượt với hiệu ứng xoay theo con trỏ/chạm đã có sẵn (2 chuyển động độc lập cộng dồn tự nhiên).

Tự tắt khi bật "Giảm chuyển động" (giữ khối 3D đứng yên, chỉ mờ nhẹ theo scroll — vẫn đảm bảo trải nghiệm dùng được).

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ.
- Test bằng browser thật: dựng lại đúng công thức vị trí hạt/shard, xác nhận không tràn viewport trên mobile.

## Tiếp theo (còn lại theo MASTER PROMPT)
Page transitions giữa các trang, audit accessibility toàn site, audit SEO các trang còn lại. Nhắn "tiếp tục" để em làm tiếp, hoặc nếu đại ca muốn nâng 3D lên mức cao hơn nữa (WebGL/Three.js thật thay vì CSS 3D transform) thì cho em biết — đó là bước nâng cấp lớn hơn nhiều, cần trao đổi thêm về đánh đổi hiệu năng trước khi làm.
