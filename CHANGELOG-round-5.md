# KhangHuynh Vault — Round 5 Hotfix: sửa đúng lỗi từ ảnh mới nhất

## Bối cảnh
Ảnh đại ca gửi sau khi deploy Round 4 cho thấy: badge "Vault Core" **đã hết cắt mép** (fix Round 4 có tác dụng), nhưng nút nhạc/chat **vẫn che nội dung** ngay từ đầu — nghĩa là fix "chỉ hiện sau khi cuộn" của Round 4 không hoạt động.

## Nguyên nhân
Lỗi nằm ở chính logic em viết tại `src/components/music/FloatingWidgets.tsx`: nếu thiết bị bật **"Giảm chuyển động"** (Settings → Accessibility → Motion → Reduce Motion trên iOS, hoặc tương đương trên Android), code cũ cho nút **hiện ngay lập tức, bỏ qua toàn bộ phần chờ cuộn** — vì em nhầm lẫn giữa "tắt animation" và "tắt luôn cả cơ chế ẩn/hiện". Đây là 2 việc khác nhau: tắt hiệu ứng mượt là đúng cho người dùng nhạy cảm với chuyển động, nhưng vẫn phải giữ đúng thời điểm hiện/ẩn.

## Fix
Tách riêng 2 khái niệm:
- **`revealed`** (có hiện hay không) — luôn dựa theo vị trí cuộn, không phân biệt reduced-motion.
- **`reducedMotion`** (có animate mượt hay không) — chỉ quyết định có dùng transition mờ dần hay đổi trạng thái tức thì.

## Đã kiểm tra bằng browser thật, không chỉ đọc code
Lần này em không chỉ sửa xong là báo — em đã dựng lại đúng CSS thật của dự án (biên dịch Tailwind từ chính file cấu hình), mô phỏng đúng hành vi component, chạy bằng Chromium headless (Playwright) và **chụp ảnh xác minh trực tiếp**:
- Tại vị trí cuộn = 0 (vừa vào trang): nút nhạc/chat **ẩn hoàn toàn**, không che gì cả.
- Sau khi cuộn qua ngưỡng: nút xuất hiện đúng vị trí góc dưới phải, không chồng lên nội dung.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi.
- `eslint`: 0 lỗi, 4 warning cũ không liên quan.

## Đại ca lưu ý khi deploy lần này
Sau khi giải nén đè + push code, đại ca **nhớ hard-refresh** (đóng hẳn tab Safari, mở lại) trước khi chụp ảnh kiểm tra, để chắc chắn không phải đang xem bản cache cũ.
