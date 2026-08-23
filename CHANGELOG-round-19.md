# KhangHuynh Vault — Round 19: Hệ thống hoá toàn site (Phase 3/n) — Lớp chồng (z-index)

## Lỗi thật phát hiện: Toast bị modal che khuất
Quét toàn bộ giá trị z-index trong code, phát hiện: **Toast thông báo (`z-[200]`) thấp hơn Modal/Quick View (`z-[1000]`)**.

**Hậu quả thực tế:** trong `QuickViewModal.tsx`, nút "Thêm giỏ hàng" gọi thông báo thành công ngay khi modal **vẫn đang mở** — nhưng vì toast có lớp thấp hơn modal, nó render **phía sau** lớp nền mờ của modal, người dùng bấm mua/thêm giỏ hàng mà **không hề thấy phản hồi** xác nhận thao tác đã thành công. Đây là lỗi ảnh hưởng trực tiếp đến trải nghiệm mua hàng — người dùng có thể bấm nhiều lần vì tưởng thao tác chưa thành công.

## Đã sửa — thiết lập thứ bậc lớp chồng rõ ràng
- **Toast: `z-[200]` → `z-[2000]`** — giờ luôn nổi trên cùng, đúng vai trò của một thông báo phản hồi (bất kể đang mở gì khác).
- **ConfirmDialog: `z-[150]` → `z-[1500]`** — đảm bảo hộp thoại xác nhận (ví dụ "Xoá đơn hàng?") luôn hiện đúng trên các modal khác, phòng trường hợp được gọi từ bên trong 1 modal đang mở.
- Đã ghi chú rõ toàn bộ thứ bậc ngay trong code (`ConfirmDialog.tsx`) để các lần thêm overlay mới sau này biết đặt đúng tầng, không lặp lại lỗi tương tự.

## Đã xác minh bằng browser thật — không suy đoán
Dựng lại đúng tình huống lỗi (Modal z-1000 + Toast) bằng đúng CSS thật của dự án, chụp ảnh **trước và sau fix**: trước đây toast nằm ẩn phía sau; sau khi sửa, toast hiện rõ đè lên trên, đọc được đầy đủ nội dung.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ (không đổi qua 19 round — xác nhận không phải lỗi phát sinh).
- Không có thay đổi database — không cần chạy migration.

## Tổng kết hành trình hệ thống hoá (Phase 1-3)
| Phase | Nội dung | Loại |
|---|---|---|
| 1 | Hợp nhất easing curve (19 chỗ trùng lặp → 1 nguồn) | Dọn code, không đổi hình ảnh |
| 2 | Bo góc trùng token (9 chỗ) + Căn lề Header lệch nội dung ~30px | 1 dọn code, 1 lỗi thật đã sửa |
| 3 | Toast bị modal che khuất | Lỗi thật, ảnh hưởng UX mua hàng, đã sửa |

Còn lại: bắt đầu polish riêng từng trang cụ thể nếu đại ca chỉ định (đăng nhập, giỏ hàng, trang sản phẩm...). Nhắn "tiếp tục" hoặc chỉ tên trang, em làm tiếp.
