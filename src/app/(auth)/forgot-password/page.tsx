import type { Metadata } from "next";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  if (sent) {
    return (
      <Card variant="glass-strong" padding="xl" className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-500/15 text-neon-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fog-50">
            Check your inbox
          </h1>
          <p className="text-sm text-fog-400 max-w-sm">
            If an account exists for that email, we&apos;ve sent a link to reset
            your password. It expires in 1 hour and can be used once. Don&apos;t
            forget to check Spam or Promotions.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass-strong" padding="xl" className="w-full max-w-md">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fog-50">
          Reset your password
        </h1>
        <p className="text-sm text-fog-400">
          Enter the email on your Edway account and we&apos;ll send you a link to
          set a new password.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
          {error}
        </div>
      )}

      <form action={requestPasswordReset} className="flex flex-col gap-4">
        <Input
          name="email"
          type="email"
          required
          label="Email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          autoComplete="email"
        />
        <Button type="submit" variant="primary" size="md" className="mt-2 w-full">
          Send reset link
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-fog-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
