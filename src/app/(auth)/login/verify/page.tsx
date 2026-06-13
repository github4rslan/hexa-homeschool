import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyTwoFactor, resendTwoFactorCode } from "./actions";

export const metadata: Metadata = { title: "Two-factor sign-in" };

export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resent?: string; error?: string }>;
}) {
  const { email, resent, error } = await searchParams;
  const resend = resendTwoFactorCode.bind(null, email ?? "");

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card variant="glass-strong" padding="xl" className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-500/10 border border-neon-400/30">
          <ShieldCheck className="h-7 w-7 text-neon-300" />
        </div>
        <h1 className="text-2xl font-semibold text-fog-50 mb-2">Check your email</h1>
        <p className="text-fog-400 leading-relaxed mb-3">
          Two-factor sign-in is on for this account. We&apos;ve sent a 6-digit
          code{email ? ` to ${email}` : ""} — enter it to finish signing in.
        </p>
        <p className="text-xs text-amber-400/90 leading-relaxed mb-6">
          Can&apos;t find it? Check your <strong>Spam</strong> and{" "}
          <strong>Promotions</strong> folders. The code expires in 10 minutes.
        </p>

        {resent && (
          <p className="mb-4 text-sm text-neon-400">A new code has been sent.</p>
        )}
        {error && <p className="mb-4 text-sm text-crimson-400">{error}</p>}

        <form action={verifyTwoFactor} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={email ?? ""} />
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            placeholder="● ● ● ● ● ●"
            className="h-16 w-full rounded-xl border border-white/10 bg-white/[0.03] text-center text-3xl font-mono tracking-[0.4em] text-fog-50 placeholder:text-fog-600 placeholder:tracking-[0.2em] focus:border-neon-400/60 focus:outline-none focus:ring-2 focus:ring-neon-400/20"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Verify and sign in
          </Button>
        </form>

        <form action={resend} className="mt-5">
          <button
            type="submit"
            className="text-sm text-fog-400 hover:text-fog-100 transition-colors"
          >
            Didn&apos;t get it? Resend code
          </button>
        </form>

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
