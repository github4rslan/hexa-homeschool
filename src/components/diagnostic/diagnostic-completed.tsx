import { Check, ArrowRight, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiagnosticRestart } from "@/components/diagnostic/diagnostic-restart";
import type { SubjectStanding } from "@/lib/db/repo";

/**
 * Read-only "diagnostic completed" state (Diagnostic lock). Shown instead of the
 * runner once a child has finished their one-time learning check. Warm and
 * encouraging for the child, clear and trustworthy for the parent: it shows the
 * STABLE saved baseline (never a re-run), the completion date, and forward CTAs
 * only — never a "start again" path. Static by design (reduced-motion safe).
 */

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

export function DiagnosticCompleted({
  childName,
  childId,
  completedAt,
  standings,
}: {
  childName?: string;
  childId: string;
  completedAt: Date | null;
  standings: SubjectStanding[];
}) {
  const who = childName?.trim() || "your child";
  const dateLabel = completedAt
    ? completedAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;
  const assessed = standings.length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <Card variant="glass-strong" padding="xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-neon-400/40 bg-neon-500/10 glow-neon">
          <Check className="h-8 w-8 text-neon-400" />
        </div>
        <h1 className="mb-2 text-center text-3xl font-semibold text-fog-50">
          You&apos;ve completed your learning check, {who}!
        </h1>
        <p className="mx-auto mb-8 max-w-md text-center text-fog-400">
          Here&apos;s where you&apos;re starting from. This is your baseline —
          it stays saved, so you only do this once.
        </p>

        {assessed ? (
          <div className="mb-8 flex flex-col gap-3">
            {standings.map((s) => (
              <div
                key={s.subject}
                className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
              >
                <div className="text-sm font-semibold text-fog-50">
                  {SUBJECT_LABEL[s.subject] ?? s.subject}
                </div>
                <div className="mt-1 text-xs text-fog-500">
                  Starting point saved
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center text-sm text-fog-400">
            Your results are saved to your child&apos;s record.
          </div>
        )}

        <div className="mb-8 rounded-xl border border-violet-400/20 bg-violet-500/5 p-4">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <p className="text-sm leading-relaxed text-fog-200">
              Your weekly plan is built from this baseline — every lesson chosen
              for a reason you can see. Sit any exam when ready, not before.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/schedule" variant="primary" size="lg">
            See this week&apos;s plan
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/dashboard" variant="secondary" size="lg">
            Go to dashboard
          </Button>
        </div>

        <div className="mt-6 border-t border-white/5 pt-6 text-center">
          <p className="mb-3 text-xs text-fog-500">
            Parent only · PIN required
          </p>
          <DiagnosticRestart childId={childId} childName={who} />
        </div>

        {dateLabel && (
          <p className="mt-6 text-center text-xs text-fog-500">
            Completed on {dateLabel}
          </p>
        )}
      </Card>
    </div>
  );
}
