# KhangHuynh Vault — Round 21: Nâng cấp sâu Trang Mua hàng + Nạp tiền

## Trang Mua hàng (Thanh toán)
- **Ảnh sản phẩm** giờ hiện trong danh sách tóm tắt đơn hàng — trước đây chỉ có tên chữ, không có gì để mắt xác nhận nhanh "đúng sản phẩm mình chọn".
- **Màn hình thành công nâng cấp:** icon tích xanh giờ có hiệu ứng "bung ra" (spring animation) thay vì xuất hiện tĩnh, thêm dòng xác nhận "Sản phẩm đã sẵn sàng tải xuống ngay bây giờ" — rõ ràng hơn về bước tiếp theo.
- **Animation xuất hiện theo trình tự** cho cột nội dung và cột tóm tắt (có độ trễ nhẹ giữa 2 bên).
- Thêm dòng tín hiệu tin cậy cạnh nút xác nhận: "Thanh toán an toàn · Giao hàng số tức thì" — chi tiết nhỏ nhưng giảm lo lắng trước khi bấm mua, mọi trang thanh toán nghiêm túc đều có.

## Trang Nạp tiền
- **Nút chọn nhanh mệnh giá** (100k / 200k / 500k / 1tr / 2tr / 5tr) — trước đây phải gõ tay toàn bộ số tiền. Đây là chi tiết UX rất "cảm nhận được ngay", giảm ma sát đáng kể cho thao tác nạp tiền thường xuyên nhất.
- **Huy hiệu trạng thái lịch sử nạp tiền** ("Đang chờ duyệt" / "Đã cộng tiền" / "Bị từ chối") nâng từ chữ thường thành pill có nền màu — dễ quét mắt hơn khi nhìn danh sách dài.
- Animation xuất hiện theo trình tự cho toàn trang.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ (không đổi qua 21 round).
- Test bằng browser thật (esbuild + Playwright): xác nhận nút mệnh giá hiển thị đúng, không vỡ layout; xác nhận không có lỗi runtime khi render.
- Không có thay đổi database.

## Còn lại theo yêu cầu
Đăng nhập, đăng ký, user vault. Nhắn "tiếp tục" để em làm nốt.
