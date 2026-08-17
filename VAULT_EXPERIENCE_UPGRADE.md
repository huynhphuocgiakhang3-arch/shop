# KhangHuynh Vault — Experience Upgrade

## Đã nâng cấp

- Hero headline CMS với 2 trạng thái: `File/Tool hiện đại` ↔ `Đẳng cấp Vault.`
- 3D Vault Core bằng CSS 3D + Framer Motion, không thêm WebGL dependency nặng.
- 3D pointer tilt, floating layers, depth cards và reduced-motion support.
- Announcement bar có thể bật/tắt và chỉnh nội dung từ Super Admin.
- Homepage CMS: headline, CTA, mô tả, announcement.
- Social proof CMS: chỉnh số thành viên và đánh giá 5 sao; nếu bỏ trống tự compact `1k+`, `1k9+`, ...
- Why Vault section.
- Recently Viewed bằng localStorage, không cần AI/API ngoài.
- Trending/Best Sellers theo dữ liệu bán hàng thật.
- FAQ JSON-LD lấy trực tiếp từ FAQ đang publish.
- Organization + WebSite structured data.
- Mobile/reduced-motion performance pass.
- Cloudinary `q@1.5.1` dependency được đưa vào package + lock để tránh lỗi `Can't resolve 'q'` từng gặp khi build.
- Migration mới: `20260814000000_vault_experience`.
- `.env` được đưa vào package theo yêu cầu người sở hữu project.

## Kiểm tra trên Windows

```bat
npm ci
npx prisma migrate deploy
npx tsc --noEmit
npm run build
```

Sau đó:

```bat
npm start
```

## Vercel

Khai báo các biến trong `.env` của project trong **Vercel Project Settings → Environment Variables**. Không commit secret vào Git public.

Migration production:

```bat
npx prisma migrate deploy
```

Build command:

```bat
npm run build
```

## Super Admin

Vào **Admin → Giao diện & Hệ thống** để chỉnh:

- Dòng chính
- Dòng chuyển động
- Dòng Vault
- Announcement
- CTA
- Mô tả Hero
- Thành viên hiển thị
- Đánh giá 5 sao hiển thị
- Appearance / Maintenance Mode

Các thay đổi CMS không cần sửa source code.
