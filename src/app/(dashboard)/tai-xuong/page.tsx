"use client";

import Link from "next/link";
import Image from "next/image";
import { Download } from "lucide-react";
import { useDownloadHistory } from "@/hooks/useDownloads";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { formatDateTime } from "@/lib/format";

export default function DownloadsPage() {
  const { data, isLoading } = useDownloadHistory();

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Trung tâm tải xuống</h1>

      {!data || data.items.length === 0 ? (
        <EmptyState
          title="Chưa có tệp nào để tải"
          description="Sản phẩm bạn mua sẽ xuất hiện tại đây, sẵn sàng tải xuống bất cứ lúc nào."
          actionLabel="Khám phá sản phẩm"
          actionHref="/san-pham"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((d) => (
            <GlassPanel key={d.id} radius="md" className="flex flex-col gap-3 p-5">
              <div className="relative h-32 w-full overflow-hidden rounded-md bg-white/5">
                <Image src={d.product.thumbnailUrl} alt={d.product.name} fill className="object-cover" />
              </div>
              <div>
                <Link href={`/san-pham/${d.product.slug}`} className="text-small text-white/85 hover:text-white line-clamp-1">
                  {d.product.name}
                </Link>
                <p className="text-caption text-white/35">Phiên bản {d.product.version} · Đã tải {d.downloadCount} lần</p>
                <p className="text-caption text-white/30">Kích hoạt: {formatDateTime(d.createdAt)}</p>
              </div>
              <a
                href={`/api/downloads/${d.token}`}
                target="_blank"
                rel="noreferrer"
                className="mt-auto flex items-center justify-center gap-2 rounded-pill bg-white/[0.06] py-2 text-caption text-white/80 hover:bg-white/[0.1]"
              >
                <Download className="h-3.5 w-3.5" /> Tải lại
              </a>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
