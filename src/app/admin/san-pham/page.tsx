"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Archive, Copy, RotateCcw } from "lucide-react";
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useArchiveProduct,
  useDuplicateProduct,
  useRestoreProduct,
  type AdminProduct,
  type ProductFormInput
} from "@/hooks/admin/useAdminProducts";
import { useCategories } from "@/hooks/useProducts";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: undefined, label: "Tất cả" },
  { value: "PUBLISHED", label: "Đang bán" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ARCHIVED", label: "Đã lưu trữ" }
] as const;

const emptyForm: ProductFormInput = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  price: 0,
  categoryId: "",
  isFeatured: false,
  isVipOnly: false,
  status: "PUBLISHED"
};

export default function AdminProductsPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAdminProducts(status);
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();
  const duplicateProduct = useDuplicateProduct();
  const restoreProduct = useRestoreProduct();
  const { show } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormInput>(emptyForm);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const categories = (categoriesData?.categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      thumbnailUrl: product.thumbnailUrl,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      categoryId: product.categoryId,
      isFeatured: product.isFeatured,
      isVipOnly: product.isVipOnly,
      status: product.status
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim() || !form.categoryId) {
      show("Vui lòng nhập tên, slug và chọn danh mục.", "error");
      return;
    }

    const onSuccess = () => {
      show(editing ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm.", "success");
      setModalOpen(false);
    };
    const onError = (err: unknown) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error");

    if (editing) {
      updateProduct.mutate({ id: editing.id, input: form }, { onSuccess, onError });
    } else {
      createProduct.mutate(form, { onSuccess, onError });
    }
  };

  const handleArchive = () => {
    if (!confirmArchiveId) return;
    archiveProduct.mutate(confirmArchiveId, {
      onSuccess: () => {
        show("Đã lưu trữ sản phẩm.", "success");
        setConfirmArchiveId(null);
      },
      onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-display text-white">Quản lý sản phẩm</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tạo sản phẩm
        </Button>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-pill border px-4 py-1.5 text-small transition-colors",
              status === tab.value ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có sản phẩm" description="Nhấn “Tạo sản phẩm” ở trên để thêm sản phẩm đầu tiên." />
      ) : (
        <GlassPanel radius="md" className="overflow-x-auto p-0">
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-white/10 text-caption text-white/40">
                <th className="px-5 py-3">Sản phẩm</th>
                <th className="px-5 py-3">Danh mục</th>
                <th className="px-5 py-3">Giá</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white/5">
                        <Image src={p.thumbnailUrl} alt={p.name} fill className="object-cover" />
                      </div>
                      <span className="text-white/85 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/50">{p.category?.name}</td>
                  <td className="px-5 py-3 text-white/70">{formatVnd(p.discountPrice ?? p.price)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-pill px-2.5 py-1 text-caption",
                        p.status === "PUBLISHED" && "bg-state-success/10 text-state-success",
                        p.status === "DRAFT" && "bg-state-warning/10 text-state-warning",
                        p.status === "ARCHIVED" && "bg-white/5 text-white/40"
                      )}
                    >
                      {p.status === "PUBLISHED" ? "Đang bán" : p.status === "DRAFT" ? "Bản nháp" : "Đã lưu trữ"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-white/40 hover:text-white" aria-label="Sửa">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => duplicateProduct.mutate(p.id, { onSuccess: () => show("Đã sao chép sản phẩm.", "success") })}
                        className="text-white/40 hover:text-white"
                        aria-label="Sao chép"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {p.status === "ARCHIVED" ? (
                        <button
                          onClick={() => restoreProduct.mutate(p.id, { onSuccess: () => show("Đã khôi phục sản phẩm.", "success") })}
                          className="text-white/40 hover:text-state-success"
                          aria-label="Khôi phục"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => setConfirmArchiveId(p.id)} className="text-white/40 hover:text-state-danger" aria-label="Lưu trữ">
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      <Modal open={modalOpen} title={editing ? "Sửa sản phẩm" : "Tạo sản phẩm"} onClose={() => setModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <Input label="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input
            label="Mô tả ngắn"
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />
          <div>
            <label className="mb-2 block text-small text-white/70">Mô tả chi tiết</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-white focus:border-accent-orange/70 focus:outline-none"
            />
          </div>
          <Input label="Ảnh đại diện (URL)" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} />

          <div>
            <label className="mb-2 block text-small text-white/70">Danh mục</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-bg-secondary px-4 py-3 text-white focus:border-accent-orange/70 focus:outline-none"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Giá (VND)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <Input
              label="Giá giảm (tùy chọn)"
              type="number"
              value={form.discountPrice ?? ""}
              onChange={(e) => setForm({ ...form, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          <div>
            <label className="mb-2 block text-small text-white/70">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProductFormInput["status"] })}
              className="w-full rounded-md border border-white/10 bg-bg-secondary px-4 py-3 text-white focus:border-accent-orange/70 focus:outline-none"
            >
              <option value="PUBLISHED">Đang bán</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-small text-white/60">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Nổi bật
            </label>
            <label className="flex items-center gap-2 text-small text-white/60">
              <input type="checkbox" checked={form.isVipOnly} onChange={(e) => setForm({ ...form, isVipOnly: e.target.checked })} />
              Chỉ dành cho VIP
            </label>
          </div>

          <Button onClick={handleSubmit} isLoading={createProduct.isPending || updateProduct.isPending}>
            {editing ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmArchiveId)}
        title="Lưu trữ sản phẩm?"
        description="Sản phẩm sẽ ngừng hiển thị trên marketplace. Bạn có thể khôi phục lại sau."
        confirmLabel="Lưu trữ"
        isLoading={archiveProduct.isPending}
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchiveId(null)}
      />
    </div>
  );
}
