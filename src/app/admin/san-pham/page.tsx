"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Archive, Copy, RotateCcw, Upload, ImagePlus, X } from "lucide-react";
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
import { uploadDirectToCloudinary } from "@/lib/client/cloudinary-upload";

const STATUS_TABS = [
  { value: undefined, label: "Tất cả" },
  { value: "PUBLISHED", label: "Đang bán" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ARCHIVED", label: "Đã lưu trữ" }
] as const;

const PRODUCT_DRAFT_KEY = "khv:admin:product-draft:v2";

const emptyForm: ProductFormInput = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  galleryUrls: [],
  featureBullets: ["Giao hàng số tức thì", "Kiểm duyệt & bảo mật", "Hỗ trợ khách hàng 24/7"],
  price: 0,
  categoryId: "",
  isFeatured: false,
  isVipOnly: false,
  status: "PUBLISHED",
  salesCount: 0,
  fileUrl: "",
  releaseNotes: "",
  version: "1.0.0",
  fileSizeMb: undefined,
  compatibility: ""
};

const normalizeSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

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
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormInput>(emptyForm);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // Persist the in-progress product locally so a refresh, accidental navigation,
  // or a transient deployment/auth interruption does not force the admin to
  // re-enter the whole form. Nothing is sent to the server until Submit.
  useEffect(() => {
    if (!modalOpen || editing) return;
    try {
      localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  }, [form, modalOpen, editing]);

  const clearProductDraft = () => {
    try {
      localStorage.removeItem(PRODUCT_DRAFT_KEY);
    } catch {
      // Ignore storage failures.
    }
  };

  const categories = (categoriesData?.categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);

  const openCreate = () => {
    setEditing(null);
    let restored: ProductFormInput | null = null;
    try {
      const raw = localStorage.getItem(PRODUCT_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProductFormInput>;
        if (typeof parsed.name === "string" || typeof parsed.slug === "string" || typeof parsed.description === "string") {
          restored = { ...emptyForm, ...parsed, galleryUrls: Array.isArray(parsed.galleryUrls) ? parsed.galleryUrls : [] };
        }
      }
    } catch {
      clearProductDraft();
    }
    setDraftRestored(Boolean(restored));
    setForm(restored ?? { ...emptyForm, galleryUrls: [] });
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
      galleryUrls: product.galleryUrls ?? [],
      featureBullets: product.featureBullets ?? [],
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      categoryId: product.categoryId,
      isFeatured: product.isFeatured,
      isVipOnly: product.isVipOnly,
      status: product.status,
      salesCount: product.salesCount ?? 0,
      fileUrl: product.fileUrl ?? "",
      releaseNotes: product.releaseNotes ?? "",
      version: product.version ?? "1.0.0",
      fileSizeMb: product.fileSizeMb ?? undefined,
      compatibility: product.compatibility ?? ""
    });
    setModalOpen(true);
  };

  const uploadProductImage = async (file: File) => {
    const result = await uploadDirectToCloudinary(file, "product-image");
    const res = await fetch("/api/admin/products/upload-image", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: result.url, publicId: result.publicId })
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
    if (!res.ok || !data.url) throw new Error(data.message ?? "Lưu ảnh thất bại.");
    return data.url;
  };

  const handleThumbnailUpload = async (file?: File) => {
    if (!file) return;
    try {
      show("Đang tải ảnh lên...", "success");
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, thumbnailUrl: url }));
      show("Đã tải ảnh sản phẩm lên.", "success");
    } catch (error) {
      show(error instanceof Error ? error.message : "Tải ảnh thất bại.", "error");
    }
  };

  const uploadProductFile = async (file: File) => {
    const result = await uploadDirectToCloudinary(file, "product-file");
    const res = await fetch("/api/admin/products/upload-file", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; sizeMb?: number; message?: string };
    if (!res.ok || !data.url) throw new Error(data.message ?? "Lưu tệp thất bại.");
    setForm(current => ({ ...current, fileUrl: data.url!, fileSizeMb: data.sizeMb ?? result.sizeMb ?? current.fileSizeMb }));
  };

  const handleProductFileUpload = async (file?: File) => {
    if (!file) return;
    try { show("Đang tải file sản phẩm lên...", "success"); await uploadProductFile(file); show("Đã tải file sản phẩm.", "success"); }
    catch (error) { show(error instanceof Error ? error.message : "Tải file thất bại.", "error"); }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8)) urls.push(await uploadProductImage(file));
      setForm((current) => ({ ...current, galleryUrls: [...(current.galleryUrls ?? []), ...urls] }));
      show(`Đã tải ${urls.length} ảnh bổ sung.`, "success");
    } catch (error) {
      show(error instanceof Error ? error.message : "Tải ảnh thất bại.", "error");
    }
  };

  const handleSubmit = () => {
    const normalizedSlug = normalizeSlug(form.slug);
    setForm((current) => ({ ...current, slug: normalizedSlug }));
    if (!form.name.trim() || !normalizedSlug) {
      show("Vui lòng nhập tên và slug sản phẩm.", "error");
      return;
    }

    const onSuccess = () => {
      show(editing ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm.", "success");
      if (!editing) clearProductDraft();
      setDraftRestored(false);
      setModalOpen(false);
      // Refresh the current RSC payload so any public catalog data changed by
      // this save is immediately reflected when the admin returns to the shop.
      router.refresh();
    };
    const onError = (err: unknown) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error");

    if (editing) {
      updateProduct.mutate({ id: editing.id, input: { ...form, slug: normalizedSlug, galleryUrls: form.galleryUrls ?? [] } }, { onSuccess, onError });
    } else {
      createProduct.mutate({ ...form, slug: normalizedSlug, galleryUrls: form.galleryUrls ?? [] }, { onSuccess, onError });
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

      <Modal open={modalOpen} title={editing ? "Sửa sản phẩm" : "Tạo sản phẩm"} onClose={() => { if (!editing) setDraftRestored(false); setModalOpen(false); }}>
        <div className="flex flex-col gap-4">
          {!editing && draftRestored && (
            <div className="flex items-center justify-between rounded-lg border border-accent-orange/20 bg-accent-orange/5 px-3 py-2 text-caption text-white/65">
              <span>Đã khôi phục bản nháp chưa lưu của bạn.</span>
              <button type="button" className="text-accent-orange hover:underline" onClick={() => { clearProductDraft(); setForm({ ...emptyForm, galleryUrls: [] }); setDraftRestored(false); }}>Xóa bản nháp</button>
            </div>
          )}
          <Input label="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((current) => ({ ...current, slug: normalizeSlug(e.target.value) }))}
            onBlur={() => setForm((current) => ({ ...current, slug: normalizeSlug(current.slug) }))}
            placeholder="vi-du-san-pham"
          />
          <p className="-mt-2 text-caption text-white/35">Chỉ dùng chữ thường, số và dấu gạch ngang. Hệ thống tự chuẩn hóa.</p>
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
          <div className="flex flex-col gap-3">
            <label className="text-small text-white/70">Ảnh sản phẩm</label>
            <div className="flex gap-3">
              <Input label="" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="Dán URL hoặc tải ảnh trực tiếp" />
              <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-small text-white/75 hover:bg-white/[0.08]">
                <Upload className="h-4 w-4" /> Tải ảnh
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleThumbnailUpload(e.target.files?.[0])} />
              </label>
            </div>
            {form.thumbnailUrl && (
              <div className="relative aspect-[16/7] overflow-hidden rounded-lg border border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.thumbnailUrl} alt="Xem trước" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-caption text-white/35">Có thể dùng URL Cloudinary hoặc tải ảnh trực tiếp.</span>
              <label className="flex cursor-pointer items-center gap-2 text-caption text-accent-orange hover:underline">
                <ImagePlus className="h-3.5 w-3.5" /> Thêm ảnh gallery
                <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
              </label>
            </div>
            {(form.galleryUrls?.length ?? 0) > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {(form.galleryUrls ?? []).map((url, index) => (
                  <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-md border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setForm((current) => ({ ...current, galleryUrls: (current.galleryUrls ?? []).filter((_, i) => i !== index) }))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white/80 hover:text-white"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <GlassPanel radius="sm" className="space-y-4 p-4">
            <div><p className="text-small font-semibold text-white">File sản phẩm</p><p className="mt-1 text-caption text-white/35">Upload ZIP/RAR/7Z/PDF hoặc dán URL file. Upload trực tiếp tối đa 25MB.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input label="URL file" value={form.fileUrl ?? ""} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." />
              <label className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-accent-orange/20 bg-accent-orange/5 px-4 text-small text-accent-orange hover:bg-accent-orange/10"><Upload className="h-4 w-4" /> Tải file<input type="file" className="hidden" onChange={e => handleProductFileUpload(e.target.files?.[0])} /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3"><Input label="Version" value={form.version ?? "1.0.0"} onChange={e => setForm({ ...form, version: e.target.value })} /><Input label="Dung lượng (MB)" type="number" min={1} value={form.fileSizeMb ?? ""} onChange={e => setForm({ ...form, fileSizeMb: e.target.value ? Number(e.target.value) : undefined })} /><Input label="Tương thích" value={form.compatibility ?? ""} onChange={e => setForm({ ...form, compatibility: e.target.value })} placeholder="Windows / macOS..." /></div>
            <div><label className="mb-2 block text-small text-white/70">Changelog / ghi chú phiên bản</label><textarea value={form.releaseNotes ?? ""} onChange={e => setForm({ ...form, releaseNotes: e.target.value })} rows={3} className="w-full rounded-md border border-white/10 bg-white/[.03] px-4 py-3 text-small text-white focus:border-accent-orange/70 focus:outline-none" /></div>
          </GlassPanel>

          <div>
            <label className="mb-2 block text-small text-white/70">Danh mục</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-bg-secondary px-4 py-3 text-white focus:border-accent-orange/70 focus:outline-none"
            >
              <option value="">-- Không chọn (tự vào Chưa phân loại) --</option>
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
            <label className="mb-2 block text-small text-white/70">Điểm nổi bật (tick xanh)</label>
            <div className="flex flex-col gap-2">
              {(form.featureBullets ?? []).map((bullet, index) => (
                <div key={`${index}-${bullet}`} className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-state-success/25 bg-state-success/10 text-state-success">✓</span>
                  <Input label="" value={bullet} onChange={(e) => setForm((current) => ({ ...current, featureBullets: (current.featureBullets ?? []).map((item, i) => i === index ? e.target.value : item) }))} placeholder="Điểm nổi bật của sản phẩm" />
                  <button type="button" onClick={() => setForm((current) => ({ ...current, featureBullets: (current.featureBullets ?? []).filter((_, i) => i !== index) }))} className="rounded-full border border-white/10 p-2 text-white/40 hover:border-state-danger/30 hover:text-state-danger" aria-label="Xóa điểm nổi bật"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {(form.featureBullets ?? []).length < 8 && (
                <button type="button" onClick={() => setForm((current) => ({ ...current, featureBullets: [...(current.featureBullets ?? []), ""] }))} className="self-start rounded-full border border-state-success/20 bg-state-success/5 px-3 py-1.5 text-caption text-state-success hover:bg-state-success/10">+ Thêm tick nổi bật</button>
              )}
            </div>
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

          <Input label="Số lượt mua hiển thị" type="number" min={0} value={form.salesCount ?? 0} onChange={(e) => setForm((current) => ({ ...current, salesCount: Math.max(0, Number(e.target.value) || 0) }))} />
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
