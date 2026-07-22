import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClock, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSession } from "@/lib/auth/session";
import { findParentById, listTutorSessionsForTutor } from "@/lib/db/repo";
import { updateTutorAvailability } from "./actions";

export const metadata: Metadata = { title: "Tutor sessions" };
export const dynamic = "force-dynamic";

export default async function TutorHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?redirect=/tutor");
  const account = await findParentById(session.id);
  const available = account?.tutor_available !== false; // undefined = available
  const sessions = await listTutorSessionsForTutor(session.id);
  const upcoming = sessions.filter((s) => s.booking.status === "scheduled");
  const completed = sessions.filter((s) => s.booking.status === "completed");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-fog-50">Assigned sessions</h1>
        <p className="mt-1 text-sm text-fog-400">
          Join scheduled rooms, message families, and complete notes after tutoring.
        </p>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-400">
          Availability saved.
        </div>
      )}

      <Card variant="glass" padding="lg" className="mb-8">
        <form
          action={updateTutorAvailability}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
            <input
              type="checkbox"
              name="tutor_available"
              defaultChecked={available}
              className="mt-0.5 rounded border-white/10 bg-white/5"
            />
            <span>
              Available for new sessions
              <span className="block text-xs text-fog-500 mt-0.5">
                Let staff know whether you&apos;re currently accepting assignments.
                Advisory only — this doesn&apos;t change existing bookings.
              </span>
            </span>
          </label>
          <SubmitButton variant="secondary" size="md" pendingLabel="Saving…">
            Save availability
          </SubmitButton>
        </form>
      </Card>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card variant="glass" padding="md">
          <div className="text-xs uppercase tracking-widest text-fog-500">Upcoming</div>
          <div className="mt-2 text-3xl font-semibold text-fog-50">{upcoming.length}</div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="text-xs uppercase tracking-widest text-fog-500">Completed</div>
          <div className="mt-2 text-3xl font-semibold text-fog-50">{completed.length}</div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="text-xs uppercase tracking-widest text-fog-500">Video</div>
          <div className="mt-2 text-3xl font-semibold text-fog-50">Jitsi</div>
        </Card>
      </section>

      <Card variant="glass-strong" padding="lg">
        <div className="mb-5 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-violet-300" />
          <h2 className="text-lg font-semibold text-fog-50">Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-sm text-fog-400">
            No sessions assigned yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map(({ booking, childName, parentName }) => {
              const id = booking._id?.toHexString() ?? "";
              return (
                <li
                  key={id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={booking.status === "scheduled" ? "violet" : "neon"} size="sm">
                      {booking.status}
                    </Badge>
                    <span className="font-semibold text-fog-50">{childName}</span>
                    <span className="text-sm text-fog-400">Parent: {parentName}</span>
                    <span className="flex-1 text-sm text-fog-400">
                      {booking.topic_title ?? booking.subject ?? "General tutoring"}
                    </span>
                    <Button href={`/tutor/sessions/${id}`} variant="secondary" size="sm">
                      <Video className="h-4 w-4" />
                      Open
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-fog-300">{booking.note}</p>
                  {booking.scheduled_at && (
                    <p className="mt-1 text-xs text-fog-500">
                      {new Date(booking.scheduled_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {booking.duration_minutes ? ` · ${booking.duration_minutes} min` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
