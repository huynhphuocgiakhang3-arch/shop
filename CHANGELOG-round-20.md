# KhangHuynh Vault — Round 20: Nâng cấp sâu Trang sản phẩm + Admin Dashboard

## Trang sản phẩm

### 🔧 Lỗi thật phát hiện qua test: tên sản phẩm bị phóng to sai
Tiêu đề sản phẩm (`<h1>`) đang dùng nhầm class `khv-hero-title` — class này **chỉ dành riêng cho tiêu đề khổng lồ ở trang chủ** (có `font-size` `!important` lên tới 4.5rem). Áp nhầm vào trang sản phẩm khiến tên sản phẩm bị phóng to chiếm gần hết màn hình trên mobile, đẩy giá/nút mua xuống sâu, phải cuộn mới thấy.

**Phát hiện bằng cách nào:** dựng lại đúng component thật bằng esbuild + browser thật (không đoán qua đọc code) — đây chính xác là bug đã có sẵn từ trước, chưa từng bị phát hiện vì chưa ai test trang này theo cách này.

**Đã sửa:** bỏ class sai, tên sản phẩm giờ đúng kích thước — thấy đủ ảnh/tên/giá/mô tả/nút mua trong 1 màn hình đầu tiên, không cần cuộn.

### Nâng cấp thêm — cảm nhận được ngay
- **Thanh mua hàng dính (sticky buy bar)** trên mobile — cuộn qua nút mua chính, giá + nút "Mua ngay" tự động dính xuống đáy màn hình, luôn trong tầm tay dù đang đọc mô tả/đánh giá ở dưới xa. Đây là chi tiết mọi trang thương mại điện tử nghiêm túc đều có.
- **Ảnh chuyển mượt (crossfade)** khi đổi ảnh trong dải thumbnail, thay vì đổi khựng tức thì.
- **Hiệu ứng zoom nhẹ khi rê chuột** vào ảnh sản phẩm (desktop).
- **Animation xuất hiện theo trình tự** khi vào trang (ảnh trước, thông tin sau — có độ trễ nhẹ, không phải mọi thứ hiện cùng lúc).
- Thêm nút **chia sẻ sản phẩm** (share API trên mobile, copy link trên desktop).

## Admin Dashboard

### Nâng cấp `LoadingBlock` — ảnh hưởng TOÀN BỘ hệ thống admin/dashboard cùng lúc
Trước đây mọi trang admin/dashboard khi đang tải chỉ hiện 1 vòng xoay đơn giản. Đã thay bằng **skeleton shimmer** đúng hình dạng nội dung sắp hiện (thanh tiêu đề + thẻ số liệu + panel) — hiệu ứng dải sáng chạy qua, độ trễ so le giữa các khối. Đây là chi tiết mọi app cao cấp đều có (khác biệt giữa "trông như đang tải xong" và "trông như đang chờ").

**Vì đây là 1 component dùng chung**, sửa 1 lần → toàn bộ trang admin/dashboard đang dùng `<LoadingBlock />` được nâng cấp ngay lập tức, không cần sửa từng trang.

### Phân cấp thị giác rõ ràng hơn
Thêm thuộc tính `emphasis` cho `StatCard` — áp dụng cho "Doanh thu hôm nay" (số liệu quan trọng nhất): số to hơn, khung nhấn màu cam nhẹ. Trước đây mọi thẻ số liệu có sức nặng thị giác bằng nhau, không phân biệt được cái nào quan trọng nhất chỉ bằng mắt.

### Animation xuất hiện cho thẻ số liệu
Thêm hiệu ứng mờ dần + trượt nhẹ khi các thẻ xuất hiện, thay vì hiện đột ngột.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ (không đổi qua 20 round).
- Test bằng browser thật (esbuild + Playwright): chụp ảnh xác nhận lỗi tiêu đề trước/sau fix, xác nhận sticky bar xuất hiện đúng vị trí không đè nội dung, xác nhận hiệu ứng shimmer chạy đúng.
- Không có thay đổi database.

## Còn lại theo yêu cầu
Giỏ hàng/mua hàng, nạp tiền, đăng nhập, đăng ký, user vault — em tiếp tục ngay khi đại ca nhắn "tiếp tục".
