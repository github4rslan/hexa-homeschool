import { cn } from "@/lib/utils";
import type { WeekStripDay } from "@/lib/engine/streak";

/**
 * F6 — a small, warm 7-dot week strip on the child hub. Each dot is a day of
 * this week (Mon..Sun): filled in the child's accent for days a lesson was
 * completed, today ringed, later days faint. Purely presentational and static
 * (no motion, so it is inherently reduced-motion-safe) and reads only the
 * completion data the hub already loads — no tracking, no analytics, nothing
 * sent about the child. Encouraging by design: a missed day is just an unfilled
 * dot, never a "broken chain".
 */

const LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekStrip({
  days,
  accentText,
}: {
  days: WeekStripDay[];
  accentText: string;
}) {
  const activeCount = days.filter((d) => d.active).length;
  return (
    <div
      role="img"
      aria-label={`This week: ${activeCount} ${activeCount === 1 ? "day" : "days"} with a completed lesson`}
      className="flex items-end justify-center gap-2.5"
    >
      {days.map((d, i) => {
        const tint = d.active || d.isToday;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5" aria-hidden>
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                tint && accentText,
                d.active ? "bg-current" : "bg-white/10",
                d.future && "opacity-40",
                d.isToday && "ring-2 ring-current",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                d.isToday ? cn("font-semibold", accentText) : "text-fog-500",
              )}
            >
              {LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
