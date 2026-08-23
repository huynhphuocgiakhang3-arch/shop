# KhangHuynh Vault — Round 16: Sửa 3/5 câu chữ chạy không chỉnh được + lệch layout chữ dài

## 1. Nguyên nhân chỉ 1 câu chỉnh được
`Hero.tsx` build danh sách 5 câu chữ chạy như sau (code cũ):
```
[variant, vault, "Tài sản của bạn.", "Trải nghiệm khác biệt.", "Mua một lần. Sở hữu lâu dài."]
```
Chỉ 2 biến đầu (`variant`, `vault`) đến từ CMS — **3 câu còn lại viết cứng thẳng trong code**, chưa từng có field database hay ô nhập trong Admin cho chúng. Đây là lỗ hổng có từ trước, không phải do Round 15 gây ra.

**Đã sửa:** thêm field `heroRotatingPhrasesExtra` (text nhiều dòng, mỗi dòng 1 câu) + ô nhập tương ứng trong **Admin → Giao diện & Hệ thống**. Để trống vẫn dùng đúng 3 câu mặc định cũ — không phá vỡ gì cho site đang chạy.

## 2. Lỗi lệch màn hình với câu dài
**Nguyên nhân:** khung chứa chữ chạy chỉ dự trữ đúng chiều cao 1 dòng (`min-h-[1.05em]`). Khi gõ tới câu dài phải xuống dòng 2, chiều cao khung đột ngột tăng → đẩy mọi thứ bên dưới (mô tả, nút bấm) nhảy giật ngay giữa lúc animation đang chạy.

**Đã sửa:**
- Dự trữ sẵn chiều cao cho 2 dòng (`min-h-[2.15em]`) — không còn giật dù câu ngắn hay dài.
- Thêm `overflow-wrap: anywhere` cho chữ chạy — phòng trường hợp ai đó nhập 1 từ dính liền cực dài (không dấu cách) cũng không thể đẩy vỡ layout ngang.
- Thêm gợi ý ngay trong Admin: nên giữ mỗi câu dưới ~28 ký tự để đẹp nhất trên 1 dòng.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ.
- Test bằng browser thật: dựng lại đúng Hero với 1 câu cực dài (90 ký tự) để cố tình ép lỗi → xác nhận không tràn ngang, không lỗi runtime.

## ⚠️ Trước khi deploy
Có migration DB mới:
```sql
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroRotatingPhrasesExtra" TEXT;
```

## Về yêu cầu "nâng toàn bộ web lên đẳng cấp Apple"
Đại ca ơi, đây là yêu cầu rất lớn và mang tính chủ quan cao (không có tiêu chí đo được cụ thể) — em xin trả lời thẳng thắn thay vì hứa suông: một buổi audit + nâng cấp thật sự "ngang Apple" cho toàn bộ site sẽ cần nhiều round nhỏ, mỗi round tập trung 1 khu vực cụ thể (giống cách mình đã làm xuyên suốt 16 round vừa qua), có test bằng browser thật trước khi giao — không thể làm ẩu trong 1 lượt mà đảm bảo chất lượng.

**Đề xuất cách làm tiếp:** đại ca chỉ ra 1-2 trang/khu vực cụ thể mà đại ca thấy "chưa xịn" nhất hiện tại (ví dụ: trang sản phẩm, trang giỏ hàng, trang đăng nhập...), em sẽ soi kỹ, so sánh với chuẩn Apple thật (spacing, typography, easing, micro-interaction) và nâng cấp có trọng tâm — hiệu quả và chắc tay hơn nhiều so với "sửa hết mọi thứ" mơ hồ.
