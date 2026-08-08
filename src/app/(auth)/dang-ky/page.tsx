"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

import { AuroraLayer } from "@/components/auth/AuroraLayer";
import { CosmicBackground } from "@/components/auth/CosmicBackground";
import { AuthBackgroundImage } from "@/components/auth/AuthBackgroundImage";
import { CustomCursor } from "@/components/auth/CustomCursor";
import { LoginGlassPanel } from "@/components/auth/LoginGlassPanel";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerSchema, type RegisterInput } from "@/lib/validations/user";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);

    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch {
      setServerError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.");
      return;
    }

    const body = await res.json().catch(() => ({})) as { message?: string };

    if (!res.ok) {
      setServerError(body?.message ?? "Đăng ký không thành công. Vui lòng thử lại.");
      return;
    }

    // Registration succeeded — server already set auth cookies in the response.
    // Show the success screen briefly then redirect to dashboard.
    setSuccess(true);
    await new Promise((r) => setTimeout(r, 1800));
    router.push("/trang-chu");
  };

  return (
    <main className="relative z-0 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg-primary px-4 py-10 sm:px-6">
      <AuthBackgroundImage variant="register" />
      <AuroraLayer />
      <CosmicBackground />
      <CustomCursor />

      <motion.div
        initial={{ scale: 1.035, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="flex w-full flex-col items-center"
            >
              <div className="mb-6"><Logo /></div>

              <LoginGlassPanel>
                <h1 className="mb-1 text-h3 font-display text-white">Tạo tài khoản</h1>
                <p className="mb-6 text-small text-white/50">Tham gia KhangHuynh Vault chỉ trong vài giây.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                  <Input
                    label="Tên hiển thị"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    error={errors.displayName?.message}
                    disabled={isSubmitting}
                    {...register("displayName")}
                  />
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="ban@vidu.com"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    {...register("email")}
                  />
                  <Input
                    label="Mật khẩu"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                    error={errors.password?.message}
                    disabled={isSubmitting}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-white/40 hover:text-white/70"
                        tabIndex={-1}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    {...register("password")}
                  />
                  <Input
                    label="Xác nhận mật khẩu"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    error={errors.confirmPassword?.message}
                    disabled={isSubmitting}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="text-white/40 hover:text-white/70"
                        tabIndex={-1}
                        aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    {...register("confirmPassword")}
                  />

                  {serverError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-small text-state-danger"
                      role="alert"
                      aria-live="polite"
                    >
                      {serverError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="mt-1 w-full"
                  >
                    Tạo tài khoản
                  </Button>

                  <p className="text-center text-small text-white/40">
                    Đã có tài khoản?{" "}
                    <Link href="/dang-nhap" className="text-accent-orange/90 hover:text-accent-orange">
                      Đăng nhập
                    </Link>
                  </p>
                </form>
              </LoginGlassPanel>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <LoginGlassPanel className="flex flex-col items-center text-center">
                <CheckCircle2 className="mb-4 h-10 w-10 text-state-success" />
                <h1 className="mb-2 text-h3 font-display text-white">Đăng ký thành công!</h1>
                <p className="mb-4 text-small text-white/55">
                  Đang đưa bạn vào Vault...
                </p>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-orange/30 border-t-accent-orange" />
              </LoginGlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
