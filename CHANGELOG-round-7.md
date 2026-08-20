# KhangHuynh Vault — Round 7: Vá tận gốc Light Mode (mục 4 trong MASTER PROMPT)

## Vấn đề tìm thấy
Quét toàn bộ 100+ file component, phát hiện có **51 loại class border/nền/chữ mờ (opacity trắng)** đang được dùng khắp nơi trong code, nhưng hệ thống Light Mode cũ **chỉ dịch được 24/51** — cách làm cũ là liệt kê tay từng class cụ thể, nên bất kỳ component nào dùng một mức opacity khác (`bg-white/[.06]`, `border-white/[.14]`, `divide-white/[.06]`...) sẽ bị bỏ sót, khiến viền/nền gần như **vô hình trên nền sáng** (trắng mờ trên nền trắng).

## Cách xử lý — có hệ thống, không vá từng cái một
1. Quét (grep) toàn bộ `src/` lấy chính xác danh sách class thật sự đang dùng.
2. Đối chiếu với CSS Light Mode hiện có → xác định đúng 27 class bị thiếu.
3. Sinh tự động toàn bộ rule còn thiếu (nền/viền → `rgba(15,23,42,...)`, chữ → `rgba(17,24,39,...)`, cùng công thức với các rule đã có sẵn để đồng nhất).
4. Loại trừ 1 trường hợp cố ý giữ nguyên: các hạt sáng (particle) bên trong khối 3D Vault Core — khối này luôn có nền tối bất kể theme, nên giữ màu trắng là đúng.

## Đã xác minh bằng browser thật (không chỉ đọc code)
- Test riêng với tổ hợp nhiều class từng bị thiếu → tất cả hiện rõ ràng, đúng độ đậm nhạt tương ứng.
- Test trực tiếp trên `StatCard` thật của app (dùng trong Dashboard) ở Light Mode → viền, icon, chữ đều rõ nét, cảm giác cao cấp tương đương bản Dark Mode.

## File đã sửa
- `src/styles/globals.css` (thêm block CSS mới, không sửa/xoá gì trong Dark Mode)

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ.
- Đây là thay đổi **chỉ thêm CSS**, không đụng logic/component nào — rủi ro phá vỡ chức năng gần như bằng 0.

## Tiếp theo
Phần Design System còn lại theo MASTER PROMPT: typography scale chuẩn hoá, spacing 8px audit, và nâng cấp thêm các component (dropdown, tabs, badge...). Nhắn "tiếp tục" để em làm tiếp, hoặc cho em biết ưu tiên khác.
