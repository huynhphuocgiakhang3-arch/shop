"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const body = await response.json().catch(() => ({}));
      setMessage(typeof body.message === "string" ? body.message : "Nếu email tồn tại, hướng dẫn khôi phục đã được gửi.");
    } catch {
      setMessage("Không thể kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <GlassPanel className="w-full max-w-md p-7 sm:p-9">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent-orange">Khôi phục tài khoản</p>
          <h1 className="mt-3 text-h2 font-display text-white">Quên mật khẩu?</h1>
          <p className="mt-3 text-small text-white/50">
            Nhập email đăng ký. Nếu tài khoản tồn tại, chúng tôi gửi hướng dẫn đặt lại (khi email hệ thống đã được cấu hình).
          </p>
          <div className="mt-6">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
          </div>
          {message ? <p className="mt-4 text-small text-state-success">{message}</p> : null}
          <Button className="mt-5 w-full" onClick={submit} isLoading={busy} disabled={!email.trim()}>
            Gửi hướng dẫn
          </Button>
          <Link href="/dang-nhap" className="mt-5 block text-center text-small text-white/45">
            ← Quay lại đăng nhập
          </Link>
        </GlassPanel>
      </main>
      <SiteFooter />
    </div>
  );
}
