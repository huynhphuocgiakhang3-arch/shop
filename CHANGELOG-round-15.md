# KhangHuynh Vault — Round 15: Sửa lỗi chữ "vô hình" dưới Sản phẩm số + màu tùy chỉnh

## Nguyên nhân chính xác (đã xác minh bằng browser thật)
Dòng chữ chạy chữ ("File/Tool hiện đại", "Đẳng cấp Vault."...) dùng hiệu ứng gradient cam (`text-gradient-orange` — kỹ thuật `background-clip: text` + `color: transparent`). Class này được đặt ở **thẻ cha**, nhưng chữ thật lại nằm trong 1 thẻ `<span>` **con**, lồng bên trong một `<span>` khác có `display: inline-flex` (dùng để canh chữ + con trỏ nháy).

`display: inline-flex` vô tình **chặn đứng** hiệu ứng "cắt nền theo chữ" lan từ cha xuống — hậu quả: chữ con chỉ còn `color: transparent` (thừa hưởng từ cha) mà **không có nền gradient để hiện lên**, tức là chữ tồn tại trong DOM, chiếm đúng khoảng trống, nhưng hoàn toàn trong suốt. Đúng như đại ca mô tả: "không gian vô hình".

**Cách em xác minh (không đoán mò):** dựng đúng cấu trúc HTML/CSS y hệt bản gốc bằng browser thật — tái hiện y hệt: chữ biến mất hoàn toàn, chỉ còn thấy que nháy màu cam. Sau đó áp fix, test lại — chữ hiện rõ ràng.

## Đã sửa
- `src/components/ui/AnimatedHeadline.tsx`: thêm `textClassName`/`textStyle`, đặt đúng vào thẻ chứa chữ thật (bỏ qua rào cản `inline-flex`).
- `src/components/home/Hero.tsx`: chuyển gradient từ thẻ cha (vô nghĩa) sang đúng vị trí.

## Thêm: chỉnh màu chữ dòng chạy trong Super Admin
Giống màu mô tả Hero (Round 13), giờ dòng chữ chạy cũng chỉnh được:
- `SiteSettings.heroHeadlineColor` (migration mới).
- **Admin → Giao diện & Hệ thống**: ô màu mới "Màu chữ dòng chạy" — để trống dùng gradient cam mặc định (đẹp sẵn), nhập màu riêng nếu muốn đổi.

## ⚠️ Trước khi deploy
Có migration DB mới — chạy `npx prisma migrate deploy` (hoặc dán SQL trong `prisma/migrations/20260822180000_add_hero_headline_color/migration.sql` vào SQL Editor) **trước khi** khởi động lại app.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ.
- Test bằng browser thật, có ảnh chụp trước/sau đối chứng — không chỉ đọc code.
