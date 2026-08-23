# KhangHuynh Vault — Round 14: Performance Monitoring + 3D Card Tilt + i18n thật + AI Chat

## 1. Theo dõi hiệu năng thực tế
Cài `@vercel/analytics` + `@vercel/speed-insights`, gắn vào `layout.tsx`.

**Sau khi deploy, đại ca cần vào Vercel Dashboard → project → tab Analytics/Speed Insights → bấm Enable** (miễn phí ở gói cơ bản, có giới hạn số sự kiện/tháng). Từ đó sẽ thấy Core Web Vitals (LCP, CLS, INP) đo trên thiết bị người dùng thật, không phải điểm số giả lập.

## 2. Hiệu ứng 3D nghiêng theo con trỏ cho Product Card
Thêm hiệu ứng "tilt" (nghiêng nhẹ ±5° theo vị trí con trỏ) cho mọi card sản phẩm — hiệu ứng thường thấy ở các trang thương mại điện tử cao cấp. Chỉ áp dụng trên desktop (không có hover trên mobile), tôn trọng "Giảm chuyển động".

**Lưu ý kỹ thuật:** dùng đúng cơ chế `style` motion-value của Framer Motion (không dùng chuỗi `transform` viết tay) — rút kinh nghiệm trực tiếp từ lỗi lệch tâm ở Round 13. Đã verify bằng browser thật: hiệu ứng nghiêng + hiệu ứng nâng khi hover kết hợp đúng thành 1 transform duy nhất, không xung đột.

## 3. Đa ngôn ngữ thật (thay hệ thống cũ)
Hệ thống cũ (`LanguageBridge`) hoạt động bằng cách **dò và sửa từng chữ trong DOM** sau khi trang đã tải xong — tốn hiệu năng (theo dõi toàn bộ thay đổi DOM của cả trang), gây nháy chữ Việt→Anh, và **không có tác dụng với SEO/preview mạng xã hội** (Google/Facebook đọc HTML gốc từ server, không thấy bản dịch).

**Đã thay bằng:** hệ thống Context React chuẩn (`useTranslation()`/`t()`) — component tự gọi dịch, không dò DOM. Đã di chuyển xong các khu vực hiển thị nhiều nhất: Header, Footer, Product Card. Chuỗi chưa migrate sẽ tự động giữ nguyên tiếng Việt khi chọn EN (không vỡ trang, không hiện lỗi) — mở rộng thêm chỉ cần thêm dòng vào từ điển và bọc `t()`, không cần đụng vào hệ thống lõi.

**Giới hạn cần biết:** vì ngôn ngữ vẫn lưu ở trình duyệt (không phải URL `/en/...` + cookie phía server), lần đầu tải trang vẫn hiển thị tiếng Việt trong tích tắc trước khi chuyển sang tiếng Anh cho người đã chọn EN trước đó — muốn loại bỏ hoàn toàn cần làm i18n theo route (đổi cấu trúc URL), là một dự án riêng lớn hơn nhiều.

## 4. Nâng chat hỗ trợ — AI trả lời tự động
**Phát hiện quan trọng:** chat đã có sẵn bot tự động trả lời theo từ khóa khá đầy đủ (19 nhóm chủ đề, tra cứu dữ liệu thật: số dư ví, đơn hàng, mã giảm giá...) — đại ca có thể chưa biết vì không có nơi nào hiển thị rõ điều này.

**Đã nâng cấp:** khi bot không khớp được từ khóa nào (trước đây → chuyển thẳng cho Admin), giờ **thử hỏi Claude AI thật trước** nếu đại ca cấu hình API key, chỉ chuyển Admin nếu AI cũng không giúp được. Toàn bộ câu trả lời từ dữ liệu thật (ví, đơn hàng...) vẫn giữ nguyên cơ chế cũ — AI chỉ bổ sung cho phần "không nhận diện được", không thay thế.

**An toàn tuyệt đối:** nếu đại ca chưa cấu hình API key, hành vi **giữ nguyên y hệt trước đây** — không có gì thay đổi, không lỗi. Nếu key sai/hết hạn mức, tự động rơi về câu trả lời cũ, không bao giờ làm hỏng chat.

### Cách bật AI thật (tùy chọn)
1. Đăng ký tài khoản tại `console.anthropic.com`, tạo API key.
2. Vào Vercel → project → Settings → Environment Variables → thêm `ANTHROPIC_API_KEY` = key vừa tạo.
3. Redeploy. Vào **Admin → Tin nhắn** sẽ thấy badge "AI fallback: Đang bật".
4. (Tùy chọn) chi phí tính theo lượt gọi thật của Anthropic — chỉ tốn phí cho các câu hỏi bot không nhận diện được bằng từ khóa (đa số câu hỏi thường gặp vẫn miễn phí qua hệ thống từ khóa cũ).

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ.
- Test bằng browser thật (esbuild + Playwright): xác nhận tilt 3D không xung đột transform, xác nhận `t()` dịch đúng và fallback an toàn khi thiếu key dịch.
- Không có thay đổi database ở round này — không cần chạy migration.
