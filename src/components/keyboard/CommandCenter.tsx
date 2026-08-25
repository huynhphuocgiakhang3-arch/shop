"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchCommandPalette } from "@/components/search/SearchCommandPalette";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function CommandCenter() {
  const router = useRouter();
  const [pendingG, setPendingG] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
          event.preventDefault();
          router.push("/tai-xuong");
        }
        return;
      }

      if (pendingG) {
        setPendingG(false);
        if (event.key.toLowerCase() === "h") {
          event.preventDefault();
          router.push("/");
        }
        if (event.key.toLowerCase() === "v") {
          event.preventDefault();
          router.push("/tai-xuong");
        }
        if (event.key.toLowerCase() === "p") {
          event.preventDefault();
          router.push("/san-pham");
        }
        if (event.key.toLowerCase() === "c") {
          event.preventDefault();
          router.push("/gio-hang");
        }
        if (event.key.toLowerCase() === "w") {
          event.preventDefault();
          router.push("/yeu-thich");
        }
        return;
      }

      if (event.key.toLowerCase() === "g") {
        setPendingG(true);
        window.setTimeout(() => setPendingG(false), 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingG, router]);

  return null;
}

export function HeaderSearch() {
  return <SearchCommandPalette />;
}
