# KhangHuynh Vault — Fix Round 2 (Referral / Affiliate + Vault + Wishlist)

**Cách áp dụng:** giải nén `khanghuynh-vault-round2.zip` đè lên source gốc (đúng path `src/...`, `prisma/...`). Đây là **patch nối tiếp Round 1** — không đụng vào file nào ngoài danh sách 23 file bên dưới, mọi phần khác của web giữ nguyên 100%.

## ⚠️ Bước bắt buộc trước khi chạy
File `prisma/schema.prisma` có thay đổi cấu trúc DB (thêm cột), nên sau khi giải nén, đại ca cần chạy 1 trong 2 cách:

**Cách A — có quyền chỉnh DB trực tiếp (khuyến nghị, an toàn với dữ liệu cũ):**
```bash
npx prisma migrate deploy
```
(migration đã được viết sẵn tại `prisma/migrations/20260818010000_add_referral_program/migration.sql`, dùng toàn `ADD COLUMN IF NOT EXISTS` nên không đụng dữ liệu hiện có)

**Cách B — môi trường dev/không có migration history khớp:**
```bash
npx prisma db push
npx prisma generate
```

## 1. Hệ thống Giới thiệu bạn bè / Affiliate (tính năng mới hoàn toàn)
**Cơ chế:** mỗi user có 1 mã giới thiệu riêng (tự sinh lần đầu vào trang, không cần chạy script backfill cho tài khoản cũ). Khi người được mời **thanh toán đơn hàng đầu tiên**, người giới thiệu tự động nhận % hoa hồng cộng thẳng vào Wallet + có thông báo.

- `prisma/schema.prisma` — thêm `User.referralCode`, `User.referredById`, `SiteSettings.referralEnabled`, `SiteSettings.referralCommissionPercent`.
- `src/lib/referral.ts` — sinh mã 7 ký tự (loại bỏ ký tự dễ nhầm như 0/O, 1/I), an toàn khi trùng (retry tự động).
- `src/app/api/checkout/route.ts` — logic cộng hoa hồng chạy **sau** transaction thanh toán chính, có try/catch riêng: nếu có lỗi ở phần hoa hồng, đơn hàng của khách vẫn thành công bình thường, chỉ log lỗi lại — không bao giờ vì một tính năng phụ mà làm hỏng giao dịch tiền thật.
- `src/app/api/auth/register/route.ts` — nhận `?ref=CODE` khi đăng ký, gắn người giới thiệu (mã sai/không tồn tại thì bỏ qua âm thầm, không chặn đăng ký).
- API mới: `GET /api/referrals/me` (thống kê cho user), `GET /api/admin/referrals` (bảng xếp hạng cho admin).
- Trang mới **`/gioi-thieu`** (user): mã giới thiệu, link chia sẻ (Web Share API + copy), 3 thẻ thống kê, danh sách bạn bè đã mời kèm trạng thái đã/chưa mua hàng.
- Trang mới **`/admin/gioi-thieu`**: tổng quan hệ thống + bảng xếp hạng top referrer.
- **`/admin/giao-dien`** (Super Admin): thêm panel bật/tắt chương trình + chỉnh tỷ lệ hoa hồng (0–50%).
- Trang đăng ký hiển thị banner "Bạn được giới thiệu bởi mã XXXX" khi vào từ link giới thiệu.
- Đã thêm mục "Giới thiệu bạn bè" vào sidebar user và admin.

## 2. Nâng cấp Vault cá nhân (`/tai-xuong`)
- Thêm ô tìm kiếm, 4 kiểu sắp xếp (mới kích hoạt / cũ nhất / A-Z / tải nhiều nhất).
- Thêm 3 thẻ thống kê: số sản phẩm sở hữu, tổng lượt tải, dung lượng ước tính.
- Card sản phẩm thiết kế lại: ảnh lớn hơn, badge phiên bản, hiệu ứng hover, nút "Tải lại" rõ ràng hơn.

## 3. Nâng cấp Wishlist (`/yeu-thich`)
- Thêm tìm kiếm + sắp xếp (mới thêm / giá thấp→cao / giá cao→thấp / A-Z).
- Nút **"Thêm tất cả vào giỏ"** khi có từ 2 sản phẩm trở lên.
- Card hiển thị badge "Ưu đãi" + giá gạch ngang khi có giảm giá (trước đây không có).
- Nút "Thêm vào giỏ" ngay trên từng card, không cần vào trang chi tiết.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi toàn bộ project.
- `eslint`: 0 lỗi. Chỉ còn 4 warning có sẵn từ trước khi Round 2 bắt đầu (không liên quan các file đã sửa).
- Toàn bộ logic tiền (hoa hồng) được thiết kế **best-effort, không thể làm hỏng giao dịch mua hàng thật** ngay cả khi có lỗi.
