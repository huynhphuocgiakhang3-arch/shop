# KhangHuynh Vault — Round 8: Notification system + audit Typography

## Typography (mục 3 MASTER PROMPT) — đã audit, không cần sửa
Hệ thống type scale hiện tại (`tailwind.config.ts`) đã có đủ 9 cấp bậc rõ ràng và nhất quán: `display → hero → h1 → h2 → h3 → h4 → title → subtitle → small → caption → overline`, dùng `clamp()` cho các cấp lớn để tự responsive. Đây đã là một hệ thống chuẩn, không có khoảng trống cần vá — không sửa gì để tránh động vào thứ đang hoạt động tốt.

## Notification System (mục 34 MASTER PROMPT) — 2 lỗ hổng thật, đã fix
File `src/components/ui/Toast.tsx`:

1. **Thiếu 2 trạng thái bắt buộc:** trước đây chỉ có `success/error/info`, thiếu hẳn **`warning`** và **`loading`**. Đã bổ sung đủ 5 loại theo đúng yêu cầu, `loading` có icon xoay và không tự tắt (chờ code gọi tắt thủ công khi việc xong — đúng hành vi loading toast chuẩn).

2. **Toast đè lên thanh điều hướng dưới trên mobile:** vị trí cũ cố định `bottom-5` (20px) — trên các trang Dashboard/Admin có thanh nav dưới cùng cao ~64-84px, toast sẽ hiện **chồng lên** các icon điều hướng. Đã sửa để tự động né thanh nav trên mobile, đồng thời vẫn tôn trọng vùng an toàn (home indicator) trên các trang không có nav.

### Xác minh bằng browser thật
Dựng lại đúng bối cảnh (trang có bottom nav + toast cùng lúc) bằng Chromium headless → chụp ảnh xác nhận: toast nằm hẳn phía trên thanh nav, không che icon nào.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ (không liên quan).

## Còn lại trong Design System
- Spacing 8px audit
- Dropdown/Tabs/Badge (hiện đang inline theo từng nơi dùng, chưa có component dùng chung — cân nhắc có cần thiết không hay giữ nguyên vì đang hoạt động tốt)

Nhắn "tiếp tục" để em làm tiếp, hoặc cho em biết đã test Round 7 (Light Mode) ổn chưa để em yên tâm tiếp tục theo hướng này.
