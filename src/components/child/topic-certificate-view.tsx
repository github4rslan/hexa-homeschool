"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { TopicCertificate } from "@/lib/db/repo";

/**
 * F5 — a print-beautiful, child-facing certificate for a single mastered topic,
 * shown the moment a topic is certified ("Save my certificate"). Child mode is
 * fixed-light, so the certificate reads warm on screen and prints clean.
 * "Save as PDF" uses the browser's print-to-PDF (no PDF library, same pattern as
 * the parent mastery certificate). Carries no PII beyond the child's first name.
 */
export function TopicCertificateView({
  certificate,
}: {
  certificate: TopicCertificate;
}) {
  const dateLabel = certificate.achievedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="cert-root mx-auto max-w-3xl px-2 py-4 print:px-0 print:py-0">
      <style>{`
        @media print {
          .cert-noprint { display: none !important; }
          .cert-paper { box-shadow: none !important; max-width: none !important; margin: 0 !important; }
          @page { size: landscape; margin: 14mm; }
        }
      `}</style>

      <div className="cert-noprint mb-6 flex items-center justify-between">
        <Link
          href="/learn/map"
          className="child-touch inline-flex items-center gap-2 text-base text-fog-500 hover:text-fog-700"
        >
          <ArrowLeft className="h-5 w-5" /> Back to my journey
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="child-touch inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-5 py-3 text-base font-semibold text-white shadow-lg"
        >
          <Printer className="h-5 w-5" /> Save my certificate
        </button>
      </div>

      <article className="cert-paper mx-auto rounded-3xl border-4 border-amber-300 bg-white p-10 text-center shadow-2xl sm:p-14 print:rounded-none">
        {/* Seal */}
        <div className="mb-6 flex justify-center">
          <svg width="88" height="88" viewBox="0 0 96 96" aria-hidden>
            <circle cx="48" cy="48" r="44" fill="none" stroke="#B8893A" strokeWidth="2" />
            <circle cx="48" cy="48" r="36" fill="none" stroke="#B8893A" strokeWidth="1" opacity="0.6" />
            <text
              x="48"
              y="58"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontSize="34"
              fontWeight="700"
              fill="#B8893A"
            >
              E
            </text>
          </svg>
        </div>

        <p className="text-xs font-mono uppercase tracking-[0.4em] text-amber-600">
          Certificate of mastery
        </p>

        <p className="mt-8 text-sm text-neutral-500">This certifies that</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-neutral-900 sm:text-5xl">
          {certificate.childFirstName}
        </h1>

        <p className="mt-8 text-base text-neutral-600">has mastered</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">
          {certificate.topicTitle}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {certificate.subjectLabel}
        </p>

        <p className="mt-8 text-sm text-neutral-500">Awarded {dateLabel}</p>

        <div className="mt-10 border-t border-neutral-200 pt-6">
          <p className="text-xs text-neutral-400">
            Verified by Edway · tamper-evident reference
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-neutral-400">
            {certificate.verificationHash}
          </p>
        </div>
      </article>
    </div>
  );
}
