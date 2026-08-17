"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuditLog } from "@/hooks/admin/useAuditLog";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// Every distinct action string currently written to AuditLog across the
// codebase (auth events, admin/super-admin mutations) — kept as a fixed
// list rather than derived at request time so the filter never depends on
// an extra query, and any new action added later just needs a one-line
// addition here.
const ACTIONS = [
  "LOGIN_SUCCESS",
  "REGISTER",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "ADMIN_UPDATE_USER",
  "ADMIN_DELETE_USER",
  "ADMIN_WALLET_ADJUST",
  "ADMIN_RESET_WALLET",
  "ADMIN_DELETE_WALLET_TX",
  "ADMIN_APPROVE_DEPOSIT",
  "ADMIN_REJECT_DEPOSIT",
  "ADMIN_GRANT_DOWNLOAD",
  "ADMIN_REVOKE_DOWNLOAD",
  "SUPER_ADMIN_UPDATE_SETTINGS",
  "SUPER_ADMIN_UPLOAD_APPEARANCE",
  "SUPER_ADMIN_REMOVE_APPEARANCE",
  "SUPER_ADMIN_UPDATE_PAYMENT_SETTINGS",
  "SUPER_ADMIN_UPLOAD_PAYMENT_ASSET"
];

function actionTone(action: string) {
  if (action.startsWith("SUPER_ADMIN")) return "text-accent-orange";
  if (action.startsWith("ADMIN_DELETE") || action === "ADMIN_REVOKE_DOWNLOAD" || action === "ADMIN_REJECT_DEPOSIT") return "text-red-400";
  if (action.startsWith("ADMIN")) return "text-accent-blue";
  return "text-white/50";
}

export function AuditLogClient() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAuditLog(page, action);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Nhật ký hệ thống</h1>
        <p className="mt-2 text-small text-white/45">Toàn bộ hành động nhạy cảm trên hệ thống — đăng nhập, thay đổi quyền, giao dịch ví, cài đặt Super Admin.</p>
      </div>

      <select
        value={action ?? ""}
        onChange={(e) => {
          setAction(e.target.value || undefined);
          setPage(1);
        }}
        aria-label="Lọc theo hành động"
        className="khv-touch-target w-fit rounded-pill border border-white/10 bg-bg-secondary px-4 py-2.5 text-small text-white/80 focus:outline-none"
      >
        <option value="">Tất cả hành động</option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <GlassPanel radius="md" className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8">
            <LoadingBlock />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-8">
            <EmptyState title="Không có nhật ký nào" description="Chưa có sự kiện nào khớp với bộ lọc hiện tại." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-small">
              <thead>
                <tr className="border-b border-white/10 text-caption text-white/40">
                  <th className="px-5 py-4">Hành động</th>
                  <th>Người thực hiện</th>
                  <th>Địa chỉ IP</th>
                  <th className="px-5">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <span className={cn("flex items-center gap-2 font-mono text-caption", actionTone(log.action))}>
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> {log.action}
                      </span>
                    </td>
                    <td className="text-white/60">{log.user ? log.user.displayName : "Hệ thống"}</td>
                    <td className="text-white/40">{log.ipAddress ?? "—"}</td>
                    <td className="px-5 text-white/40">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
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
