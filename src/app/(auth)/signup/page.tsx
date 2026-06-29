import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "./actions";
import { TrackOnMount } from "@/components/analytics/analytics-provider";

export const metadata: Metadata = {
  title: "Create your Edway account",
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  return (
    <Card variant="glass-strong" padding="xl" className="w-full max-w-md">
      <TrackOnMount event="signup_started" />
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fog-50">
          Create your account
        </h1>
        <p className="text-sm text-fog-400">
          Start with a free 60-minute diagnostic. No card required.
        </p>
      </div>

      <Surface searchParams={searchParams} />

      <form action={signup} className="flex flex-col gap-4">
        <Input
          name="full_name"
          required
          label="Your name"
          placeholder="Jane Smith"
          leftIcon={<User className="h-4 w-4" />}
          autoComplete="name"
        />
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
          placeholder="At least 8 characters"
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
          minLength={8}
          hint="Use a mix of letters, numbers and symbols."
        />

        <label className="flex items-start gap-3 mt-2 text-xs text-fog-400 cursor-pointer">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 rounded border-white/10 bg-white/5"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-violet-300 hover:text-violet-200">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-violet-300 hover:text-violet-200">
              Privacy Policy
            </Link>
            . I confirm I am the parent or legal guardian of any minor enrolled.
          </span>
        </label>

        <Button type="submit" variant="primary" size="md" className="mt-4 w-full">
          Create account
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-fog-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Sign in
        </Link>
      </div>
    </Card>
  );
}

async function Surface({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  if (params.error) {
    return (
      <div className="mb-4 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
        {params.error}
      </div>
    );
  }
  if (params.success) {
    return (
      <div className="mb-4 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-400">
        {params.success}
      </div>
    );
  }
  return null;
}
