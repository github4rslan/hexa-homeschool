import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Fingerprint, ShieldCheck, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { verifyDossierHash } from "@/lib/db/repo";

export const metadata: Metadata = {
  title: "Verify portfolio",
  description: "Verify an Edway Local Authority portfolio hash.",
};

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function VerifyPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ hash?: string }>;
}) {
  const { hash = "" } = await searchParams;
  const verification = hash ? await verifyDossierHash(hash) : null;

  return (
    <main className="relative min-h-screen px-6 py-10 text-fog-50">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
          <HexaLogo size={30} withText />
        </Link>

        <Card variant="glass-strong" padding="xl">
          <div className="mb-6 flex items-start gap-4">
            <div
              className={[
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border",
                verification
                  ? "border-neon-400/30 bg-neon-500/10 text-neon-300"
                  : "border-crimson-400/30 bg-crimson-500/10 text-crimson-300",
              ].join(" ")}
            >
              {verification ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <XCircle className="h-7 w-7" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                Local Authority verification
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-fog-50">
                {verification ? "Portfolio verified" : "Portfolio not verified"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-fog-400">
                {verification
                  ? "This hash matches a generated Edway education portfolio record."
                  : "We could not find a generated Edway portfolio for this hash. Check the link or ask the parent to resend the portfolio."}
              </p>
            </div>
          </div>

          {verification ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-wider text-fog-500">
                    Child
                  </div>
                  <div className="mt-1 text-lg font-semibold text-fog-100">
                    {verification.childFirstName}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-wider text-fog-500">
                    Reporting period
                  </div>
                  <div className="mt-1 text-lg font-semibold text-fog-100">
                    {verification.reportingPeriod}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 sm:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-fog-500">
                    Generated
                  </div>
                  <div className="mt-1 text-lg font-semibold text-fog-100">
                    {formatDate(verification.generatedAt)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neon-400/20 bg-neon-500/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neon-300">
                  <ShieldCheck className="h-4 w-4" />
                  Verified hash
                </div>
                <code className="block break-all rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-fog-200">
                  {verification.secureHash}
                </code>
              </div>

              <p className="flex items-start gap-2 text-xs leading-relaxed text-fog-500">
                <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-fog-400" />
                Any alteration to the portfolio content produces a different
                SHA-256 hash. This page confirms the supplied hash exists in
                Edway&apos;s generated dossier record.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-wider text-fog-500">
                Submitted hash
              </div>
              <code className="mt-2 block break-all text-xs text-fog-400">
                {hash || "No hash supplied"}
              </code>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
