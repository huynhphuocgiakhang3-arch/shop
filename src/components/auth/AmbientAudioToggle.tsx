"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Safari (and older Chromium builds) exposed the Web Audio constructor under a
// vendor-prefixed name before standardizing on `AudioContext`. Typed narrowly
// here instead of casting the whole `window` object to `any`.
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function AmbientAudioToggle() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  const start = () => {
    const AudioCtx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    // two detuned low sines — a very soft, unobtrusive pad, not a melody
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 96;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 120.5;

    osc.connect(gain);
    osc2.connect(gain);
    osc.start();
    osc2.start();

    gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 2.5);

    ctxRef.current = ctx;
    nodesRef.current = { osc, osc2, gain };
  };

  const stop = () => {
    const ctx = ctxRef.current;
    const nodes = nodesRef.current;
    if (!ctx || !nodes) return;
    nodes.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => {
      nodes.osc.stop();
      nodes.osc2.stop();
      ctx.close();
    }, 700);
    ctxRef.current = null;
    nodesRef.current = null;
  };

  useEffect(() => stop, []);

  const toggle = () => {
    if (enabled) {
      stop();
      setEnabled(false);
    } else {
      start();
      setEnabled(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Tắt âm thanh nền" : "Bật âm thanh nền"}
      className="fixed bottom-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 backdrop-blur-glass transition-colors hover:text-white/80"
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
