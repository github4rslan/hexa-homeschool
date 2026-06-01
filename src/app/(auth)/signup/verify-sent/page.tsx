import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resendVerification } from "./actions";

export const metadata: Metadata = { title: "Check your email" };

export default async function VerifySentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resent?: string }>;
}) {
  const { email, resent } = await searchParams;
  const resend = resendVerification.bind(null, email ?? "");

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card variant="glass-strong" padding="xl" className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/30">
          <MailCheck className="h-7 w-7 text-violet-300" />
        </div>
        <h1 className="text-2xl font-semibold text-fog-50 mb-2">Check your email</h1>
        <p className="text-fog-400 leading-relaxed mb-6">
          We&apos;ve sent a confirmation link{email ? ` to ${email}` : ""}. Click it
          to activate your account and start your child&apos;s diagnostic.
        </p>
        {resent && (
          <p className="mb-4 text-sm text-neon-400">Verification email re-sent.</p>
        )}
        <form action={resend}>
          <Button type="submit" variant="secondary" size="md">
            Resend email
          </Button>
        </form>
        <p className="mt-6 text-xs text-fog-500">
          Wrong address? <a href="/signup" className="text-violet-300 hover:text-violet-200">Sign up again</a>.
        </p>
      </Card>
    </div>
  );
}
