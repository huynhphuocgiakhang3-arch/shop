"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { EASE_PREMIUM } from "@/lib/motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  isLoading,
  danger = true,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  // Portalled to <body> for the same reason as Modal/FloatingWidgets: this
  // component is used from deep inside pages with all sorts of ancestor
  // wrappers (glass panels, auth backgrounds), and any ancestor with
  // backdrop-filter would otherwise hijack this `position: fixed` overlay.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // z-index hierarchy (documented here since it's spread across
          // several files as Tailwind arbitrary values, which can't share a
          // JS constant the way EASE_PREMIUM does — Tailwind's compiler
          // needs the literal `z-[N]` string in each file, not a template):
          //   10-90    in-page sticky headers, mobile nav drawers
          //   100      SearchCommandPalette
          //   1000     Modal.tsx / QuickViewModal (content dialogs)
          //   1500     ConfirmDialog — must beat content modals: a delete
          //            confirmation opened from within an edit modal has to
          //            render on top of it, not behind it
          //   2000     Toast — always topmost; it's feedback for an action
          //            that may have just been taken inside any of the above
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/60 px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <GlassPanel radius="md" className="w-full p-6">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className={danger ? "h-5 w-5 text-state-danger" : "h-5 w-5 text-accent-orange"} />
                <h2 className="text-title text-white">{title}</h2>
              </div>
              <p className="mb-6 text-small text-white/55">{description}</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
                  Hủy
                </Button>
                <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} isLoading={isLoading}>
                  {confirmLabel}
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
