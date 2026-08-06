import { Skeleton } from "@/components/ui/skeleton";

/**
 * Parent lesson-preview loading (F3): a calm card matching the lesson-player
 * shape (prompt block + answer options) so the "Start a lesson" bootstrap no
 * longer flashes the root "Initialising" text splash before the real player
 * mounts. Big calm blocks, no spinners.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-2xl px-6 py-10"
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="mb-6 h-4 w-40" />
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
