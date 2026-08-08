"use client";

import { useEffect, useState } from "react";

export function TypingTagline({ text, startDelayMs = 900 }: { text: string; startDelayMs?: number }) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisibleChars(text.length);
      setDone(true);
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setVisibleChars((prev) => {
          if (prev >= text.length) {
            clearInterval(interval);
            setDone(true);
            return prev;
          }
          return prev + 1;
        });
      }, 38);
    }, startDelayMs);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, startDelayMs]);

  return (
    <p className="text-subtitle text-white/60">
      {text.slice(0, visibleChars)}
      {!done && <span className="ml-0.5 inline-block h-4 w-[2px] -translate-y-0.5 animate-pulse bg-accent-orange align-middle" />}
    </p>
  );
}
