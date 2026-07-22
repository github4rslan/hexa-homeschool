import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyTotpSignIn } from "./actions";

export const metadata: Metadata = { title: "Authenticator sign-in" };

export default async function TotpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card variant="glass-strong" padding="xl" className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-500/10 border border-neon-400/30">
          <KeyRound className="h-7 w-7 text-neon-300" />
        </div>
        <h1 className="text-2xl font-semibold text-fog-50 mb-2">Authenticator code</h1>
        <p className="text-fog-400 leading-relaxed mb-6">
          Two-factor sign-in is on for this account. Open your authenticator app
          and enter the current 6-digit code to finish signing in.
        </p>

        {error && <p className="mb-4 text-sm text-crimson-400">{error}</p>}

        <form action={verifyTotpSignIn} className="flex flex-col gap-4">
          <input
            name="code"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={11}
            required
            autoFocus
            placeholder="● ● ● ● ● ●"
            className="h-16 w-full rounded-xl border border-white/10 bg-white/[0.03] text-center text-3xl font-mono tracking-[0.4em] text-fog-50 placeholder:text-fog-600 placeholder:tracking-[0.2em] focus:border-neon-400/60 focus:outline-none focus:ring-2 focus:ring-neon-400/20"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Verify and sign in
          </Button>
        </form>

        <p className="mt-5 text-xs text-fog-500 leading-relaxed">
          Lost your phone? Enter one of your <strong>recovery codes</strong> in the
          box above instead — each one works once.
        </p>

        <p className="mt-4 text-xs text-fog-500">
          Not you?{" "}
          <a href="/login" className="text-violet-300 hover:text-violet-200">
            Back to sign in
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
