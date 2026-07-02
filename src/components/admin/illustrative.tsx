import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Marks a figure or panel as NOT computed from live data — a placeholder for a
 * metric whose real source doesn't exist yet. Phase 0 rule: no admin screen may
 * show a fabricated number without one of these next to it.
 */
export function IllustrativeBadge({ className }: { className?: string }) {
  return (
    <Badge variant="amber" size="sm" className={cn("shrink-0", className)}>
      Illustrative — not live
    </Badge>
  );
}

/** A full-width note explaining a whole illustrative panel. */
export function IllustrativeNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3",
        className,
      )}
    >
      <IllustrativeBadge />
      <p className="text-xs text-fog-400 leading-relaxed">{children}</p>
    </div>
  );
}
