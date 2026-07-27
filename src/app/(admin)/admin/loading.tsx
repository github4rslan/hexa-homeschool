import { Skeleton } from "@/components/ui/skeleton";

/**
 * Admin content skeleton — mirrors the topbar + metric-grid + panel rhythm so
 * navigating between admin pages swaps in shape, never the generic centred
 * "Initialising" splash (F7). The persistent sidebar comes from the layout.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex-1">
      {/* Topbar band */}
      <div className="border-b border-white/5 px-6 py-5 lg:px-10">
        <Skeleton className="mb-2 h-6 w-56" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>

      <div className="p-6 lg:p-10">
        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <Skeleton className="mb-3 h-3.5 w-24" />
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Content panels */}
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:col-span-3">
            <Skeleton className="mb-5 h-5 w-40" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:col-span-2">
            <Skeleton className="mb-5 h-5 w-32" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
