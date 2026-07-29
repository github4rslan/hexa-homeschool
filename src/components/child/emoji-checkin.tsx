"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { submitCheckin } from "@/app/(child)/learn/actions";

const MOODS = [
  { mood: 1, emoji: "😟", label: "Tough day" },
  { mood: 2, emoji: "😕", label: "Meh" },
  { mood: 3, emoji: "🙂", label: "Okay" },
  { mood: 4, emoji: "😄", label: "Good" },
  { mood: 5, emoji: "🤩", label: "Great!" },
];

/**
 * 30-second daily check-in. The child taps how they feel; this gently nudges
 * the starting difficulty for the day (Brief: Student Daily Flow step 1).
 * Big emoji, big targets — no pressure, no streaks.
 */
export function EmojiCheckin({ done = false }: { done?: boolean }) {
  const [completed, setCompleted] = useState(done);
  const [picked, setPicked] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(mood: number) {
    setPicked(mood);
    startTransition(async () => {
      await submitCheckin(mood);
      setCompleted(true);
    });
  }

  if (completed) {
    // Acknowledge a tough day warmly (F4): a low mood gets a gentler line and a
    // "one quest is plenty" framing rather than the upbeat default. Encouraging,
    // never diagnostic.
    const low = picked !== null && picked <= 2;
    return (
      <div className="child-panel p-6 text-center animate-child-pop">
        <p className="text-2xl font-semibold text-fog-50">
          {low ? "Thanks for sharing. 💛" : "Thanks for checking in! 🌟"}
        </p>
        <p className="mt-2 text-fog-300">
          {low
            ? "Let's keep it light today — one quest is plenty."
            : "Let's have a great session."}
        </p>
      </div>
    );
  }

  return (
    <div className="child-panel p-6 sm:p-8 text-center">
      <h2 className="text-2xl sm:text-3xl font-semibold text-fog-50 mb-2">
        How are you feeling today?
      </h2>
      <p className="text-fog-300 mb-8 text-lg">Tap the face that fits.</p>
      <div className="grid grid-cols-5 gap-3 sm:gap-4">
        {MOODS.map((m) => (
          <motion.button
            key={m.mood}
            onClick={() => choose(m.mood)}
            disabled={pending}
            whileTap={{ scale: 0.92 }}
            // Tactile single bounce on the picked face — quick, fires once.
            animate={
              picked === m.mood
                ? { scale: [1, 1.18, 1], transition: { duration: 0.35 } }
                : undefined
            }
            className={`child-touch flex flex-col items-center justify-center gap-1 rounded-3xl border p-3 transition-all disabled:opacity-60 ${
              picked === m.mood
                ? "border-violet-400/60 bg-violet-500/15"
                : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/5"
            }`}
          >
            <span className="text-4xl sm:text-5xl" aria-hidden>
              {m.emoji}
            </span>
            <span className="text-xs text-fog-400">{m.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
