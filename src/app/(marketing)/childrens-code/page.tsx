import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Children's Code Compliance",
  description:
    "How Edway implements the 15 standards of the ICO Age-Appropriate Design Code.",
};

const STANDARDS = [
  { num: 1, title: "Best interests of the child", body: "Every product decision is evaluated against the best interests of the child, not engagement or revenue metrics." },
  { num: 2, title: "Data protection impact assessments", body: "We conduct DPIAs for every new feature that processes children's data." },
  { num: 3, title: "Age-appropriate application", body: "The platform is designed specifically for ages 10–13. UI language, complexity, and friction are calibrated for that range." },
  { num: 4, title: "Transparency", body: "Plain-language privacy explanations are surfaced in-context, not buried in policy documents." },
  { num: 5, title: "Detrimental use of data", body: "We do not use children's data in ways that have been shown to be detrimental to their wellbeing." },
  { num: 6, title: "Policies and community standards", body: "All terms, including community standards, are upheld consistently." },
  { num: 7, title: "Default settings", body: "Privacy-protective settings are on by default. No opt-out required." },
  { num: 8, title: "Data minimisation", body: "We collect only what is required to deliver the service — no speculative data collection." },
  { num: 9, title: "Data sharing", body: "Personal data is not disclosed to third parties unless we can demonstrate a compelling reason in the best interests of the child." },
  { num: 10, title: "Geolocation", body: "We do not collect or use geolocation data." },
  { num: 11, title: "Parental controls", body: "Comprehensive parent dashboard with full visibility and control." },
  { num: 12, title: "Profiling", body: "No profiling for advertising, monetisation, or engagement loops. Personalisation is strictly educational." },
  { num: 13, title: "Nudge techniques", body: "No dark patterns. No notifications designed to extend session time. No streak pressure." },
  { num: 14, title: "Connected toys and devices", body: "Not applicable — Edway is a web/app service only." },
  { num: 15, title: "Online tools", body: "Easy-to-use tools to exercise data rights (access, deletion, portability) directly from the parent dashboard." },
];

export default function ChildrensCodePage() {
  return (
    <LegalLayout
      title="Children's Code Compliance"
      lastUpdated="25 May 2026"
      intro="The ICO Age-Appropriate Design Code (Children's Code) sets 15 standards for online services likely to be accessed by children. Edway was designed from the ground up to meet — and in most cases exceed — every one of them."
    >
      <h2>The 15 standards, and how we meet them</h2>

      {STANDARDS.map((s) => (
        <div key={s.num} className="mt-8 pl-6 border-l-2 border-violet-400/30">
          <h3 className="!mt-0 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-violet-300 bg-violet-500/10 border border-violet-400/30 rounded px-2 py-0.5">
              {String(s.num).padStart(2, "0")}
            </span>
            {s.title}
          </h3>
          <p>{s.body}</p>
        </div>
      ))}

      <h2>Independent verification</h2>
      <p>
        We commission annual independent privacy audits and publish summary
        findings. The full report is available to Local Authorities and parents
        on request.
      </p>

      <h2>Reporting concerns</h2>
      <p>
        If you believe Edway is not meeting any of these standards, please email{" "}
        <a href="mailto:dpo@edway.uk">dpo@edway.uk</a>. You can also
        complain directly to the <a href="https://ico.org.uk">ICO</a>.
      </p>
    </LegalLayout>
  );
}
