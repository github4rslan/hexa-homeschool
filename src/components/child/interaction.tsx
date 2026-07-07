"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import {
  checkDragDrop,
  checkFillBlank,
  checkMcq,
  checkTapReveal,
  spokenBlankValue,
  type DragDropInteraction,
  type FillBlankInteraction,
  type Interaction as InteractionDef,
  type McqInteraction,
  type TapRevealInteraction,
} from "@/lib/child/interactions";

/**
 * Reusable interactive-step renderer (Feature 1). Renders mcq / tap_reveal /
 * fill_blank / drag_drop from human-authored data, accent-driven, with generous
 * touch targets (.child-touch ≥64px) and full keyboard support (WCAG 2.1 AA).
 *
 * The parent owns the lesson choreography (check / reveal / hints). This
 * component owns only the child's in-progress answer; it reports readiness via
 * `onReadyChange` and exposes correctness + a readable answer string through an
 * imperative handle so checks stay pure, local and instant (<200ms).
 *
 * Calm-feedback law: correct = accent settle; incorrect = a soft dim/desaturate
 * — never red, never a shake, never a buzzer. Everything collapses gracefully
 * under prefers-reduced-motion.
 *
 * Remount per step (`key={step}`) to reset internal answer state.
 */

export interface InteractionHandle {
  /** Whether the current answer is correct — pure, local, instant. */
  isCorrect: () => boolean;
  /** A readable form of the child's answer (for the distress gate + logging). */
  answerText: () => string;
  /**
   * The chosen option index for `mcq` (drives per-option misconception hints),
   * or null for other interaction types where there is no single option index.
   */
  selectedIndex: () => number | null;
  /**
   * Apply a spoken answer (Wave 8, Phase 3): fill_blank puts the processed
   * transcript into the first empty blank. Returns whether it was applied —
   * false means "let the child tap/type instead" (mcq is handled by the
   * parent's option matcher; other types don't take dictation yet).
   */
  applySpokenAnswer: (transcript: string) => boolean;
}

interface InteractionProps {
  options: string[];
  correctIndex: number;
  interaction: InteractionDef;
  accent: AccentPreset;
  /** Lock inputs and show the correct answer. */
  reveal: boolean;
  /** Whether the child's last submitted answer was correct (drives reveal tint). */
  wasCorrect?: boolean;
  /** Called whenever the child has entered a checkable answer. */
  onReadyChange?: (ready: boolean) => void;
  /** STT bridge for mcq: selecting this option from a spoken answer. */
  forceMcqSelect?: number | null;
}

export const Interaction = forwardRef<InteractionHandle, InteractionProps>(
  function Interaction(
    {
      options,
      correctIndex,
      interaction,
      accent,
      reveal,
      wasCorrect,
      onReadyChange,
      forceMcqSelect,
    },
    ref,
  ) {
    switch (interaction.type) {
      case "tap_reveal":
        return (
          <TapReveal
            ref={ref}
            it={interaction}
            accent={accent}
            reveal={reveal}
            onReadyChange={onReadyChange}
          />
        );
      case "fill_blank":
        return (
          <FillBlank
            ref={ref}
            it={interaction}
            accent={accent}
            reveal={reveal}
            wasCorrect={wasCorrect}
            onReadyChange={onReadyChange}
          />
        );
      case "drag_drop":
        return (
          <DragDrop
            ref={ref}
            it={interaction}
            accent={accent}
            reveal={reveal}
            onReadyChange={onReadyChange}
          />
        );
      case "mcq":
      default:
        return (
          <Mcq
            ref={ref}
            it={interaction}
            options={options}
            correctIndex={correctIndex}
            accent={accent}
            reveal={reveal}
            onReadyChange={onReadyChange}
            forceMcqSelect={forceMcqSelect}
          />
        );
    }
  },
);

// ── MCQ ──────────────────────────────────────────────────────

const Mcq = forwardRef<
  InteractionHandle,
  {
    it: McqInteraction;
    options: string[];
    correctIndex: number;
    accent: AccentPreset;
    reveal: boolean;
    onReadyChange?: (ready: boolean) => void;
    forceMcqSelect?: number | null;
  }
>(function Mcq(
  { options, correctIndex, accent, reveal, onReadyChange, forceMcqSelect },
  ref,
) {
  const [selected, setSelected] = useState<number | null>(null);

  // STT bridge — a spoken answer selects the matching option.
  useEffect(() => {
    if (typeof forceMcqSelect === "number") setSelected(forceMcqSelect);
  }, [forceMcqSelect]);

  useEffect(() => onReadyChange?.(selected !== null), [selected, onReadyChange]);

  useImperativeHandle(ref, () => ({
    isCorrect: () => checkMcq(selected, correctIndex),
    answerText: () => (selected !== null ? options[selected] ?? "" : ""),
    selectedIndex: () => selected,
    applySpokenAnswer: () => false, // parent matches spoken text to an option
  }));

  return (
    <div className="grid gap-4" role="radiogroup" aria-label="Answer choices">
      {options.map((option, i) => {
        const chosen = selected === i;
        const showCorrect = reveal && i === correctIndex;
        const showWrong = reveal && chosen && i !== correctIndex;
        return (
          <motion.button
            key={i}
            type="button"
            role="radio"
            aria-checked={chosen}
            onClick={() => !reveal && setSelected(i)}
            disabled={reveal}
            whileTap={reveal ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              "child-touch flex items-center gap-4 rounded-3xl border-2 px-5 text-left text-xl transition-all",
              "focus-visible:outline-none focus-visible:ring-4",
              accent.ring,
              !reveal && chosen && cn(accent.border, accent.bg),
              !reveal &&
                !chosen &&
                "border-white/10 bg-white/[0.03] hover:border-white/30",
              showCorrect && "border-neon-400/70 bg-neon-500/15",
              // A wrong pick gently dims + desaturates — never a red flash.
              showWrong && "border-white/10 bg-white/[0.02] opacity-60 saturate-50",
              reveal && !showCorrect && !showWrong && "border-white/5 opacity-50",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-mono text-base",
                chosen && !reveal
                  ? cn(accent.border, accent.text)
                  : "border-white/15 text-fog-400",
                showCorrect && "border-neon-400 text-neon-400",
              )}
              aria-hidden
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1 text-fog-50">{option}</span>
            {showCorrect && <Check className="h-7 w-7 shrink-0 text-neon-400" />}
            {showWrong && <X className="h-7 w-7 shrink-0 text-fog-400" />}
          </motion.button>
        );
      })}
    </div>
  );
});

// ── Tap to reveal ────────────────────────────────────────────

const TapReveal = forwardRef<
  InteractionHandle,
  {
    it: TapRevealInteraction;
    accent: AccentPreset;
    reveal: boolean;
    onReadyChange?: (ready: boolean) => void;
  }
>(function TapReveal({ it, accent, reveal, onReadyChange }, ref) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => onReadyChange?.(selected !== null), [selected, onReadyChange]);

  useImperativeHandle(ref, () => ({
    isCorrect: () => checkTapReveal(it, selected),
    answerText: () =>
      selected !== null ? it.cards[selected]?.reveal ?? "" : "",
    selectedIndex: () => null,
    applySpokenAnswer: () => false,
  }));

  function tap(i: number) {
    if (reveal) return;
    setFlipped((prev) => new Set(prev).add(i));
    setSelected(i);
  }

  return (
    <div>
      <p className="mb-5 text-lg text-fog-300">{it.instruction}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {it.cards.map((card, i) => {
          const isFlipped = flipped.has(i) || reveal;
          const chosen = selected === i;
          const showCorrect = reveal && i === it.correctCard;
          const showWrong = reveal && chosen && i !== it.correctCard;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={chosen}
              onClick={() => tap(i)}
              disabled={reveal}
              className={cn(
                "child-touch relative flex flex-col items-start justify-center gap-1 rounded-3xl border-2 px-5 py-4 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-4",
                accent.ring,
                !reveal && chosen && cn(accent.border, accent.bg),
                !reveal &&
                  !chosen &&
                  "border-white/10 bg-white/[0.03] hover:border-white/30",
                showCorrect && "border-neon-400/70 bg-neon-500/15",
                showWrong && "border-white/10 bg-white/[0.02] opacity-60 saturate-50",
              )}
            >
              <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
                {card.label}
              </span>
              {isFlipped ? (
                <motion.span
                  key="back"
                  initial={reduced ? false : { opacity: 0, rotateX: -40 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                  className={cn(
                    "text-xl font-semibold",
                    chosen && !reveal ? accent.text : "text-fog-50",
                    showCorrect && "text-neon-300",
                  )}
                >
                  {card.reveal}
                </motion.span>
              ) : (
                <span className="text-lg text-fog-400">Tap to reveal</span>
              )}
              {showCorrect && (
                <Check className="absolute right-4 top-4 h-6 w-6 text-neon-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ── Fill in the blank ────────────────────────────────────────

const FillBlank = forwardRef<
  InteractionHandle,
  {
    it: FillBlankInteraction;
    accent: AccentPreset;
    reveal: boolean;
    wasCorrect?: boolean;
    onReadyChange?: (ready: boolean) => void;
  }
>(function FillBlank({ it, accent, reveal, wasCorrect, onReadyChange }, ref) {
  const [values, setValues] = useState<string[]>(() =>
    it.blanks.map(() => ""),
  );

  useEffect(() => {
    onReadyChange?.(values.every((v) => v.trim().length > 0));
  }, [values, onReadyChange]);

  useImperativeHandle(ref, () => ({
    isCorrect: () => checkFillBlank(it, values),
    answerText: () => values.join(" ").trim(),
    selectedIndex: () => null,
    // Spoken answer → the first empty blank (or the only blank). Forgiving:
    // an unusable transcript returns false and the child just types instead.
    applySpokenAnswer: (transcript: string) => {
      const target = Math.max(
        0,
        values.findIndex((v) => !v.trim()),
      );
      const blank = it.blanks[target];
      if (!blank) return false;
      const value = spokenBlankValue(transcript, blank.numeric);
      if (value === null) return false;
      setBlank(target, value);
      return true;
    },
  }));

  function setBlank(i: number, v: string) {
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-y-3 text-2xl leading-relaxed text-fog-50"
      aria-label="Fill in the blanks"
    >
      {it.parts.map((part, i) => (
        <span key={`p-${i}`} className="contents">
          {part && <span className="whitespace-pre-wrap">{part}</span>}
          {i < it.blanks.length && (
            <span className="mx-1 inline-flex flex-col items-center">
              <input
                type="text"
                inputMode={it.blanks[i].numeric ? "numeric" : "text"}
                value={values[i]}
                onChange={(e) => setBlank(i, e.target.value)}
                disabled={reveal}
                placeholder={it.blanks[i].placeholder ?? "…"}
                aria-label={`Blank ${i + 1}`}
                autoComplete="off"
                className={cn(
                  "min-h-[3.25rem] min-w-[5rem] max-w-[14rem] rounded-2xl border-2 bg-white/[0.04] px-4 py-2 text-center text-2xl font-semibold text-fog-50 outline-none transition-all",
                  "placeholder:text-fog-600 focus:bg-white/[0.06]",
                  "focus-visible:ring-4",
                  accent.caret,
                  accent.ring,
                  reveal
                    ? wasCorrect
                      ? "border-neon-400/60"
                      : "border-white/10 opacity-60 saturate-50"
                    : "border-white/15 focus:border-white/40",
                )}
                style={{ width: `${Math.max(5, values[i].length + 2)}ch` }}
              />
              {reveal && !wasCorrect && (
                <span className="mt-1 text-sm font-medium text-neon-300">
                  {it.blanks[i].answers[0]}
                </span>
              )}
            </span>
          )}
        </span>
      ))}
    </div>
  );
});

// ── Drag & drop (with tap-to-place + keyboard fallback) ──────

const DragDrop = forwardRef<
  InteractionHandle,
  {
    it: DragDropInteraction;
    accent: AccentPreset;
    reveal: boolean;
    onReadyChange?: (ready: boolean) => void;
  }
>(function DragDrop({ it, accent, reveal, onReadyChange }, ref) {
  const reduced = useReducedMotion();
  // slot index → chip index (or null)
  const [placement, setPlacement] = useState<(number | null)[]>(() =>
    it.slots.map(() => null),
  );
  const [selectedChip, setSelectedChip] = useState<number | null>(null);

  const placedChips = useMemo(
    () => new Set(placement.filter((p): p is number => p !== null)),
    [placement],
  );

  useEffect(() => {
    onReadyChange?.(placement.every((p) => p !== null));
  }, [placement, onReadyChange]);

  useImperativeHandle(ref, () => ({
    isCorrect: () => checkDragDrop(it, placement),
    answerText: () =>
      it.slots
        .map((s, i) => {
          const chip = placement[i];
          return `${s.label}: ${chip !== null ? it.chips[chip] : "—"}`;
        })
        .join("; "),
    selectedIndex: () => null,
    applySpokenAnswer: () => false,
  }));

  function placeChip(slotIdx: number, chipIdx: number) {
    if (reveal) return;
    setPlacement((prev) => {
      const next = [...prev];
      // Remove this chip from any slot it already occupies.
      for (let i = 0; i < next.length; i++) if (next[i] === chipIdx) next[i] = null;
      next[slotIdx] = chipIdx;
      return next;
    });
    setSelectedChip(null);
  }

  function clearSlot(slotIdx: number) {
    if (reveal) return;
    setPlacement((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  }

  function onSlotActivate(slotIdx: number) {
    if (reveal) return;
    if (selectedChip !== null) {
      placeChip(slotIdx, selectedChip);
    } else if (placement[slotIdx] !== null) {
      clearSlot(slotIdx);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Chip tray */}
      <div className="flex flex-wrap gap-3" role="listbox" aria-label="Pieces to place">
        {it.chips.map((chip, i) => {
          const placed = placedChips.has(i);
          const isSelected = selectedChip === i;
          return (
            <motion.button
              key={i}
              type="button"
              role="option"
              aria-selected={isSelected}
              draggable={!reveal && !placed}
              onDragStart={(e) =>
                (e as unknown as React.DragEvent).dataTransfer?.setData(
                  "text/plain",
                  String(i),
                )
              }
              onClick={() =>
                !reveal && !placed && setSelectedChip(isSelected ? null : i)
              }
              disabled={reveal || placed}
              whileTap={reveal || placed ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn(
                "child-touch rounded-2xl border-2 px-5 text-lg font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-4",
                accent.ring,
                placed
                  ? "border-white/5 bg-white/[0.02] text-fog-600 opacity-40"
                  : isSelected
                    ? cn(accent.border, accent.bg, "text-fog-50")
                    : "border-white/15 bg-white/[0.04] text-fog-100 hover:border-white/30",
              )}
            >
              {chip}
            </motion.button>
          );
        })}
      </div>

      {/* Slots */}
      <div className="grid gap-3">
        {it.slots.map((slot, i) => {
          const chip = placement[i];
          const correct = reveal && chip === slot.correctChip;
          const wrong = reveal && chip !== slot.correctChip;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-lg text-fog-300">
                {slot.label}
              </span>
              <button
                type="button"
                onClick={() => onSlotActivate(i)}
                onDragOver={(e) => !reveal && e.preventDefault()}
                onDrop={(e) => {
                  if (reveal) return;
                  e.preventDefault();
                  const data = e.dataTransfer.getData("text/plain");
                  const chipIdx = Number(data);
                  if (!Number.isNaN(chipIdx)) placeChip(i, chipIdx);
                }}
                disabled={reveal}
                aria-label={
                  chip !== null
                    ? `${slot.label}: ${it.chips[chip]}. Activate to remove.`
                    : `${slot.label}: empty. Activate to place the selected piece.`
                }
                className={cn(
                  "child-touch flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed px-5 text-lg transition-all",
                  "focus-visible:outline-none focus-visible:ring-4",
                  accent.ring,
                  chip === null && "border-white/15 text-fog-500",
                  chip !== null && !reveal && cn("border-solid", accent.border, accent.bg, "text-fog-50"),
                  correct && "border-solid border-neon-400/70 bg-neon-500/15 text-fog-50",
                  wrong && "border-solid border-white/10 bg-white/[0.02] text-fog-300 opacity-60 saturate-50",
                )}
              >
                {chip !== null ? (
                  <motion.span
                    initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {it.chips[chip]}
                  </motion.span>
                ) : (
                  <span className="text-fog-600">Drop or tap here</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {selectedChip !== null && !reveal && (
        <p className="text-base text-fog-400">
          Now tap a box to place{" "}
          <span className={accent.text}>“{it.chips[selectedChip]}”</span>.
        </p>
      )}
    </div>
  );
});
