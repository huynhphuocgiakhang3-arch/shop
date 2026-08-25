export interface RecentViewItem {
  slug: string;
  viewedAt: number;
}

const STORAGE_KEY = "khv-recent-products-v2";
const LEGACY_KEY = "khv-recent-products";
const MAX_ITEMS = 12;
const STALE_MS = 90 * 24 * 60 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined";
}

function readRaw(): RecentViewItem[] {
  if (!isBrowser()) return [];
  try {
    const next = localStorage.getItem(STORAGE_KEY);
    if (next) {
      const parsed = JSON.parse(next) as RecentViewItem[];
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && typeof item.slug === "string" && typeof item.viewedAt === "number");
      }
    }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]") as string[];
    if (Array.isArray(legacy)) {
      return legacy.filter((slug) => typeof slug === "string").map((slug, index) => ({
        slug,
        viewedAt: Date.now() - index
      }));
    }
  } catch {
    return [];
  }
  return [];
}

export function readRecentlyViewed(): RecentViewItem[] {
  const now = Date.now();
  const cleaned = readRaw()
    .filter((item) => now - item.viewedAt < STALE_MS)
    .filter((item, index, list) => list.findIndex((other) => other.slug === item.slug) === index)
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, MAX_ITEMS);
  return cleaned;
}

export function trackRecentlyViewed(slug: string) {
  if (!isBrowser() || !slug) return;
  const next = [{ slug, viewedAt: Date.now() }, ...readRecentlyViewed().filter((item) => item.slug !== slug)].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(next.map((item) => item.slug)));
  } catch {
    /* quota / private mode */
  }
}

export function recentlyViewedSlugs(limit = 8) {
  return readRecentlyViewed().slice(0, limit).map((item) => item.slug);
}
