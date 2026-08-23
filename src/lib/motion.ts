/**
 * The site's signature "premium" easing curve — a fast-out, gentle-settle
 * cubic-bezier that reads as considered rather than mechanical (the same
 * shape used throughout, e.g. macOS/iOS system animations). Previously
 * duplicated as a raw `[0.22, 1, 0.36, 1]` array in 11+ separate files;
 * consolidated here so the site's motion feel is tunable from one place
 * instead of requiring a find-and-replace across the codebase.
 *
 * Mirrors `theme.transitionTimingFunction.premium` in tailwind.config.ts
 * (`ease-premium`, for plain CSS transitions) — keep the two in sync if
 * this ever changes.
 */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/** Standard duration scale (seconds) for Framer Motion `transition.duration`. */
export const DURATION = {
  /** Button/link taps, toggles — anything that should feel instant. */
  fast: 0.18,
  /** Cards, panels, most hover/enter transitions. */
  base: 0.28,
  /** Modals, page-level reveals. */
  slow: 0.45
} as const;
