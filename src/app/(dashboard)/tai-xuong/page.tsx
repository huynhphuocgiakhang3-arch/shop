"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Search, HardDrive, PackageCheck, ArrowDownToLine, Pin, StickyNote, Tag, MoreHorizontal, Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { useDownloadHistory } from "@/hooks/useDownloads";
import { useUpdateVaultItem } from "@/hooks/useVaultItems";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { StatCard, EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/format";
import { EASE_PREMIUM } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ApiError } from "@/lib/api-client";
import type { DownloadItem } from "@/hooks/useDownloads";

type SortKey = "recent" | "updated" | "name" | "pinned";
type Section = "all" | "pinned" | "updated" | "notes";

const DENSITY_KEY = "khv-vault-density";

export default function DownloadsPage() {
  const { data, isLoading, isError, refetch } = useDownloadHistory();
  const updateVault = useUpdateVaultItem();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [section, setSection] = useState<Section>("all");
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    if (typeof window === "undefined") return "comfortable";
    return window.localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  });
  const [focusId, setFocusId] = useState<string | null>(null);
  const [active, setActive] = useState<DownloadItem | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => data?.items ?? [], [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? items.filter((d) => d.product.name.toLowerCase().includes(q) || (d.vault?.tags ?? []).some((tag) => tag.includes(q)))
      : [...items];
    if (section === "pinned") list = list.filter((d) => d.vault?.pinned);
    if (section === "notes") list = list.filter((d) => d.vault?.notes);
    if (section === "updated") {
      list = list.filter((d) => d.product.updatedAt && new Date(d.product.updatedAt).getTime() > new Date(d.createdAt).getTime());
    }
    list.sort((a, b) => {
      if (a.vault?.pinned && !b.vault?.pinned) return -1;
      if (!a.vault?.pinned && b.vault?.pinned) return 1;
      if (sort === "name") return a.product.name.localeCompare(b.product.name, "vi");
      if (sort === "updated") return new Date(b.product.updatedAt ?? 0).getTime() - new Date(a.product.updatedAt ?? 0).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [items, query, sort, section]);

  const focused = filtered.find((item) => item.id === focusId) ?? null;
  const totalDownloads = items.reduce((sum, d) => sum + d.downloadCount, 0);
  const totalStorage = items.reduce((sum, d) => sum + (d.product.fileSizeMb ?? 0), 0);

  const persistDensity = (value: "comfortable" | "compact") => {
    setDensity(value);
    localStorage.setItem(DENSITY_KEY, value);
  };

  const togglePin = (item: DownloadItem) => {
    const productId = item.product.id ?? item.productId;
    if (!productId) return;
    const next = !item.vault?.pinned;
    updateVault.mutate(
      { productId, pinned: next },
      {
        onSuccess: () =>
          show(next ? "Đã ghim lên đầu Vault." : "Đã bỏ ghim.", "success", {
            undoLabel: "Hoàn tác",
            onUndo: () => updateVault.mutate({ productId, pinned: !next })
          }),
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể cập nhật ghim.", "error")
      }
    );
  };

  if (isLoading) return <LoadingBlock />;
  if (isError) {
    return <EmptyState title="Không tải được Vault" description="Chúng tôi không thể tải tài sản của bạn lúc này." actionLabel="Thử lại" onAction={() => refetch()} />;
  }

  if (focused) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">Focus mode</p>
            <h1 className="text-h2 font-display text-white">{focused.product.name}</h1>
          </div>
          <Button variant="secondary" onClick={() => setFocusId(null)}><Minimize2 className="h-4 w-4" /> Thoát Focus</Button>
        </div>
        <GlassPanel className="p-6">
          <p className="text-small text-white/50">Phiên bản {focused.product.version}</p>
          {focused.product.releaseNotes ? <p className="mt-3 whitespace-pre-wrap text-small text-white/70">{focused.product.releaseNotes}</p> : <p className="mt-3 text-small text-white/40">Chưa có ghi chú phiên bản.</p>}
          {focused.product.licenseType ? <p className="mt-4 text-small text-white/60">Giấy phép: {focused.product.licenseType}</p> : null}
          <a href={`/api/downloads/${focused.token}`} target="_blank" rel="noreferrer" className="mt-6 inline-block">
            <Button><Download className="h-4 w-4" /> Tải xuống</Button>
          </a>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h2 font-display text-white">Vault của tôi</h1>
          <p className="mt-1 text-small text-white/50">Trung tâm quản lý tài sản số — ghim, ghi chú và tải lại khi bạn cần.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => persistDensity("comfortable")} className={cn("rounded-full px-3 py-1.5 text-caption", density === "comfortable" ? "bg-white/10 text-white" : "text-white/40")}>Rộng</button>
          <button type="button" onClick={() => persistDensity("compact")} className={cn("rounded-full px-3 py-1.5 text-caption", density === "compact" ? "bg-white/10 text-white" : "text-white/40")}>Gọn</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={PackageCheck} label="Sản phẩm sở hữu" value={String(items.length)} />
          <StatCard icon={ArrowDownToLine} label="Lượt tải" value={String(totalDownloads)} />
          <StatCard icon={HardDrive} label="Dung lượng ước tính" value={totalStorage > 0 ? `${totalStorage.toLocaleString("vi-VN")} MB` : "—"} />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="Vault đang trống" description="Sản phẩm bạn mua sẽ xuất hiện tại đây, sẵn sàng tải xuống bất cứ lúc nào." actionLabel="Khám phá sản phẩm" actionHref="/san-pham" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "Tài sản"],
              ["pinned", "Đã ghim"],
              ["updated", "Có bản cập nhật"],
              ["notes", "Có ghi chú"]
            ] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setSection(key)} className={cn("rounded-full px-3 py-1.5 text-caption", section === key ? "bg-accent-orange/15 text-accent-orange" : "bg-white/[.04] text-white/50")}>{label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong Vault..." className="w-full rounded-2xl border border-white/10 bg-white/[.03] py-2.5 pl-10 pr-4 text-small text-white outline-none focus:border-accent-orange/50" />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(["recent", "updated", "name"] as const).map((key) => (
                <button key={key} onClick={() => setSort(key)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-caption", sort === key ? "bg-white/10 text-white" : "text-white/40")}>
                  {key === "recent" ? "Mới thêm" : key === "updated" ? "Mới cập nhật" : "Tên"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Không tìm thấy tài sản" description="Thử từ khóa khác hoặc xem toàn bộ Vault." />
          ) : (
            <div className={cn("grid grid-cols-1 gap-4", density === "comfortable" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4")}>
              {filtered.map((d, index) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: EASE_PREMIUM }}>
                  <GlassPanel radius="md" className="group flex flex-col overflow-hidden p-0">
                    <Link href={`/san-pham/${d.product.slug}`} className={cn("relative block overflow-hidden bg-white/5", density === "compact" ? "aspect-[16/8]" : "aspect-[16/10]")}>
                      <SafeImage src={d.product.thumbnailUrl} alt={d.product.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white/80">v{d.product.version}</span>
                      {d.vault?.pinned ? <span className="absolute left-2.5 top-2.5 rounded-full bg-accent-orange px-2 py-1 text-[10px] font-bold text-black">PIN</span> : null}
                    </Link>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <Link href={`/san-pham/${d.product.slug}`} className="text-small font-medium text-white/85 hover:text-white line-clamp-1">{d.product.name}</Link>
                        <p className="mt-1 text-caption text-white/35">Mua {formatDateTime(d.createdAt)} · Đã tải {d.downloadCount} lần</p>
                        {d.vault?.tags?.length ? <p className="mt-1 text-[11px] text-accent-orange/80">{d.vault.tags.map((tag) => `#${tag}`).join(" ")}</p> : null}
                      </div>
                      <div className="mt-auto flex gap-2">
                        <a href={`/api/downloads/${d.token}`} target="_blank" rel="noreferrer" className="flex-1">
                          <Button variant="secondary" className="khv-touch-target w-full"><Download className="h-3.5 w-3.5" /> Tải</Button>
                        </a>
                        <button type="button" onClick={() => { setActive(d); setNoteDraft(d.vault?.notes ?? ""); setTagDraft(""); }} className="khv-touch-target flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white/60" aria-label="Thêm thao tác">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <BottomSheet open={Boolean(active)} title={active?.product.name ?? "Tài sản"} onClose={() => setActive(null)}>
        {active ? (
          <div className="grid gap-3 pb-4">
            <button type="button" onClick={() => togglePin(active)} className="khv-touch-target flex items-center gap-3 rounded-2xl border border-white/10 px-4 text-left text-small text-white/80">
              <Pin className="h-4 w-4" /> {active.vault?.pinned ? "Bỏ ghim" : "Ghim lên đầu"}
            </button>
            <button type="button" onClick={() => setFocusId(active.id)} className="khv-touch-target flex items-center gap-3 rounded-2xl border border-white/10 px-4 text-left text-small text-white/80">
              <Maximize2 className="h-4 w-4" /> Focus mode
            </button>
            <Link href={`/san-pham/${active.product.slug}`} className="khv-touch-target flex items-center gap-3 rounded-2xl border border-white/10 px-4 text-small text-white/80">Xem sản phẩm</Link>
            <Link href="/don-hang" className="khv-touch-target flex items-center gap-3 rounded-2xl border border-white/10 px-4 text-small text-white/80">Xem đơn hàng</Link>
            <Link href="/ho-tro" className="khv-touch-target flex items-center gap-3 rounded-2xl border border-white/10 px-4 text-small text-white/80">Liên hệ hỗ trợ</Link>
            {active.product.licenseType ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(active.product.licenseType ?? "");
                    setCopied(true);
                    show("Đã sao chép loại giấy phép.", "success");
                    setTimeout(() => setCopied(false), 1600);
                  } catch {
                    show("Không thể sao chép.", "error");
                  }
                }}
                className="khv-touch-target flex items-center gap-3 rounded-2xl border border-white/10 px-4 text-left text-small text-white/80"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Giấy phép: {active.product.licenseType}
              </button>
            ) : null}
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="mb-2 flex items-center gap-2 text-caption text-white/40"><StickyNote className="h-3.5 w-3.5" /> Ghi chú cá nhân</p>
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-small text-white" />
              <Button
                className="mt-3"
                isLoading={updateVault.isPending}
                onClick={() => {
                  const productId = active.product.id ?? active.productId;
                  if (!productId) return;
                  updateVault.mutate({ productId, notes: noteDraft }, { onSuccess: () => show("Đã lưu ghi chú.", "success") });
                }}
              >
                Lưu ghi chú
              </Button>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="mb-2 flex items-center gap-2 text-caption text-white/40"><Tag className="h-3.5 w-3.5" /> Tag cá nhân</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {(active.vault?.tags ?? []).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const productId = active.product.id ?? active.productId;
                      if (!productId) return;
                      const next = (active.vault?.tags ?? []).filter((item) => item !== tag);
                      updateVault.mutate(
                        { productId, tags: next },
                        {
                          onSuccess: () => show("Đã xóa tag.", "success", { undoLabel: "Hoàn tác", onUndo: () => updateVault.mutate({ productId, tags: [...next, tag] }) })
                        }
                      );
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="work, school..." className="flex-1 rounded-xl border border-white/10 bg-white/[.03] px-3 text-small text-white" />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const productId = active.product.id ?? active.productId;
                    const nextTag = tagDraft.replace(/^#/, "").trim().toLowerCase();
                    if (!productId || !nextTag) return;
                    updateVault.mutate({ productId, tags: Array.from(new Set([...(active.vault?.tags ?? []), nextTag])) }, { onSuccess: () => setTagDraft("") });
                  }}
                >
                  Thêm
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
