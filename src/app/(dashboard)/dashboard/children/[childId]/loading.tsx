import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * Child-profile loading (F3): a shape-matched skeleton so navigating to a
 * child's profile no longer flashes the root "Initialising" text splash while
 * the (force-dynamic) page fetches. Big calm blocks, nothing flashing.
 */
export default function Loading() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <PageSkeleton wide cards={4} />
    </div>
  );
}
