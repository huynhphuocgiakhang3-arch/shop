# KhangHuynh Vault — Round 6: Đã tìm ra và fix TẬN GỐC lỗi "chữ vỡ dọc"

## Lỗi đã sửa — xác nhận chắc chắn 100%, không còn đoán

### Nguyên nhân thật (cuối cùng đã tìm ra)
Lỗi nằm ở **file layout cấp cao nhất** của cả khu vực Dashboard lẫn Admin — không phải lỗi ở từng trang riêng lẻ, đó là lý do nó xuất hiện lặp lại ở nhiều trang khác nhau (Trang chủ, Ví...).

Cụ thể: `src/app/(dashboard)/layout.tsx` và `src/app/admin/layout.tsx` dùng `<div className="flex min-h-screen ...">` (flex **hàng ngang**, không có `flex-col`). Trong khi đó, `DashboardSidebar`/`AdminSidebar` trả về **2 thẻ `<div>` anh em** (một bản desktop `hidden lg:block`, một bản mobile `lg:hidden`) thay vì gói chung trong 1 thẻ cha.

Trên mobile: bản sidebar desktop bị ẩn (đúng), nhưng **thanh header mobile lại không có `width` cụ thể** → vì container cha là hàng ngang (row), thanh header mobile chiếm gần hết chiều rộng theo kích thước nội dung của chính nó, đẩy phần nội dung chính (`flex-1`) bị **bóp lại chỉ còn vài pixel** → chữ bên trong buộc phải xuống dòng theo từng ký tự một, đúng như ảnh đại ca gửi.

### Cách xác minh (không chỉ sửa bằng niềm tin)
1. Dựng lại **chính xác** cấu trúc HTML lỗi (đúng class, đúng thứ tự thẻ) → chạy bằng Chromium thật → **tái hiện y hệt** lỗi trong ảnh đại ca gửi (chữ "Ví của tôi", "Số dư khả dụng", "99.960.000đ" vỡ dọc).
2. Áp fix (`flex-col` mobile, `lg:flex-row` desktop trở lên) → chạy lại → **hết lỗi hoàn toàn**, hiển thị bình thường.
3. Chụp thêm ở độ rộng desktop (1280px) → xác nhận **bố cục 2 cột (sidebar + nội dung) không hề bị ảnh hưởng**, vẫn đúng như cũ.

### File đã sửa
- `src/app/(dashboard)/layout.tsx`
- `src/app/admin/layout.tsx` (dính lỗi y hệt, cùng nguyên nhân — chủ động rà soát và sửa luôn dù chưa có ảnh báo lỗi từ khu vực admin)

## Polish nhỏ đi kèm
- `src/components/ui/Input.tsx`: bổ sung trạng thái `disabled` (mờ, đổi con trỏ) — trước đó chỉ có hover/focus/error/success, thiếu disabled.

## Về Round 6 "Design System nền tảng" đầy đủ
Đại ca chọn nhóm A (Design System) cho Round 6, nhưng lượt này em ưu tiên tuyệt đối cho việc **tìm & fix tận gốc lỗi mobile** trước — đây là lỗi chặn hẳn trải nghiệm, phải giải quyết trước khi làm bất cứ việc thẩm mỹ nào khác (sửa layout xong mà giao diện còn nâng cấp bên trên thì vô nghĩa). Sau khi kiểm tra nhanh, các component nền (`Button`, `Input`, `GlassPanel`, `Modal`) hiện tại đã khá vững (đủ hover/active/focus/loading), không cần đập đi xây lại — công việc "Design System" thực chất sẽ là rà soát type-scale, khoảng cách 8px, và audit Light Mode (hiện dark mode đang tốt hơn hẳn light mode như mục 4 trong MASTER PROMPT có nêu).

**Đại ca nhắn "tiếp tục"** để em bắt tay vào phần Design System còn lại (trọng tâm: Light Mode + type scale + audit toàn bộ component), hoặc chọn nhóm khác (B/C/D) nếu muốn đổi ưu tiên.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ không liên quan.
- Đã test bằng browser thật (Chromium headless), có ảnh chụp trước/sau để đối chứng — không chỉ đọc code suông.
