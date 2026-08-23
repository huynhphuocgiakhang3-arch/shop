"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_PHRASES = [
  "Sản phẩm số.",
  "Đẳng cấp Vault.",
  "Tài sản của bạn.",
  "Trải nghiệm khác biệt.",
  "Mua một lần. Sở hữu lâu dài."
];

const TYPE_MS = 58;
const ERASE_MS = 26;
const HOLD_MS = 1750;
const PAUSE_MS = 420;

/**
 * Typing headline used by the hero. Runs a single timeout chain (no interval
 * storms), idles while the tab is hidden and renders a static first phrase
 * when the visitor prefers reduced motion.
 */
export function AnimatedHeadline({
  phrases = DEFAULT_PHRASES,
  className,
  textClassName,
  textStyle
}: {
  phrases?: string[];
  className?: string;
  /** Gradient/color classes MUST land here, on the element actually wrapping
   *  the visible text — not on an ancestor. `background-clip: text` only
   *  clips a background painted on the same box as the text; `color`
   *  inherits to children but `background` does not, so putting the
   *  gradient class one level too high (as the caller previously did)
   *  renders the text with `color: transparent` and nothing to clip
   *  against — invisible, not just low-contrast. This bit the hero's
   *  rotating headline in production. */
  textClassName?: string;
  textStyle?: React.CSSProperties;
}) {
  const cleaned = phrases.filter((line) => Boolean(line && line.trim()));
  const list = cleaned.length ? cleaned : DEFAULT_PHRASES;
  const key = list.join("|");
  const reduced = useReducedMotion();
  const [text, setText] = useState(list[0] ?? "");
  const [typing, setTyping] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const items = key.split("|");
    if (reduced) {
      setText(items[0] ?? "");
      return;
    }
    let cancelled = false;
    let phrase = 0;
    let index = 0;
    let erasing = false;
    setText("");

    const schedule = (fn: () => void, ms: number) => {
      timer.current = setTimeout(() => {
        if (cancelled) return;
        if (typeof document !== "undefined" && document.hidden) {
          schedule(fn, 400);
          return;
        }
        fn();
      }, ms);
    };

    const step = () => {
      const current = items[phrase % items.length] ?? "";
      if (!erasing) {
        index += 1;
        setText(current.slice(0, index));
        setTyping(true);
        if (index >= current.length) {
          erasing = true;
          schedule(step, HOLD_MS);
          return;
        }
        schedule(step, TYPE_MS + Math.random() * 34);
        return;
      }
      index -= 1;
      setText(current.slice(0, Math.max(index, 0)));
      setTyping(false);
      if (index <= 0) {
        erasing = false;
        phrase += 1;
        schedule(step, PAUSE_MS);
        return;
      }
      schedule(step, ERASE_MS);
    };

    schedule(step, 500);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reduced, key]);

  return (
    <span className={cn("relative inline-flex min-h-[2.15em] items-baseline", className)}>
      <span aria-live="polite" className={cn("[overflow-wrap:anywhere]", textClassName)} style={textStyle}>
        {text}
      </span>
      {!reduced && (
        <span
          aria-hidden
          className={cn(
            "khv-type-caret ml-1 inline-block h-[.72em] w-[3px] translate-y-[.04em] rounded-full",
            typing ? "bg-accent-orange" : "bg-accent-orange/70"
          )}
        />
      )}
    </span>
  );
}
