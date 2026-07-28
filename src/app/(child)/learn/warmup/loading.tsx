import { Skeleton } from "@/components/ui/skeleton";

/**
 * Warm-up loading (F4): the same single-question card shape as the lesson
 * skeleton (prompt + answer options), so the spaced-repetition review opens
 * without a jump.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-2 py-4" role="status" aria-label="Loading">
      <Skeleton className="mb-8 h-2.5 w-full rounded-full" />

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8">
        <Skeleton className="mb-3 h-8 w-3/4 rounded-2xl" />
        <Skeleton className="mb-8 h-8 w-1/2 rounded-2xl" />
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
