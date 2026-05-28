import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How HEXA uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      lastUpdated="25 May 2026"
      intro="HEXA uses the minimum number of cookies required to operate. We do not use cookies for advertising, behavioural profiling, or third-party tracking."
    >
      <h2>Cookies we use</h2>

      <h3>Strictly necessary (always on)</h3>
      <ul>
        <li><strong>sb-access-token, sb-refresh-token</strong> — Supabase authentication. Required to keep you signed in.</li>
        <li><strong>__Host-session</strong> — CSRF protection on authenticated requests.</li>
      </ul>

      <h3>Functional (optional)</h3>
      <ul>
        <li><strong>hexa-theme</strong> — Remembers UI preferences.</li>
        <li><strong>hexa-locale</strong> — Remembers language preference (currently en-GB only).</li>
      </ul>

      <h3>Analytics (opt-in only)</h3>
      <p>
        We use <strong>self-hosted Plausible Analytics</strong>, which is
        cookieless and GDPR-friendly. No personal identifiers are recorded;
        we cannot track you across sessions.
      </p>

      <h2>What we don't do</h2>
      <ul>
        <li>No Google Analytics, Meta Pixel, TikTok Pixel, or similar.</li>
        <li>No advertising cookies of any kind.</li>
        <li>No cross-site tracking.</li>
        <li>No fingerprinting.</li>
      </ul>

      <h2>Managing cookies</h2>
      <p>
        You can disable functional cookies in your browser settings. Disabling
        strictly necessary cookies will prevent you from signing in.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href="mailto:privacy@hexa.education">privacy@hexa.education</a>
      </p>
    </LegalLayout>
  );
}
