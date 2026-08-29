import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string; reset?: string }>;
}) {
  const { redirect: redirectParam, reset } = await searchParams;
  // Only forward a validated in-site path — never an attacker-supplied host.
  const redirectTo = safeInternalPath(redirectParam);
  return (
    <Card variant="glass-strong" padding="xl" className="w-full max-w-md">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fog-50">
          Welcome back
        </h1>
        <p className="text-sm text-fog-400">
          Sign in to your Edway account.
        </p>
      </div>

      {reset && (
        <div className="mb-4 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-300">
          Your password has been reset. Sign in with your new password.
        </div>
      )}

      <ErrorSurface searchParams={searchParams} />

      <form action={login} className="flex flex-col gap-4">
        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}
        <Input
          name="email"
          type="email"
          required
          label="Email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          required
          label="Password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-fog-400 cursor-pointer">
            {/* B3 fix: checked by default so an untouched submit keeps
                today's 7-day session; deliberately unchecking it (a shared or
                public device) issues a much shorter one instead. */}
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="rounded border-white/10 bg-white/5"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-violet-300 hover:text-violet-200">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="md" className="mt-4 w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-fog-400">
        New to Edway?{" "}
        <Link href="/signup" className="font-medium text-violet-300 hover:text-violet-200">
          Create an account
        </Link>
      </div>
    </Card>
  );
}

async function ErrorSurface({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <div className="mb-4 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
      {params.error}
    </div>
  );
}
