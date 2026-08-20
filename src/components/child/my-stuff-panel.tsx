"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Volume2, Loader2, Palette, BookOpenText, Type, Ruler } from "lucide-react";
import { accentPreset, type AccentPreset } from "@/lib/child/accents";
import { EddieAvatar } from "@/components/child/eddie-avatar";
import {
  TEXT_SCALES,
  textScaleLabel,
  type TextScale,
} from "@/lib/child/reading-supports";
import { saveChildPreferences } from "@/app/(child)/learn/my-stuff/actions";

/**
 * "My stuff" — the child's personalisation panel: pick a narration voice (with
 * a quick preview) and a child-mode accent colour. Choices persist on the
 * ChildDoc and apply to TTS narration and child-mode theming. Large touch
 * targets, calm, no analytics.
 */

interface Voice {
  id: string;
  label: string;
  blurb: string;
}

/** Eddie introduces himself in the previewed voice — the pick IS Eddie's voice. */
const PREVIEW_TEXT =
  "Hi! I'm Eddie, your Edway coach. This is how I'll sound. Let's learn together.";

export function MyStuffPanel({
  voices,
  accents,
  currentVoiceId,
  currentAccent,
  currentNarrationAutoplay = true,
  currentSoundCues = true,
  currentLowText = false,
  currentReadingFont = false,
  currentTextScale = 1,
  currentReadingRuler = false,
  onSave,
}: {
  voices: Voice[];
  accents: AccentPreset[];
  currentVoiceId: string;
  currentAccent: string;
  /** Child's "read questions to me" preference (auto-narration). */
  currentNarrationAutoplay?: boolean;
  /** Child's "sounds & buzz" preference (gentle lesson cues; opt-out). */
  currentSoundCues?: boolean;
  /** Child's picture-first / low-text preference (fewer words, opt-in). */
  currentLowText?: boolean;
  /** SEND reading support: dyslexia-friendly font (opt-in). */
  currentReadingFont?: boolean;
  /** SEND reading support: text-size multiplier. */
  currentTextScale?: TextScale;
  /** SEND reading support: line-focus reading ruler (opt-in). */
  currentReadingRuler?: boolean;
  /** Injected in tests; defaults to the real server action. */
  onSave?: (
    voiceId: string,
    accent: string,
    narrationAutoplay: boolean,
    soundCues: boolean,
    lowText: boolean,
    reading?: {
      readingFont?: boolean;
      textScale?: number;
      readingRuler?: boolean;
    },
  ) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const [voiceId, setVoiceId] = useState(currentVoiceId);
  const [accent, setAccent] = useState(currentAccent);
  // F5 — Eddie's face reacts to the voice preview, same component/moods as
  // the practice panel and the See-it walkthrough.
  const selectedAccentPreset = accentPreset(accent);
  const [readAloud, setReadAloud] = useState(currentNarrationAutoplay);
  const [soundCues, setSoundCues] = useState(currentSoundCues);
  const [lowText, setLowText] = useState(currentLowText);
  const [readingFont, setReadingFont] = useState(currentReadingFont);
  const [textScale, setTextScale] = useState<TextScale>(currentTextScale);
  const [readingRuler, setReadingRuler] = useState(currentReadingRuler);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function preview(id: string) {
    if (previewing) return;
    setPreviewing(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: PREVIEW_TEXT, voiceId: id }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      }
    } catch {
      /* preview is optional — silently ignore */
    } finally {
      setPreviewing(null);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await (onSave ?? saveChildPreferences)(
        voiceId,
        accent,
        readAloud,
        soundCues,
        lowText,
        { readingFont, textScale, readingRuler },
      );
      if (res.ok) {
        setSaved(true);
        // Re-fetch the learn hub so the new accent applies immediately.
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/learn"
        className="child-touch mb-6 inline-flex items-center gap-2 text-base text-fog-300 hover:text-fog-100"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <h1 className="mb-2 text-4xl font-semibold text-fog-50">My stuff</h1>
      <p className="mb-8 text-xl text-fog-300">
        Make Edway feel like yours.
      </p>

      {/* Eddie's voice (Wave 8, Feature 9) — the same curated, tier-gated TTS
          voices as before, framed as EDDIE so the choice builds attachment. */}
      <section className="mb-10">
        <div className="mb-1 flex items-center gap-3">
          <EddieAvatar
            mood={previewing ? "warm-nod" : "neutral"}
            accent={selectedAccentPreset}
            reduced={reduced}
          />
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-fog-100">
            <Volume2 className="h-6 w-6 text-fog-300" /> Eddie&apos;s voice
          </h2>
        </div>
        <p className="mb-4 text-base text-fog-400">
          Pick the voice Eddie uses when he reads and teaches. Tap the speaker
          to hear each one.
        </p>
        <div className="grid gap-3">
          {voices.map((v) => {
            const selected = v.id === voiceId;
            return (
              <div
                key={v.id}
                className={[
                  "child-panel flex items-center gap-4 p-5 transition-colors",
                  selected ? "border-violet-400/60 bg-violet-500/10" : "",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setVoiceId(v.id)}
                  className="child-touch flex flex-1 items-center gap-4 text-left"
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-violet-400 bg-violet-500 text-white"
                        : "border-white/20",
                    ].join(" ")}
                  >
                    {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-xl font-semibold text-fog-50">
                      {v.label}
                    </span>
                    <span className="block text-base text-fog-400">{v.blurb}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void preview(v.id)}
                  disabled={previewing !== null}
                  className="child-touch flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-fog-200 disabled:opacity-50"
                  aria-label={`Hear ${v.label}`}
                >
                  {previewing === v.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Read aloud */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-fog-100">
          <BookOpenText className="h-6 w-6 text-fog-300" /> Reading help
        </h2>
        <button
          type="button"
          onClick={() => setReadAloud((v) => !v)}
          role="switch"
          aria-checked={readAloud}
          className="child-panel child-touch flex w-full items-center gap-4 p-5 text-left"
        >
          <span
            className={[
              "relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              readAloud ? "bg-violet-500" : "bg-white/15",
            ].join(" ")}
          >
            <span
              className={[
                "absolute h-6 w-6 rounded-full bg-white transition-transform",
                readAloud ? "translate-x-7" : "translate-x-1",
              ].join(" ")}
            />
          </span>
          <span>
            <span className="block text-xl font-semibold text-fog-50">
              Read questions to me
            </span>
            <span className="block text-base text-fog-400">
              {readAloud
                ? "I'll read each question out loud for you."
                : "Questions stay quiet — tap Listen any time you want to hear one."}
            </span>
          </span>
        </button>
        {/* Pictures first — fewer words, icon-first controls (Wave 8, P3). */}
        <button
          type="button"
          onClick={() => setLowText((v) => !v)}
          role="switch"
          aria-checked={lowText}
          className="child-panel child-touch mt-3 flex w-full items-center gap-4 p-5 text-left"
        >
          <span
            className={[
              "relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              lowText ? "bg-violet-500" : "bg-white/15",
            ].join(" ")}
          >
            <span
              className={[
                "absolute h-6 w-6 rounded-full bg-white transition-transform",
                lowText ? "translate-x-7" : "translate-x-1",
              ].join(" ")}
            />
          </span>
          <span>
            <span className="block text-xl font-semibold text-fog-50">
              Pictures first
            </span>
            <span className="block text-base text-fog-400">
              {lowText
                ? "Fewer words on screen — Eddie says them out loud instead."
                : "Show the full words on screen as well as reading them."}
            </span>
          </span>
        </button>

        {/* Sounds & buzz — gentle lesson cues (opt-out, Wave 8). */}
        <button
          type="button"
          onClick={() => setSoundCues((v) => !v)}
          role="switch"
          aria-checked={soundCues}
          className="child-panel child-touch mt-3 flex w-full items-center gap-4 p-5 text-left"
        >
          <span
            className={[
              "relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              soundCues ? "bg-violet-500" : "bg-white/15",
            ].join(" ")}
          >
            <span
              className={[
                "absolute h-6 w-6 rounded-full bg-white transition-transform",
                soundCues ? "translate-x-7" : "translate-x-1",
              ].join(" ")}
            />
          </span>
          <span>
            <span className="block text-xl font-semibold text-fog-50">
              Sounds &amp; buzz
            </span>
            <span className="block text-base text-fog-400">
              {soundCues
                ? "Soft taps and a tiny buzz when things happen in a lesson."
                : "Lessons stay silent — no tap sounds, no buzz."}
            </span>
          </span>
        </button>
      </section>

      {/* Reading supports (F3) — SEND-friendly: easy-read font, bigger text,
          and a line-focus ruler. All child-controlled, default off. */}
      <section className="mb-10">
        <h2 className="mb-1 flex items-center gap-2 text-2xl font-semibold text-fog-100">
          <Type className="h-6 w-6 text-fog-300" /> Easier to read
        </h2>
        <p className="mb-4 text-base text-fog-400">
          Make the words easier to read the way that suits you.
        </p>

        {/* Easy-read font */}
        <button
          type="button"
          onClick={() => setReadingFont((v) => !v)}
          role="switch"
          aria-checked={readingFont}
          className="child-panel child-touch flex w-full items-center gap-4 p-5 text-left"
        >
          <span
            className={[
              "relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              readingFont ? "bg-violet-500" : "bg-white/15",
            ].join(" ")}
          >
            <span
              className={[
                "absolute h-6 w-6 rounded-full bg-white transition-transform",
                readingFont ? "translate-x-7" : "translate-x-1",
              ].join(" ")}
            />
          </span>
          <span>
            <span className="block text-xl font-semibold text-fog-50">
              Easy-read font
            </span>
            <span className="block text-base text-fog-400">
              {readingFont
                ? "Rounder letters with more space between them."
                : "Use the normal lesson font."}
            </span>
          </span>
        </button>

        {/* Text size */}
        <div className="child-panel mt-3 p-5">
          <div className="mb-3 text-xl font-semibold text-fog-50">Text size</div>
          <div
            role="radiogroup"
            aria-label="Text size"
            className="grid grid-cols-3 gap-3"
          >
            {TEXT_SCALES.map((s) => {
              const selected = s === textScale;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTextScale(s)}
                  className={[
                    "child-touch flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 transition-colors",
                    selected
                      ? "border-violet-400/60 bg-violet-500/10 text-fog-50"
                      : "border-white/10 text-fog-300",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className="font-semibold leading-none"
                    style={{ fontSize: `${s}rem` }}
                  >
                    Aa
                  </span>
                  <span className="text-sm font-medium">{textScaleLabel(s)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading ruler */}
        <button
          type="button"
          onClick={() => setReadingRuler((v) => !v)}
          role="switch"
          aria-checked={readingRuler}
          className="child-panel child-touch mt-3 flex w-full items-center gap-4 p-5 text-left"
        >
          <span
            className={[
              "relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              readingRuler ? "bg-violet-500" : "bg-white/15",
            ].join(" ")}
          >
            <span
              className={[
                "absolute h-6 w-6 rounded-full bg-white transition-transform",
                readingRuler ? "translate-x-7" : "translate-x-1",
              ].join(" ")}
            />
          </span>
          <span className="flex items-center gap-3">
            <Ruler className="h-6 w-6 shrink-0 text-fog-300" aria-hidden />
            <span>
              <span className="block text-xl font-semibold text-fog-50">
                Reading ruler
              </span>
              <span className="block text-base text-fog-400">
                {readingRuler
                  ? "A soft strip helps you keep your place while you read."
                  : "No reading strip."}
              </span>
            </span>
          </span>
        </button>
      </section>

      {/* Accent */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-fog-100">
          <Palette className="h-6 w-6 text-fog-300" /> Colour
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {accents.map((a) => {
            const selected = a.id === accent;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                className={[
                  "child-touch child-panel flex flex-col items-center gap-2 p-5 transition-colors",
                  selected ? "border-white/40" : "",
                ].join(" ")}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${a.gradient}`}
                >
                  {selected && <Check className="h-6 w-6 text-white" strokeWidth={3} />}
                </span>
                <span className="text-base font-medium text-fog-100">{a.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        onClick={() => void save()}
        disabled={saving}
        className="child-touch inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-8 py-4 text-lg font-semibold text-white disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Saving…
          </>
        ) : saved ? (
          <>
            <Check className="h-5 w-5" /> Saved!
          </>
        ) : (
          "Save my stuff"
        )}
      </button>
    </div>
  );
}
