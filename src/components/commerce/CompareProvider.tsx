"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CompareProduct {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string;
  price: number;
  discountPrice?: number | null;
  version?: string | null;
  compatibility?: string | null;
  licenseType?: string | null;
  averageRating?: number;
  reviewCount?: number;
  fileSizeMb?: number | null;
}

const STORAGE_KEY = "khv-compare-v1";
const MAX_COMPARE = 4;

interface CompareContextValue {
  items: CompareProduct[];
  add: (product: CompareProduct) => { ok: boolean; message?: string };
  remove: (id: string) => CompareProduct | undefined;
  restore: (product: CompareProduct) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as CompareProduct[];
      if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_COMPARE));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((product: CompareProduct) => {
    let result: { ok: boolean; message?: string } = { ok: true };
    setItems((current) => {
      if (current.some((item) => item.id === product.id)) {
        result = { ok: false, message: "Sản phẩm đã nằm trong danh sách so sánh." };
        return current;
      }
      if (current.length >= MAX_COMPARE) {
        result = { ok: false, message: "Chỉ so sánh tối đa 4 sản phẩm." };
        return current;
      }
      return [...current, product];
    });
    return result;
  }, []);

  const remove = useCallback((id: string) => {
    let removed: CompareProduct | undefined;
    setItems((current) => {
      removed = current.find((item) => item.id === id);
      return current.filter((item) => item.id !== id);
    });
    return removed;
  }, []);

  const restore = useCallback((product: CompareProduct) => {
    setItems((current) => (current.some((item) => item.id === product.id) || current.length >= MAX_COMPARE ? current : [...current, product]));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const value = useMemo(() => ({ items, add, remove, restore, clear, has }), [items, add, remove, restore, clear, has]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
