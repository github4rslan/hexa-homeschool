import type { Metadata } from "next";
import Link from "next/link";
import { Lock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyPasswordResetToken, resetSnapshot } from "@/lib/email/verification";
import { findParentById } from "@/lib/db/repo";
import { submitPasswordReset } from "../forgot-password/actions";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; expired?: string }>;
}) {
  const { token, error, expired } = await searchParams;

  // Validate the token (and its single-use snapshot) before showing the form, so
  // a stale/used/garbled link lands on a calm "expired" screen, not a dead form.
  let valid = false;
  if (token && !expired) {
    const parsed = await verifyPasswordResetToken(token);
    if (parsed) {
      const parent = await findParentById(parsed.parentId);
      valid =
        !!parent &&
        resetSnapshot(parent.password_hash, parent.token_version ?? 0) ===
          parsed.snapshot;
    }
  }

  if (!valid) {
    return (
      <Card variant="glass-strong" padding="xl" className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fog-50">
            This link has expired
          </h1>
          <p className="text-sm text-fog-400 max-w-sm">
            Password-reset links last 1 hour and can be used once. Request a fresh
            link and we&apos;ll email you a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-2 text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Request a new link
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass-strong" padding="xl" className="w-full max-w-md">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fog-50">
          Choose a new password
        </h1>
        <p className="text-sm text-fog-400">
          Pick something at least 8 characters long. Setting it signs you out of
          every other device.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
          {error}
        </div>
      )}

      <form action={submitPasswordReset} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Input
          name="new_password"
          type="password"
          required
          minLength={8}
          label="New password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />
        <Input
          name="confirm_password"
          type="password"
          required
          minLength={8}
          label="Confirm new password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" size="md" className="mt-2 w-full">
          Set new password
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-fog-400">
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
