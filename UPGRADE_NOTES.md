# KhangHuynh Vault — UI / UX & Commerce Upgrade

## Included
- Direct Cloudinary product-image upload from Super Admin product creation/edit modal.
- Optional product category: leaving category empty automatically uses `Chưa phân loại`.
- Super Admin category management at `/admin/danh-muc`.
- User management now displays wallet balance and pending balance.
- Deterministic keyword chatbot expanded for deposit/QR/card, products, prices, balance, orders, downloads, membership, coupons, account, security, music, refunds and human support.
- Music provider remains mounted at the root so playback survives client-side navigation; playlist advances automatically and wraps back to the first track.
- Floating chat label animates in and deletes itself letter-by-letter after six seconds.
- Page entrance animation for dashboard/admin surfaces with reduced-motion support.
- Product upload endpoint is same-origin + Super Admin protected and limits images to 10MB.

## Deployment
1. Copy `.env.example` to `.env` and fill your real environment values.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Run `npx tsc --noEmit`.
5. Run `npm run build`.
6. Deploy the project and verify Cloudinary environment variables are configured in production.

The archive intentionally does **not** contain the original `.env` secrets.


## TITAN PERFORMANCE LAYER

The visual design and animation effects are intentionally preserved. A lightweight adaptive motion layer now scales only the render budget based on device capability, reduced-motion preference, data saver/network hints, and tab visibility. Background canvas effects pause while hidden, cap device-pixel-ratio on constrained devices, and avoid expensive per-particle canvas blur filters. Cursor/aurora/count-up animation loops are frame-budgeted instead of running unrestricted at 60fps on every device. React Query also keeps a bounded cache and avoids unnecessary focus refetches.

This is a performance guardrail, not a visual redesign.
