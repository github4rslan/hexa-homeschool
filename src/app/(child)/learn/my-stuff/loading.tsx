import { Skeleton } from "@/components/ui/skeleton";

/** "My stuff" loading (F4): title + a stack of settings cards. Calm blocks. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl" role="status" aria-label="Loading">
      <Skeleton className="mb-6 h-6 w-20 rounded-2xl" />

      <div className="mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-6 w-80 max-w-full rounded-2xl" />
      </div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/5 bg-white/[0.02] p-6"
          >
            <Skeleton className="mb-3 h-6 w-2/5 rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-3xl" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
