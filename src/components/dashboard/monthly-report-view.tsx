"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { MonthlyReport } from "@/lib/db/repo";
import type { Subject } from "@/lib/db/types";

/**
 * Print-optimized monthly progress report — also serves as local-authority
 * evidence, so the tone is factual + warm and the header carries the child's
 * name, period and generation date. "Download as PDF" is the browser's
 * print-to-PDF via print CSS (no PDF library). On-screen chrome (nav, buttons)
 * is hidden when printing.
 */
export function MonthlyReportView({
  report,
  childId,
  subjectLabels,
}: {
  report: MonthlyReport;
  childId: string;
  subjectLabels: Record<Subject, string>;
}) {
  const hasActivity =
    report.lessonsCompleted > 0 ||
    report.topicsCertified.length > 0 ||
    report.evaluations.length > 0;

  return (
    <div className="report-root min-h-screen bg-void px-6 py-10 print:bg-white print:px-0 print:py-0">
      <style>{`
        @media print {
          .report-noprint { display: none !important; }
          .report-paper { box-shadow: none !important; border: none !important; background: white !important; color: #1a1a1a !important; max-width: none !important; margin: 0 !important; padding: 24px !important; }
          .report-paper * { color: #1a1a1a !important; }
          .report-muted { color: #555 !important; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div className="report-noprint mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <Link
          href={`/dashboard/children/${childId}`}
          className="inline-flex items-center gap-2 text-sm text-fog-300 hover:text-fog-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2 text-sm font-medium text-white"
        >
          <Printer className="h-4 w-4" /> Download as PDF
        </button>
      </div>

      <article className="report-paper mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-fog-100 shadow-2xl print:rounded-none">
        {/* Header */}
        <header className="mb-8 border-b border-white/10 pb-6">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-semibold text-fog-50">
              Monthly progress report
            </h1>
            <span className="text-sm report-muted text-fog-400">Edway</span>
          </div>
          <p className="mt-2 text-lg text-fog-100">{report.childName}</p>
          <p className="text-sm report-muted text-fog-400">
            {report.periodLabel} · generated{" "}
            {report.generatedAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </header>

        {!hasActivity ? (
          <p className="report-muted text-fog-300">
            No learning activity was recorded for {report.childName.split(" ")[0]}{" "}
            during {report.periodLabel}. Lessons, certified topics and assessment
            results will appear here once the month has activity.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Summary numbers */}
            <section className="grid grid-cols-3 gap-4">
              <Stat label="Lessons completed" value={report.lessonsCompleted} />
              <Stat label="Active days" value={report.activeDays} />
              <Stat label="Topics certified" value={report.topicsCertified.length} />
            </section>

            {/* Certified topics */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fog-300 report-muted">
                Topics certified this month
              </h2>
              {report.topicsCertified.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {report.topicsCertified.map((t, i) => (
                    <li key={i} className="text-sm text-fog-100">
                      {t.title}{" "}
                      <span className="report-muted text-fog-500">
                        · {subjectLabels[t.subject]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm report-muted text-fog-400">
                  No topics were certified this month — steady practice continues.
                </p>
              )}
            </section>

            {/* Assessments */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fog-300 report-muted">
                Assessments
              </h2>
              {report.evaluations.length > 0 ? (
                <div className="-mx-1 overflow-x-auto px-1 print:overflow-visible">
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <thead>
                    <tr className="report-muted text-fog-500">
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="whitespace-nowrap pb-2 font-medium">Working grade</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.evaluations.map((e, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-2 text-fog-100">{subjectLabels[e.subject]}</td>
                        <td className="py-2 report-muted text-fog-400">
                          {e.mock ? "Mock exam" : "Diagnostic"}
                        </td>
                        <td className="py-2 text-fog-100">{e.grade ?? "—"}</td>
                        <td className="py-2 report-muted text-fog-400">
                          {e.at.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : (
                <p className="text-sm report-muted text-fog-400">
                  No assessments were taken this month.
                </p>
              )}
            </section>

            {/* Next month's focus */}
            {report.nextFocus.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fog-300 report-muted">
                  Next month&apos;s focus
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {report.nextFocus.map((t, i) => (
                    <li key={i} className="text-sm text-fog-100">
                      {t.title}{" "}
                      <span className="report-muted text-fog-500">
                        · {subjectLabels[t.subject]}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Compliance framing */}
        <footer className="mt-8 border-t border-white/10 pt-6 text-xs report-muted text-fog-500">
          <p>
            This report summarises structured home education provision for{" "}
            {report.childName} during {report.periodLabel}. It forms part of the
            evidence base available to your local authority. A full verified
            portfolio with work evidence and a tamper-evident hash can be
            generated from the{" "}
            <Link
              href="/portfolio"
              className="text-violet-300 underline print:text-blue-700"
            >
              portfolio page
            </Link>
            .
          </p>
        </footer>
      </article>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 print:border-gray-200">
      <div className="text-2xl font-semibold text-fog-50">{value}</div>
      <div className="text-xs report-muted text-fog-400">{label}</div>
    </div>
  );
}
