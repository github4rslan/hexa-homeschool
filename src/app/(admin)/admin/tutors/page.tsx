import type { Metadata } from "next";
import { Calendar, ShieldCheck, Star, UserPlus } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listTutorBookingsAsStaff } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Tutor Marketplace" };

const TUTORS = [
  { id: "tut_001", name: "Dr. K. Patel", domains: ["mathematics"], status: "active", rating: 4.9, responseTime: 7, sessions: 142, dbsExpiry: "2027-08-12" },
  { id: "tut_002", name: "Ms. R. Foster", domains: ["english", "science"], status: "active", rating: 4.8, responseTime: 11, sessions: 87, dbsExpiry: "2027-03-04" },
  { id: "tut_003", name: "Mr. T. Begum", domains: ["science"], status: "active", rating: 4.7, responseTime: 9, sessions: 64, dbsExpiry: "2026-11-21" },
  { id: "tut_004", name: "Dr. A. Singh", domains: ["mathematics", "science"], status: "pending", rating: 0, responseTime: 0, sessions: 0, dbsExpiry: "—" },
  { id: "tut_005", name: "Ms. L. Chen", domains: ["english"], status: "verified", rating: 5.0, responseTime: 4, sessions: 12, dbsExpiry: "2027-12-30" },
  { id: "tut_006", name: "Mr. J. Adeyemi", domains: ["mathematics"], status: "active", rating: 4.6, responseTime: 14, sessions: 38, dbsExpiry: "2026-06-15" },
];

const statusBadge = {
  pending: { label: "Pending DBS", variant: "amber" as const },
  verified: { label: "Verified", variant: "cyan" as const },
  active: { label: "Active", variant: "neon" as const },
  suspended: { label: "Suspended", variant: "crimson" as const },
};

const ASSIGNMENTS = [
  { tutor: "Dr. K. Patel", child: "Amara T.", domain: "mathematics", scheduledAt: "today · 16:30", duration: 30 },
  { tutor: "Ms. R. Foster", child: "Noah F.", domain: "english", scheduledAt: "tomorrow · 09:00", duration: 45 },
  { tutor: "Dr. K. Patel", child: "Theo K.", domain: "mathematics", scheduledAt: "in 2 days · 17:00", duration: 30 },
];

export default async function TutorsPage() {
  const queue = await listTutorBookingsAsStaff(10);

  return (
    <>
      <AdminTopbar
        title="Tutor Marketplace"
        subtitle="Verified human tutors for safety net escalations"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Active tutors"
            value="48"
            delta={{ value: "+3", direction: "up" }}
            accent="neon"
          />
          <MetricCard
            label="Avg response time"
            value="9m"
            delta={{ value: "−2m", direction: "down", positive: true }}
            hint="from dispatch to live"
            accent="cyan"
          />
          <MetricCard
            label="Pending DBS"
            value="3"
            hint="awaiting verification"
            accent="amber"
          />
          <MetricCard
            label="Avg rating"
            value="4.81"
            hint="across 1,247 sessions"
            accent="violet"
          />
        </section>

        {queue.length > 0 && (
          <Card variant="glass-strong" padding="lg" className="mb-8">
            <div className="mb-5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-300" />
              <h2 className="text-lg font-semibold text-fog-50">
                Queued tutor requests
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {queue.map(({ booking, childName }) => (
                <div
                  key={booking._id?.toHexString()}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
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
                  </div>
                  <p className="text-sm text-fog-300">{booking.note}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <section className="grid lg:grid-cols-3 gap-5 mb-8">
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Tutor roster</h2>
              <Button variant="primary" size="sm">
                <UserPlus className="h-4 w-4" />
                Invite tutor
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {TUTORS.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-semibold">
                    {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fog-50">{t.name}</span>
                      <Badge variant={statusBadge[t.status as keyof typeof statusBadge].variant} size="sm">
                        {statusBadge[t.status as keyof typeof statusBadge].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-fog-500 mt-0.5 flex items-center gap-2">
                      {t.domains.map((d) => (
                        <span key={d} className="font-mono text-[10px] uppercase tracking-widest">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  {t.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-fog-200">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-mono">{t.rating}</span>
                    </div>
                  )}
                  <div className="text-xs text-fog-400 text-right font-mono">
                    <div>{t.sessions} sessions</div>
                    <div className="text-[10px] text-fog-600 mt-0.5">DBS exp {t.dbsExpiry}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass-strong" padding="lg">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="h-4 w-4 text-violet-300" />
              <h2 className="text-lg font-semibold text-fog-50">Scheduled assignments</h2>
            </div>
            <div className="flex flex-col gap-3">
              {ASSIGNMENTS.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-fog-50">{a.child}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                      {a.duration}min
                    </span>
                  </div>
                  <div className="text-xs text-fog-400 mb-1">{a.tutor}</div>
                  <div className="text-[10px] font-mono text-violet-300 uppercase tracking-widest">
                    {a.scheduledAt}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-white/5 flex items-center gap-2 text-[10px] text-fog-500 font-mono uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3 text-neon-400" />
              All tutors DBS-checked · UK-registered
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
