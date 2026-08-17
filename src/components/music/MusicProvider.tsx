"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useMusicPlaylist, type MusicTrackPublic } from "@/hooks/useMusic";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          height: string;
          width: string;
          playerVars: Record<string, number>;
          events: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
        }
      ) => YouTubePlayerInstance;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  loadVideoById(videoId: string): void;
  destroy(): void;
}

interface MusicState {
  tracks: MusicTrackPublic[];
  current: MusicTrackPublic | null;
  isPlaying: boolean;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  play: (track?: MusicTrackPublic) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const MusicContext = createContext<MusicState | null>(null);

const STORAGE_KEY = "khv:music:state";

function readStoredState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { trackId?: string; volume?: number; isShuffle?: boolean; isRepeat?: boolean }) : null;
  } catch {
    return null;
  }
}

let youtubeApiPromise: Promise<void> | null = null;
function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const { data } = useMusicPlaylist();
  const tracks = data?.tracks ?? [];

  const stored = useRef(readStoredState());
  const [currentId, setCurrentId] = useState<string | null>(stored.current?.trackId ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(stored.current?.volume ?? 70);
  const [isShuffle, setIsShuffle] = useState(stored.current?.isShuffle ?? false);
  const [isRepeat, setIsRepeat] = useState(stored.current?.isRepeat ?? false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const ytReadyRef = useRef(false);

  const current = tracks.find((t) => t.id === currentId) ?? null;

  // Persist volume/shuffle/repeat/current-track — not playback position,
  // which would just fight autoplay-blocking on the next page load anyway.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ trackId: currentId, volume, isShuffle, isRepeat }));
  }, [currentId, volume, isShuffle, isRepeat]);

  // Native <audio> element for MP3 / Cloudinary tracks.
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => handleTrackEndRef.current());
    }
    audioRef.current.volume = volume / 100;
  }, [volume]);

  // YouTube IFrame player — created lazily once, reused across tracks.
  useEffect(() => {
    if (!current || current.source !== "YOUTUBE") return;
    let cancelled = false;

    loadYoutubeApi().then(() => {
      if (cancelled || !window.YT) return;
      if (!ytPlayerRef.current) {
        const el = document.createElement("div");
        ytContainerRef.current?.appendChild(el);
        ytPlayerRef.current = new window.YT.Player(el, {
          videoId: current.url,
          height: "0",
          width: "0",
          playerVars: { autoplay: 0, controls: 0 },
          events: {
            onReady: () => {
              ytReadyRef.current = true;
              ytPlayerRef.current?.setVolume(volume);
              if (isPlaying) ytPlayerRef.current?.playVideo();
            },
            onStateChange: (e) => {
              if (window.YT && e.data === window.YT.PlayerState.ENDED) handleTrackEndRef.current();
            }
          }
        });
      } else if (ytReadyRef.current) {
        ytPlayerRef.current.loadVideoById(current.url);
        if (isPlaying) ytPlayerRef.current.playVideo();
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on track change
  }, [current?.id]);

  useEffect(() => {
    if (!current) return;
    if (current.source === "YOUTUBE") {
      ytPlayerRef.current?.setVolume(volume);
    } else if (audioRef.current) {
      if (audioRef.current.src !== current.url) audioRef.current.src = current.url;
      audioRef.current.volume = volume / 100;
    }
  }, [current, volume]);

  useEffect(() => {
    if (!current) return;
    if (current.source === "YOUTUBE") {
      if (isPlaying) ytPlayerRef.current?.playVideo();
      else ytPlayerRef.current?.pauseVideo();
    } else if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
      else audioRef.current.pause();
    }
  }, [isPlaying, current]);

  const pickNext = useCallback(
    (direction: 1 | -1) => {
      if (tracks.length === 0) return null;
      if (isShuffle) return tracks[Math.floor(Math.random() * tracks.length)];
      const idx = tracks.findIndex((t) => t.id === currentId);
      const nextIdx = (idx + direction + tracks.length) % tracks.length;
      return tracks[nextIdx];
    },
    [tracks, isShuffle, currentId]
  );

  const handleTrackEnd = useCallback(() => {
    if (isRepeat && current) {
      if (current.source === "YOUTUBE") ytPlayerRef.current?.seekTo(0);
      else if (audioRef.current) audioRef.current.currentTime = 0;
      setIsPlaying(true);
      return;
    }
    const nextTrack = pickNext(1);
    if (nextTrack) {
      setCurrentId(nextTrack.id);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isRepeat, current, pickNext]);

  // The native <audio> "ended" listener is attached exactly once (see the
  // effect below — audioRef.current is created a single time and reused for
  // every track), so it can never close over a fresh handleTrackEnd on its
  // own. Routing the call through a ref that's kept current on every render
  // means the listener always invokes today's isRepeat/current/pickNext,
  // not whatever they were on the very first render.
  const handleTrackEndRef = useRef(handleTrackEnd);
  useEffect(() => {
    handleTrackEndRef.current = handleTrackEnd;
  }, [handleTrackEnd]);

  const play = (track?: MusicTrackPublic) => {
    if (track) setCurrentId(track.id);
    else if (!current) {
      const first = tracks[0];
      if (first) setCurrentId(first.id);
    }
    setIsPlaying(true);
  };
  const pause = () => setIsPlaying(false);
  const toggle = () => setIsPlaying((p) => !p);
  const next = () => {
    const t = pickNext(1);
    if (t) {
      setCurrentId(t.id);
      setIsPlaying(true);
    }
  };
  const previous = () => {
    const t = pickNext(-1);
    if (t) {
      setCurrentId(t.id);
      setIsPlaying(true);
    }
  };

  return (
    <MusicContext.Provider
      value={{
        tracks,
        current,
        isPlaying,
        volume,
        isShuffle,
        isRepeat,
        play,
        pause,
        toggle,
        next,
        previous,
        setVolume: setVolumeState,
        toggleShuffle: () => setIsShuffle((s) => !s),
        toggleRepeat: () => setIsRepeat((r) => !r)
      }}
    >
      {children}
      <div ref={ytContainerRef} className="hidden" aria-hidden />
    </MusicContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicProvider");
  return ctx;
}
