# KhangHuynh Vault — Round 4: Sửa lỗi thực tế từ ảnh chụp production + full source

⚠️ **Quan trọng:** Round trước em có làm xong "Admin Dashboard doanh thu real-time" + "Mobile sweep" (SiteHeader drawer, SearchCommandPalette, ConfirmDialog, bảng danh-muc) nhưng **quên đóng gói file gửi đại ca** — chỉ báo cáo bằng chữ. Xin lỗi đại ca vì sơ suất này. Zip lần này (`khanghuynh-vault-round4.zip`) là **full source hoàn chỉnh**, đã gồm toàn bộ những thứ đó **cộng thêm** 2 lỗi mới sửa từ ảnh đại ca gửi. Giải nén ra dùng thay thế toàn bộ, không cần vá gì thêm.

## Lỗi đã xác minh và fix được (dựa trên ảnh thật)

### 1. Nút nhạc/chat che nội dung Hero (ảnh 2 — "Sản phẩm số")
**Nguyên nhân thật:** nút nhạc/chat cố định ở góc dưới phải, hiện ngay từ khi trang vừa tải — trong khi phần mô tả Hero + badge "Vault Core" cũng nằm ngay khu vực đó trên màn hình cao. Hai thứ chồng lên nhau ngay lần xem đầu tiên.
**Fix:** nút nhạc/chat giờ **chỉ xuất hiện sau khi cuộn nhẹ** (~140px), mờ dần vào (fade-in mượt). Không còn che nội dung marketing quan trọng lúc vừa vào trang, vẫn xuất hiện gần như ngay khi người dùng bắt đầu tương tác. (`src/components/music/FloatingWidgets.tsx`)

### 2. Badge "Vault Core" bị cắt ở mép màn hình (ảnh 2)
**Nguyên nhân thật — khá tinh vi:** badge dùng `translateZ(100px)` kết hợp hiệu ứng phối cảnh 3D (`perspective`). Khi khối 3D bị xoay (chạm/kéo hoặc do animation), phép chiếu phối cảnh **phóng to và dịch chuyển** phần tử có `translateZ` dương ra xa hơn vị trí tính theo layout 2D thông thường — đây là đặc tính vật lý của CSS 3D transform, không phải lỗi responsive width như em nghĩ ban đầu.
**Fix:**
- Kéo 2 badge ("Vault Core" và "Digital assets") vào **bên trong** biên khối 3D thay vì đặt nhô ra ngoài.
- Giảm `translateZ` của badge (100px→70px, 94px→64px) để giảm độ phóng đại phối cảnh.
- Giảm biên độ xoay tối đa (±15°→±11°) — vẫn đủ mượt để cảm nhận chiều sâu 3D nhưng không đẩy badge ra khỏi khung hình trên điện thoại hẹp.
(`src/components/home/VaultCore3D.tsx`)

## Về lỗi "chữ vỡ dọc từng ký tự" ở Dashboard (ảnh 1)

Em đã cố gắng tái hiện lỗi này một cách nghiêm túc: dựng lại **chính xác** đoạn markup + CSS thật của trang (biên dịch Tailwind từ đúng file cấu hình dự án, không đoán) và render bằng trình duyệt headless ở đúng độ rộng màn hình — kết quả là **không tái hiện được lỗi**, giao diện hiển thị bình thường.

Điều này cho em biết: đoạn code hiện tại (`trang-chu/page.tsx`) tự bản thân nó không có lỗi CSS/layout gây ra hiện tượng này. Khả năng cao nhất theo kinh nghiệm thực tế:

- **Bundle JS/CSS cũ bị cache lại trên điện thoại** ngay sau khi vừa redeploy — đặc biệt dễ xảy ra khi đại ca vừa gặp lỗi DB (ảnh trước) rồi bấm "Thử lại" nhiều lần, có thể trình duyệt giữ lại một phần tài nguyên cũ không khớp với bản mới.
- Đây là loại lỗi rất phổ biến ngay sau khi redeploy, và **thường tự hết sau khi tải lại sạch**.

**Đại ca thử giúp em:** đóng hẳn tab Safari (không chỉ bấm back) hoặc vào Cài đặt → Safari → Xóa lịch sử và dữ liệu trang web cho riêng site này → mở lại. Nếu lỗi vẫn còn y nguyên sau bước này, đại ca chụp lại ảnh mới + cho em biết tên hiển thị tài khoản đang đăng nhập lúc đó — em sẽ đào sâu tiếp với dữ liệu cụ thể thay vì đoán.

## Về file MASTER PROMPT đại ca gửi

Em đã đọc kỹ toàn bộ 44 mục. Đây là một bản yêu cầu "redesign toàn diện" ở quy mô một dự án nhiều tuần của cả một đội ngũ thật (design system 2 theme, hệ thống 3D spatial world đầy đủ, page transitions, reduced-motion, a11y audit toàn site, v.v.) — **không thể làm nghiêm túc, không phá vỡ chức năng hiện có, trong một lượt duy nhất**. Nếu em nhận liều làm hết ngay bây giờ, rủi ro cao nhất chính là tạo ra thêm những lỗi giống 2 lỗi em vừa sửa ở trên — hoặc tệ hơn.

Cách làm đúng bài (và cũng là tinh thần chính "audit trước, sửa sau" mà chính file MASTER PROMPT yêu cầu ở mục 2): em đề xuất chia nhỏ theo từng mảng, đại ca chọn thứ tự ưu tiên, mỗi round em làm chắc tay — có kiểm tra `tsc`/`eslint`, có test — rồi giao ngay, không hứa suông.

**Đại ca nhắn "tiếp tục" nếu muốn em đề xuất lộ trình chia round cho toàn bộ MASTER PROMPT**, hoặc cho em biết 1-2 mảng đại ca thấy gấp nhất trong 44 mục đó, em bắt tay vào ngay round tiếp theo.
