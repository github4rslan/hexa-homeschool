"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, Play, Pause, Loader2, Volume2 } from "lucide-react";

/**
 * F1 — a calm, dismissible card carrying a short parent → child encouragement
 * note at the top of the child hub. Human-authored (no AI), React-escaped, and
 * never tracked. Dismissal is remembered per-note in localStorage: once the
 * parent writes a *new* note it gently reappears. Renders nothing until mounted
 * (avoids an SSR flash) and nothing once dismissed.
 *
 * F3 — the note can be heard, not just read. A small "listen" control narrates
 * the note in the child's chosen voice via the existing `/api/tts` path
 * (ElevenLabs, Cloudinary-cached by content hash — the same note reuses the same
 * clip, so repeat plays cost nothing). Purely additive and accessibility-first
 * (a real win for a pre-reader / dyslexic learner): if TTS is unconfigured (503)
 * or the tier gate rejects (403) the control simply hides — the text note is
 * always there, never a dead button. No AI authoring, no analytics, no profiling.
 */

type AudioState = "idle" | "loading" | "playing" | "paused" | "error";

export function ParentNoteCard({
  note,
  childId,
  accentText,
  voiceId,
}: {
  note: string;
  childId: string;
  accentText: string;
  voiceId?: string;
}) {
  const storageKey = `hexa_parent_note_seen_${childId}`;
  const [show, setShow] = useState(false);
  const [audio, setAudio] = useState<AudioState>("idle");
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!note) {
      setShow(false);
      return;
    }
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(storageKey);
    } catch {
      seen = null;
    }
    setShow(seen !== note);
  }, [note, storageKey]);

  // Revoke any object URL + stop playback on unmount (no leaked blob memory).
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      audioElRef.current?.pause();
    };
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, note);
    } catch {
      /* ignore — dismissal is best-effort */
    }
    audioElRef.current?.pause();
    setShow(false);
  }

  async function play() {
    // Resume/pause an already-loaded clip.
    if (audioElRef.current && (audio === "paused" || audio === "playing")) {
      if (audio === "playing") {
        audioElRef.current.pause();
        setAudio("paused");
      } else {
        await audioElRef.current.play().catch(() => setAudio("error"));
        setAudio("playing");
      }
      return;
    }

    setAudio("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note, ...(voiceId ? { voiceId } : {}) }),
      });
      if (!res.ok) {
        // Unconfigured / gated / rate-limited → hide the control, keep the text.
        setAudio("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const el = new Audio(url);
      audioElRef.current = el;
      el.onended = () => setAudio("paused");
      el.onerror = () => setAudio("error");
      await el.play();
      setAudio("playing");
    } catch {
      setAudio("error");
    }
  }

  const label =
    audio === "loading"
      ? "Getting your note ready…"
      : audio === "playing"
        ? "Pause"
        : audio === "paused"
          ? "Play again"
          : "Hear it read to you";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="child-panel mb-5 flex items-start gap-4 p-5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
            <Heart className="h-6 w-6" fill="currentColor" />
          </div>
          <div className="flex-1 pt-0.5">
            <div className={`text-sm font-semibold ${accentText}`}>
              A note for you
            </div>
            <p className="mt-1 text-lg leading-snug text-fog-100">{note}</p>
            {audio !== "error" && (
              <button
                type="button"
                onClick={play}
                disabled={audio === "loading"}
                aria-label={label}
                className="child-touch mt-3 inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
              >
                {audio === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : audio === "playing" ? (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                ) : audio === "paused" ? (
                  <Play className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
                {label}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hide note"
            className="child-touch -mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fog-500 transition-colors hover:bg-white/5 hover:text-fog-200"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
