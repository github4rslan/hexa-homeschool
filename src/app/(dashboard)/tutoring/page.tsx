import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, Check, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  currentParentId,
  tutorQuota,
  listTutorBookings,
} from "@/lib/db/repo";
import { requestTutor } from "./actions";

export const metadata: Metadata = { title: "Human tutoring" };
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};
const STATUS_VARIANT: Record<string, "violet" | "neon" | "amber" | "outline"> = {
  requested: "amber",
  scheduled: "violet",
  completed: "neon",
  cancelled: "outline",
};

export default async function TutoringPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/tutoring");

  const { used, limit } = await tutorQuota(parentId);
  const bookings = await listTutorBookings(parentId);
  const remaining = Math.max(0, limit - used);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <main className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
        <PageHeader
          title="Human tutoring"
          description="When AI reaches its limit, a real tutor steps in. Book a session for your active child."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Tutoring" },
          ]}
          backFallback="/dashboard"
          action={
            <Badge variant={remaining > 0 ? "neon" : "amber"} size="lg">
              {remaining} of {limit} left this month
            </Badge>
          }
        />

        {sp.booked && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-400">
            <Check className="h-4 w-4" /> Session requested — our team will confirm a time.
          </div>
        )}
        {sp.error && (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            {sp.error}
          </div>
        )}

        <Card variant="glass-strong" padding="xl" className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-4 w-4 text-violet-300" />
            <h2 className="text-lg font-semibold text-fog-50">
              Book a tutor session
            </h2>
          </div>

          {limit === 0 ? (
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
              <p className="text-sm text-fog-200">
                Live tutor sessions are included on HEXA Complete (1/month) and
                HEXA Partner (3/month). Upgrade your plan to book a session.
              </p>
              <Button href="/pricing" variant="secondary" size="md" className="mt-4">
                See plans
              </Button>
            </div>
          ) : (
            <form action={requestTutor} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-fog-300">
                  Subject
                </label>
                <select
                  name="subject"
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                >
                  <option value="mathematics">Maths</option>
                  <option value="english">English</option>
                  <option value="science">Science</option>
                </select>
              </div>
              <Input
                name="requested_slot"
                label="Preferred time"
                placeholder="e.g. Weekday mornings, or Tue 4pm"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-fog-300">
                  What should the tutor focus on?
                </label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="e.g. Stuck on fractions; gets frustrated with word problems."
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="self-start"
                disabled={remaining === 0}
              >
                {remaining === 0 ? "No sessions left this month" : "Request session"}
              </Button>
            </form>
          )}
        </Card>

        {bookings.length > 0 && (
          <Card variant="glass" padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-base font-semibold text-fog-50">
                Your requests
              </h3>
            </div>
            <ul className="flex flex-col gap-3">
              {bookings.map((b) => (
                <li
                  key={b._id?.toHexString()}
                  className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <Badge variant="outline" size="sm">
                    {b.subject ? SUBJECT_LABEL[b.subject] : "General"}
                  </Badge>
                  <span className="flex-1 text-sm text-fog-300 truncate">
                    {b.requested_slot || "Any time"}
                  </span>
                  <Badge variant={STATUS_VARIANT[b.status] ?? "outline"} size="sm">
                    {b.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}
