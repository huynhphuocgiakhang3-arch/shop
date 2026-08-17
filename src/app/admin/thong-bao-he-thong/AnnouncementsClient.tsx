"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { api } from "@/lib/api-client";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Announcement = { id: string; title: string; body: string; isActive: boolean; createdAt: string };
const blank = { title: "", body: "", isActive: true };

export function AnnouncementsClient() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ announcements: Announcement[] }>("/api/admin/announcements");
      setItems(data.announcements);
    } catch (e) {
      show(e instanceof Error ? e.message : "Không thể tải danh sách thông báo.", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return show("Vui lòng nhập tiêu đề và nội dung.", "error");
    setSaving(true);
    try {
      if (editing) await api.patch(`/api/admin/announcements/${editing}`, form);
      else await api.post("/api/admin/announcements", form);
      show(editing ? "Đã cập nhật thông báo." : "Đã tạo thông báo.", "success");
      setForm(blank);
      setEditing(null);
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Không thể lưu thông báo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: Announcement) => {
    setEditing(item.id);
    setForm({ title: item.title, body: item.body, isActive: item.isActive });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (item: Announcement) => {
    try {
      await api.patch(`/api/admin/announcements/${item.id}`, { isActive: !item.isActive });
      show(item.isActive ? "Đã ẩn thông báo." : "Đã hiện thông báo.", "success");
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Không thể cập nhật trạng thái.", "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa thông báo này? Hành động không thể hoàn tác.")) return;
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      show("Đã xóa thông báo.", "success");
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Không thể xóa thông báo.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Thông báo hệ thống</h1>
        <p className="mt-2 text-small text-white/45">
          Quản lý banner thông báo hiển thị cho toàn bộ khách truy cập trên trang chủ. Chỉ Super Admin có thể tạo, sửa hoặc xóa.
        </p>
      </div>

      <GlassPanel radius="md" className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title text-white">{editing ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</h2>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(blank);
              }}
              className="khv-touch-target text-caption text-white/45 hover:text-white"
            >
              Hủy sửa
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Tiêu đề thông báo" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div className="flex flex-col gap-2">
            <label htmlFor="announcement-body" className="text-small text-white/70">
              Nội dung thông báo
            </label>
            <textarea
              id="announcement-body"
              placeholder="Nội dung hiển thị trong banner..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-small text-white placeholder:text-white/30 focus:border-accent-orange/70 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-small text-white/60">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="khv-touch-target h-4 w-4 accent-accent-orange"
            />
            Hiển thị ngay sau khi lưu
          </label>
          <Button variant="primary" isLoading={saving} onClick={save} className="khv-touch-target w-fit">
            <Plus className="h-4 w-4" /> {editing ? "Cập nhật" : "Tạo thông báo"}
          </Button>
        </div>
      </GlassPanel>

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có thông báo nào" description="Tạo thông báo đầu tiên để hiển thị trên trang chủ." />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <GlassPanel key={item.id} radius="md" className="flex items-start gap-4 p-4">
              <div className={cn("mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", item.isActive ? "bg-accent-orange/10 text-accent-orange" : "bg-white/5 text-white/30")}>
                <Megaphone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-small font-semibold text-white">{item.title}</h3>
                  <span className={cn("rounded-pill px-2 py-0.5 text-[10px] font-medium", item.isActive ? "bg-accent-orange/10 text-accent-orange" : "bg-white/5 text-white/40")}>
                    {item.isActive ? "Đang hiện" : "Đã ẩn"}
                  </span>
                </div>
                <p className="mt-1 text-caption text-white/50">{item.body}</p>
                <p className="mt-2 text-caption text-white/25">{formatDateTime(item.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => toggleActive(item)} aria-label={item.isActive ? "Ẩn thông báo" : "Hiện thông báo"} className="khv-touch-target flex items-center justify-center text-white/40 hover:text-white">
                  {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => edit(item)} aria-label="Sửa thông báo" className="khv-touch-target flex items-center justify-center text-white/40 hover:text-white">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(item.id)} aria-label="Xóa thông báo" className="khv-touch-target flex items-center justify-center text-white/40 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
