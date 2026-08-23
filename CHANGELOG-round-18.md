# KhangHuynh Vault — Round 18: Hệ thống hoá toàn site (Phase 2/n) — Bo góc + Căn lề

## 1. Bo góc (border-radius) — dọn 9 chỗ viết tay trùng token có sẵn
Site đã có sẵn thang bo góc chuẩn (`xs`=8, `sm`=12, `md`=16, `lg`=24, `xl`=32, `pill`=999px), nhưng 9 chỗ trong code vẫn viết tay `rounded-[24px]` / `rounded-[32px]` thay vì dùng token `rounded-lg` / `rounded-xl` sẵn có — trùng khớp pixel tuyệt đối, chỉ là thiếu kỷ luật code, không có lý do thiết kế. Đã gộp về dùng token, xác nhận bằng build CSS thật: giá trị pixel ra y hệt trước (24px/32px), **không có bất kỳ thay đổi hình ảnh nào**, chỉ sạch code hơn.

## 2. Căn lề (container width) — lỗi thật, đã sửa + verify bằng đo toạ độ thực tế
**Phát hiện:** khung chứa nội dung chính của site đang dùng **3 độ rộng khác nhau** cho cùng một vai trò (khung bao ngoài căn giữa trang):
- `1380px` — dùng ở Hero (banner) và toàn bộ 7 section khác của trang chủ (đa số áp đảo).
- `1440px` — dùng riêng ở Header (cả desktop và thanh tìm kiếm mobile) và ở chính khối lưới chính của Hero.
- `1200px` — chỉ 1 chỗ, hoá ra là vòng sáng nền trang trí (blur glow), không phải khung nội dung — giữ nguyên, không phải lỗi.

Hậu quả thực tế: **Header lệch ra ngoài ~30px mỗi bên** so với nội dung trang bên dưới — mắt thường trên màn hình rộng sẽ thấy nav bar và nội dung không thẳng hàng, đúng kiểu "trông có gì đó không chuẩn" dù khó chỉ ra chính xác là gì.

**Đã sửa:** gộp toàn bộ về 1380px (theo số đông áp đảo — 8/11 chỗ). Xác nhận bằng browser thật, **đo toạ độ pixel chính xác**: header và nội dung giờ có `x`, `width`, `right` **giống hệt nhau tuyệt đối** — căn thẳng hàng hoàn hảo.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ.
- Build CSS thật bằng Tailwind + đo bounding box bằng Playwright cho cả 2 thay đổi — không suy đoán, có số liệu đối chứng.
- Đã audit thêm 2 mục và xác nhận **không có vấn đề, không cần sửa**: khoảng cách (padding/margin/gap) đã dùng 100% thang chuẩn Tailwind; hệ thống đổ bóng (shadow) tuy có nhiều giá trị khác nhau nhưng đều là biến thể có chủ đích theo ngữ cảnh (không phải lỗi trùng lặp cần gộp).

## Tiếp theo (Phase 3)
Còn lại theo hướng hệ thống: rà soát độ nhất quán của z-index (lớp chồng), và bắt đầu polish riêng từng trang cụ thể nếu đại ca chỉ định. Nhắn "tiếp tục" để em làm Phase 3.
