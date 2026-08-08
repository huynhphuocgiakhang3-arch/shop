"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import { AuroraLayer } from "@/components/auth/AuroraLayer";
import { CosmicBackground } from "@/components/auth/CosmicBackground";
import { AuthBackgroundImage } from "@/components/auth/AuthBackgroundImage";
import { CustomCursor } from "@/components/auth/CustomCursor";
import { TypingTagline } from "@/components/auth/TypingTagline";
import { AmbientAudioToggle } from "@/components/auth/AmbientAudioToggle";
import { LoginGlassPanel } from "@/components/auth/LoginGlassPanel";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const SUCCESS_MESSAGES = [
  "Access Granted",
  "Đang chuẩn bị Vault...",
  "Đang tải không gian làm việc...",
  "Đang đồng bộ dữ liệu...",
  "Chào mừng bạn trở lại."
];

type ViewState = "idle" | "submitting" | "success" | "error";

const revealParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } }
};
const revealItem = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } }
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main className="relative z-0 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg-primary px-4 py-10 sm:px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-orange/30 border-t-accent-orange" />
    </main>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successStep, setSuccessStep] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    // Prevent double-submit: if already loading, do nothing.
    if (view === "submitting" || view === "success") return;

    setServerError(null);
    setView("submitting");

    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch {
      setServerError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.");
      setView("error");
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      setServerError(body?.message ?? "Đăng nhập không thành công. Vui lòng thử lại.");
      setView("error");
      return;
    }

    setView("success");

    // Show the success animation sequence, then redirect.
    for (let i = 0; i < SUCCESS_MESSAGES.length; i++) {
      setSuccessStep(i);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Honour ?redirectTo= param so protected pages can bounce back here.
    const redirectTo = searchParams.get("redirectTo");
    const destination =
      redirectTo && redirectTo.startsWith("/") ? redirectTo : "/trang-chu";
    router.push(destination);
  };

  const isLoading = view === "submitting" || view === "success";

  return (
    <main className="relative z-0 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg-primary px-4 py-10 sm:px-6">
      <AuthBackgroundImage variant="login" />
      <AuroraLayer />
      <CosmicBackground />
      <CustomCursor />
      <AmbientAudioToggle />

      <motion.div
        initial={{ scale: 1.035, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
        className="relative z-10 w-full max-w-[420px] motion-safe:animate-camera-breathe"
      >
        <AnimatePresence mode="wait">
          {view !== "success" ? (
            <motion.div
              key="content"
              variants={revealParent}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.4, ease: EASE } }}
              className="flex w-full flex-col items-center"
            >
              <motion.div variants={revealItem} className="mb-4">
                <Logo />
              </motion.div>

              <motion.div variants={revealItem} className="mb-8">
                <TypingTagline text="Nền tảng thương mại số cao cấp." startDelayMs={200} />
              </motion.div>

              <motion.div variants={revealItem} className="w-full">
                <LoginGlassPanel
                  className={cn(
                    "transition-shadow duration-large",
                    view === "error" &&
                      "shadow-[0_0_0_1px_rgba(255,92,92,0.35),0_0_32px_rgba(255,92,92,0.18)]"
                  )}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                    <Input
                      label="Email"
                      type="email"
                      autoComplete="email"
                      placeholder="ban@vidu.com"
                      error={errors.email?.message}
                      disabled={isLoading}
                      {...register("email")}
                    />

                    <Input
                      label="Mật khẩu"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      error={errors.password?.message}
                      disabled={isLoading}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-white/40 transition-colors hover:text-white/70"
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                      {...register("password")}
                    />

                    <div className="flex items-center justify-between text-small">
                      <label className="flex items-center gap-2 text-white/60">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-transparent accent-accent-orange"
                          disabled={isLoading}
                          {...register("rememberMe")}
                        />
                        Ghi nhớ đăng nhập
                      </label>
                      <a href="/quen-mat-khau" className="text-accent-orange/90 hover:text-accent-orange">
                        Quên mật khẩu?
                      </a>
                    </div>

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
                      isLoading={isLoading}
                      disabled={isLoading}
                      className="mt-1 w-full"
                    >
                      Đăng nhập
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => router.push("/dang-ky")}
                    >
                      Tạo tài khoản mới
                    </Button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => router.push("/")}
                      className="min-h-[44px] text-center text-small text-white/40 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Tiếp tục với tư cách khách
                    </button>
                  </form>
                </LoginGlassPanel>
              </motion.div>

              <motion.div
                variants={revealItem}
                className="mt-6 flex items-center gap-2 text-caption text-white/35"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Bảo mật với mã hóa mật khẩu và JWT
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-orange/30 border-t-accent-orange" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={successStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="text-subtitle text-white/80"
                >
                  {SUCCESS_MESSAGES[successStep]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
