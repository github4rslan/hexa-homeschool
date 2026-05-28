import { LessonPlayer } from "@/components/lesson/lesson-player";

export default function LessonPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-violet opacity-20 -z-10 pointer-events-none" />
      <div className="px-6 py-10 lg:px-10 lg:py-16">
        <LessonPlayer />
      </div>
    </div>
  );
}
