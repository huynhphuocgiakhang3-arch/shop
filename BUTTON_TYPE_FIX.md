# Button TypeScript Fix

Fixed `src/components/ui/Button.tsx` so the custom Button props no longer inherit React's DOM `onAnimationStart` handler, which conflicts with Framer Motion's `onAnimationStart` type on `motion.button`.

The Button keeps its existing hover/tap animations and visual effects.
