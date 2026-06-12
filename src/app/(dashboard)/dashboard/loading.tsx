import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <PageSkeleton cards={3} wide />
    </div>
  );
}
