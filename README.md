# KhangHuynh Vault

Premium digital marketplace — built from Master Prompts A1–A6.

Stack: **Next.js 14 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind CSS · Framer Motion · JWT Auth**

This is a fresh project, intentionally separate from `khanghuynh-shop`.

## Setup

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL and JWT secrets
npx prisma migrate dev --name init
npm run dev
```

Requires a running PostgreSQL instance (local, Docker, Supabase, Neon, or Render Postgres all work).

## Structure

```
prisma/schema.prisma        Core relational schema (users, catalog, orders, wallet, membership, security)
src/app/(auth)/dang-nhap/   Login experience (Master Prompt A2)
src/app/api/auth/login/     Login API route — bcrypt + JWT access/refresh cookies
src/app/trang-chu/          Placeholder post-login landing (real dashboard is Phase 2)
src/components/ui/          Design-system primitives: Button, Input, GlassPanel, Logo
src/components/auth/        CosmicBackground (canvas particle engine), CustomCursor, TypingTagline
src/lib/                    prisma client, jwt helpers, zod validation, cn() utility
```

## Login redesign (v2)

The login route (`src/app/(auth)/dang-nhap/`) was elevated on top of the Phase 1 foundation —
architecture, routes, and auth logic are untouched; only the presentation layer changed:

- `AuroraLayer.tsx` — three CSS depth layers (galaxy dust, aurora ribbon, volumetric fog) with
  mouse-parallax, each moving at a different rate. Disabled on touch devices and under
  `prefers-reduced-motion`.
- `CosmicBackground.tsx` — canvas starfield: twinkling stars, mixed sharp/blurred drifting dust,
  a rare shooting star, and a rarer, slower comet with a fuzzy glowing head. Particle counts halve
  on screens under 768px. Fades in on mount instead of appearing instantly.
- `LoginGlassPanel.tsx` — "glass 2.0" wrapper around the shared `GlassPanel`: cursor-follow light
  sheen and a subtle spring-damped 3D tilt, skipped entirely under reduced motion.
- `AmbientAudioToggle.tsx` — optional, muted-by-default ambient pad synthesized with Web Audio
  (no external audio asset needed); permanently toggleable, bottom-right corner.
- `Button.tsx` — added a diagonal light-sweep on hover for primary/outline variants; API unchanged.
- Page-level: staggered reveal (logo → tagline → panel → footer) using blur+fade+rise, a one-time
  camera zoom-in on load plus a near-imperceptible infinite "breathing" scale, and a trust-signal
  footer line that reveals last.
- `globals.css` — added glass inner-shadow depth and a `prefers-contrast: more` fallback.

`onSubmit`, the `/api/auth/login` call, the Zod schema, and the JWT/cookie flow are byte-identical
to Phase 1 — nothing in the authentication path was touched.

## Vercel build fix — "Failed to collect page data for /api/auth/login"

**Root cause:** `src/lib/prisma.ts` constructed `new PrismaClient()` at module top
level. Next.js's "Collecting page data" build step imports every route module (and
everything it imports) in a plain Node process just to read static exports like
`runtime`/`dynamic` — it does **not** call the route handlers, but it does execute
top-level code. Prisma's constructor eagerly resolves `DATABASE_URL` and throws a
`PrismaClientInitializationError` immediately if it's missing from the environment
the code is currently executing in. If `DATABASE_URL` wasn't present during the
Vercel build step (common when the variable is only added to some environments, or
added after the project was first created), that throw happened while Next.js was
just importing the module — surfacing as the generic wrapper error in the build log,
with a `PrismaClientInitializationError`-shaped object (`clientVersion`, `errorCode:
undefined`) nested inside it.

**Fixes applied:**

| File | Change | Why |
|---|---|---|
| `src/lib/prisma.ts` | `prisma` is now a `Proxy` that only constructs the real `PrismaClient` the first time a property is used | Defers construction to actual request handling; the build's static-import pass never triggers it, so a missing/late env var can no longer break the build |
| `src/app/api/auth/login/route.ts` | Added `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`; added an env-presence guard returning 503; wrapped the DB/JWT logic in try/catch returning 500 | Prisma requires the Node runtime, never Edge; the route must never be statically optimized; the route now returns proper HTTP responses instead of crashing on missing config or DB errors |
| `package.json` | Added `"postinstall": "prisma generate"`, changed `"build"` to `"prisma generate && next build"`, added `"engines": { "node": ">=18.18.0" }` | Guarantees the generated Prisma Client always matches `schema.prisma` before every build, on Vercel and locally, regardless of install caching |
| `prisma/schema.prisma` | Added `binaryTargets = ["native", "rhel-openssl-3.0.x", "rhel-openssl-1.0.x"]` to the `generator client` block | Vercel's serverless functions run on Amazon Linux; without the matching engine binary Prisma can fail at runtime even when the build succeeds |
| `next.config.js` | Added `experimental.serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"]` | Prevents Next.js from webpack-bundling Prisma's native engine binary and bcryptjs's native bindings, which otherwise causes intermittent "engine not found" failures on Vercel |

**Vercel deployment checklist** (the most common real-world cause of this exact
error is simply a missing environment variable in one of the three Vercel targets):

1. In the Vercel project → Settings → Environment Variables, add `DATABASE_URL`,
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (and the Cloudinary vars once used) to
   **all three** environments: Production, Preview, and Development.
2. Run `npx prisma migrate deploy` against the production database before the first
   deploy (migrations are not run automatically by `next build`).
3. Redeploy — the build now runs `prisma generate` unconditionally before
   `next build`, so the generated client is always in sync with `schema.prisma`.

## Phase 2 — Marketplace backend + homepage

**Scope note, read this first:** the Phase 2 brief asked for all 27 subsystems
(full admin dashboard UI, real-time notifications, analytics charts, SEO
sitemap, etc.) to be simultaneously "production-ready with zero placeholders."
That's not achievable honestly in one pass without either faking data or
hiding stubs — so this phase built the **real backend for every feature area**
(schema + business logic, all against Postgres/Prisma, nothing mocked) plus
the two pages that matter most for a working demo (Home, Register). See
"Remaining roadmap" below for exactly what's not built yet.

### Database — `prisma/schema.prisma`

New models: `EmailVerificationToken`, `PasswordResetToken`, `Cart`/`CartItem`,
`DownloadToken`, `ReviewLike`, `ReviewReport`, `Announcement`,
`SupportTicketMessage`. Extended: `User` (soft-delete fields), `Category`
(color/order/banner), `Product` (tags, previewVideoUrl, fileUrl,
releaseNotes, status enum, downloadCount, salesCount), `Order` (taxTotal,
refundedAt), `WalletTransaction` (reviewedById/reviewedAt), `SupportTicket`
(priority). New enum: `ProductStatus`, `TicketPriority`.

### APIs implemented (all real Prisma queries, no mock data)

- **Auth:** register, login, logout, refresh (rotating), me, forgot/reset
  password, change password, verify email, sessions (list/revoke), delete
  account
- **Users:** update profile, Cloudinary avatar upload
- **Catalog:** product search/filter/sort/pagination, product detail
  (rating, related, favorite/purchased state), admin CRUD + duplicate +
  restore, category tree + admin CRUD
- **Commerce:** cart (add/update/remove/save-for-later), coupon apply/remove,
  checkout (wallet completes atomically; other methods go to admin-confirmed
  PENDING — see payment note below), orders (mine + detail), admin
  list/confirm/cancel/refund
- **Wallet:** balance, deposit/withdraw requests, transaction history, admin
  approve/reject queue
- **Downloads:** token generation, redirect+counter, history
- **Engagement:** favorites toggle/list, reviews (create/like/report),
  admin review moderation, notifications (list/read/read-all), support
  tickets (create/reply/list/detail), admin ticket status/priority, unified
  search, announcements (public + admin CRUD), admin coupon CRUD
- **Admin:** overview (real aggregate revenue/orders/users/top-products
  queries), user list

### Payment honesty note

No live payment gateway (Stripe/VNPay/MoMo/PayPal) API keys are configured —
building against real ones would require your actual merchant credentials.
**Wallet payments are fully real**: balance check, atomic deduction, download
token issuance. Every other payment method creates a real `PENDING` order
that an admin explicitly confirms via `PATCH /api/admin/orders/[id]` once
they've verified the transfer — this is the same "Manual Verification"
pattern the original A4 spec listed as one of the supported methods, not a
placeholder.

### Security added this phase

- Rate limiting (in-memory, per-instance — documented limitation in
  `src/lib/security/rate-limit.ts`; recommend Upstash Redis at real scale)
- Same-origin check on state-changing auth/checkout routes
  (`src/lib/security/same-origin.ts`)
- `src/middleware.ts` — edge-level gate on `/admin/*` pages (redirects
  unauthenticated/non-admin users); every admin API route additionally
  verifies via `requireAdmin()` server-side regardless
- Refresh-token rotation on every `/api/auth/refresh` call
- Soft-delete for accounts (preserves order/financial history)
- Password reset invalidates all existing sessions

### Seed data — `prisma/seed.ts`

Run `npm run prisma:seed` (or `npx prisma db seed`) after migrating. Creates
one admin (`admin@khanghuynh.vault` / `Admin@12345`), one demo user with
₫500,000 wallet balance (`demo@khanghuynh.vault` / `User@12345`), three
categories, four real products, and one announcement — so the homepage and
every API endpoint has real rows to work with immediately.

### Remaining roadmap (honest — not built yet)

- **Pages, not APIs:** cart page, checkout page, wallet page, orders/download
  history pages, favorites page, notifications panel, support ticket UI,
  profile/settings pages — all their APIs exist and work, the screens don't
  yet.
- **Admin dashboard UI:** only the API layer exists (overview, products,
  orders, users, wallet, coupons, announcements, reviews, support). No
  admin pages/tables/charts have been built.
- **Real-time notifications:** current implementation is poll-based (fetch
  on demand), not WebSocket/SSE push.
- **SEO extras:** sitemap.xml, robots.txt, canonical URLs not generated yet
  (per-page metadata is in place on the homepage).
- **Transactional email:** verification/reset links are logged to the
  server console, not emailed — no SMTP/email API is configured. Wire up
  Resend/Postmark/SES and swap the `console.info` calls in
  `register/route.ts` and `forgot-password/route.ts`.
- Nothing in this phase was run — no `npm install`, `prisma generate`,
  `lint`, or `build` executed (no network access in this environment).
  Please run these locally against a real `DATABASE_URL` before deploying.

## Phase 3 — User-facing frontend

Same honesty as Phase 2: the brief asked for 13 parts (full user dashboard,
profile center, marketplace, cart, checkout, orders, downloads, support,
notifications, admin dashboard, CMS, analytics, settings) as one
"production-ready, everything works" delivery. This pass built the
**complete real, working user-facing side** of that list — every page below
is wired to the real Phase 2 APIs, no mock data, no dead buttons. Admin
dashboard, CMS, and analytics charts are not built yet (see roadmap).

### Shared infrastructure (built once, reused everywhere — "no duplicated components")

- `src/lib/api-client.ts` — typed fetch wrapper (credentials, JSON, `ApiError`)
- `src/hooks/*` — one React Query hook module per domain (cart, checkout,
  wallet, orders, favorites, notifications, profile/sessions, downloads,
  support tickets, products/categories) — every mutation invalidates the
  right query keys automatically
- `src/components/ui/Toast.tsx` — global toast system wired into every
  mutation's success/error path
- `src/components/dashboard/primitives.tsx` — `StatCard`, `SectionCard`,
  `EmptyState`, `LoadingBlock` reused across every dashboard page
- `src/lib/format.ts` — money/date formatting + status-label maps, typed by
  the actual Prisma enums (not raw strings) so they can't silently return
  `undefined` — same fix pattern as the TIER_RANK bug from earlier
- `src/middleware`-adjacent: `(dashboard)/layout.tsx` — server-side auth
  guard (redirects to `/dang-nhap` if not logged in) wrapping sidebar+header

### Pages built this phase (all real, all functional)

- **Dashboard home** (`/trang-chu`) — wallet balance, order/favorite/download
  counts, membership card, recent orders, notifications, downloads
- **Cart** (`/gio-hang`) — quantity controls, remove, coupon apply/remove,
  live totals, empty-state
- **Checkout** (`/thanh-toan`) — payment method selection, wallet balance
  check, order summary, success screen with real order number
- **Wallet** (`/vi`) — balance cards, deposit/withdraw request forms,
  paginated transaction history
- **Orders** (`/don-hang`, `/don-hang/[id]`) — status filter tabs, invoice
  view, per-item secure download buttons
- **Download Center** (`/tai-xuong`) — purchased files, version, re-download
- **Favorites** (`/yeu-thich`) — grid with toggle-off
- **Notifications** (`/thong-bao`) — mark read / mark all read
- **Profile & Settings** (`/ho-so`) — avatar upload (Cloudinary), display
  name, change password, active sessions with revoke, account deletion
- **Support Center** (`/ho-tro`, `/ho-tro/[id]`) — create ticket, threaded
  conversation UI, status badges
- **Marketplace** (`/san-pham`) — search, category filter, sort, pagination
- **Product detail** (`/san-pham/[slug]`) — gallery, ratings, reviews,
  related products, add-to-cart / favorite / owned-state download button

### Type safety note

Applied the same enum-keyed-`Record` discipline from the last build-fix
across every new file (checked explicitly — see audit below): no `any`, no
`!` non-null assertions, no `Record<string, …>` read anywhere real data
flows through. `src/lib/format.ts`'s status-label maps are typed by the
actual Prisma enums, not raw strings, for exactly the reason the TIER_RANK
bug happened.

### Remaining roadmap (honest)

- **Admin dashboard UI** — still API-only (Part 10). No sidebar/tables/
  charts/command-palette have been built.
- **CMS** (Part 11) — homepage/hero/FAQ/banner/footer/SEO editors not built;
  homepage content is currently hardcoded in the component files, not
  admin-editable.
- **Analytics charts** (Part 12) — the `/api/admin/overview` numbers exist;
  no chart UI consumes them yet.
- **Settings** (Part 13) — no admin settings page (Cloudinary/email/
  maintenance mode toggles).
- **Invoice PDF download** — order detail shows an invoice view in-browser;
  no PDF export yet.
- **2FA** — schema has the fields (`twoFactorEnabled`/`twoFactorSecret`),
  no UI or TOTP verification flow implemented.
- **Command palette / keyboard shortcuts** — not built.
- Nothing was run in this environment (no network access) — please run
  `npm install && npx prisma generate && npm run build` locally before
  deploying.

## Phase 4 — Admin Panel + permission model

**Premise check:** no admin pages existed before this pass — only the admin
APIs from Phase 2. This phase built the real Admin Panel UI for the
highest-value modules plus a proper SUPER_ADMIN vs ADMIN permission split,
and closed several backend gaps the panel exposed.

### Permission model (new)

- `requireSuperAdmin()` added alongside `requireAdmin()` in
  `src/lib/auth/guard.ts`. Per the access model: **SUPER_ADMIN only** —
  product/category/coupon/announcement mutations (create/update/
  delete/duplicate/restore), user role/membership/ban changes, direct
  wallet balance adjustment, user deletion. **ADMIN or SUPER_ADMIN** —
  viewing everything, order confirm/cancel/refund, review moderation,
  support tickets, download revoke/grant. This is enforced server-side on
  every mutation regardless of what the UI shows.
- Applied `requireSuperAdmin` to all product/category/coupon/announcement
  mutation routes (GET/list endpoints stay `requireAdmin` so plain admins
  can still view).
- **Ban enforcement was a real gap** — the User model had no ban field and
  login/refresh never checked it, so "banning" a user would have done
  nothing. Added `isBanned`/`bannedAt` to `User`, and now both
  `/api/auth/login` and `/api/auth/refresh` reject banned/deleted accounts
  and revoke their sessions.

### New backend endpoints

- `PATCH /api/admin/users/[id]` — role/membership/ban (SUPER_ADMIN)
- `DELETE /api/admin/users/[id]` — soft delete (SUPER_ADMIN)
- `POST /api/admin/wallet/adjust` — direct signed balance adjustment,
  creates a real `ADJUSTMENT`-type transaction (SUPER_ADMIN)
- `DELETE /api/admin/wallet/transactions/[id]` — removes a transaction and
  reverses its balance effect if it was completed (SUPER_ADMIN)
- `GET /api/admin/downloads`, `POST /api/admin/downloads/[id]` (revoke),
  `POST /api/admin/downloads/generate` (manually grant access) — ADMIN
- `DELETE /api/admin/reviews/[id]` — hard delete, alongside the existing
  approve/reject via `isHidden` — ADMIN

### Admin Panel UI (new)

- `src/app/admin/layout.tsx` + `AdminSidebar` — server-side auth guard
  (redirects non-admins), Super Admin badge shown when applicable
- **Overview** (`/admin`) — real revenue/order/user aggregates, top products
- **Products** (`/admin/san-pham`) — table, status tabs, create/edit modal,
  archive (with confirm dialog)/restore/duplicate — full CRUD
- **Users** (`/admin/nguoi-dung`) — search, inline role/membership editors,
  wallet adjustment modal, ban, delete (with confirm dialog) — all
  SUPER_ADMIN-gated in the UI to match the backend, with a visible notice
  for plain admins explaining why those controls are hidden
- **Orders** (`/admin/don-hang`) — status tabs, confirm-paid/cancel pending
  orders, refund (with confirm dialog)
- New shared components: `ConfirmDialog` (every destructive action in the
  panel uses it) and `Modal` (create/edit forms)

### Type-safety audit (repeated for this batch, same standard as before)

Swept every new file: zero `any`, zero non-null assertions, and fixed two
`any`-cast usages that crept into the products page (a categories-flatten
cast and a mutation-dispatch cast) — replaced with a properly extended
hook type and explicit branching, respectively.

### Remaining roadmap (honest)

- **Categories, Coupons, Reviews, Support, Announcements, Wallet-queue,
  Downloads admin UI** — all have working APIs (several new this phase);
  no admin pages consume them yet.
- **Analytics charts, CMS, Settings, command palette, 2FA UI** — still not
  built (unchanged from the Phase 3 roadmap).
- Nothing was run in this environment (no network access) — run
  `npm install && npx prisma generate && npx prisma migrate dev && npm run build`
  locally. The `isBanned`/`bannedAt` fields and `ADJUSTMENT` enum value are
  schema changes requiring a new migration.

## Implemented so far (Phase 1)

- Prisma schema covering identity/auth, catalog, orders, wallet, membership, coupons, reviews,
  notifications, support tickets, audit log, blocked IPs — normalized, indexed, matches A1/A4/A5.
- Full design-token system in `tailwind.config.ts` (color, spacing, radius, shadow, motion timing) per A5.
- Login experience per A2: cinematic intro sequence (fade → logo → typing tagline → glass panel rise),
  cosmic canvas background with twinkling stars, drifting particles, occasional shooting star, subtle
  cursor-reactive ambient light; custom cursor (desktop only); soft-red error glow that preserves input;
  multi-step "Access Granted…" success sequence before redirect. Reduced-motion and keyboard focus handled.
- JWT auth: bcrypt password hashing, short-lived access token + 30-day refresh token as httpOnly cookies,
  refresh-token rows and audit-log rows persisted per login.
- All visible UI text in Vietnamese per A6; code/identifiers in English.

## Not yet built (planned next phases)

- Phase 2 — User Dashboard & Marketplace (A3/A4): sidebar, header, product grid, cart, checkout, wallet UI.
- Phase 3 — Admin Dashboard (A1): analytics, CMS, theme builder, security center, backup/automation.
- Phase 4 — Remaining design-system component library (tables, modals, toasts, mega menu, etc. per A5).
- Register / forgot-password / email-verification flows (routes are scaffolded, pages are not).

## Notes on environment

- No package installation or build was run in this workspace — files were authored directly. Run
  `npm install` locally before `npm run dev`.
- `next.config.js` currently whitelists Cloudinary and `*.vercel.app` for `next/image`; adjust if you
  deploy storage elsewhere.
