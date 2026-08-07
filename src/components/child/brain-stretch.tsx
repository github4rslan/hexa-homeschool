"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Celebration } from "@/components/fx/celebration";
import { Interaction, type InteractionHandle } from "@/components/child/interaction";
import type { AccentPreset } from "@/lib/child/accents";
import { cn } from "@/lib/utils";
import type { Question } from "@/components/lesson/lesson-player";

/**
 * F6 — optional post-mastery "brain stretch".
 *
 * Offered ONLY after a topic is certified, so it can never gate mastery or risk
 * the calm-wrong law. One harder, human-authored bonus question (AI never
 * authors it — Children's Code). Purely celebratory + NON-scoring: a correct
 * answer earns an extra sparkle, a wrong answer gets a warm "good thinking —
 * that one's a real stretch" and reveals the answer. Nothing here is counted,
 * logged as a result, or allowed to dent confidence. If the topic carries no
 * authored stretch question this component is never rendered.
 */
export function BrainStretch({
  question,
  accent,
  firstName,
}: {
  question: Question;
  accent: AccentPreset;
  firstName?: string;
}) {
  const [phase, setPhase] = useState<"offer" | "answering" | "result">("offer");
  const [ready, setReady] = useState(false);
  const [correct, setCorrect] = useState(false);
  const ref = useRef<InteractionHandle>(null);

  const name = firstName ? `, ${firstName}` : "";

  if (phase === "offer") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className={cn(
          "mx-auto mt-6 max-w-2xl rounded-3xl border p-5 text-center",
          accent.softBorder,
          accent.softBg,
        )}
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-lg font-semibold text-fog-50">
          <Sparkles className={cn("h-5 w-5", accent.text)} />
          Fancy a brain stretch?
        </div>
        <p className="mb-4 text-base text-fog-300">
          One tricky bonus question — just for fun. It won&apos;t change your
          certificate.
        </p>
        <Button
          variant="child"
          size="child"
          onClick={() => setPhase("answering")}
        >
          Yes, stretch me!
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  if (phase === "answering") {
    return (
      <div className="mx-auto mt-6 max-w-2xl">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-fog-400">
          <Sparkles className={cn("h-4 w-4", accent.text)} />
          Brain stretch · bonus
        </div>
        <h2 className="mb-6 text-center text-2xl font-semibold text-fog-50">
          {question.prompt}
        </h2>
        <Interaction
          ref={ref}
          options={question.options}
          correctIndex={question.correctIndex}
          interaction={question.interaction ?? { type: "mcq" }}
          accent={accent}
          reveal={false}
          onReadyChange={setReady}
        />
        <div className="mt-6 flex justify-center">
          <Button
            variant="child"
            size="child"
            disabled={!ready}
            onClick={() => {
              setCorrect(ref.current?.isCorrect() ?? false);
              setPhase("result");
            }}
          >
            Check my answer
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // result — purely celebratory, never scored.
  return (
    <div className="mx-auto mt-6 max-w-2xl">
      <div className="relative child-panel p-8 text-center animate-child-pop">
        {correct && <Celebration variant={3} big />}
        <div className="mb-3 text-5xl" aria-hidden>
          {correct ? "🌟" : "💡"}
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-fog-50">
          {correct
            ? `Wow${name} — you nailed the stretch!`
            : "Good thinking — that one's a real stretch!"}
        </h2>
        <p className="mb-6 text-base text-fog-300">
          {correct
            ? "That was a tricky one. Brilliant thinking. ✨"
            : `The answer was “${question.options[question.correctIndex]}”. ${question.explanation}`}
        </p>
        <Button href="/learn" variant="child" size="child">
          Back to subjects
        </Button>
      </div>
    </div>
  );
}
