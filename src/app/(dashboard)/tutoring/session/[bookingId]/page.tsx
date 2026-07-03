import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoRoom } from "@/components/tutoring/video-room";
import { currentParentId, getTutorBookingForParent } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Tutoring room" };
export const dynamic = "force-dynamic";

export default async function ParentTutorRoomPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/tutoring");
  const { bookingId } = await params;
  const detail = await getTutorBookingForParent(parentId, bookingId);
  if (!detail) notFound();

  const { booking, childName, tutorName } = detail;
  if (booking.status !== "scheduled" || !booking.video_room_name) {
    redirect("/tutoring");
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader
          title="Tutoring room"
          description="Join from a quiet space with camera and microphone enabled."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Tutoring", href: "/tutoring" },
            { label: "Room" },
          ]}
          backFallback="/tutoring"
          action={
            <Button href="/tutoring" variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          }
        />

        <Card variant="glass" padding="lg" className="mb-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-fog-200">
            <Badge variant="violet" size="sm">{childName}</Badge>
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-4 w-4 text-cyan-300" />
              {tutorName ?? "Tutor"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-amber-300" />
              {booking.scheduled_at
                ? new Date(booking.scheduled_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Scheduled"}
              {booking.duration_minutes ? ` · ${booking.duration_minutes} min` : ""}
            </span>
          </div>
        </Card>

        <VideoRoom roomName={booking.video_room_name} displayName={`Parent - ${childName}`} />
      </main>
    </div>
  );
}
