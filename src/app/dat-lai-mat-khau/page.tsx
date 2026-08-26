"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.message === "string" ? body.message : "Không thể đặt lại mật khẩu.");
        return;
      }
      setMessage(typeof body.message === "string" ? body.message : "Đặt lại mật khẩu thành công.");
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <GlassPanel className="w-full max-w-md p-7 sm:p-9">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent-orange">Bảo mật tài khoản</p>
          <h1 className="mt-3 text-h2 font-display text-white">Đặt lại mật khẩu</h1>
          <p className="mt-3 text-small text-white/50">
            Nhập mật khẩu mới. Liên kết chỉ dùng được một lần và hết hạn sau 60 phút.
          </p>
          {!token ? (
            <p className="mt-6 text-small text-state-danger">Thiếu mã đặt lại. Hãy yêu cầu liên kết mới.</p>
          ) : (
            <div className="mt-6 space-y-4">
              <Input label="Mật khẩu mới" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input label="Xác nhận mật khẩu" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          )}
          {error ? <p className="mt-4 text-small text-state-danger">{error}</p> : null}
          {message ? <p className="mt-4 text-small text-state-success">{message}</p> : null}
          {token ? (
            <Button className="mt-5 w-full" onClick={submit} isLoading={busy} disabled={!password || !confirmPassword}>
              Lưu mật khẩu mới
            </Button>
          ) : null}
          <Link href="/dang-nhap" className="mt-5 block text-center text-small text-white/45">
            ← Quay lại đăng nhập
          </Link>
        </GlassPanel>
      </main>
      <SiteFooter />
    </div>
  );
}
