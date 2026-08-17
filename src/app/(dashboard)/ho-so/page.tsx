"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Monitor, ShieldCheck, Trash2 } from "lucide-react";
import {
  useCurrentUser,
  useUpdateProfile,
  useUploadAvatar,
  useChangePassword,
  useSessions,
  useRevokeSession,
  useDeleteAccount
} from "@/hooks/useProfile";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, MEMBERSHIP_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api-client";

export default function ProfilePage() {
  const { data: userData, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const changePassword = useChangePassword();
  const { data: sessionsData } = useSessions();
  const revokeSession = useRevokeSession();
  const deleteAccount = useDeleteAccount();
  const { show } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading) return <LoadingBlock />;
  const user = userData?.user;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: () => show("Cập nhật ảnh đại diện thành công.", "success"),
      onError: (err) => show(err instanceof Error ? err.message : "Tải ảnh lên thất bại.", "error")
    });
  };

  const handleSaveProfile = () => {
    if (!displayName.trim()) return;
    updateProfile.mutate(
      { displayName: displayName.trim() },
      {
        onSuccess: () => show("Đã cập nhật hồ sơ.", "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Cập nhật thất bại.", "error")
      }
    );
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      show("Mật khẩu xác nhận không khớp.", "error");
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          show("Đổi mật khẩu thành công.", "success");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Đổi mật khẩu thất bại.", "error")
      }
    );
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate(deletePassword, {
      onSuccess: () => {
        show("Tài khoản đã được xóa.", "info");
        router.push("/dang-nhap");
      },
      onError: (err) => show(err instanceof ApiError ? err.message : "Xóa tài khoản thất bại.", "error")
    });
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Hồ sơ & Cài đặt</h1>

      <GlassPanel radius="md" className="flex items-center gap-5 p-6">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/10 text-h3 text-white/70">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              user?.displayName?.charAt(0)?.toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-orange text-black"
            aria-label="Đổi ảnh đại diện"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-title text-white">{user?.displayName}</p>
          <p className="text-small text-white/40">{user?.email}</p>
          <span className="mt-1 inline-block rounded-pill bg-accent-orange/10 px-2.5 py-0.5 text-caption text-accent-orange">
            {MEMBERSHIP_LABEL[user?.membershipTier ?? "FREE"]}
          </span>
        </div>
      </GlassPanel>

      <GlassPanel radius="md" className="p-6">
        <h2 className="mb-4 text-title text-white">Thông tin cá nhân</h2>
        <Input label="Tên hiển thị" placeholder={user?.displayName} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Button className="mt-4" onClick={handleSaveProfile} isLoading={updateProfile.isPending}>
          Lưu thay đổi
        </Button>
      </GlassPanel>

      <GlassPanel radius="md" className="p-6">
        <h2 className="mb-4 text-title text-white">Đổi mật khẩu</h2>
        <div className="flex flex-col gap-4">
          <Input label="Mật khẩu hiện tại" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="Mật khẩu mới" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Xác nhận mật khẩu mới" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button className="mt-4" onClick={handleChangePassword} isLoading={changePassword.isPending}>
          Đổi mật khẩu
        </Button>
      </GlassPanel>

      <GlassPanel radius="md" className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-title text-white">
          <Monitor className="h-4 w-4" /> Thiết bị đăng nhập
        </h2>
        <ul className="flex flex-col divide-y divide-white/5">
          {(sessionsData?.sessions ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-small text-white/80">
                  {s.ipAddress ?? "Không xác định"} {s.isCurrent && <span className="text-accent-orange">(Thiết bị hiện tại)</span>}
                </p>
                <p className="text-caption text-white/35 line-clamp-1">{s.userAgent}</p>
                <p className="text-caption text-white/30">{formatDateTime(s.createdAt)}</p>
              </div>
              {!s.isCurrent && !s.revokedAt && (
                <button onClick={() => revokeSession.mutate(s.id)} className="text-caption text-state-danger hover:underline">
                  Đăng xuất
                </button>
              )}
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel radius="md" className="border-state-danger/20 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-title text-state-danger">
          <Trash2 className="h-4 w-4" /> Xóa tài khoản
        </h2>
        <p className="mb-4 text-small text-white/40">Hành động này không thể hoàn tác. Toàn bộ phiên đăng nhập sẽ bị vô hiệu hóa.</p>
        {!confirmingDelete ? (
          <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
            Tôi muốn xóa tài khoản
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <Input label="Nhập mật khẩu để xác nhận" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDeleteAccount} isLoading={deleteAccount.isPending}>
                Xác nhận xóa
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Hủy
              </Button>
            </div>
          </div>
        )}
      </GlassPanel>

      <p className="flex items-center gap-2 text-caption text-white/30">
        <ShieldCheck className="h-3.5 w-3.5" /> Mật khẩu của bạn được mã hóa bằng bcrypt và không bao giờ được lưu ở dạng văn bản thuần.
      </p>
    </div>
  );
}
