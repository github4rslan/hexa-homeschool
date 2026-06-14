import "server-only";
import { cookies } from "next/headers";

/**
 * Whether the parent has dismissed the getting-started checklist. Stored in a
 * cookie (no DB write) so the card can be hidden without inventing persistent
 * onboarding state — the checklist's *progress* is always derived from real
 * data; only this one "I've seen it, hide it" preference is remembered here.
 */
const COOKIE = "hexa_gs_dismissed";

export async function isOnboardingDismissed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "1";
}

export async function dismissOnboarding(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
