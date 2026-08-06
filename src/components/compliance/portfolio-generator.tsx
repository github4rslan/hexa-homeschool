"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Check,
  Copy,
  FileCheck,
  Fingerprint,
  Loader2,
  Mail,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { VerifiedPortfolio } from "@/lib/compliance/portfolio";
import { emailPortfolio } from "@/app/(dashboard)/portfolio/actions";

/**
 * Cloudinary delivery thumbnail — mirrors `cloudinaryThumb` but inlined here
 * (that helper lives in a server-only module). Pure string work; no-op for
 * non-Cloudinary URLs. Full-res still opens via the anchor href.
 */
function thumbUrl(url: string, width = 320): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace(
    /\/(upload|authenticated)\/(?!.*\/(upload|authenticated)\/)/,
    `/$1/f_auto,q_auto,w_${width},c_limit/`,
  );
}

type PortfolioResponse = VerifiedPortfolio & {
  persisted?: boolean;
  readiness?: {
    status: "complete" | "in_progress";
    certifiedTopics: number;
    totalTopics: number;
    mocksTaken: number;
    totalMocks: number;
    lessonsCompleted: number;
    workEvidenceCount: number;
    latestGrade: number | null;
    subjects: {
      subject: string;
      label: string;
      certifiedTopics: number;
      totalTopics: number;
      mockTaken: boolean;
      mockGrade: string | null;
      latestGrade: string | null;
      gradeSource: string | null;
      assessedAt: string | null;
    }[];
  } | null;
};

type WorkEvidenceItem = NonNullable<VerifiedPortfolio["workEvidence"]>[number];

function formatUkDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
    timeZoneName: "short",
  });
}

const DEFAULT_TERM = (() => {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
})();

export interface PortfolioChild {
  id: string;
  name: string;
}

function EvidenceMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-fog-50">{value}</div>
      <div className="mt-0.5 text-xs text-fog-500">{detail}</div>
    </div>
  );
}

function formatShortUkDate(value: string | null): string {
  if (!value) return "No assessment yet";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });
}

export function PortfolioGenerator({
  childList = [],
}: {
  /** The parent's children — when present, the picker selects by id (exact). */
  childList?: PortfolioChild[];
}) {
  const [childId, setChildId] = useState(childList[0]?.id ?? "");
  const [childName, setChildName] = useState("");
  const [term, setTerm] = useState(DEFAULT_TERM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Email-to-LA state
  const [laEmail, setLaEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  async function sendToLa() {
    if (!portfolio) return;
    setEmailState("sending");
    setEmailMsg(null);
    const res = await emailPortfolio({
      toEmail: laEmail,
      childName: portfolio.childName,
      term: portfolio.term,
      verificationHash: portfolio.verificationHash,
    });
    if (res.ok) {
      setEmailState("sent");
      setLaEmail("");
    } else {
      setEmailState("error");
      setEmailMsg(res.reason ?? "Could not send.");
    }
  }

  const hasPicker = childList.length > 0;

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (hasPicker ? !childId : !childName.trim()) {
      setError(hasPicker ? "Please choose a child." : "Please enter the child's name.");
      return;
    }
    setError(null);
    setLoading(true);
    setPortfolio(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hasPicker
            ? { childId, term: term.trim() }
            : { childName: childName.trim(), term: term.trim() },
        ),
      });
      const data = (await res.json()) as PortfolioResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyHash() {
    if (!portfolio) return;
    try {
      await navigator.clipboard.writeText(portfolio.verificationHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  const verificationHref = portfolio?.persisted
    ? `/verify-portfolio?hash=${encodeURIComponent(portfolio.verificationHash)}`
    : null;
  const verificationUrl =
    verificationHref && typeof window !== "undefined"
      ? `${window.location.origin}${verificationHref}`
      : verificationHref;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Generator form */}
      <Card variant="glass-strong" padding="xl" className="mb-8 print:hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson-500/10 border border-crimson-400/30">
            <FileCheck className="h-5 w-5 text-crimson-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-fog-50">
              Local Authority portfolio
            </h1>
            <p className="text-sm text-fog-400">
              Generate a verified Local Authority evidence package.
            </p>
          </div>
        </div>

        <form onSubmit={generate} className="grid sm:grid-cols-2 gap-4">
          {hasPicker ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="childId"
                className="text-xs font-medium uppercase tracking-wider text-fog-300"
              >
                Child
              </label>
              <select
                id="childId"
                name="childId"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              >
                {childList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              name="childName"
              label="Child's name"
              placeholder="e.g. Aisha Khan"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
            />
          )}
          <Input
            name="term"
            label="Reporting term"
            placeholder="e.g. Q2 2026"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          {error && (
            <div className="sm:col-span-2 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
              {error}
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Generate portfolio
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Generated portfolio document */}
      {portfolio && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass" padding="xl" className="print:shadow-none">
            {/* Document header */}
            <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-violet-300" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                    Edway Compliance Portfolio
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-fog-50">
                  {portfolio.childName}
                </h2>
                <p className="text-sm text-fog-400">
                  {portfolio.term} · {portfolio.subjects.join(" · ")}
                </p>
              </div>
              <Badge variant="neon" size="md">
                <Check className="h-3 w-3" />
                Verified
              </Badge>
            </div>

            {portfolio.readiness && (
              <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
                      Evidence summary
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          portfolio.readiness.status === "complete"
                            ? "neon"
                            : "amber"
                        }
                        size="md"
                      >
                        {portfolio.readiness.status === "complete"
                          ? "Complete portfolio"
                          : "In progress portfolio"}
                      </Badge>
                      <span className="text-xs font-medium text-fog-500">
                        Evidence status
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-fog-300">
                      {portfolio.readiness.status === "complete"
                        ? "This evidence pack includes the full certified curriculum and all subject mock exams."
                        : "This evidence pack is useful for interim reporting. It becomes complete when all topics are certified and all subject mocks are taken."}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    SHA-256 signed
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <EvidenceMetric
                    label="Curriculum"
                    value={`${portfolio.readiness.certifiedTopics}/${portfolio.readiness.totalTopics}`}
                    detail="topics certified"
                  />
                  <EvidenceMetric
                    label="Mock exams"
                    value={`${portfolio.readiness.mocksTaken}/${portfolio.readiness.totalMocks}`}
                    detail="subject mocks completed"
                  />
                  <EvidenceMetric
                    label="Lessons"
                    value={portfolio.readiness.lessonsCompleted.toString()}
                    detail="completed lesson logs"
                  />
                  <EvidenceMetric
                    label="Grade evidence"
                    value={
                      portfolio.readiness.latestGrade !== null
                        ? `Grade ${portfolio.readiness.latestGrade}`
                        : "Pending"
                    }
                    detail="highest current predicted grade"
                  />
                  <EvidenceMetric
                    label="Work evidence"
                    value={portfolio.readiness.workEvidenceCount.toString()}
                    detail="uploaded work samples"
                  />
                  <EvidenceMetric
                    label="Verification"
                    value="Ready"
                    detail="public hash check"
                  />
                  <EvidenceMetric
                    label="Generated"
                    value={formatUkDateTime(portfolio.generatedAt)}
                    detail="UK time"
                  />
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[1.15fr_0.8fr_0.9fr_1.1fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-fog-500">
                      <span>Subject</span>
                      <span>Topics</span>
                      <span>Mock</span>
                      <span>Predicted grade</span>
                    </div>
                    <div className="divide-y divide-white/10">
                    {portfolio.readiness.subjects.map((subject) => (
                      <div
                        key={subject.subject}
                        className="grid grid-cols-[1.15fr_0.8fr_0.9fr_1.1fr] gap-3 px-4 py-3 text-sm text-fog-200"
                      >
                        <div>
                          <div className="font-semibold text-fog-50">
                            {subject.label}
                          </div>
                          <div className="mt-0.5 text-xs text-fog-500">
                            {formatShortUkDate(subject.assessedAt)}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-fog-50">
                            {subject.certifiedTopics}/{subject.totalTopics}
                          </span>
                          <div className="mt-0.5 text-xs text-fog-500">
                            certified
                          </div>
                        </div>
                        <div>
                          <span
                            className={
                              subject.mockTaken
                                ? "font-semibold text-neon-300"
                                : "font-semibold text-amber-300"
                            }
                          >
                            {subject.mockTaken ? "Taken" : "Pending"}
                          </span>
                          <div className="mt-0.5 text-xs text-fog-500">
                            {subject.mockGrade ?? "No mock grade"}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-fog-50">
                            {subject.latestGrade ?? "Pending"}
                          </span>
                          <div className="mt-0.5 text-xs text-fog-500">
                            {subject.gradeSource ?? "Awaiting assessment"}
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statutory sections */}
            <div className="flex flex-col gap-6">
              {portfolio.sections.map((section) => (
                <div key={section.key}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-300 mb-2">
                    {section.heading}
                  </h3>
                  <p className="text-sm text-fog-200 leading-relaxed mb-3">
                    {section.body}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {section.evidence.map((ev) => (
                      <li key={ev}>
                        <Badge variant="outline" size="sm">
                          {ev}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Work-evidence gallery (F2) — the real, viewable photos of the
                child's handwritten working, each tied to its certified topic.
                The strongest home-ed evidence, now visible not just named. */}
            {portfolio.workEvidence && portfolio.workEvidence.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className="h-4 w-4 text-violet-300" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-300">
                    Work evidence
                  </h3>
                </div>
                <p className="mb-4 text-sm text-fog-400">
                  Photographs of {portfolio.childName}&apos;s written working,
                  attached to the topic each demonstrates. Click any to view the
                  full image.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {portfolio.workEvidence.map((w: WorkEvidenceItem, i) => (
                    <a
                      key={`${w.url}-${i}`}
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                    >
                      <span className="relative block aspect-square overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbUrl(w.url)}
                          alt={`Written working — ${w.title}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      </span>
                      <span className="truncate px-2.5 py-2 text-xs font-medium text-fog-200">
                        {w.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Verification footer */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint className="h-4 w-4 text-neon-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-fog-200">
                  SHA-256 verification hash
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono text-fog-400 break-all rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                  {portfolio.verificationHash}
                </code>
                <button
                  onClick={copyHash}
                  className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-fog-300 transition-colors print:hidden"
                  aria-label="Copy verification hash"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-neon-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-3 text-xs text-fog-500 leading-relaxed">
                This hash is computed over the canonical record. Any alteration to
                the portfolio changes the hash — allowing a Local Authority to
                independently verify whether the document changed after generation.
                Generated {formatUkDateTime(portfolio.generatedAt)}.
                {portfolio.persisted
                  ? " Saved to your child's compliance record."
                  : " (Not saved — sign in and match a child's name to persist.)"}
              </p>
            </div>

            {portfolio.persisted && (
              <div className="mt-5 rounded-xl border border-neon-400/20 bg-neon-500/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neon-300">
                  <Fingerprint className="h-4 w-4" />
                  Verification page
                </div>
                <p className="mb-3 text-xs leading-relaxed text-fog-500">
                  Local Authority officers can use this link to confirm the
                  portfolio hash against Edway&apos;s generated dossier record.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:block">
                  <Button
                    href={verificationHref ?? "#"}
                    variant="outline"
                    size="sm"
                    className="self-start print:hidden"
                  >
                    <Fingerprint className="h-4 w-4" />
                    Open verification page
                  </Button>
                  {verificationHref && (
                    <a
                      href={verificationHref}
                      className="break-all text-xs font-medium text-violet-300 underline underline-offset-2 print:text-fog-900"
                    >
                      {verificationUrl}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3 print:hidden">
              <Button onClick={() => window.print()} variant="secondary" size="md">
                <Printer className="h-4 w-4" />
                Print / Save as PDF
              </Button>
            </div>

            {/* Email to Local Authority */}
            <div className="mt-6 pt-6 border-t border-white/10 print:hidden">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-violet-300" />
                <span className="text-sm font-semibold text-fog-100">
                  Send to your Local Authority
                </span>
              </div>
              {emailState === "sent" ? (
                <p className="flex items-center gap-2 text-sm text-neon-400">
                  <Check className="h-4 w-4" /> Sent — the LA officer will receive
                  the portfolio details and verification hash.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    name="la_email"
                    type="email"
                    placeholder="officer@council.gov.uk"
                    value={laEmail}
                    onChange={(e) => setLaEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendToLa}
                    variant="primary"
                    size="md"
                    disabled={emailState === "sending" || !laEmail}
                  >
                    {emailState === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Email portfolio"
                    )}
                  </Button>
                </div>
              )}
              {emailMsg && (
                <p className="mt-2 text-xs text-amber-400">{emailMsg}</p>
              )}
              <p className="mt-2 text-xs text-fog-500">
                You control what&apos;s shared — Edway never sends anything
                automatically.
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
