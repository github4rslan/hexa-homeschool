import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
  accent?: "violet" | "neon" | "cyan" | "amber";
  icon?: React.ReactNode;
}

const accentClasses = {
  violet: "text-violet-300 bg-violet-500/10 border-violet-400/30",
  neon: "text-neon-400 bg-neon-500/10 border-neon-400/30",
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-400/30",
  amber: "text-amber-400 bg-amber-500/10 border-amber-400/30",
};

export function StatCard({
  label,
  value,
  hint,
  trend,
  accent = "violet",
  icon,
}: StatCardProps) {
  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-fog-400">
          {label}
        </span>
        {icon && (
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            accentClasses[accent],
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-tight text-fog-50 leading-none">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium mb-1.5",
              trend.direction === "up" ? "text-neon-400" : "text-crimson-400",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {hint && <p className="mt-2 text-xs text-fog-500">{hint}</p>}
    </Card>
  );
}
