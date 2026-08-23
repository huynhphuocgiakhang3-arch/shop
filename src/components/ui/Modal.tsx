"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EASE_PREMIUM } from "@/lib/motion";

export function Modal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
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
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/78 p-3 backdrop-blur-md sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto flex w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] py-0 sm:max-h-[min(92dvh,900px)]"
          >
            <GlassPanel radius="md" className="max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overscroll-contain p-4 sm:max-h-[min(92dvh,900px)] sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-title text-white">{title}</h2>
                <button onClick={onClose} className="text-white/40 hover:text-white/80" aria-label="Đóng">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
