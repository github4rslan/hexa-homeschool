import { cn } from "@/lib/utils";

/** Shimmer block — compose these into per-route loading skeletons. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-white/[0.06]", className)}
    />
  );
}

/**
 * Generic dashboard-page skeleton: header band + content cards mirroring the
 * typical page rhythm so the swap to real content doesn't jump the layout.
 */
export function PageSkeleton({
  cards = 2,
  wide = false,
}: {
  cards?: number;
  wide?: boolean;
}) {
  return (
    <div
      className={cn("mx-auto px-6 py-10 lg:py-16", wide ? "max-w-4xl" : "max-w-3xl")}
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-9 w-72 mb-3" />
      <Skeleton className="h-4 w-96 max-w-full mb-10" />
      <div className="flex flex-col gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
          >
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2.5" />
            <Skeleton className="h-4 w-5/6 mb-2.5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
