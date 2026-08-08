"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Search, ShieldX } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * F5 — public certificate verification widget. Paste (or deep-link) a
 * certificate's SHA-256 hash; it calls the read-only, IP-rate-limited
 * `/api/verify-certificate` and renders a clear Verified / Not found result
 * with only the facts already printed on the certificate.
 */

interface VerifiedCert {
  childFirstName: string;
  topicTitle: string;
  subjectLabel: string;
  achievedAt: string;
  verificationHash: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "verified"; cert: VerifiedCert }
  | { status: "not_found" }
  | { status: "invalid" }
  | { status: "error"; message: string };

export function VerifyCertificate({ initialHash }: { initialHash?: string }) {
  const [hash, setHash] = useState(initialHash ?? "");
  const [state, setState] = useState<State>({ status: "idle" });

  const verify = useCallback(async (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(value)) {
      setState({ status: "invalid" });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch(
        `/api/verify-certificate?hash=${encodeURIComponent(value)}`,
        { cache: "no-store" },
      );
      if (res.status === 429) {
        setState({
          status: "error",
          message: "Too many checks just now. Please wait a moment and retry.",
        });
        return;
      }
      const data = (await res.json()) as {
        verified?: boolean;
        reason?: string;
        certificate?: VerifiedCert;
      };
      if (data.verified && data.certificate) {
        setState({ status: "verified", cert: data.certificate });
      } else if (data.reason === "invalid") {
        setState({ status: "invalid" });
      } else {
        setState({ status: "not_found" });
      }
    } catch {
      setState({
        status: "error",
        message: "Could not verify right now. Please try again.",
      });
    }
  }, []);

  // Auto-verify a deep-linked hash on mount.
  useEffect(() => {
    if (initialHash && /^[a-f0-9]{64}$/i.test(initialHash.trim())) {
      void verify(initialHash);
    }
  }, [initialHash, verify]);

  return (
    <div className="mt-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verify(hash);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="cert-hash" className="sr-only">
          Certificate verification hash
        </label>
        <input
          id="cert-hash"
          name="hash"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Paste the certificate's verification code"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-fog-100 placeholder:text-fog-500 focus:border-neon-400/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-neon-400 to-violet-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state.status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Verify
        </button>
      </form>

      <div className="mt-6" aria-live="polite">
        {state.status === "verified" && (
          <Card variant="glass-strong" padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neon-400/30 bg-neon-500/10">
                <BadgeCheck className="h-6 w-6 text-neon-300" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-neon-200">
                  Verified authentic
                </p>
                <p className="mt-1 text-sm text-fog-200">
                  {state.cert.childFirstName} mastered{" "}
                  <span className="font-medium text-fog-50">
                    {state.cert.topicTitle}
                  </span>{" "}
                  ({state.cert.subjectLabel}), awarded {state.cert.achievedAt}.
                </p>
                <p className="mt-2 break-all font-mono text-[11px] text-fog-500">
                  {state.cert.verificationHash}
                </p>
              </div>
            </div>
          </Card>
        )}

        {state.status === "not_found" && (
          <Card variant="glass" padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10">
                <ShieldX className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <p className="text-lg font-semibold text-amber-200">
                  No matching certificate
                </p>
                <p className="mt-1 text-sm text-fog-300">
                  We could not find a certificate with that verification code.
                  Check the code is copied exactly from the certificate.
                </p>
              </div>
            </div>
          </Card>
        )}

        {state.status === "invalid" && (
          <p className="text-sm text-fog-400">
            That does not look like a valid verification code. It is a 64-character
            string of letters a to f and digits 0 to 9.
          </p>
        )}

        {state.status === "error" && (
          <p className="text-sm text-amber-300">{state.message}</p>
        )}
      </div>
    </div>
  );
}
