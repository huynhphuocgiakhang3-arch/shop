export type ThemePreference = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "khv-theme";

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "dark";
}

export function resolvedTheme(preference: ThemePreference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return preference;
}

export function applyTheme(preference: ThemePreference) {
  const next = resolvedTheme(preference);
  document.documentElement.classList.toggle("theme-light", next === "light");
  document.documentElement.dataset.theme = next;
  document.documentElement.dataset.themePreference = preference;
}

export function persistTheme(preference: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyTheme(preference);
}
