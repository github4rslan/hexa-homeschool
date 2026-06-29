"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { MasteryCertificate } from "@/lib/db/repo";

/**
 * Print-beautiful mastery certificate — grandparent-fridge-worthy. Child's
 * first name, the achievement, the date and a Edway seal, with the verification
 * hash in small print (tying delight to the compliance story). "Download as
 * PDF" uses the browser's print-to-PDF via print CSS — same pattern as the
 * monthly report, no PDF library. On-screen chrome is hidden when printing.
 */
export function CertificateView({
  certificate,
  childId,
}: {
  certificate: MasteryCertificate;
  childId: string;
}) {
  const dateLabel = certificate.achievedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="cert-root min-h-screen bg-void px-6 py-10 print:bg-white print:px-0 print:py-0">
      <style>{`
        @media print {
          .cert-noprint { display: none !important; }
          .cert-paper { box-shadow: none !important; background: #fff !important; color: #14110E !important; max-width: none !important; margin: 0 !important; }
          .cert-paper * { color: #14110E !important; }
          .cert-gold { color: #B8893A !important; }
          @page { size: landscape; margin: 14mm; }
        }
      `}</style>

      <div className="cert-noprint mx-auto mb-6 flex max-w-4xl items-center justify-between">
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

      <article className="cert-paper mx-auto max-w-4xl rounded-3xl border-4 border-amber-400/30 bg-white/[0.03] p-12 text-center shadow-2xl print:rounded-none print:border-amber-700">
        {/* Seal */}
        <div className="mb-8 flex justify-center">
          <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
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
              H
            </text>
          </svg>
        </div>

        <p className="cert-gold text-xs font-mono uppercase tracking-[0.4em] text-amber-300">
          Certificate of mastery
        </p>

        <p className="mt-8 text-sm text-fog-400">This certifies that</p>
        <h1 className="mt-2 font-serif text-5xl font-semibold text-fog-50">
          {certificate.childFirstName}
        </h1>

        <p className="mt-8 text-base text-fog-300">has demonstrated mastery of all</p>
        <p className="mt-1 text-2xl font-semibold text-fog-50">
          {certificate.topicsCertified} {certificate.subjectLabel} topics
        </p>

        <p className="mt-8 text-sm text-fog-400">Awarded {dateLabel}</p>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-fog-500">
            Verified by Edway · tamper-evident reference
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-fog-600">
            {certificate.verificationHash}
          </p>
        </div>
      </article>
    </div>
  );
}
