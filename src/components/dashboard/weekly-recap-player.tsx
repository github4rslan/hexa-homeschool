"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";

type State = "idle" | "loading" | "playing" | "paused" | "error";

/**
 * Parent weekly audio recap (F6). Plays a ~60-second narrated recap of the
 * child's week, synthesized on demand via the existing `/api/tts` path
 * (ElevenLabs, Cloudinary-cached by content hash — identical weeks reuse the
 * same clip, so repeat plays cost nothing). The recap text is deterministic
 * (built server-side from `weekInReview`); this component only fetches + plays.
 * Degrades to a friendly, non-blocking message when TTS is unconfigured (503)
 * or the tier gate rejects (403) — never crashes, never a dead control.
 */
export function WeeklyRecapPlayer({ narration }: { narration: string }) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  // Revoke any object URL on unmount to avoid leaking blob memory.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const play = async () => {
    // Resume an already-loaded clip.
    if (audioRef.current && (state === "paused" || state === "playing")) {
      if (state === "playing") {
        audioRef.current.pause();
        setState("paused");
      } else {
        await audioRef.current.play().catch(() => setState("error"));
        setState("playing");
      }
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narration }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("paused");
      audio.onerror = () => setState("error");
      await audio.play();
      setState("playing");
    } catch {
      setState("error");
    }
  };

  const label =
    state === "loading"
      ? "Preparing recap…"
      : state === "playing"
        ? "Pause recap"
        : state === "paused"
          ? "Resume recap"
          : "Listen to this week's recap";

  return (
    <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
      <button
        type="button"
        onClick={play}
        disabled={state === "loading"}
        aria-label={label}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-60"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : state === "playing" ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-fog-100">
          <Volume2 className="h-3.5 w-3.5 text-fog-400" aria-hidden="true" />
          {label}
        </p>
        <p className="text-xs text-fog-500">
          {state === "error"
            ? "Audio recap isn't available right now."
            : "A ~1-minute narrated summary of the week."}
        </p>
      </div>
    </div>
  );
}
