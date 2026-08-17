"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Music2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import {
  useAdminMusic,
  useCreateMusicTrack,
  useUpdateMusicTrack,
  useDeleteMusicTrack,
  useReorderMusic,
  type AdminMusicTrack
} from "@/hooks/admin/useAdminMusic";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<AdminMusicTrack["source"], string> = {
  MP3: "MP3 URL",
  CLOUDINARY: "Cloudinary URL",
  YOUTUBE: "YouTube"
};

export default function AdminMusicPage() {
  const { data, isLoading } = useAdminMusic();
  const create = useCreateMusicTrack();
  const update = useUpdateMusicTrack();
  const del = useDeleteMusicTrack();
  const reorder = useReorderMusic();
  const { show } = useToast();

  const [form, setForm] = useState({ title: "", artist: "", source: "MP3" as AdminMusicTrack["source"], url: "" });
  const [confirmDelete, setConfirmDelete] = useState<AdminMusicTrack | null>(null);

  const tracks = data?.tracks ?? [];

  const handleAdd = async () => {
    if (!form.title || !form.url) {
      show("Vui lòng nhập tên bài hát và URL.", "error");
      return;
    }
    try {
      await create.mutateAsync({ title: form.title, artist: form.artist || undefined, source: form.source, url: form.url });
      show("Đã thêm bài hát vào playlist.", "success");
      setForm({ title: "", artist: "", source: "MP3", url: "" });
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error");
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tracks.length) return;
    const ids = tracks.map((t) => t.id);
    const a = ids[index];
    const b = ids[target];
    if (a === undefined || b === undefined) return;
    ids[index] = b;
    ids[target] = a;
    reorder.mutate(ids);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    del.mutate(confirmDelete.id, {
      onSuccess: () => {
        show(`Đã xóa "${confirmDelete.title}".`, "success");
        setConfirmDelete(null);
      }
    });
  };

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2 font-display text-white">Playlist nhạc nền</h1>
        <p className="mt-1 text-small text-white/50">Thêm bài hát từ MP3, Cloudinary hoặc YouTube. Người dùng nghe qua nút Music góc dưới phải.</p>
      </div>

      <GlassPanel radius="md" className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Tên bài hát" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Nghệ sĩ (tùy chọn)" value={form.artist} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} />
        </div>
        <div>
          <p className="mb-2 text-caption text-white/40">Nguồn</p>
          <div className="flex gap-2">
            {(Object.keys(SOURCE_LABEL) as AdminMusicTrack["source"][]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, source: s }))}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-caption",
                  form.source === s ? "bg-accent-orange text-black" : "glass-surface text-white/60"
                )}
              >
                {SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <Input
          label={form.source === "YOUTUBE" ? "URL hoặc mã video YouTube" : "URL file âm thanh"}
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder={form.source === "YOUTUBE" ? "https://youtube.com/watch?v=..." : "https://res.cloudinary.com/.../track.mp3"}
        />
        <Button onClick={handleAdd} isLoading={create.isPending} className="self-start">
          <Plus className="h-4 w-4" /> Thêm vào playlist
        </Button>
      </GlassPanel>

      {tracks.length === 0 ? (
        <EmptyState title="Playlist trống" description="Thêm bài hát đầu tiên ở trên." />
      ) : (
        <GlassPanel radius="md" className="p-2">
          <ul className="flex flex-col divide-y divide-white/5">
            {tracks.map((t, i) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="h-4 w-4 shrink-0 text-white/20" />
                <Music2 className="h-4 w-4 shrink-0 text-white/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium text-white/90">{t.title}</p>
                  <p className="truncate text-caption text-white/35">
                    {t.artist ? `${t.artist} · ` : ""}
                    {SOURCE_LABEL[t.source]}
                  </p>
                </div>
                <button
                  onClick={() => update.mutate({ id: t.id, input: { isActive: !t.isActive } })}
                  className={cn(
                    "rounded-pill px-3 py-1 text-caption",
                    t.isActive ? "bg-state-success/10 text-state-success" : "bg-white/[0.05] text-white/40"
                  )}
                >
                  {t.isActive ? "Đang bật" : "Đã tắt"}
                </button>
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="text-white/30 hover:text-white disabled:opacity-20">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button disabled={i === tracks.length - 1} onClick={() => move(i, 1)} className="text-white/30 hover:text-white disabled:opacity-20">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button onClick={() => setConfirmDelete(t)} className="text-white/30 hover:text-state-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xóa bài hát?"
        description={`"${confirmDelete?.title ?? ""}" sẽ bị xóa khỏi playlist.`}
        confirmLabel="Xóa"
        isLoading={del.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
