import { redirect } from "next/navigation";

/**
 * Legacy link-based screen. Verification now uses a 6-digit code, so route any
 * remaining traffic to the code-entry page.
 */
export default async function VerifySentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  redirect(`/signup/verify${email ? `?email=${encodeURIComponent(email)}` : ""}`);
}
