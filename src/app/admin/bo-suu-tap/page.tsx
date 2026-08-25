"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { useAdminProducts } from "@/hooks/admin/useAdminProducts";
import { ApiError } from "@/lib/api-client";

interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFeatured: boolean;
  sortOrder: number;
  products: { productId: string }[];
  _count: { products: number };
}

export default function AdminCollectionsPage() {
  const qc = useQueryClient();
  const { show } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: () => api.get<{ collections: AdminCollection[] }>("/api/admin/collections")
  });
  const { data: productsData } = useAdminProducts();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: () => api.post("/api/admin/collections", { name, slug, description, productIds: selected, isFeatured: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "collections"] });
      setName("");
      setSlug("");
      setDescription("");
      setSelected([]);
      show("Đã tạo bộ sưu tập.", "success");
    },
    onError: (err) => show(err instanceof ApiError ? err.message : "Không thể tạo collection.", "error")
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/collections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "collections"] });
      show("Đã xóa bộ sưu tập.", "success");
    }
  });

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Bộ sưu tập</h1>
      <GlassPanel className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="mt-3">
          <Input label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="mt-4 max-h-48 overflow-y-auto rounded-2xl border border-white/10 p-3">
          {(productsData?.items ?? []).map((product) => (
            <label key={product.id} className="flex items-center gap-2 py-1 text-small text-white/70">
              <input
                type="checkbox"
                checked={selected.includes(product.id)}
                onChange={(e) => setSelected((current) => (e.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id)))}
              />
              {product.name}
            </label>
          ))}
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} isLoading={create.isPending}>Tạo collection</Button>
      </GlassPanel>

      {(data?.collections.length ?? 0) === 0 ? (
        <EmptyState title="Chưa có collection" description="Tạo bộ sưu tập theo use-case, khác với danh mục sản phẩm." />
      ) : (
        <div className="grid gap-3">
          {data?.collections.map((collection) => (
            <GlassPanel key={collection.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-small text-white">{collection.name}</p>
                <p className="text-caption text-white/40">/{collection.slug} · {collection._count.products} sản phẩm</p>
              </div>
              <Button variant="danger" onClick={() => remove.mutate(collection.id)}>Xóa</Button>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
