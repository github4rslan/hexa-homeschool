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

type PortfolioResponse = VerifiedPortfolio & { persisted?: boolean };

const DEFAULT_TERM = (() => {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
})();

export interface PortfolioChild {
  id: string;
  name: string;
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
              Generate a verified, tamper-evident evidence package.
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
                independently verify the document has not been tampered with.
                Generated {new Date(portfolio.generatedAt).toLocaleString("en-GB")}.
                {portfolio.persisted
                  ? " Saved to your child's compliance record."
                  : " (Not saved — sign in and match a child's name to persist.)"}
              </p>
            </div>

            {portfolio.persisted && (
              <div className="mt-4 print:hidden">
                <Button
                  href={`/verify-portfolio?hash=${encodeURIComponent(portfolio.verificationHash)}`}
                  variant="outline"
                  size="sm"
                >
                  <Fingerprint className="h-4 w-4" />
                  Open verification page
                </Button>
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
