import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { ResumeCard as ResumeCardData } from "@/lib/child/resume";

const SUBJECT_LABEL: Record<ResumeCardData["subject"], string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

/**
 * "Continue where you left off" — a warm, non-guilty resume card at the top of
 * the child hub for each lesson that's genuinely mid-flow. Links straight back
 * to the exact lesson so the interactive flow lands the child on their saved
 * step. Presentation only; the data is an ownership-checked repo read.
 */
export function ResumeCards({
  cards,
  accentText,
}: {
  cards: ResumeCardData[];
  accentText: string;
}) {
  if (cards.length === 0) return null;
  return (
    <div className="mb-5 grid gap-3">
      {cards.map((c) => (
        <Link
          key={c.topicTag}
          href={`/learn/lesson?topic=${c.topicTag}`}
          className="child-touch child-panel group flex min-w-0 items-center gap-4 p-5 transition-all hover:scale-[1.01]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06]">
            <PlayCircle className={`h-8 w-8 ${accentText}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-fog-50">
              Pick up where you left off
            </div>
            <div className="truncate text-base text-fog-300">
              {SUBJECT_LABEL[c.subject]} · {c.title} · step {c.current} of{" "}
              {c.total}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-neon-400"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
