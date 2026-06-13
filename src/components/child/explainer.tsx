"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Loader2, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Explainer step (Brief: Daily Flow step 2). Phase-1 uses a clear written
 * explainer with optional ElevenLabs narration ("Play"). Video lands in
 * Stage 4 via Cloudinary. Big, calm, full playback control.
 */
export function Explainer({
  title,
  summary,
  points,
  onContinue,
  voiceId,
}: {
  title: string;
  summary: string;
  points: string[];
  onContinue: () => void;
  /** Child-chosen narration voice; falls back to the server default when unset. */
  voiceId?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    audioRef.current = null;
    urlRef.current = null;
  }, []);

  async function toggle() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    if (audioRef.current) {
      void audioRef.current.play();
      setPlaying(true);
      return;
    }
    setLoading(true);
    try {
      const narration = `${title}. ${summary}. ${points.join(". ")}`;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: narration.slice(0, 1200),
          ...(voiceId ? { voiceId } : {}),
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
      await audio.play();
      setPlaying(true);
    } catch {
      /* narration optional */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="child-panel p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-500/15 border border-violet-400/30">
              <Lightbulb className="h-7 w-7 text-violet-300" />
            </div>
            <div>
              <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
                Today&apos;s lesson
              </span>
              <h1 className="text-3xl font-semibold text-fog-50">{title}</h1>
            </div>
          </div>
          <button
            onClick={toggle}
            disabled={loading}
            aria-label={playing ? "Pause narration" : "Play narration"}
            className="child-touch flex w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : playing ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7" />
            )}
          </button>
        </div>

        <p className="text-xl text-fog-200 leading-relaxed mb-6">{summary}</p>

        <ul className="flex flex-col gap-3 mb-8">
          {points.map((p, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 text-lg text-fog-100"
            >
              <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-500/15 text-sm font-semibold text-neon-400">
                {i + 1}
              </span>
              {p}
            </motion.li>
          ))}
        </ul>

        <div className="flex justify-end">
          <Button
            onClick={() => {
              cleanup();
              onContinue();
            }}
            variant="child"
            size="child"
          >
            I&apos;m ready — let&apos;s practise
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
