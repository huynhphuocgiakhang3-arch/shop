"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_PREMIUM } from "@/lib/motion";

type ToastVariant = "success" | "error" | "info" | "warning" | "loading";
interface ToastAction {
  undoLabel?: string;
  onUndo?: () => void;
}

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, action?: ToastAction) => string;
  /** Returns the toast id so a "loading" toast can be dismissed/replaced once the async work resolves. */
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2
};

const COLORS: Record<ToastVariant, string> = {
  success: "text-state-success",
  error: "text-state-danger",
  info: "text-accent-blue",
  warning: "text-accent-orange",
  loading: "text-white/50"
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info", action?: ToastAction) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, variant, action }]);
      if (variant !== "loading") {
        setTimeout(() => dismiss(id), action?.onUndo ? 6000 : 4000);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {/* Bottom offset clears both the mobile bottom nav (Dashboard/Admin,
          ~64px + safe-area) and the iOS home-indicator gesture bar on plain
          marketing pages — a plain `bottom-5` collided with the bottom nav
          bar and covered its icons whenever a toast fired on those pages. */}
      {/* z-[2000] — Toast must always sit above every modal/dialog in the
          app (see the z-index hierarchy note in ConfirmDialog.tsx), because
          actions taken *inside* a modal (e.g. "Thêm giỏ hàng" in Quick View,
          z-[1000]) fire a toast as feedback while that modal is still open.
          At the old z-[200], that toast rendered BEHIND the modal's opaque
          backdrop — invisible confirmation for a real purchase-flow action.
          Confirmed by rendering both stacked in a real browser before and
          after this fix. */}
      <div className="khv-toast-stack pointer-events-none fixed inset-x-0 z-[2000] flex w-full flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                className="glass-surface pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md px-4 py-3 shadow-lg"
              >
                <Icon className={cn("h-4 w-4 shrink-0", COLORS[toast.variant], toast.variant === "loading" && "animate-spin")} />
                <span className="text-small text-white/85">{toast.message}</span>
                {toast.action?.onUndo ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onUndo?.();
                      dismiss(toast.id);
                    }}
                    className="text-[11px] font-bold uppercase tracking-[.12em] text-accent-orange"
                  >
                    {toast.action.undoLabel ?? "Hoàn tác"}
                  </button>
                ) : null}
                {toast.variant !== "loading" && (
                  <button onClick={() => dismiss(toast.id)} className="khv-touch-target ml-auto -mr-1.5 flex h-8 w-8 items-center justify-center text-white/30 hover:text-white/60 focus-visible:text-white/70 focus-visible:outline-none" aria-label="Đóng thông báo">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
