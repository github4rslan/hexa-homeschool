import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VideoRoom } from "@/components/tutoring/video-room";
import { getSession } from "@/lib/auth/session";
import {
  getTutorSessionForTutor,
  listThreadMessagesAsStaff,
} from "@/lib/db/repo";
import { CompleteSessionForm } from "../../complete-session-form";
import { TutorMessageThread } from "../../tutor-message-thread";

export const metadata: Metadata = { title: "Tutor session" };
export const dynamic = "force-dynamic";

export default async function TutorSessionPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/tutor");
  const { bookingId } = await params;
  const detail = await getTutorSessionForTutor(session.id, bookingId);
  if (!detail) notFound();

  const { booking, childName, parentName, parentEmail } = detail;
  const messages = await listThreadMessagesAsStaff("booking", bookingId);
  const roomReady = booking.status === "scheduled" && booking.video_room_name;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button href="/tutor" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Sessions
        </Button>
        <Badge variant={booking.status === "completed" ? "neon" : "violet"} size="sm">
          {booking.status}
        </Badge>
        <h1 className="text-xl font-semibold text-fog-50">{childName}</h1>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card variant="glass" padding="lg" className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 text-sm text-fog-200">
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-4 w-4 text-cyan-300" />
              {parentName} · {parentEmail}
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
          <p className="mt-3 text-sm text-fog-300">{booking.note}</p>
          {booking.topic_title && (
            <p className="mt-2 text-xs uppercase tracking-widest text-fog-500">
              Topic: {booking.topic_title}
            </p>
          )}
        </Card>
        <Card variant="glass-strong" padding="lg">
          {booking.status === "completed" ? (
            <p className="text-sm text-neon-300">This session has been completed.</p>
          ) : (
            <CompleteSessionForm bookingId={bookingId} />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {roomReady ? (
            <VideoRoom roomName={booking.video_room_name!} displayName={`Tutor - ${childName}`} />
          ) : (
            <Card variant="glass" padding="lg">
              <p className="text-sm text-fog-400">
                The room is not available because this session is not scheduled.
              </p>
            </Card>
          )}
        </div>
        <TutorMessageThread
          bookingId={bookingId}
          messages={messages.map((m) => ({
            id: m._id!.toHexString(),
            sender: m.sender,
            body: m.body,
            createdAt: m.created_at.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
