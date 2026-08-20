import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description:
    "How Edway collects, uses, and protects your data. Designed for UK GDPR and ICO Age-Appropriate Design Code (Children's Code) compliance.",
});

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="25 May 2026"
      intro="This Privacy Policy explains how Edway Education Ltd (we, us, our) collects, uses, retains and protects personal data when you use our platform. We are registered with the Information Commissioner's Office (ICO) and operate under UK GDPR and the Data Protection Act 2018."
    >
      <h2 id="who-we-are">Who we are</h2>
      <p>
        Edway Education Ltd is the data controller for all personal data processed
        through our platform. Our registered office is in the United Kingdom.
        All data is stored exclusively within the UK (AWS London, eu-west-2 region).
      </p>

      <h2 id="data-we-collect">Data we collect</h2>
      <p>We collect only what is required to deliver the service:</p>
      <ul>
        <li>
          <strong>Parent account data:</strong> name, email address, billing
          information, support correspondence.
        </li>
        <li>
          <strong>Child profile data:</strong> first name, date of birth,
          documented SEND designations (if shared), parent-provided learning
          history.
        </li>
        <li>
          <strong>Learning data:</strong> lesson activity, response patterns,
          mastery scores, assessment results.
        </li>
        <li>
          <strong>Technical data:</strong> device type, browser, IP address (for
          security and rate-limiting only), error logs.
        </li>
      </ul>
      <p>
        We <strong>do not</strong> collect: behavioural tracking for
        monetisation, advertising identifiers, health data beyond what parents
        voluntarily share for educational accommodation, or biometric data.
      </p>

      <h2 id="how-we-use-data">How we use your data</h2>
      <ul>
        <li>To deliver personalised learning to your child.</li>
        <li>To generate progress dossiers for Local Authority presentations.</li>
        <li>To operate the human safety net (escalation to tutors or safeguarding bodies).</li>
        <li>To process subscription payments via Stripe.</li>
        <li>To improve the platform through aggregated, anonymised metrics.</li>
      </ul>

      <h2 id="lawful-basis">Lawful basis for processing</h2>
      <p>
        We rely on the following lawful bases under UK GDPR Article 6:
      </p>
      <ul>
        <li><strong>Contract:</strong> to deliver the service you signed up for.</li>
        <li><strong>Legitimate interest:</strong> for security, fraud prevention, and product improvement.</li>
        <li><strong>Legal obligation:</strong> for safeguarding reports to statutory bodies.</li>
        <li><strong>Consent:</strong> for any optional features (marketing emails, etc.) — withdrawable at any time.</li>
      </ul>

      <h2 id="children">Children's data</h2>
      <p>
        Edway's primary users include children aged 10–13. We comply fully with
        the ICO Age-Appropriate Design Code:
      </p>
      <ul>
        <li>Data minimisation by default — no field is collected speculatively.</li>
        <li>No profiling for advertising, monetisation, or engagement loops.</li>
        <li>No nudging or dark patterns to extend session time.</li>
        <li>Parents (as legal guardians) hold all consent and access rights.</li>
        <li>Child-facing language is age-appropriate and transparent.</li>
      </ul>

      <h2 id="retention">Data retention</h2>
      <p>
        Active account data is retained for as long as you remain a subscriber.
        On account closure:
      </p>
      <ul>
        <li>Operational data is deleted within <strong>30 days</strong>.</li>
        <li>Compliance dossiers and audit logs are retained for <strong>24 months</strong> to satisfy potential Local Authority follow-up requests.</li>
        <li>After 24 months, all records (including backups) are cryptographically destroyed.</li>
        <li>Anonymised, aggregated analytics may be retained indefinitely.</li>
      </ul>

      <h2 id="security">Security</h2>
      <ul>
        <li>AES-256 encryption at rest.</li>
        <li>TLS 1.3 in transit.</li>
        <li>Role-based access control with row-level security on all database queries.</li>
        <li>SHA-256 cryptographic signatures on all compliance dossiers.</li>
        <li>Regular penetration testing and Cyber Essentials Plus certification.</li>
      </ul>

      <h2 id="your-rights">Your rights</h2>
      <p>Under UK GDPR you have the right to:</p>
      <ul>
        <li>Access your personal data.</li>
        <li>Rectify inaccurate data.</li>
        <li>Erase your data (subject to the 24-month retention above).</li>
        <li>Restrict processing.</li>
        <li>Data portability — export in JSON or PDF format.</li>
        <li>Object to processing.</li>
        <li>Lodge a complaint with the <a href="https://ico.org.uk">Information Commissioner's Office</a>.</li>
      </ul>
      <p>
        To exercise any of these rights, email <a href="mailto:privacy@edway.uk">privacy@edway.uk</a>.
      </p>

      <h2 id="third-parties">Third-party processors</h2>
      <p>
        We use the following processors, all UK GDPR compliant:
      </p>
      <ul>
        <li><strong>MongoDB Atlas:</strong> primary database.</li>
        <li><strong>Cloudinary:</strong> media storage (lesson audio, uploaded work).</li>
        <li><strong>OpenAI:</strong> language model inference (no training on customer data).</li>
        <li><strong>ElevenLabs:</strong> voice synthesis (no training on customer data).</li>
        <li><strong>Vercel:</strong> application hosting.</li>
        <li><strong>Stripe:</strong> subscription billing.</li>
        <li><strong>Brevo:</strong> transactional and (opt-in) lifecycle email to parents.</li>
        <li><strong>PostHog (EU cloud):</strong> opt-in product analytics for parents only &mdash; never used in the child experience, identifies by internal account id, no profiling or session recording.</li>
      </ul>

      <h2 id="contact">Contact</h2>
      <p>
        Data Protection Officer: <a href="mailto:dpo@edway.uk">dpo@edway.uk</a><br />
        Privacy queries: <a href="mailto:privacy@edway.uk">privacy@edway.uk</a><br />
        General: <a href="mailto:hello@edway.uk">hello@edway.uk</a>
      </p>
    </LegalLayout>
  );
}
