"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Volume2, Pause } from "lucide-react";
import { accentPreset } from "@/lib/child/accents";
import { useNarration } from "@/lib/child/use-narration";
import type { ReexplainContext } from "@/lib/child/reexplain";
import { cn } from "@/lib/utils";

/**
 * "Explain it another way" (F4) — a calm, opt-in control on the Explainer that
 * re-teaches the SAME human-authored content in fresh words via the
 * checker-gated `/api/tutor` pipeline.
 *
 * Child-safety invariants (kept intact):
 *  - Sends NO child-entered free text (no `studentAnswer`), so there is no new
 *    distress surface; the route's distress gate still runs server-side.
 *  - AI text renders ONLY when `aiVerified` (Checker ≥ 95%). On rejection,
 *    unavailability (503/403), rate-limit or error, it shows the human-authored
 *    `fallback` — a re-presentation of the same canonical content. Never streams
 *    raw model output; never authors curriculum.
 *  - Result is cached so a re-tap is free.
 */
export function ExplainAnotherWay({
  context,
  topic,
  keyStage,
  voiceId,
  accent: accentId,
}: {
  context: ReexplainContext;
  topic?: string;
  keyStage?: number;
  voiceId?: string | null;
  accent?: string | null;
}) {
  const accent = accentPreset(accentId);
  const narration = useNarration(voiceId, keyStage);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const cacheRef = useRef<string | null>(null);

  async function fetchAnotherWay() {
    if (loading) return;
    if (cacheRef.current) {
      setText(cacheRef.current);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: context.prompt,
          correctAnswer: context.correctAnswer,
          topic,
          // B3 fix: no answer exists yet on the Explainer, so `wasCorrect` is
          // omitted entirely rather than hardcoded true. The Teaching Agent
          // treats an undefined wasCorrect as "fresh explanation, no answer
          // yet" and never opens with correctness-praise language.
          keyStage,
        }),
      });
      const data = (await res.json()) as {
        explanation?: string;
        aiVerified?: boolean;
        frozen?: boolean;
        message?: string;
      };
      // The distress gate can't fire here (no studentAnswer), but stay defensive.
      const resolved =
        data.frozen && data.message
          ? data.message
          : res.ok && data.aiVerified && data.explanation
            ? data.explanation
            : context.fallback;
      cacheRef.current = resolved;
      setText(resolved);
    } catch {
      cacheRef.current = context.fallback;
      setText(context.fallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      {!text && (
        <button
          onClick={fetchAnotherWay}
          disabled={loading}
          className={cn(
            "child-touch inline-flex items-center gap-2.5 rounded-2xl border px-5 text-base font-medium text-fog-100 transition-colors disabled:opacity-60",
            accent.softBg,
            accent.softBorder,
          )}
        >
          {loading ? (
            <Loader2 className={cn("h-5 w-5 animate-spin", accent.text)} />
          ) : (
            <Sparkles className={cn("h-5 w-5", accent.text)} />
          )}
          Show me another way
        </button>
      )}

      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start gap-3 rounded-3xl border p-5",
              accent.softBg,
              accent.softBorder,
            )}
          >
            <Sparkles className={cn("mt-1 h-6 w-6 shrink-0", accent.text)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-relaxed text-fog-100">{text}</p>
              <button
                onClick={() => void narration.toggle(text)}
                disabled={narration.loading}
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-fog-200 disabled:opacity-50",
                )}
              >
                {narration.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : narration.playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                {narration.playing ? "Pause" : "Hear it"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
