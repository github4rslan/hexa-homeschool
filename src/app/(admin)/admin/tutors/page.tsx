import type { Metadata } from "next";
import { Calendar, ShieldCheck, Star } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTutorAccounts, listTutorBookingsAsStaff } from "@/lib/db/repo";
import {
  CreateTutorAccountForm,
  TutorScheduleForm,
  TutorSessionForm,
} from "./tutor-session-form";

export const metadata: Metadata = { title: "Admin · Tutor Marketplace" };
export const dynamic = "force-dynamic";

export default async function TutorsPage() {
  const [queue, tutors] = await Promise.all([
    listTutorBookingsAsStaff(30),
    listTutorAccounts(),
  ]);
  const requested = queue.filter(({ booking }) => booking.status === "requested");
  const scheduled = queue.filter(({ booking }) => booking.status === "scheduled");
  const activeTutors = tutors.filter((t) => t.active);

  return (
    <>
      <AdminTopbar
        title="Tutor Marketplace"
        subtitle="Tutor accounts, scheduling, video rooms, and completed session notes"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Active tutors" value={String(activeTutors.length)} accent="neon" />
          <MetricCard
            label="Queued requests"
            value={String(requested.length)}
            hint="awaiting scheduling"
            accent="cyan"
          />
          <MetricCard
            label="Scheduled"
            value={String(scheduled.length)}
            hint="rooms created"
            accent="amber"
          />
          <MetricCard label="Provider" value="Jitsi" hint="free video rooms" accent="violet" />
        </section>

        <Card variant="glass-strong" padding="lg" className="mb-8">
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-300" />
            <h2 className="text-lg font-semibold text-fog-50">Tutor requests</h2>
          </div>
          {queue.length === 0 ? (
            <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-fog-400">
              No active tutor requests right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {queue.map(({ booking, childName, parentName, tutorName }) => {
                const bookingId = booking._id?.toHexString() ?? "";
                return (
                  <div
                    key={bookingId}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <Badge
                        variant={booking.source === "remediation" ? "amber" : "outline"}
                        size="sm"
                      >
                        {booking.source === "remediation" ? "Remediation" : "Parent"}
                      </Badge>
                      <span className="font-semibold text-fog-50">{childName}</span>
                      <span className="text-sm text-fog-400">
                        {booking.topic_title ?? booking.subject ?? "General support"}
                      </span>
                      <Badge
                        variant={booking.status === "scheduled" ? "violet" : "amber"}
                        size="sm"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="mb-1 text-xs text-fog-500">
                      Parent: {parentName}
                      {tutorName ? ` · Tutor: ${tutorName}` : ""}
                      {booking.scheduled_at
                        ? ` · ${new Date(booking.scheduled_at).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`
                        : ""}
                    </p>
                    <p className="text-sm text-fog-300">{booking.note}</p>

                    <TutorScheduleForm bookingId={bookingId} tutors={tutors} />
                    <TutorSessionForm
                      bookingId={bookingId}
                      placeholder={
                        booking.source === "remediation" && booking.topic_title
                          ? `A tip for ${childName} on ${booking.topic_title} - surfaces in their next lesson`
                          : "Session notes"
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <section className="grid lg:grid-cols-3 gap-5 mb-8">
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fog-50">Tutor roster</h2>
            </div>
            <div className="flex flex-col gap-2">
              {tutors.length === 0 && (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-fog-400">
                  No tutor accounts yet. Create the first tutor login from the panel.
                </p>
              )}
              {tutors.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/15"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-semibold text-white">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-fog-50">
                        {t.name}
                      </span>
                      <Badge variant={t.active ? "neon" : "crimson"} size="sm">
                        {t.active ? "Active" : "Suspended"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-fog-500">
                      {t.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-fog-200">
                    <Star className="h-3 w-3 text-amber-400" />
                    <span className="font-mono">Tutor</span>
                  </div>
                  <div className="text-right font-mono text-xs text-fog-400">
                    <div>Created</div>
                    <div className="mt-0.5 text-[10px] text-fog-600">
                      {new Date(t.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass-strong" padding="lg">
            <CreateTutorAccountForm />
            <div className="mt-5 flex items-center gap-2 border-t border-white/5 pt-5 font-mono text-[10px] uppercase tracking-widest text-fog-500">
              <ShieldCheck className="h-3 w-3 text-neon-400" />
              Tutor access is separate from admin
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
