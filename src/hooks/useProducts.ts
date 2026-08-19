import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ProductCardData } from "@/components/home/ProductCard";

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ProductFilters {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
}

export function useProducts(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));

  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => api.get<Paginated<ProductCardData & { id: string }>>(`/api/products?${params.toString()}`)
  });
}

export interface ProductDetail extends ProductCardData {
  featureBullets?: string[];
  id: string;
  description: string;
  galleryUrls: string[];
  version: string;
  compatibility: string | null;
  fileSizeMb: number | null;
  releaseNotes: string | null;
  averageRating: number;
  category: { id: string; name: string; slug: string } | null;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    isVerified: boolean;
    createdAt: string;
    user: { displayName: string; avatarUrl: string | null };
    _count: { likes: number };
  }[];
}

export type ProductDetailResponse = { product: ProductDetail; related: ProductCardData[]; isFavorited: boolean; hasPurchased: boolean };

// `initialData` lets the server-rendered page hand off the exact payload it
// already fetched for SEO/metadata, so the client never re-fetches on first
// paint — no loading flash, no duplicate request. Subsequent client-side
// navigations (e.g. clicking a "related product" card) still fetch fresh.
export function useProduct(slug: string, initialData?: ProductDetailResponse) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<ProductDetailResponse>(`/api/products/${slug}`),
    enabled: Boolean(slug),
    initialData
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<{
        categories: {
          id: string;
          slug: string;
          name: string;
          _count: { products: number };
          children?: { id: string; slug: string; name: string; _count: { products: number } }[];
        }[];
      }>("/api/categories")
  });
}
