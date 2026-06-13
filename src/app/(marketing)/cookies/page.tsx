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
        <li><strong>hexa_session</strong> — secure sign-in session (httpOnly). Required to keep you signed in.</li>
        <li><strong>hexa_active_child</strong> — remembers which child you&apos;re currently viewing.</li>
      </ul>

      <h3>Functional (optional)</h3>
      <ul>
        <li><strong>hexa-theme</strong> — Remembers UI preferences.</li>
        <li><strong>hexa-locale</strong> — Remembers language preference (currently en-GB only).</li>
      </ul>

      <h3>Analytics (opt-in only)</h3>
      <p>
        With your consent, we use <strong>PostHog</strong> (EU cloud) for
        privacy-respecting product analytics, so we can see which parts of the
        platform parents use and improve them. Analytics run only after you
        choose &ldquo;Accept all&rdquo; in the cookie banner, identify you by an
        internal account id only (never your name or email), and have
        autocapture and session recording switched off.
      </p>
      <p>
        <strong>Children are never tracked.</strong> Analytics are not loaded at
        all in the child-facing learning experience &mdash; no events, no
        profiling, no session recording, in line with the ICO Children&rsquo;s
        Code.
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
