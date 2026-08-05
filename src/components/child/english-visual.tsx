"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import type { EnglishVisualSpec } from "@/lib/child/english-visual";

/**
 * F1 — deterministic, honestly-described English question figures. Draws either a
 * plural spelling-rule word build (base word tiles + a rule ending chip) or plain
 * letter tiles for a single word the question is about (see `deriveEnglishVisual`).
 * Always present and free (no per-question AI PNG). Transform/opacity entrance
 * only; reduced motion shows the finished figure instantly. The container carries
 * the honest `alt` as an aria-label so assistive tech + auto-narration describe it
 * exactly. The plural build never merges into the finished plural word, so it
 * teaches the rule without pre-answering the multiple-choice question.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function LetterTile({
  letter,
  accent,
  reduced,
  delay,
  highlight,
}: {
  letter: string;
  accent: AccentPreset;
  reduced: boolean;
  delay: number;
  highlight?: boolean;
}) {
  return (
    <motion.span
      initial={reduced ? false : { opacity: 0, y: 8, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.28, ease: EASE, delay }
      }
      className={cn(
        "flex h-11 w-9 items-center justify-center rounded-lg border text-xl font-bold uppercase",
        highlight ? accent.border : "border-white/10",
        highlight ? accent.text : "text-fog-100",
      )}
      style={{
        backgroundColor: highlight
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.04)",
      }}
    >
      {letter}
    </motion.span>
  );
}

function LetterTiles({
  word,
  accent,
  reduced,
  highlightFrom,
}: {
  word: string;
  accent: AccentPreset;
  reduced: boolean;
  /** Index from which letters are highlighted (for the rule ending), or -1. */
  highlightFrom?: number;
}) {
  const letters = word.split("");
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {letters.map((l, i) => (
        <LetterTile
          key={`${l}-${i}`}
          letter={l}
          accent={accent}
          reduced={reduced}
          delay={0.05 * i}
          highlight={
            typeof highlightFrom === "number" &&
            highlightFrom >= 0 &&
            i >= highlightFrom
          }
        />
      ))}
    </div>
  );
}

function PluralRule({
  base,
  ending,
  rule,
  accent,
  reduced,
}: {
  base: string;
  ending: string;
  rule: string;
  accent: AccentPreset;
  reduced: boolean;
}) {
  // Highlight the base-word letters the rule keys off (the last one or two),
  // so the child sees why the ending applies without the plural being spelled out.
  const keyLen = /(ch|sh)$/i.test(base) ? 2 : 1;
  const highlightFrom = Math.max(0, base.length - keyLen);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <LetterTiles
          word={base}
          accent={accent}
          reduced={reduced}
          highlightFrom={highlightFrom}
        />
        <motion.span
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.25, delay: 0.05 * base.length + 0.1 }
          }
          className={cn("text-2xl font-bold", accent.text)}
          aria-hidden
        >
          +
        </motion.span>
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 8, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.28, ease: EASE, delay: 0.05 * base.length + 0.18 }
          }
          className={cn(
            "flex h-11 items-center justify-center rounded-lg border px-3 text-lg font-bold lowercase",
            accent.border,
            accent.text,
          )}
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          {ending}
        </motion.span>
      </div>
      <p className="text-center text-sm font-medium text-fog-300">{rule}</p>
    </div>
  );
}

export function EnglishVisual({
  spec,
  accent,
}: {
  spec: EnglishVisualSpec;
  accent: AccentPreset;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex aspect-[3/2] w-full items-center justify-center rounded-2xl p-3"
      role="img"
      aria-label={spec.alt}
    >
      {spec.kind === "plural_rule" ? (
        <PluralRule
          base={spec.base}
          ending={spec.ending}
          rule={spec.rule}
          accent={accent}
          reduced={reduced}
        />
      ) : (
        <LetterTiles word={spec.word} accent={accent} reduced={reduced} />
      )}
    </motion.div>
  );
}
