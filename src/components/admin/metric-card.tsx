import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down"; positive?: boolean };
  hint?: string;
  sparkline?: number[];
  accent?: "violet" | "neon" | "cyan" | "amber" | "crimson";
}

const accentBar = {
  violet: "from-violet-500 to-violet-700",
  neon: "from-neon-500 to-neon-600",
  cyan: "from-cyan-500 to-cyan-600",
  amber: "from-amber-500 to-amber-600",
  crimson: "from-crimson-500 to-crimson-600",
};

export function MetricCard({
  label,
  value,
  delta,
  hint,
  sparkline,
  accent = "violet",
}: MetricCardProps) {
  const goodDirection = delta?.positive !== false; // default treats "up" as positive
  const positiveBg =
    (delta?.direction === "up" && goodDirection) ||
    (delta?.direction === "down" && !goodDirection);

  return (
    <Card variant="glass" padding="lg" className="relative overflow-hidden">
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b",
          accentBar[accent],
        )}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-fog-500">
          {label}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold",
              positiveBg ? "text-neon-400" : "text-crimson-400",
            )}
          >
            {delta.direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold tracking-tight text-fog-50 leading-none tabular-nums">
          {value}
        </span>
        {sparkline && <Sparkline data={sparkline} accent={accent} />}
      </div>
      {hint && <p className="mt-2 text-xs text-fog-500">{hint}</p>}
    </Card>
  );
}

function Sparkline({
  data,
  accent,
}: {
  data: number[];
  accent: "violet" | "neon" | "cyan" | "amber" | "crimson";
}) {
  const colorMap = {
    violet: "#A78BFA",
    neon: "#06FFA5",
    cyan: "#22D3EE",
    amber: "#F59E0B",
    crimson: "#F87171",
  };
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline
        points={points}
        fill="none"
        stroke={colorMap[accent]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
