"use client";

import { useState } from "react";
import { Search, Ban, ShieldCheck, Wallet, Trash2, Lock, Unlock, RotateCcw } from "lucide-react";
import {
  useAdminUsers,
  useUpdateUser,
  useDeleteUser,
  useAdjustWallet,
  useFreezeWallet,
  useResetWallet,
  type AdminUserListItem
} from "@/hooks/admin/useAdminUsers";
import { useCurrentUser } from "@/hooks/useProfile";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDate, MEMBERSHIP_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<AdminUserListItem["role"], string> = {
  USER: "Người dùng",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin"
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useAdminUsers(q || undefined);
  const { data: meData } = useCurrentUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const adjustWallet = useAdjustWallet();
  const freezeWallet = useFreezeWallet();
  const resetWallet = useResetWallet();
  const { show } = useToast();

  const isSuperAdmin = meData?.user.role === "SUPER_ADMIN";

  const [walletTarget, setWalletTarget] = useState<AdminUserListItem | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminUserListItem | null>(null);

  const handleRoleChange = (user: AdminUserListItem, role: string) => {
    updateUser.mutate(
      { id: user.id, input: { role } },
      {
        onSuccess: () => show(`Đã cập nhật vai trò của ${user.displayName}.`, "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleTierChange = (user: AdminUserListItem, membershipTier: string) => {
    updateUser.mutate(
      { id: user.id, input: { membershipTier } },
      {
        onSuccess: () => show(`Đã cập nhật hạng thành viên của ${user.displayName}.`, "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleToggleBan = (user: AdminUserListItem, isBanned: boolean) => {
    updateUser.mutate(
      { id: user.id, input: { isBanned } },
      {
        onSuccess: () => show(isBanned ? `Đã khóa tài khoản ${user.displayName}.` : `Đã mở khóa tài khoản ${user.displayName}.`, "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleAdjustWallet = () => {
    if (!walletTarget) return;
    const amount = Number(walletAmount);
    if (!amount) {
      show("Vui lòng nhập số tiền khác 0.", "error");
      return;
    }
    adjustWallet.mutate(
      { userId: walletTarget.id, amount },
      {
        onSuccess: () => {
          show("Đã điều chỉnh số dư ví.", "success");
          setWalletTarget(null);
          setWalletAmount("");
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleFreezeToggle = (frozen: boolean) => {
    if (!walletTarget) return;
    const reason = frozen ? window.prompt("Lý do đóng băng ví:")?.trim() : undefined;
    if (frozen && !reason) return;
    freezeWallet.mutate(
      { userId: walletTarget.id, frozen, reason },
      {
        onSuccess: () => show(frozen ? "Đã đóng băng ví." : "Đã mở khóa ví.", "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleResetWallet = () => {
    if (!walletTarget) return;
    if (!window.confirm(`Reset số dư ví của ${walletTarget.displayName} về 0? Hành động này sẽ được ghi log đầy đủ.`)) return;
    resetWallet.mutate(
      { userId: walletTarget.id },
      {
        onSuccess: () => show("Đã reset ví về 0.", "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteUser.mutate(confirmDelete.id, {
      onSuccess: () => {
        show(`Đã xóa tài khoản ${confirmDelete.displayName}.`, "success");
        setConfirmDelete(null);
      },
      onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Quản lý người dùng</h1>

      <div className="flex max-w-sm items-center gap-2 rounded-pill border border-white/10 bg-white/[0.03] px-4 py-2.5">
        <Search className="h-4 w-4 text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full bg-transparent text-small text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      {!isSuperAdmin && (
        <p className="text-caption text-white/35">
          Bạn đang xem với quyền Admin — chỉ Super Admin mới có thể đổi vai trò, khóa tài khoản, điều chỉnh ví hoặc xóa người dùng.
        </p>
      )}

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Không tìm thấy người dùng" description="Thử từ khóa tìm kiếm khác." />
      ) : (
        <GlassPanel radius="md" className="overflow-x-auto p-0">
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-white/10 text-caption text-white/40">
                <th className="px-5 py-3">Người dùng</th>
                <th className="px-5 py-3">Vai trò</th>
                <th className="px-5 py-3">Hạng thành viên</th>
                <th className="px-5 py-3">Ngày tham gia</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <p className="text-white/85">{user.displayName}</p>
                    <p className="text-caption text-white/35">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    {isSuperAdmin ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className="rounded-md border border-white/10 bg-bg-secondary px-2 py-1 text-caption text-white/80"
                      >
                        <option value="USER">Người dùng</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    ) : (
                      <span className="text-white/60">{ROLE_LABEL[user.role]}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isSuperAdmin ? (
                      <select
                        value={user.membershipTier}
                        onChange={(e) => handleTierChange(user, e.target.value)}
                        className="rounded-md border border-white/10 bg-bg-secondary px-2 py-1 text-caption text-white/80"
                      >
                        <option value="FREE">Miễn phí</option>
                        <option value="SILVER">Bạc</option>
                        <option value="GOLD">Vàng</option>
                        <option value="DIAMOND">Kim cương</option>
                      </select>
                    ) : (
                      <span className="text-white/60">{MEMBERSHIP_LABEL[user.membershipTier]}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-white/50">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    {isSuperAdmin && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setWalletTarget(user)}
                          className="text-white/40 hover:text-accent-orange"
                          aria-label="Điều chỉnh ví"
                        >
                          <Wallet className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBan(user, true)}
                          className="text-white/40 hover:text-state-warning"
                          aria-label="Khóa tài khoản"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user)}
                          className="text-white/40 hover:text-state-danger"
                          aria-label="Xóa tài khoản"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      <Modal open={Boolean(walletTarget)} title={`Điều chỉnh ví — ${walletTarget?.displayName ?? ""}`} onClose={() => setWalletTarget(null)}>
        <div className="flex flex-col gap-4">
          <Input
            label="Số tiền (âm để trừ, dương để cộng)"
            type="number"
            value={walletAmount}
            onChange={(e) => setWalletAmount(e.target.value)}
            placeholder="Ví dụ: 100000 hoặc -50000"
          />
          <Button onClick={handleAdjustWallet} isLoading={adjustWallet.isPending}>
            <ShieldCheck className="h-4 w-4" /> Xác nhận điều chỉnh
          </Button>
          <div className="my-1 border-t border-white/[0.06]" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => handleFreezeToggle(true)} isLoading={freezeWallet.isPending}>
              <Lock className="h-4 w-4" /> Đóng băng ví
            </Button>
            <Button variant="secondary" onClick={() => handleFreezeToggle(false)} isLoading={freezeWallet.isPending}>
              <Unlock className="h-4 w-4" /> Mở khóa ví
            </Button>
            <Button variant="danger" onClick={handleResetWallet} isLoading={resetWallet.isPending}>
              <RotateCcw className="h-4 w-4" /> Reset ví về 0
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xóa tài khoản người dùng?"
        description={`Tài khoản của ${confirmDelete?.displayName ?? ""} sẽ bị vô hiệu hóa vĩnh viễn. Lịch sử đơn hàng vẫn được giữ lại.`}
        confirmLabel="Xóa tài khoản"
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
