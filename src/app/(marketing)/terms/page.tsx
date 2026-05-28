import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms under which HEXA Education Ltd provides its AI-powered homeschooling platform to UK families.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="25 May 2026"
      intro="These Terms govern your access to and use of HEXA. By creating an account, you agree to these Terms on behalf of yourself and any minor child enrolled under your account."
    >
      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old and the parent or legal guardian of
        any child enrolled. HEXA is not a replacement for legal compliance with
        UK elective home education requirements — you remain responsible for
        registering with your Local Authority where applicable.
      </p>

      <h2>2. The service</h2>
      <p>
        HEXA provides an AI-powered learning platform preparing children for
        GCSE Mathematics, English Language, English Literature, and Sciences.
        We provide instructional content, assessments, and progress documentation.
        We <strong>do not</strong>:
      </p>
      <ul>
        <li>Sit exams on behalf of your child.</li>
        <li>Guarantee specific GCSE outcomes (we provide grade predictions only).</li>
        <li>Register your child as an exam candidate (we guide you through the process).</li>
        <li>Replace your role as the primary educator and decision-maker.</li>
      </ul>

      <h2>3. Subscription and billing</h2>
      <p>
        Paid plans are billed monthly or annually via Stripe. The first 14 days
        are free; no card is required to start. You may cancel at any time from
        the parent dashboard. Refunds are issued for cancellations within 14 days
        of any new billing period.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Share account credentials beyond your immediate household.</li>
        <li>Attempt to extract, scrape, or reverse-engineer platform content.</li>
        <li>Use the platform for any unlawful purpose.</li>
        <li>Submit harmful content into shared spaces.</li>
      </ul>

      <h2>5. The safety net</h2>
      <p>
        HEXA includes a Human Safety Net with SLA-bound escalation. We will
        notify you immediately of any safeguarding event and may contact
        relevant statutory bodies (e.g. local safeguarding authorities, NSPCC,
        emergency services) without prior parental notice if we have a reasonable
        belief that a child is at imminent risk of harm.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        All platform content (lessons, drills, assessment materials, software) is
        owned by HEXA Education Ltd or licensed to us. You retain ownership of
        all data your child generates. We do not use customer data to train AI
        models.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the extent permitted by UK law, HEXA Education Ltd's total liability
        for any claim arising from these Terms is limited to the amount you paid
        us in the 12 months preceding the claim. Nothing in these Terms limits
        liability for death or personal injury caused by our negligence, or for
        fraud.
      </p>

      <h2>8. Termination</h2>
      <p>
        Either party may terminate the agreement at any time. On termination,
        data retention follows the timeline set out in our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These Terms are governed by the laws of England and Wales. Disputes are
        subject to the exclusive jurisdiction of the courts of England and Wales.
      </p>

      <h2>10. Changes to these Terms</h2>
      <p>
        We will notify you by email of any material changes at least 30 days
        before they take effect. Continued use after that date constitutes
        acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:legal@hexa.education">legal@hexa.education</a>
      </p>
    </LegalLayout>
  );
}
