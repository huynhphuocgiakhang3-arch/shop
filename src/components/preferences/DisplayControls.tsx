"use client";

import { useEffect, useState } from "react";
import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { applyTheme, persistTheme, readThemePreference, type ThemePreference } from "@/lib/theme";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "Tối", icon: Moon },
  { value: "light", label: "Sáng", icon: Sun },
  { value: "system", label: "Hệ thống", icon: Monitor }
];

export function DisplayControls({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemePreference>("dark");
  const { locale, setLocale } = useTranslation();

  useEffect(() => {
    const next = readThemePreference();
    setTheme(next);
    applyTheme(next);
    if (next !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const cycleTheme = () => {
    const order: ThemePreference[] = ["dark", "light", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length] ?? "dark";
    setTheme(next);
    persistTheme(next);
  };

  const Icon = THEMES.find((item) => item.value === theme)?.icon ?? Moon;
  const label = THEMES.find((item) => item.value === theme)?.label ?? "Tối";

  return (
    <div className={`khv-display-controls flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[.025] p-1 backdrop-blur-xl ${compact ? "" : "shadow-[0_10px_30px_rgba(0,0,0,.16)]"}`} aria-label="Tùy chọn hiển thị">
      <button
        type="button"
        onClick={cycleTheme}
        className="khv-control-button flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2 text-white/55 transition hover:bg-white/10 hover:text-white"
        aria-label={`Giao diện hiện tại: ${label}. Đổi dark / light / system`}
        title={`Giao diện: ${label}`}
      >
        <Icon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
        className="khv-language-button flex h-10 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/55 transition hover:bg-white/10 hover:text-white"
        aria-label="Đổi ngôn ngữ"
      >
        <Languages className="h-3.5 w-3.5" />
        {locale === "vi" ? "VI" : "EN"}
      </button>
    </div>
  );
}
