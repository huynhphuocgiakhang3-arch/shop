# KhangHuynh Vault — TITAN Commerce Upgrade

Implemented on top of the previous TITAN UI build.

## Included
- Product cards now include a primary `Mua ngay` action that enters `/vault` and redirects to the authenticated Vault dashboard.
- Product cards use `File hỗ trợ` as the generic product category fallback.
- Product feature bullets are configurable by Super Admin (up to 8), stored in Prisma as `featureBullets`.
- New Prisma migration: `20260811000000_product_feature_bullets`.
- Category banner upload directly to Cloudinary via `/api/admin/categories/upload-banner`.
- Category modal rendered through a document-body portal to prevent stacking/half-black overlay issues.
- Super Admin coupon management page at `/admin/ma-giam-gia` with create, activate/deactivate, usage tracking and delete actions.
- Light/dark theme switcher with localStorage persistence.
- Vietnamese/English language preference switcher with persistent `html[lang]` state and shell controls.
- Display controls available in public header, dashboard header and admin sidebar.
- Premium light-theme overrides preserve the visual hierarchy rather than simply inverting colors.

## Verification note
The sandbox npm registry is configured with an invalid registry URL, so dependency installation/build could not be executed here. The source archive itself was checked for structural integrity after packaging.

## Final mobile + premium pass
- Responsive header redesigned for phone/tablet/desktop without shrinking desktop UX into a cramped mobile layout.
- Product cards enlarged and rebalanced; clear Buy now CTA, stronger hierarchy, support-file labeling, ratings/sales metadata and green trust ticks.
- FAQ redesigned into a two-column desktop presentation and compact mobile accordion.
- Admin modal viewport handling hardened so dialogs stay centered and scroll inside the dialog instead of visually cutting the page in half.
- Floating Music/Admin controls are explicitly fixed to the viewport and respect safe-area insets.
- Light theme receives a dedicated premium treatment instead of simply inverting dark colors.
- Vault showcase gets a stronger premium atmosphere.
- Chat keyword index expanded to ~49k realistic Vietnamese/English intent variants while keeping the source compact and generated at runtime.
- Chatbot intent coverage expanded for contact, FAQ, theme, language and Vault/showcase questions.

### Important
This archive intentionally does not include `node_modules` or `.next`. Keep `.env` for the existing deployment configuration. Run `npm install`, then `npx prisma generate`, `npx tsc --noEmit`, and `npm run build` in your own environment before deploying.
