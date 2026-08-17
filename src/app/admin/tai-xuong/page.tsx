"use client";

import { useState } from "react";
import { Download, ShieldOff } from "lucide-react";
import { useAdminDownloads, useRevokeDownload } from "@/hooks/admin/useAdminDownloads";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function isRevoked(expiresAt: string | null) {
  return expiresAt != null && new Date(expiresAt).getTime() <= Date.now();
}

export default function AdminDownloadsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminDownloads(page);
  const revoke = useRevokeDownload();
  const { show } = useToast();

  const handleRevoke = (id: string) => {
    if (!confirm("Thu hồi quyền tải xuống này? Người dùng sẽ không thể tải sản phẩm bằng liên kết này nữa.")) return;
    revoke.mutate(id, {
      onSuccess: () => show("Đã thu hồi quyền tải xuống.", "success"),
      onError: (err) => show(err instanceof ApiError ? err.message : "Không thể thu hồi.", "error")
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Lịch sử tải xuống</h1>
        <p className="mt-2 text-small text-white/45">Nhật ký toàn bộ liên kết tải xuống đã cấp cho khách hàng — có thể thu hồi khi cần.</p>
      </div>

      <GlassPanel radius="md" className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8">
            <LoadingBlock />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-8">
            <EmptyState title="Chưa có lượt tải xuống nào" description="Nhật ký sẽ xuất hiện khi khách hàng bắt đầu tải sản phẩm." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-small">
              <thead>
                <tr className="border-b border-white/10 text-caption text-white/40">
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th>Khách hàng</th>
                  <th>Số lần tải</th>
                  <th>Trạng thái</th>
                  <th>Cấp lúc</th>
                  <th className="px-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d) => {
                  const revoked = isRevoked(d.expiresAt);
                  return (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-white/85">
                          <Download className="h-4 w-4 shrink-0 text-white/30" /> {d.product.name}
                        </span>
                      </td>
                      <td className="text-white/60">{d.user.displayName}</td>
                      <td className="text-white/60">{d.downloadCount}</td>
                      <td>
                        <span className={cn("inline-flex items-center gap-1.5", revoked ? "text-red-400" : "text-state-success")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", revoked ? "bg-red-400" : "bg-state-success")} />
                          {revoked ? "Đã thu hồi" : "Còn hiệu lực"}
                        </span>
                      </td>
                      <td className="text-white/40">{formatDateTime(d.createdAt)}</td>
                      <td className="px-5 text-right">
                        {!revoked && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(d.id)}
                            disabled={revoke.isPending}
                            className="khv-touch-target inline-flex items-center gap-1.5 text-caption text-white/40 hover:text-red-400 disabled:opacity-50"
                          >
                            <ShieldOff className="h-3.5 w-3.5" /> Thu hồi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {data && data.pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Phân trang">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "khv-touch-target flex items-center justify-center rounded-full text-small transition-colors",
                p === page ? "bg-accent-orange text-black" : "text-white/50 hover:bg-white/5"
              )}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
