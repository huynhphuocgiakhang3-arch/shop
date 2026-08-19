# KhangHuynh Vault — Fix Round 1 (Mobile / 3D / SEO)

Áp dụng: giải nén `khanghuynh-vault-fixes.zip` đè lên source hiện tại (đúng cấu trúc thư mục `src/...`), sau đó `git diff` để review trước khi merge.

## 1. Fix widget Nhạc / Chat lệch vị trí trên mobile
**File:** `src/components/music/FloatingWidgets.tsx`

**Nguyên nhân gốc:** đây là lỗi WebKit/Blink kinh điển — bất kỳ phần tử cha nào ở phía trên trong cây DOM có `backdrop-filter`, `filter`, hoặc `transform` sẽ vô tình trở thành "containing block" mới cho `position: fixed`, khiến widget bị "bắt cóc" khỏi góc màn hình và trôi theo layout của cha đó (đúng như hiện tượng "ở giữa bên phải" đại ca mô tả).

**Cách xử lý:** portal thẳng widget ra `document.body` bằng `createPortal`. Widget giờ luôn là con trực tiếp của `<body>`, miễn nhiễm hoàn toàn với bất kỳ hiệu ứng kính mờ / animation nào được thêm ở các trang khác trong tương lai. Đây là cách một dev senior xử lý dứt điểm class bug này thay vì vá từng trường hợp.

## 2. Nâng cấp toàn bộ khối 3D "Vault Core"
**File:** `src/components/home/VaultCore3D.tsx`

- **Sửa lỗi vỡ layout mobile:** các badge "Vault Core / Digital assets" trước đây định vị bằng offset âm cố định (`-right-16`, `-bottom-9 -left-12`) nên bị tràn/cắt trên màn hình hẹp. Đã chuyển toàn bộ sang offset theo `%` của khối 3D, đảm bảo không bao giờ tràn ra ngoài khung dù màn hình 320px.
- **Thêm tương tác chạm thật:** trước đây `pointerType === "touch"` bị chặn hoàn toàn → trên mobile khối 3D chỉ quay tự động, không phản hồi người dùng. Giờ hỗ trợ kéo bằng ngón tay để xoay (giống thao tác xoay sản phẩm 3D trên các trang thương mại điện tử cao cấp), có label "Chạm để xoay" gợi ý.
- **Nâng chất lượng thị giác:** thêm lớp "specular sheen" (ánh sáng quét qua bề mặt kính) và vùng phản chiếu dưới sàn, tạo cảm giác vật thể có khối thật thay vì hình phẳng dán gradient.
- Card đề xuất tiếp theo: nếu đại ca muốn nâng lên WebGL/Three.js thật (particle system, PBR material, môi trường HDRI phản chiếu) để đạt chuẩn "AAA", em cần biết ngân sách hiệu năng mobile mong muốn — phần này nặng hơn nhiều so với CSS 3D transform hiện tại.

## 3. SEO chuẩn cho trang chi tiết sản phẩm (thay đổi quan trọng nhất)
**Files:** `src/app/san-pham/[slug]/page.tsx` (mới, Server Component), `src/app/san-pham/[slug]/ProductDetailClient.tsx` (mới, phần tương tác), `src/hooks/useProducts.ts`

**Vấn đề cũ:** toàn bộ trang sản phẩm là Client Component (`"use client"`), dữ liệu chỉ được fetch **sau khi** JS chạy xong trên trình duyệt người dùng. Với Googlebot / mạng xã hội khi share link, trang gần như trắng — không tiêu đề, không mô tả, không giá, không đánh giá. Đây là lỗ hổng SEO nghiêm trọng nhất trong toàn bộ shop.

**Đã xử lý:**
- Tách thành Server Component: dữ liệu sản phẩm được fetch trực tiếp từ Prisma trên server, HTML trả về đã có sẵn đầy đủ nội dung — Google đọc được ngay, không cần chờ JS.
- `generateMetadata()` sinh title/description/canonical/OpenGraph/Twitter Card **riêng cho từng sản phẩm** (trước đây toàn site chỉ có 1 metadata chung).
- Thêm JSON-LD `Product` schema (giá, tình trạng còn hàng, rating trung bình) — điều kiện để Google hiển thị rich snippet (sao đánh giá, giá) ngay trên kết quả tìm kiếm.
- Phần tương tác (giỏ hàng, yêu thích, đổi ảnh) tách ra `ProductDetailClient.tsx`, nhận `initialData` từ server nên **không fetch lại lần 2** — tải nhanh hơn, không còn hiện loading spinner khi vào trang.
- Tiện thể fix luôn lỗi tràn ngang dải ảnh thumbnail trên mobile (trước đây `flex gap-2` không cuộn được, nhiều ảnh sẽ vỡ layout).

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi trên toàn bộ project.
- `eslint`: 0 lỗi (chỉ còn 4 warning có sẵn từ trước, không liên quan các file đã sửa).
- Chưa chạy được `next build` đầy đủ trong sandbox vì không có `DATABASE_URL`/secrets thật — khuyến nghị đại ca chạy `npm run build` ở môi trường có DB trước khi deploy.
