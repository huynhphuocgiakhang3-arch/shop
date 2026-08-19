"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers3, Upload, Loader2 } from "lucide-react";
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useUploadCategoryBanner, type AdminCategory } from "@/hooks/admin/useAdminCategories";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";

const empty = { name: "", slug: "", icon: "", color: "", bannerUrl: "", order: 0 };

export default function AdminCategoriesPage() {
  const { data, isLoading } = useAdminCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const uploadBanner = useUploadCategoryBanner();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: AdminCategory) => { setEditing(c); setForm({ name: c.name, slug: c.slug, icon: c.icon ?? "", color: c.color ?? "", bannerUrl: c.bannerUrl ?? "", order: c.order }); setOpen(true); };

  const submit = () => {
    const name = form.name.trim();
    const slug = slugify(form.slug.trim() || name);
    if (!name || !slug) return show("Vui lòng nhập tên danh mục.", "error");
    const payload = { ...form, name, slug, order: Number(form.order) || 0 };
    const done = () => { show(editing ? "Đã cập nhật danh mục." : "Đã tạo danh mục.", "success"); setOpen(false); };
    const fail = (e: unknown) => show(e instanceof ApiError ? e.message : "Có lỗi xảy ra.", "error");
    if (editing) update.mutate({ id: editing.id, input: payload }, { onSuccess: done, onError: fail });
    else create.mutate(payload, { onSuccess: done, onError: fail });
  };

  const categories = data?.categories ?? [];
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-h2 font-display text-white">Quản lý danh mục</h1><p className="mt-1 text-small text-white/45">Tổ chức sản phẩm theo nhóm, thứ tự và nhận diện riêng.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tạo danh mục</Button>
      </div>
      {isLoading ? <LoadingBlock /> : categories.length === 0 ? <EmptyState title="Chưa có danh mục" description="Tạo danh mục đầu tiên để sắp xếp sản phẩm." /> : (
        <GlassPanel radius="md" className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-small"><thead><tr className="border-b border-white/10 text-caption text-white/40"><th className="px-5 py-3">Danh mục</th><th className="px-5 py-3">Slug</th><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Thứ tự</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
            <tbody>{categories.map((c) => <tr key={c.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-orange/10 text-accent-orange"><Layers3 className="h-4 w-4" /></span><div><p className="text-white/90">{c.name}</p><p className="text-caption text-white/35">{c.icon || "Không có icon"}</p></div></div></td><td className="px-5 py-4 text-white/45">{c.slug}</td><td className="px-5 py-4 text-white/65">{c._count.products}</td><td className="px-5 py-4 text-white/45">{c.order}</td><td className="px-5 py-4"><div className="flex justify-end gap-3"><button onClick={() => openEdit(c)} className="text-white/40 hover:text-white"><Pencil className="h-4 w-4" /></button><button onClick={() => setDeleteTarget(c)} className="text-white/40 hover:text-state-danger"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody>
          </table>
        </GlassPanel>
      )}
      <Modal open={open} title={editing ? "Sửa danh mục" : "Tạo danh mục"} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <Input label="Tên danh mục" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="vi-du-danh-muc" />
          <div className="grid grid-cols-2 gap-4"><Input label="Icon (tùy chọn)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} /><Input label="Màu (tùy chọn)" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} /></div>
          <div className="flex flex-col gap-2">
            <label className="text-small text-white/70">Banner danh mục</label>
            <div className="flex gap-2">
              <Input label="" value={form.bannerUrl} onChange={(e) => setForm((f) => ({ ...f, bannerUrl: e.target.value }))} placeholder="Dán URL hoặc tải ảnh trực tiếp" />
              <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[.04] px-4 text-small text-white/75 hover:bg-white/[.08]">
                {uploadBanner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Tải ảnh
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={uploadBanner.isPending} onChange={(e) => { const file=e.target.files?.[0]; if (!file) return; uploadBanner.mutate(file, { onSuccess: (res) => { setForm((f) => ({ ...f, bannerUrl: res.url })); show("Đã tải banner lên.", "success"); }, onError: (err) => show(err instanceof Error ? err.message : "Tải banner thất bại.", "error") }); }} />
              </label>
            </div>
            {form.bannerUrl && <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-black/20"><img src={form.bannerUrl} alt="Banner xem trước" className="h-full w-full object-cover" /><span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white/70 backdrop-blur">Xem trước banner</span></div>}
          </div>
          <Input label="Thứ tự" type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
          <Button onClick={submit} isLoading={create.isPending || update.isPending}>{editing ? "Lưu thay đổi" : "Tạo danh mục"}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa danh mục?" description={deleteTarget ? `Danh mục “${deleteTarget.name}” chỉ xóa được khi không còn sản phẩm.` : ""} confirmLabel="Xóa" isLoading={remove.isPending} onConfirm={() => { if (deleteTarget) remove.mutate(deleteTarget.id, { onSuccess: () => { show("Đã xóa danh mục.", "success"); setDeleteTarget(null); }, onError: (e) => show(e instanceof ApiError ? e.message : "Không thể xóa danh mục.", "error") }); }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
