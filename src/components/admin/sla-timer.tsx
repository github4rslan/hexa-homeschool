"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SlaTimerProps {
  deadline: Date;
  slaMinutes: number;
}

/**
 * Live countdown to SLA deadline.
 * Color shifts: green (>50%), amber (20-50%), red (<20%) of time remaining.
 */
export function SlaTimer({ deadline, slaMinutes }: SlaTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const remainingMs = deadline.getTime() - now;
  const remainingMin = remainingMs / 1000 / 60;
  const breached = remainingMs < 0;
  const ratio = Math.max(0, Math.min(1, remainingMin / slaMinutes));

  const color = breached
    ? "text-crimson-400 bg-crimson-500/10 border-crimson-400/40"
    : ratio < 0.2
      ? "text-crimson-400 bg-crimson-500/10 border-crimson-400/30"
      : ratio < 0.5
        ? "text-amber-400 bg-amber-500/10 border-amber-400/30"
        : "text-neon-400 bg-neon-500/10 border-neon-400/30";

  const dotColor = breached
    ? "bg-crimson-400"
    : ratio < 0.2
      ? "bg-crimson-400"
      : ratio < 0.5
        ? "bg-amber-400"
        : "bg-neon-400";

  function format() {
    if (breached) {
      const overMin = Math.abs(remainingMin);
      if (overMin < 60) return `+${Math.floor(overMin)}m SLA BREACH`;
      const hr = Math.floor(overMin / 60);
      const m = Math.floor(overMin % 60);
      return `+${hr}h ${m}m BREACH`;
    }
    if (remainingMin < 1) {
      const s = Math.max(0, Math.floor(remainingMs / 1000));
      return `${s}s left`;
    }
    if (remainingMin < 60) {
      return `${Math.floor(remainingMin)}m left`;
    }
    const hr = Math.floor(remainingMin / 60);
    const m = Math.floor(remainingMin % 60);
    return `${hr}h ${m}m left`;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-semibold tabular-nums whitespace-nowrap",
        color,
      )}
    >
      <span
        className={cn(
          "relative flex h-1.5 w-1.5",
          (breached || ratio < 0.2) && "animate-pulse",
        )}
      >
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            dotColor,
          )}
        />
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotColor)} />
      </span>
      {format()}
    </div>
  );
}
