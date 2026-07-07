"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  normalizeWordTimings,
  type WordTiming,
} from "@/lib/child/caption-timing";

/**
 * Auto-narration audio engine (Wave 4, Phase 1; single-controller rewrite).
 *
 * Fetches lesson narration from the EXISTING /api/tts endpoint (its rate-limit,
 * tier-gate, Cloudinary cache and 503 fallback are the contract — we never call
 * ElevenLabs directly) and plays it through **one** shared <audio> element.
 *
 * WHY A MODULE SINGLETON: every `useNarration` call used to create its OWN
 * <audio>, so a component that rendered another narration-owning component (e.g.
 * the practice player showing a worked-example StepReveal) had TWO elements that
 * could play at once → two overlapping voices. There is now exactly ONE audio
 * element for the whole app, so only one clip can ever play; a new `playText`
 * cleanly supersedes the previous one.
 *
 * PLAY-TOKEN GUARD: `playText` awaits a network fetch before it can play. A
 * generation token, bumped on every `playText`/`toggle`/`stop`, lets a stale
 * async play() (resolved after a newer request, or after the child started
 * answering and we called `stop()`) detect that it was superseded and bail — so
 * narration never resumes over a working child and clips don't cut each other
 * off by racing.
 *
 * It still: caches fetched clips by voice+stage+text (repeats + prefetched steps
 * are instant), and degrades SILENTLY on any error (no key → 503, rate-limit →
 * 429, autoplay blocked) so the lesson always works without audio.
 *
 * Policy (when to auto-play, prefetch, mute) lives in the calling component;
 * this hook is just the engine and works regardless of the child's preference.
 */

/** Matches the route's MAX_TTS_CHARS — keep narration lesson-sized. */
const NARRATION_MAX_CHARS = 1200;

interface FetchOpts {
  voiceId?: string | null;
  keyStage?: number;
  /**
   * Karaoke mode: fetch word-level timings with the audio (the Read-Along
   * alignment path). Timings ride the same cache; a clip cached without them
   * simply plays without karaoke — never a second paid fetch.
   */
  align?: boolean;
}

/** What the captions need to follow the voice: the clip's text + word timings. */
export interface NarrationCaption {
  text: string;
  words: WordTiming[] | null;
}

export interface NarrationApi {
  /** Fetch (or reuse) and play the clip for `text` from the start. */
  playText: (text: string) => Promise<void>;
  /** Like playText, but also fetches word timings for karaoke captions. */
  playCaptioned: (text: string) => Promise<void>;
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
  /** The current clip's caption data (null when nothing is loaded). */
  caption: NarrationCaption | null;
  /** Playback position in seconds — poll from rAF for karaoke highlight. */
  getTime: () => number;
}

/**
 * The single app-wide narration engine. Exactly one <audio> element exists, so
 * only one clip can ever play — this is what removes the two-voice overlap. The
 * `token` supersede guard removes the stale-async races. Exported for unit tests
 * (a fresh instance per test); the app always uses the module singleton below.
 */
export class NarrationController {
  private audio: HTMLAudioElement | null = null;
  /** voice:stage:text → object URL of the fetched MP3 + any word timings. */
  private cache = new Map<string, { url: string; words: WordTiming[] | null }>();
  /** key → in-flight fetch, so concurrent play+prefetch share one request. */
  private inflight = new Map<
    string,
    Promise<{ url: string; words: WordTiming[] | null } | null>
  >();
  /** Caption data for the current clip (text + timings), for karaoke. */
  private caption: NarrationCaption | null = null;
  /** Monotonic play generation — a play whose token is stale must not start. */
  private token = 0;
  private currentText: string | null = null;
  private usingSpeechFallback = false;
  private playingState = false;
  private loadingState = false;
  private listeners = new Set<() => void>();

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getPlaying = (): boolean => this.playingState;
  getLoading = (): boolean => this.loadingState;
  /** Stable snapshot for useSyncExternalStore — replaced only on change. */
  getCaption = (): NarrationCaption | null => this.caption;
  /** Playback position in seconds (0 for the speech fallback — no timings). */
  getTime = (): number => this.audio?.currentTime ?? 0;

  private setCaption(next: NarrationCaption | null) {
    if (this.caption !== next) {
      this.caption = next;
      this.emit();
    }
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private setPlaying(v: boolean) {
    if (this.playingState !== v) {
      this.playingState = v;
      this.emit();
    }
  }

  private setLoading(v: boolean) {
    if (this.loadingState !== v) {
      this.loadingState = v;
      this.emit();
    }
  }

  private getAudio(): HTMLAudioElement | null {
    if (!this.audio && typeof Audio !== "undefined") {
      const a = new Audio();
      a.preload = "auto";
      a.onplay = () => this.setPlaying(true);
      a.onpause = () => this.setPlaying(false);
      a.onended = () => this.setPlaying(false);
      this.audio = a;
    }
    return this.audio;
  }

  private stopSpeechFallback(): void {
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
    this.usingSpeechFallback = false;
  }

  private playSpeechFallback(text: string, token: number): void {
    if (
      typeof speechSynthesis === "undefined" ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }
    this.stopSpeechFallback();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onstart = () => {
      if (token === this.token) this.setPlaying(true);
    };
    utterance.onend = () => {
      if (token === this.token) {
        this.usingSpeechFallback = false;
        this.setPlaying(false);
      }
    };
    utterance.onerror = () => {
      if (token === this.token) {
        this.usingSpeechFallback = false;
        this.setPlaying(false);
      }
    };
    this.currentText = text;
    this.usingSpeechFallback = true;
    speechSynthesis.speak(utterance);
  }

  private key(text: string, opts: FetchOpts): string {
    return `${opts.voiceId ?? ""}:${opts.keyStage ?? ""}:${text}`;
  }

  private fetchClip(
    text: string,
    opts: FetchOpts,
  ): Promise<{ url: string; words: WordTiming[] | null } | null> {
    const key = this.key(text, opts);
    const cached = this.cache.get(key);
    // A cached clip without timings still plays when karaoke asks — captions
    // degrade to the per-step line rather than paying for a refetch.
    if (cached) return Promise.resolve(cached);
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const p = (async (): Promise<{
      url: string;
      words: WordTiming[] | null;
    } | null> => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.slice(0, NARRATION_MAX_CHARS),
            ...(opts.voiceId ? { voiceId: opts.voiceId } : {}),
            ...(opts.keyStage ? { keyStage: opts.keyStage } : {}),
            ...(opts.align ? { withAlignment: true } : {}),
          }),
        });
        if (!res.ok) return null; // 503/429/502 → silently unavailable

        let clip: { url: string; words: WordTiming[] | null };
        if (opts.align) {
          // Aligned mode returns JSON: base64 audio + word timings. Anything
          // malformed degrades to audio-only or (worse) the speech fallback —
          // never a broken highlight.
          const data = (await res.json()) as {
            audio?: string;
            words?: unknown;
          };
          if (typeof data.audio !== "string" || !data.audio) return null;
          const bin = atob(data.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          clip = {
            url: URL.createObjectURL(
              new Blob([bytes], { type: "audio/mpeg" }),
            ),
            words: normalizeWordTimings(data.words),
          };
        } else {
          const blob = await res.blob();
          clip = { url: URL.createObjectURL(blob), words: null };
        }
        this.cache.set(key, clip);
        return clip;
      } catch {
        return null;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }

  prefetch(text: string, opts: FetchOpts = {}): void {
    const t = text.trim();
    if (!t) return;
    void this.fetchClip(t, opts);
  }

  async playText(text: string, opts: FetchOpts = {}): Promise<void> {
    const t = text.trim();
    if (!t) return;
    // Claim this generation up front. Any older in-flight play is now stale, and
    // `stop()` (which also bumps the token) will invalidate THIS one.
    const myToken = ++this.token;
    this.stopSpeechFallback();
    this.audio?.pause();
    this.setLoading(true);
    const clip = await this.fetchClip(t, opts);
    // Superseded by a newer play, or cancelled by stop(), while we were fetching.
    if (myToken !== this.token) return;
    this.setLoading(false);
    if (!clip) {
      this.setCaption(null); // speech fallback has no timings
      this.playSpeechFallback(t, myToken);
      return;
    }
    const a = this.getAudio();
    if (!a) return;
    a.pause();
    a.src = clip.url;
    a.currentTime = 0;
    this.currentText = t;
    this.setCaption({ text: t, words: clip.words });
    try {
      await a.play();
    } catch {
      if (myToken === this.token) {
        this.setCaption(null);
        this.playSpeechFallback(t, myToken);
      }
      // Autoplay blocked or interrupted by a newer play — silent; the visible
      // replay control remains the affordance.
    }
  }

  async toggle(text: string, opts: FetchOpts = {}): Promise<void> {
    const t = text.trim();
    if (!t) return;
    if (this.usingSpeechFallback && this.currentText === t) {
      this.token++;
      this.stopSpeechFallback();
      this.setPlaying(false);
      return;
    }
    const a = this.audio;
    if (a && this.currentText === t && a.src) {
      if (!a.paused) {
        a.pause();
        return;
      }
      // Resuming the same, already-fetched clip — no fetch race to guard, but
      // bump the token so any unrelated in-flight play can't hijack the element.
      this.token++;
      try {
        await a.play();
        return;
      } catch {
        return;
      }
    }
    await this.playText(t, opts);
  }

  stop(): void {
    // Invalidate any in-flight play so it can't start after we stop.
    this.token++;
    this.stopSpeechFallback();
    this.audio?.pause();
    this.setPlaying(false);
    this.setLoading(false);
  }
}

/** Sentinel so useSyncExternalStore has a stable server snapshot. */
const NO_CAPTION: NarrationCaption | null = null;

/**
 * The one shared engine for the whole app. A module singleton (not per-hook) is
 * what guarantees a single <audio> element and therefore a single voice.
 */
const controller = new NarrationController();

export function useNarration(
  voiceId?: string | null,
  keyStage?: number,
): NarrationApi {
  const playing = useSyncExternalStore(
    controller.subscribe,
    controller.getPlaying,
    () => false,
  );
  const loading = useSyncExternalStore(
    controller.subscribe,
    controller.getLoading,
    () => false,
  );

  const caption = useSyncExternalStore(
    controller.subscribe,
    controller.getCaption,
    () => NO_CAPTION,
  );

  const playText = useCallback(
    (text: string) => controller.playText(text, { voiceId, keyStage }),
    [voiceId, keyStage],
  );
  const playCaptioned = useCallback(
    (text: string) =>
      controller.playText(text, { voiceId, keyStage, align: true }),
    [voiceId, keyStage],
  );
  const toggle = useCallback(
    (text: string) => controller.toggle(text, { voiceId, keyStage }),
    [voiceId, keyStage],
  );
  const prefetch = useCallback(
    (text: string) => controller.prefetch(text, { voiceId, keyStage }),
    [voiceId, keyStage],
  );
  const stop = useCallback(() => controller.stop(), []);

  // Stop (but never revoke the SHARED cache) when a consuming view unmounts, so
  // audio never bleeds past leaving the lesson. The cache is app-lifetime and
  // bounded to lesson-sized clips; dedupe by voice+stage+text keeps it small.
  useEffect(() => () => controller.stop(), []);

  return {
    playText,
    playCaptioned,
    toggle,
    stop,
    prefetch,
    playing,
    loading,
    caption,
    getTime: controller.getTime,
  };
}
