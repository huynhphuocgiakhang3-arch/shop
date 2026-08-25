import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ProductCardData } from "@/components/home/ProductCard";

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ProductFilters {
  q?: string;
  category?: string;
  collection?: string;
  sort?: string;
  page?: number;
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export function useProducts(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.featured) params.set("featured", "true");
  if (filters.bestseller) params.set("bestseller", "true");
  if (filters.isNew) params.set("new", "true");
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating != null) params.set("minRating", String(filters.minRating));

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
  licenseType?: string | null;
  licenseTerms?: string | null;
  previewVideoUrl?: string | null;
  tags?: string[];
  buyerCount?: number;
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

export interface ReviewResponse {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    isVerified: boolean;
    createdAt: string;
    user: { displayName: string; avatarUrl: string | null };
  };
}

export function useCreateReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; comment?: string }) => api.post<ReviewResponse>(`/api/products/${slug}/reviews`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product", slug] })
  });
}
