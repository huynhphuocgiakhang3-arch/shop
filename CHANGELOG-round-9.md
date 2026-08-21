# KhangHuynh Vault — Round 9: Xem nhanh sản phẩm (Quick View)

## Tính năng mới: xem sản phẩm không cần rời trang
Đúng yêu cầu đại ca: thêm ô xem nhanh sản phẩm ngay tại chỗ, không cần bấm vào trang chi tiết rồi bấm back.

**Áp dụng ở MỌI nơi hiển thị `ProductCard`** (vì đây là component dùng chung) — bao gồm cả trang **Vault** (`/vault`), Marketplace (`/san-pham`), trang chủ, sản phẩm liên quan...:

- **Icon con mắt** góc trên phải ảnh sản phẩm (hiện khi rê chuột trên desktop).
- **Nút "Xem nhanh"** ngay trong card (luôn hiển thị, dùng tốt trên cả mobile — vì mobile không có hover).

Bấm vào mở ra 1 modal ngay tại trang hiện tại, hiển thị: ảnh, tên, đánh giá sao, giá (kèm giá gốc nếu có giảm giá), mô tả ngắn, 3 điểm nổi bật, nút **Thêm giỏ hàng** / **Mua ngay** — và vẫn có link "Xem trang chi tiết đầy đủ" cho ai muốn xem sâu hơn.

**Kỹ thuật:** tận dụng lại đúng API + hook (`useProduct`) đã dùng cho trang chi tiết sản phẩm — không tạo route mới, đảm bảo dữ liệu luôn đồng nhất, không tăng thêm gánh nặng bảo trì.

## Đã kiểm tra bằng browser thật
Dựng lại đúng markup modal, test cả mobile (390px, xếp dọc ảnh trên/thông tin dưới) và desktop (1200px, ảnh trái/thông tin phải) — cả hai đều hiển thị đúng bố cục, không lỗi vị trí (đã học từ các lần trước, luôn test trước khi gửi).

## File mới / đã sửa
- `src/components/home/QuickViewModal.tsx` (mới)
- `src/components/home/ProductCard.tsx` (thêm nút mở Quick View, thay nút "Xem chi tiết" bằng "Xem nhanh" — link vào trang chi tiết đầy đủ vẫn giữ nguyên qua ảnh/tên sản phẩm và qua link trong modal)

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ.

## Về phần "còn thiếu" tổng thể (MASTER PROMPT)
Đã hoàn thành tới nay: fix layout mobile gốc rễ (Round 6), Light Mode toàn diện (Round 7), Notification system (Round 8), Quick View (Round 9). Còn lại: spacing/8px audit chi tiết, nâng cấp 3D Spatial World theo mô tả đầy đủ (cursor light, particles, camera động), page transitions, và audit accessibility/SEO cuối cùng. Đại ca nhắn "tiếp tục" để em làm tiếp theo đúng thứ tự này.
