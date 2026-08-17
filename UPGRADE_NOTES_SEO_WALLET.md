# KhangHuynh Vault — Wallet + SEO + Admin Upgrade

## Đã cập nhật
- Checkout chỉ dùng số dư Wallet đã nạp trước đó.
- Debit Wallet atomic, chống chi tiêu kép; ghi oldBalance/newBalance vào lịch sử giao dịch.
- Mua ngay từ product card/detail thêm sản phẩm vào giỏ và mở checkout Wallet.
- Upload file sản phẩm trực tiếp trong Admin (giới hạn 25MB qua server route); vẫn hỗ trợ dán URL cho file lớn.
- Product form có version, dung lượng, compatibility, release notes và file URL.
- FAQ Manager tại `/admin/cau-hoi`, CRUD + ẩn/hiện + sắp xếp.
- FAQ public lấy dữ liệu từ Admin, có fallback an toàn.
- Chat bot tiếp tục phản hồi sau hand-off; chỉ im lặng khi tin nhắn mới nhất vừa đến từ Admin.
- SEO: metadataBase, canonical, Open Graph, Twitter, robots, sitemap, manifest, Product JSON-LD, FAQ JSON-LD.
- Sitemap tự lấy các sản phẩm PUBLISHED.

## Database
Sau khi deploy source, chạy migration:

```bash
npx prisma migrate deploy
```

Migration mới:
`prisma/migrations/20260812000000_add_faq_items/migration.sql`

## Environment
Thêm:
`NEXT_PUBLIC_SITE_URL=https://khanghuynhvault.vercel.app`

Không commit `.env`. Bản ZIP phát hành không chứa `.env` thật.

## Build
```bash
npm ci
npx prisma generate
npm run build
```

Build trên môi trường deploy cần `DATABASE_URL`, JWT secrets và các biến Cloudinary cần thiết cho upload.
