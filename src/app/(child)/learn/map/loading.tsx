import { Skeleton } from "@/components/ui/skeleton";

/**
 * "My journey" loading (F4): a calm back link, a centred title block, a badge
 * shelf row and the three subject paths — matching the real layout so the swap
 * doesn't jump. Big calm blocks, no spinners; reduced-motion is globally
 * neutralised in globals.css.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl" role="status" aria-label="Loading">
      <Skeleton className="mb-6 h-6 w-20 rounded-2xl" />

      <div className="mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <Skeleton className="h-6 w-96 max-w-full rounded-2xl" />
      </div>

      {/* Badge shelf */}
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-20 rounded-2xl" />
        ))}
      </div>

      {/* Subject paths */}
      <div className="flex flex-col gap-12">
        {[0, 1, 2].map((s) => (
          <div key={s}>
            <Skeleton className="mb-4 h-7 w-40 rounded-2xl" />
            <div className="grid gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-3xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
