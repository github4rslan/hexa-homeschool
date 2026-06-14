import Link from "next/link";
import { ArrowRight, Check, Circle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChecklistStep {
  /** Stable key for rendering. */
  key: string;
  label: string;
  /** Where the step's CTA leads when it's the next incomplete step. */
  href: string;
  done: boolean;
}

/**
 * New-account getting-started checklist. Steps are computed from real data by
 * the caller (children exist, evaluation exists, approved schedule exists,
 * lesson logged) — there is no stored checklist state to drift. Completed steps
 * show ticks; the first incomplete step is the card's single primary CTA. The
 * card is not rendered at all once every step is done or the parent dismisses
 * it (the dashboard owns that decision).
 */
export function GettingStarted({
  steps,
  childName,
  dismiss,
}: {
  steps: ChecklistStep[];
  childName?: string;
  dismiss: () => Promise<void>;
}) {
  const next = steps.find((s) => !s.done);
  const completed = steps.filter((s) => s.done).length;

  return (
    <Card variant="glass-strong" padding="lg" className="mb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-fog-50">
            Get {childName ? childName : "your child"} started
          </h2>
          <p className="mt-1 text-sm text-fog-400">
            {completed} of {steps.length} done — finish setup to begin daily
            lessons.
          </p>
        </div>
        <form action={dismiss}>
          <button
            type="submit"
            aria-label="Dismiss getting-started checklist"
            className="rounded-lg p-1.5 text-fog-500 transition-colors hover:bg-white/5 hover:text-fog-300"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      </div>

      <ol className="mt-6 flex flex-col gap-2">
        {steps.map((step) => {
          const isNext = step.key === next?.key;
          const inner = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                step.done
                  ? "border-neon-400/20 bg-neon-500/[0.04]"
                  : isNext
                    ? "border-violet-400/40 bg-violet-500/[0.06] hover:border-violet-400/60"
                    : "border-white/5 bg-white/[0.02]",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-neon-400/50 bg-neon-500/15 text-neon-400"
                    : isNext
                      ? "border-violet-400/60 text-violet-300"
                      : "border-white/15 text-fog-500",
                )}
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-2 w-2 fill-current" />
                )}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm",
                  step.done
                    ? "text-fog-400 line-through decoration-fog-600"
                    : "text-fog-100",
                )}
              >
                {step.label}
              </span>
              {isNext && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300">
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          );

          return (
            <li key={step.key}>
              {isNext ? (
                <Link href={step.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>

      {next && (
        <div className="mt-6">
          <Button href={next.href} variant="primary" size="md">
            {next.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
