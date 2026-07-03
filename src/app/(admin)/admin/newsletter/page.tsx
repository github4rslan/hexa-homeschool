import type { Metadata } from "next";
import Link from "next/link";
import { Download, Mail } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminListNewsletterSubscribers } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Newsletter" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function NewsletterSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await adminListNewsletterSubscribers({ page, pageSize: PAGE_SIZE });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);

  return (
    <>
      <AdminTopbar
        title="Newsletter subscribers"
        subtitle="Everyone who signed up for weekly tips — newest first"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px]">
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <MetricCard
              label="Total subscribers"
              value={result.total.toLocaleString()}
              hint="all-time"
              accent="neon"
            />
          </div>
          {result.total > 0 && (
            <a
              href="/admin/newsletter/export"
              download
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 text-sm font-medium text-neon-400 hover:bg-neon-500/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          )}
        </section>

        <Card variant="glass" padding="none" className="overflow-hidden">
          {result.rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-fog-500">
              No subscribers yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {result.rows.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 sm:px-6 py-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30 text-neon-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-mono text-fog-50 truncate">
                      {s.email}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" size="sm">
                        {s.source}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-fog-500 font-mono shrink-0 tabular-nums">
                    {s.subscribedAt}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 sm:px-6 py-3 border-t border-white/5 flex items-center justify-between gap-3 text-xs text-fog-500">
            <span>
              {from}–{to} of {result.total} · page {result.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link
                  href={`/admin/newsletter?page=${result.page - 1}`}
                  className="h-9 inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 hover:bg-white/[0.06]"
                >
                  Previous
                </Link>
              )}
              {result.page < totalPages && (
                <Link
                  href={`/admin/newsletter?page=${result.page + 1}`}
                  className="h-9 inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 hover:bg-white/[0.06]"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
