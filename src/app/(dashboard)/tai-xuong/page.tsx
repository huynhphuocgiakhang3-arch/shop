"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Search, HardDrive, PackageCheck, ArrowDownToLine, SlidersHorizontal } from "lucide-react";
import { useDownloadHistory } from "@/hooks/useDownloads";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { StatCard, EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { formatDateTime } from "@/lib/format";
import { EASE_PREMIUM } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "oldest" | "name" | "popular";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Mới kích hoạt" },
  { key: "oldest", label: "Cũ nhất" },
  { key: "name", label: "Tên A-Z" },
  { key: "popular", label: "Tải nhiều nhất" }
];

export default function DownloadsPage() {
  const { data, isLoading } = useDownloadHistory();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const items = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? items.filter((d) => d.product.name.toLowerCase().includes(q)) : [...items];
    switch (sort) {
      case "oldest":
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "name":
        return list.sort((a, b) => a.product.name.localeCompare(b.product.name, "vi"));
      case "popular":
        return list.sort((a, b) => b.downloadCount - a.downloadCount);
      case "recent":
      default:
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [items, query, sort]);

  const totalDownloads = items.reduce((sum, d) => sum + d.downloadCount, 0);
  const totalStorage = items.reduce((sum, d) => sum + (d.product.fileSizeMb ?? 0), 0);

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Vault của tôi</h1>
        <p className="mt-1 text-small text-white/50">Toàn bộ sản phẩm bạn sở hữu, sẵn sàng tải lại bất cứ lúc nào.</p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={PackageCheck} label="Sản phẩm sở hữu" value={String(items.length)} />
          <StatCard icon={ArrowDownToLine} label="Lượt tải" value={String(totalDownloads)} />
          <StatCard icon={HardDrive} label="Dung lượng ước tính" value={totalStorage > 0 ? `${totalStorage.toLocaleString("vi-VN")} MB` : "—"} />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Chưa có tệp nào để tải"
          description="Sản phẩm bạn mua sẽ xuất hiện tại đây, sẵn sàng tải xuống bất cứ lúc nào."
          actionLabel="Khám phá sản phẩm"
          actionHref="/san-pham"
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm trong Vault của bạn..."
                className="w-full rounded-2xl border border-white/10 bg-white/[.03] py-2.5 pl-10 pr-4 text-small text-white outline-none focus:border-accent-orange/50"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-white/30" />
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-caption font-medium transition-colors",
                    sort === s.key ? "bg-accent-orange/15 text-accent-orange" : "bg-white/[.04] text-white/50 hover:bg-white/[.08]"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Không tìm thấy sản phẩm" description={`Không có kết quả nào khớp với "${query}".`} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d, index) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: EASE_PREMIUM }}
                >
                <GlassPanel radius="md" className="group flex flex-col gap-3 overflow-hidden p-0">
                  <Link href={`/san-pham/${d.product.slug}`} className="relative block aspect-[16/10] w-full overflow-hidden bg-white/5">
                    <Image
                      src={d.product.thumbnailUrl}
                      alt={d.product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute right-2.5 top-2.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-xl">
                      v{d.product.version}
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-4 pt-1">
                    <div>
                      <Link href={`/san-pham/${d.product.slug}`} className="text-small font-medium text-white/85 hover:text-white line-clamp-1">
                        {d.product.name}
                      </Link>
                      <p className="mt-1 text-caption text-white/35">
                        Đã tải {d.downloadCount} lần · Kích hoạt {formatDateTime(d.createdAt)}
                      </p>
                    </div>
                    <a href={`/api/downloads/${d.token}`} target="_blank" rel="noreferrer" className="mt-auto">
                      <Button variant="secondary" className="khv-touch-target w-full">
                        <Download className="h-3.5 w-3.5" /> Tải lại
                      </Button>
                    </a>
                  </div>
                </GlassPanel>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
