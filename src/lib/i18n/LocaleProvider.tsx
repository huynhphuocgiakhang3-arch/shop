"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionary, type Locale } from "./dictionary";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translates a Vietnamese source string. Falls back to the original string if no translation exists yet (safe for partially-migrated pages). */
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Real i18n: components explicitly call `t("Vietnamese text")` and React
 * re-renders with the translated string, instead of the previous approach
 * (`LanguageBridge`) which walked and mutated every text node in the DOM
 * after the fact with a `MutationObserver` watching the whole page.
 *
 * That mutation approach had three real costs this replaces:
 *  1. SEO/social previews always saw Vietnamese — crawlers and OG scrapers
 *     read the server-rendered HTML, which the DOM-mutation never touched.
 *  2. A visible flash of Vietnamese-then-English on every navigation.
 *  3. A `MutationObserver` on `document.body` re-scanning on every DOM
 *     change site-wide — measurable, needless render cost on every page,
 *     not just the ones that needed translating.
 *
 * Coverage today: global chrome (header, footer, product cards, common
 * actions) — the highest-visibility, most SEO-relevant surfaces. Pages not
 * yet migrated to `t()` simply stay in Vietnamese when English is selected
 * rather than silently breaking; extending coverage is additive (add a key
 * to dictionary.ts, wrap the string in `t()`) and never requires touching
 * this provider.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    const saved = localStorage.getItem("khv-language");
    setLocaleState(saved === "en" ? "en" : "vi");
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("khv-language", next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string) => {
      if (locale === "vi") return key;
      return (dictionary as Record<string, string>)[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
