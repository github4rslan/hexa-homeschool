"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-narration audio engine (Wave 4, Phase 1).
 *
 * A tiny client hook that fetches lesson narration from the EXISTING /api/tts
 * endpoint (its rate-limit, tier-gate, Cloudinary cache and 503 fallback are the
 * contract — we never call ElevenLabs directly) and plays it through a single
 * reused <audio> element. It:
 *  - keeps ONE clip playing at a time (a new play stops the previous),
 *  - caches fetched clips by text so repeats + prefetched steps are instant,
 *  - degrades SILENTLY on any error (no key → 503, rate-limit → 429, autoplay
 *    blocked) so the lesson always works without audio and a child never sees
 *    an error.
 *
 * Policy (when to auto-play, prefetch, mute) lives in the calling component;
 * this hook is just the engine and works regardless of the child's preference.
 */

/** Matches the route's MAX_TTS_CHARS — keep narration lesson-sized. */
const NARRATION_MAX_CHARS = 1200;

export interface NarrationApi {
  /** Fetch (or reuse) and play the clip for `text` from the start. */
  playText: (text: string) => Promise<void>;
  /** Play/pause the clip for `text` (manual "Listen"/replay control). */
  toggle: (text: string) => Promise<void>;
  /** Stop the current clip immediately (e.g. the child starts answering). */
  stop: () => void;
  /** Warm the cache for `text` without playing (prefetch the next step). */
  prefetch: (text: string) => void;
  /** Whether a clip is currently playing. */
  playing: boolean;
  /** Whether the current/last requested clip is still being fetched. */
  loading: boolean;
}

export function useNarration(
  voiceId?: string | null,
  keyStage?: number,
): NarrationApi {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** text → object URL of the fetched MP3 (revoked on unmount). */
  const cacheRef = useRef<Map<string, string>>(new Map());
  /** text → in-flight fetch, so concurrent play+prefetch share one request. */
  const inflightRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const currentTextRef = useRef<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current && typeof Audio !== "undefined") {
      const a = new Audio();
      a.preload = "auto";
      a.onplay = () => setPlaying(true);
      a.onpause = () => setPlaying(false);
      a.onended = () => setPlaying(false);
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const fetchUrl = useCallback(
    (text: string): Promise<string | null> => {
      const key = text;
      const cached = cacheRef.current.get(key);
      if (cached) return Promise.resolve(cached);
      const existing = inflightRef.current.get(key);
      if (existing) return existing;

      const p = (async (): Promise<string | null> => {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text.slice(0, NARRATION_MAX_CHARS),
              ...(voiceId ? { voiceId } : {}),
              ...(keyStage ? { keyStage } : {}),
            }),
          });
          if (!res.ok) return null; // 503/429/502 → silently unavailable
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          cacheRef.current.set(key, url);
          return url;
        } catch {
          return null;
        } finally {
          inflightRef.current.delete(key);
        }
      })();
      inflightRef.current.set(key, p);
      return p;
    },
    [voiceId, keyStage],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const playText = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      setLoading(true);
      const url = await fetchUrl(t);
      setLoading(false);
      if (!url) return; // unavailable — stay silent
      const a = getAudio();
      if (!a) return;
      a.pause();
      a.src = url;
      a.currentTime = 0;
      currentTextRef.current = t;
      try {
        await a.play();
      } catch {
        // Autoplay blocked or interrupted by a newer play — silent; the visible
        // replay control remains the affordance.
      }
    },
    [fetchUrl, getAudio],
  );

  const toggle = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      const a = audioRef.current;
      if (a && currentTextRef.current === t && a.src) {
        if (!a.paused) {
          a.pause();
          return;
        }
        try {
          await a.play();
          return;
        } catch {
          return;
        }
      }
      await playText(t);
    },
    [playText],
  );

  const prefetch = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      void fetchUrl(t);
    },
    [fetchUrl],
  );

  // Revoke object URLs + stop audio on unmount.
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      audioRef.current?.pause();
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, []);

  return { playText, toggle, stop, prefetch, playing, loading };
}
