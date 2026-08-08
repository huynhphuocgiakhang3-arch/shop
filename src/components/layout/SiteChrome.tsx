"use client";

import { usePathname } from "next/navigation";
import { FloatingWidgets } from "@/components/music/FloatingWidgets";

const HIDDEN_PREFIXES = ["/admin", "/dang-nhap", "/dang-ky"];

export function SiteChrome() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;
  return <FloatingWidgets />;
}
