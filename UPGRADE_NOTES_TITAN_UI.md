# KhangHuynh Vault — TITAN UI Edition

This edition keeps the existing application architecture, APIs, Prisma schema, payment/deposit flows, chat, music and admin functionality intact while upgrading the visual system.

## UI/UX upgrades
- Premium dark luxury visual system with warm orange accent and subtle blue depth.
- Layered ambient gradients, fine grid texture, glass surfaces and depth shadows.
- More consistent focus, hover, press and disabled states.
- Premium buttons with light-sweep interaction and optional directional affordance.
- Refined logo treatment with glow and micro-interaction.
- Larger marketplace cards with stronger image hierarchy, benefit ticks, instant-delivery badge and detail-only CTA.
- Marketplace grid changed to 3 columns on wide screens for larger product cards.
- Refined responsive header, footer, hero and product section hierarchy.
- Fixed-position music/chat widgets remain attached to the viewport and retain the magnetic pointer response.
- Reduced-motion and high-contrast behavior retained.
- Mobile-first responsive adjustments and touch-friendly controls.

## Verification note
The source package does not contain node_modules. Run `npm install` in a normal development environment before verification.
Recommended commands:

```text
npm install
npx prisma generate
npx tsc --noEmit
npm run build
```

The existing `.env` file from the supplied source package is preserved in this archive as requested by the project owner.
