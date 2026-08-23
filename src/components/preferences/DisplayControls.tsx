"use client";

import { useEffect, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export function DisplayControls({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { locale, setLocale } = useTranslation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("khv-theme");
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("theme-light", nextTheme === "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); localStorage.setItem("khv-theme", next);
    document.documentElement.classList.toggle("theme-light", next === "light");
  };
  const toggleLanguage = () => setLocale(locale === "vi" ? "en" : "vi");

  return <div className={`khv-display-controls flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[.025] p-1 backdrop-blur-xl ${compact ? "" : "shadow-[0_10px_30px_rgba(0,0,0,.16)]"}`} aria-label="Tùy chọn hiển thị">
    <button type="button" onClick={toggleTheme} className="khv-control-button flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Đổi giao diện sáng tối">{theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
    <button type="button" onClick={toggleLanguage} className="khv-language-button flex h-10 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Đổi ngôn ngữ"><Languages className="h-3.5 w-3.5"/>{locale === "vi" ? "VI" : "EN"}</button>
  </div>;
}
