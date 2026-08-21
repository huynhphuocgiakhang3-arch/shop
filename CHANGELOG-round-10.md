# KhangHuynh Vault — Round 10: Bổ sung chức năng viết đánh giá (đã thiếu từ trước)

## Phát hiện: tính năng nửa vời
API viết đánh giá (`POST /api/products/[slug]/reviews`) đã tồn tại sẵn trong source gốc — có validate, có chống đánh giá trùng, có gắn nhãn "Đã mua hàng"... nhưng **không có giao diện nào gọi tới nó**. Người dùng chỉ xem được đánh giá của người khác, không viết được đánh giá của chính mình.

## Đã làm
- `src/hooks/useProducts.ts`: thêm `useCreateReview`.
- `src/app/san-pham/[slug]/ProductDetailClient.tsx`: thêm form đánh giá — chỉ hiện cho người **đã mua sản phẩm** (`hasPurchased`), có chọn sao (1-5), ô nhận xét (không bắt buộc), tự ẩn form + hiện lời cảm ơn sau khi gửi thành công, danh sách đánh giá tự cập nhật ngay không cần tải lại trang.
- Nếu ai đó đã từng đánh giá ở phiên trước, API tự chặn trùng (409) và hiển thị thông báo rõ ràng — không cần thêm logic phức tạp để dò trùng phía client.

### Đã xác minh
`tsc`/`eslint` sạch 0 lỗi, dựng lại giao diện form bằng browser thật để kiểm tra hiển thị trước khi gửi.

## Rà soát các chức năng khác (để trả lời "còn thiếu gì")
Đã kiểm tra và xác nhận **đã có sẵn, hoạt động tốt**, không cần làm thêm:
- Mã giảm giá trong giỏ hàng ✅
- Trang chi tiết đơn hàng ✅
- Sản phẩm đã xem gần đây (Recently Viewed) ✅
- Yêu thích / Wishlist nâng cao ✅ (Round 2)
- Referral/Affiliate ✅ (Round 2)
- Xem nhanh sản phẩm ✅ (Round 9)

## Còn thiếu thật sự (theo MASTER PROMPT, chưa làm)
- 3D Spatial World nâng cao: cursor-light động, particle system phong phú hơn, camera chuyển cảnh theo scroll.
- Page transitions giữa các trang (fade/slide khi chuyển route).
- Audit accessibility toàn site (contrast, aria-label, keyboard nav) một cách hệ thống.
- Audit SEO cho các trang còn lại ngoài trang sản phẩm (danh mục, trang chủ đã có OG cơ bản nhưng chưa kiểm tra kỹ).

Đại ca nhắn "tiếp tục" để em làm tiếp theo thứ tự này, hoặc nói chức năng cụ thể nào đại ca cần gấp nhất.
