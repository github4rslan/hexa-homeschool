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
      <p className="flex items-center gap-2 text-sm text-clay-200">
        <Check className="h-4 w-4" /> You&apos;re in — thanks for joining!
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-200/70" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-xl border border-linen-100/15 bg-linen-50/5 pl-10 pr-4 text-sm text-linen-50 placeholder:text-forest-200/50 focus:border-clay-300/60 focus:outline-none focus:ring-2 focus:ring-clay-300/20"
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-clay-500 px-5 text-sm font-medium text-linen-50 hover:bg-clay-600 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
      {error && <p className="text-xs text-clay-200">{error}</p>}
      <p className="text-xs text-forest-200/70">
        Weekly UK homeschooling tips. No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
