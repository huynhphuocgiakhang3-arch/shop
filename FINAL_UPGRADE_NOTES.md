# KhangHuynh Final

Final UI/UX pass focused on mobile-first interaction, admin task clarity, premium motion, and Vercel-safe deployment.

## Included
- Type / hold / erase / retype hero headline animation.
- Premium adaptive 3D Vault showcase with pointer parallax, orbit layers and reduced-motion support.
- Mobile-first public header with search row and drawer navigation.
- Mobile admin/user dashboard spacing, touch targets and overflow containment.
- Admin order editor for completed/refunded/cancelled orders with internal admin notes.
- Prisma migration for `Order.adminNote`. Run `npx prisma migrate deploy` against production before using the new note field.
- Node.js pinned to `22.x` in package.json for deterministic Vercel builds. Vercel supports 20.x, 22.x and 24.x; project settings can also override the runtime.
- `.env` is excluded from the archive. Recreate environment variables in Vercel instead of committing secrets.
- Reduced motion and mobile GPU-friendly transforms are retained.

## UX basis
The mobile redesign follows current ecommerce guidance: mobile is treated as a distinct experience, secondary navigation is collapsed, touch targets are kept generous, and checkout/navigation are simplified. Animation is kept to transforms/opacity where practical and the 3D layer scales down on small screens.
