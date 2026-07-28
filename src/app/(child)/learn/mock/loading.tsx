import { Skeleton } from "@/components/ui/skeleton";

/** Mock-exam hub loading (F4): title + the three subject mock cards. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl" role="status" aria-label="Loading">
      <Skeleton className="mb-6 h-6 w-20 rounded-2xl" />

      <div className="mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-6 w-80 max-w-full rounded-2xl" />
      </div>

      <div className="grid gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
