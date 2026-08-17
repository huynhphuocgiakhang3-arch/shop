"use client";

import { useEffect, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";

export function DisplayControls({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<"vi" | "en">("vi");

  useEffect(() => {
    const savedTheme = localStorage.getItem("khv-theme");
    const savedLanguage = localStorage.getItem("khv-language");
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    const nextLanguage = savedLanguage === "en" ? "en" : "vi";
    setTheme(nextTheme); setLanguage(nextLanguage);
    document.documentElement.classList.toggle("theme-light", nextTheme === "light");
    document.documentElement.lang = nextLanguage;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); localStorage.setItem("khv-theme", next);
    document.documentElement.classList.toggle("theme-light", next === "light");
  };
  const toggleLanguage = () => {
    const next = language === "vi" ? "en" : "vi";
    setLanguage(next); localStorage.setItem("khv-language", next); document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("khv-language-change", { detail: next }));
  };

  return <div className={`khv-display-controls flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[.025] p-1 backdrop-blur-xl ${compact ? "" : "shadow-[0_10px_30px_rgba(0,0,0,.16)]"}`} aria-label="Tùy chọn hiển thị">
    <button type="button" onClick={toggleTheme} className="khv-control-button flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Đổi giao diện sáng tối">{theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
    <button type="button" onClick={toggleLanguage} className="khv-language-button flex h-10 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Đổi ngôn ngữ"><Languages className="h-3.5 w-3.5"/>{language === "vi" ? "VI" : "EN"}</button>
  </div>;
}
