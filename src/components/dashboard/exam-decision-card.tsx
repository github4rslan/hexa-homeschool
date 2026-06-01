import { Compass, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExamDecision } from "@/lib/engine/exam-decision";

/**
 * Surfaces the data-driven exam paths for a 13+ child. Read-only, informational
 * — the parent decides. Hidden when not eligible.
 */
export function ExamDecisionCard({
  decision,
  childName,
}: {
  decision: ExamDecision;
  childName: string;
}) {
  if (!decision.eligible) return null;

  return (
    <Card variant="glass-strong" padding="lg">
      <div className="flex items-center gap-2 mb-1">
        <Compass className="h-4 w-4 text-cyan-400" />
        <h3 className="text-base font-semibold text-fog-50">
          Exam decision — {childName}
        </h3>
      </div>
      <p className="text-sm text-fog-300 mb-5">{decision.summary}</p>

      <div className="flex flex-col gap-2">
        {decision.paths.map((p) => (
          <div
            key={p.key}
            className={`rounded-xl border p-3 ${
              p.recommended
                ? "border-neon-400/40 bg-neon-500/5"
                : "border-white/5 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-xs font-mono text-fog-300">
                {p.key}
              </span>
              <span className="text-sm font-medium text-fog-100">{p.title}</span>
              {p.recommended && (
                <Badge variant="neon" size="sm" className="ml-auto">
                  <Check className="h-3 w-3" /> Suggested
                </Badge>
              )}
            </div>
            <p className="mt-1.5 pl-8 text-xs text-fog-400 leading-relaxed">
              {p.detail}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-fog-500">
        These are options, not deadlines. You choose when {childName.split(" ")[0]}{" "}
        sits — at 14, 15 or 16.
      </p>
    </Card>
  );
}
