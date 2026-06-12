import { Skeleton } from "@/components/ui/skeleton";

/** Child-mode loading: big calm blocks, no spinners, nothing flashing. */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-2xl px-6 py-12"
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="h-8 w-56 mb-8 rounded-2xl" />
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8">
        <Skeleton className="h-10 w-4/5 mb-8 rounded-2xl" />
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
