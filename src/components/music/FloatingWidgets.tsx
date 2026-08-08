"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, MessageCircle, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, X } from "lucide-react";
import { useMusicPlayer } from "@/components/music/MusicProvider";
import { useCurrentUser } from "@/hooks/useProfile";
import { useConversation } from "@/hooks/useChat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { cn } from "@/lib/utils";

function FloatingButton({
  icon: Icon,
  label,
  active,
  badge,
  onClick
}: {
  icon: typeof Music2;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  // Label is visible for the first 6s, then the letters wipe away one at a
  // time (staggered exit), leaving just the icon — per spec.
  const [showLabel, setShowLabel] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowLabel(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const letters = label.split("");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      className={cn(
        "glass-surface flex h-12 items-center gap-2 overflow-hidden rounded-pill px-4 text-small font-medium text-white/90 shadow-lg backdrop-blur-xl transition-colors duration-standard",
        active ? "border-accent-orange/50 text-accent-orange" : "hover:border-white/20"
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="relative shrink-0">
        <Icon className="h-5 w-5" />
        {Boolean(badge) && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-state-danger px-1 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}
      </span>
      <AnimatePresence>
        {showLabel && (
          <motion.span className="flex overflow-hidden whitespace-nowrap" exit={{ width: 0 }} transition={{ duration: 0.4 }}>
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function MusicPanel({ onClose }: { onClose: () => void }) {
  const { tracks, current, isPlaying, volume, isShuffle, isRepeat, play, toggle, next, previous, setVolume, toggleShuffle, toggleRepeat } =
    useMusicPlayer();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="glass-surface absolute bottom-16 right-0 flex w-80 flex-col gap-3 rounded-lg border border-white/10 p-4 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-small font-medium text-white/90">Music</p>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {current ? (
        <div className="text-center">
          <p className="truncate text-small font-medium text-white/90">{current.title}</p>
          {current.artist && <p className="truncate text-caption text-white/40">{current.artist}</p>}
        </div>
      ) : (
        <p className="text-center text-caption text-white/40">Chưa có bài hát nào được chọn.</p>
      )}

      <div className="flex items-center justify-center gap-4">
        <button onClick={toggleShuffle} className={cn("text-white/40 hover:text-white", isShuffle && "text-accent-orange")}>
          <Shuffle className="h-4 w-4" />
        </button>
        <button onClick={previous} className="text-white/70 hover:text-white">
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          onClick={() => (current ? toggle() : play())}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-orange text-black hover:brightness-110"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
        </button>
        <button onClick={next} className="text-white/70 hover:text-white">
          <SkipForward className="h-5 w-5" />
        </button>
        <button onClick={toggleRepeat} className={cn("text-white/40 hover:text-white", isRepeat && "text-accent-orange")}>
          <Repeat className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 shrink-0 text-white/40" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1 flex-1 accent-accent-orange"
        />
      </div>

      <div className="max-h-40 overflow-y-auto border-t border-white/[0.06] pt-2">
        {tracks.length === 0 ? (
          <p className="py-2 text-center text-caption text-white/30">Playlist trống.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {tracks.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => play(t)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-caption",
                    current?.id === t.id ? "bg-accent-orange/10 text-accent-orange" : "text-white/60 hover:bg-white/[0.04]"
                  )}
                >
                  <span className="truncate">{t.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export function FloatingWidgets() {
  const [musicOpen, setMusicOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { data: meData } = useCurrentUser();
  const isLoggedIn = Boolean(meData?.user);

  // Light background poll (chat closed) just to badge unread admin/bot
  // replies — the panel itself polls faster (4s) only while actually open.
  const { data: convoData } = useConversation(isLoggedIn && !chatOpen);
  const unread = convoData?.messages.filter((m) => m.sender !== "USER" && !m.readByUserAt).length ?? 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>{musicOpen && <MusicPanel onClose={() => setMusicOpen(false)} />}</AnimatePresence>
      <div className="relative">
        <FloatingButton icon={Music2} label="Music" active={musicOpen} onClick={() => setMusicOpen((v) => !v)} />
      </div>

      {isLoggedIn && (
        <>
          <AnimatePresence>{chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}</AnimatePresence>
          <div className="relative">
            <FloatingButton
              icon={MessageCircle}
              label="Chat trực tiếp với Admin"
              active={chatOpen}
              badge={!chatOpen ? unread : 0}
              onClick={() => setChatOpen((v) => !v)}
            />
          </div>
        </>
      )}
    </div>
  );
}
