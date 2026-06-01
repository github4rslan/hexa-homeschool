"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

/**
 * Newsletter signup (Brief footer: "Join 2,000+ UK homeschooling parents").
 * Posts to /api/newsletter; idempotent on email.
 */
export function Newsletter({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not subscribe.");
      setState("done");
      setEmail("");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not subscribe.");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 text-sm text-neon-400">
        <Check className="h-4 w-4" /> You&apos;re in — thanks for joining!
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fog-500" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 text-sm font-medium text-white hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
      {error && <p className="text-xs text-crimson-400">{error}</p>}
      <p className="text-xs text-fog-500">
        Weekly UK homeschooling tips. No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
