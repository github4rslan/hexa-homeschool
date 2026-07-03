import type { Metadata } from "next";
import {
  ChevronRight,
  Cpu,
  FileCheck,
  Mail,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAdminStats, adminRecentLogs } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Overview" };
export const dynamic = "force-dynamic";

function relativeTime(d: Date): string {
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();
  const recent = await adminRecentLogs(8);

  return (
    <>
      <AdminTopbar
        title="System Overview"
        subtitle="Live view of the Edway platform"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        {/* Real platform metrics */}
        <section className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Parent accounts"
              value={stats.parents.toLocaleString()}
              hint="total registered"
              accent="violet"
            />
            <MetricCard
              label="Children"
              value={stats.children.toLocaleString()}
              hint="learner profiles"
              accent="cyan"
            />
            <MetricCard
              label="Lessons this week"
              value={stats.lessonsThisWeek.toLocaleString()}
              hint="completed sessions"
              accent="neon"
            />
            <MetricCard
              label="Open escalations"
              value={stats.openEscalations.toLocaleString()}
              hint={stats.openEscalations > 0 ? "needs triage" : "all clear"}
              accent="crimson"
            />
          </div>
        </section>

        <section className="grid lg:grid-cols-5 gap-5 mb-8">
          {/* Real recent activity */}
          <Card variant="glass" padding="lg" className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">
                Recent learning activity
              </h2>
              <Badge variant="violet" size="sm">
                Live
              </Badge>
            </div>
            {recent.length > 0 ? (
              <ul className="flex flex-col gap-3 font-mono text-xs">
                {recent.map((l) => (
                  <li
                    key={l._id?.toHexString()}
                    className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-violet-400" />
                    <span className="text-fog-500 w-16 shrink-0">
                      {relativeTime(l.timestamp_start)}
                    </span>
                    <span className="font-semibold uppercase text-[10px] text-fog-400 tracking-wider w-16 shrink-0">
                      {l.status}
                    </span>
                    <span className="text-fog-200 flex-1 capitalize">
                      {l.topic_tag.replace(/_/g, " ")}
                      {l.mastery_score != null ? ` · ${l.mastery_score}%` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog-500 py-6 text-center">
                No lesson activity yet.
              </p>
            )}
          </Card>

          {/* Platform totals */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-fog-50 mb-5">
              Platform totals
            </h2>
            <ul className="flex flex-col gap-3">
              <TotalRow
                label="Newsletter subscribers"
                value={stats.newsletterSubscribers}
                href="/admin/newsletter"
              />
              <TotalRow label="Portfolios generated" value={stats.dossiers} />
              <TotalRow label="Parent accounts" value={stats.parents} />
              <TotalRow label="Children" value={stats.children} />
            </ul>
          </Card>
        </section>

        {/* Quick actions with real counts */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            icon={ShieldAlert}
            label="Triage escalations"
            href="/admin/escalations"
            badge={`${stats.openEscalations} open`}
            accent="crimson"
          />
          <QuickAction
            icon={Users}
            label="User management"
            href="/admin/users"
            badge={`${stats.parents} parents`}
            accent="violet"
          />
          <QuickAction
            icon={FileCheck}
            label="Curriculum CMS"
            href="/admin/curriculum"
            badge="3 subjects"
            accent="cyan"
          />
          <QuickAction
            icon={Mail}
            label="Newsletter"
            href="/admin/newsletter"
            badge={`${stats.newsletterSubscribers} subs`}
            accent="neon"
          />
        </section>

        <section className="mt-8">
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
              <Sparkles className="h-5 w-5 text-violet-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-fog-50">
                Metrics shown are live from the database
              </h3>
              <p className="text-xs text-fog-400">
                Overview, Users and Finance figures are computed from live data.
                Anything not yet computable (A/B experiments, churn, LA access)
                is clearly labelled &ldquo;Illustrative — not live&rdquo; on its page.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function TotalRow({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <span className="text-sm text-fog-200 group-hover:text-fog-50">
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-fog-50 tabular-nums">
        {value.toLocaleString()}
        {href && (
          <ChevronRight className="h-3.5 w-3.5 text-fog-600 group-hover:text-fog-300 transition-colors" />
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.02]">
      {inner}
    </li>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  badge,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge: string;
  accent: "violet" | "neon" | "cyan" | "amber" | "crimson";
}) {
  const colors = {
    violet: "border-violet-400/30 bg-violet-500/5 text-violet-300",
    neon: "border-neon-400/30 bg-neon-500/5 text-neon-400",
    cyan: "border-cyan-400/30 bg-cyan-500/5 text-cyan-400",
    amber: "border-amber-400/30 bg-amber-500/5 text-amber-400",
    crimson: "border-crimson-400/30 bg-crimson-500/5 text-crimson-400",
  };
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex items-center gap-4"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colors[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-fog-50">{label}</div>
        <div className="text-xs text-fog-500 font-mono">{badge}</div>
      </div>
      <Cpu className="h-4 w-4 text-fog-600 group-hover:text-fog-300 transition-colors" />
    </Link>
  );
}
