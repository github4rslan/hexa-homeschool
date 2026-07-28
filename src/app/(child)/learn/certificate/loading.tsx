import { Skeleton } from "@/components/ui/skeleton";

/** Certificate loading (F4): the toolbar row + the certificate paper block. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-2 py-4" role="status" aria-label="Loading">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-40 rounded-2xl" />
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-10 sm:p-14">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-48 rounded-2xl" />
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-6 w-56 rounded-2xl" />
          <Skeleton className="h-4 w-40 rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
