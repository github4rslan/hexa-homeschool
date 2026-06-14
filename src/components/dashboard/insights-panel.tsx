import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Insight } from "@/lib/engine/insights";

/**
 * Learning insights panel — deterministic patterns from real lessons + mood
 * check-ins (no AI). Shows only statistically-backed lines; otherwise explains
 * it's still learning the child's rhythm. Never judges the child, and there is
 * deliberately NO sibling comparison anywhere — the data only ever covers one
 * child.
 */
export function InsightsPanel({
  insights,
  learning,
  childFirstName,
}: {
  insights: Insight[];
  learning: boolean;
  childFirstName: string;
}) {
  return (
    <Card variant="glass" padding="xl" className="mb-6">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-300" />
        <h2 className="text-lg font-semibold text-fog-50">Learning insights</h2>
      </div>

      {learning || insights.length === 0 ? (
        <p className="text-sm text-fog-400">
          Still learning {childFirstName}&apos;s rhythm. As more lessons and daily
          check-ins build up, gentle patterns — like the time of day they do their
          best work — will appear here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {insights.map((i) => (
            <li
              key={i.key}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              <span className="text-sm text-fog-200">{i.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
