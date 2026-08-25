"use client";

import { usePathname } from "next/navigation";
import { FloatingWidgets } from "@/components/music/FloatingWidgets";
import { CompareBar } from "@/components/commerce/CompareBar";
import { CommandCenter } from "@/components/keyboard/CommandCenter";

const HIDDEN_PREFIXES = ["/admin", "/dang-nhap", "/dang-ky"];

export function SiteChrome() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return <CommandCenter />;
  return (
    <>
      <CommandCenter />
      <CompareBar />
      <FloatingWidgets />
    </>
  );
}
