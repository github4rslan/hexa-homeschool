import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lesson loading: a calm card matching the daily-flow shape (phase bar, a big
 * prompt block, answer options) so the swap to the real lesson doesn't jump.
 * Big calm blocks, no spinners — the same register as the learn-hub skeleton.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-2xl px-6 py-10"
      role="status"
      aria-label="Loading"
    >
      {/* Phase bar */}
      <div className="mb-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-2.5 flex-1 rounded-full" />
        ))}
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8">
        {/* Prompt */}
        <Skeleton className="mb-3 h-8 w-3/4 rounded-2xl" />
        <Skeleton className="mb-8 h-8 w-1/2 rounded-2xl" />

        {/* Answer options */}
        <div className="grid gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-3xl" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
