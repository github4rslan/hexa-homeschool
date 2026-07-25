import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { CTA } from "@/components/marketing/cta";
import { CheckCircle2, MessageCircle, FileText, Calendar, Lightbulb } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";

export const metadata: Metadata = {
  title: "For UK homeschooling parents",
  description:
    "Designed for UK homeschooling families. Compliance handled. Anxiety reduced. Outcomes proven.",
};

const PAINS = [
  {
    pain: "The Local Authority anxiety",
    answer:
      "Every time the LA calls, the answer is one click away. SHA-256 signed portfolios are continuously assembled — not scrambled together the night before a visit.",
    icon: FileText,
  },
  {
    pain: "The pacing problem",
    answer:
      "Most homeschool curricula are linear and rigid. Edway adapts daily — accelerating mastery topics and slowing on weak ones, balanced against a hard GCSE deadline.",
    icon: Calendar,
  },
  {
    pain: "The motivation gap",
    answer:
      "The Teaching Agent monitors friction in real time. When it detects distress vectors or persistent concept blocks, a human tutor is dispatched within 15 minutes.",
    icon: Lightbulb,
  },
  {
    pain: "The 'am I doing enough?' question",
    answer:
      "Monthly simulated mocks generate a defensible predicted grade. You see — and the LA sees — the trajectory in hard numbers.",
    icon: CheckCircle2,
  },
  {
    pain: "The isolation",
    answer:
      "Direct chat with retained education specialists and a marketplace of verified tutors. You're never alone with the decisions.",
    icon: MessageCircle,
  },
];

const FAQ = [
  {
    q: "Is Edway accepted by Local Authorities?",
    a: "Edway assembles portfolios in the statutory categories Local Authorities request — Breadth, Balance, Progression — with cryptographic signatures proving record integrity. Many UK LAs already accept structured digital portfolios; Edway's are designed to be over the bar.",
  },
  {
    q: "Can my child really be ready for GCSEs at 14?",
    a: "GCSE specifications are content-based, not age-based. Private candidates can sit examinations at any age — many independent schools enter students early. Edway's pacing model is built around the published specifications for Mathematics, English Language, English Literature and the three Sciences.",
  },
  {
    q: "What if my child has SEND?",
    a: "Verified SEND designations are ingested by the Diagnostic Agent and persist through the Cognitive Processing Typology. Pacing, modality and assessment style adapt accordingly — and we partner with educational psychologists where appropriate.",
  },
  {
    q: "What does my child do all day?",
    a: "Daily sessions are 45–60 minutes of focused instruction — multi-modal video, interactive drilling, and mastery-gated progression. Children are free to pursue any other curriculum or interests outside this window.",
  },
  {
    q: "What happens at age 14?",
    a: "Edway guides you through Pearson, AQA or OCR private candidate entry at one of the verified regional assessment centres. We don't sit the exam for you, but we make the registration painless.",
  },
];

export default function ForParentsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "For parents", path: "/for-parents" }]} />
      <Section padded className="pt-16">
        <SectionHeader
          as="h1"
          eyebrow="For UK Parents"
          title={
            <>
              Built around the parents
              <br />
              <span className="text-gradient-aurora">we couldn't ignore.</span>
            </>
          }
          description="Edway exists because UK homeschooling parents told us the same thing five different ways: 'I need proof, I need pacing, and I need someone in my corner with the LA.'"
        />
      </Section>

      <Section padded={false} className="pb-20">
        <div className="grid lg:grid-cols-2 gap-5">
          {PAINS.map((p) => (
            <Card key={p.pain} variant="glass" padding="lg">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
                  <p.icon className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-fog-50 mb-2">
                    {p.pain}
                  </h3>
                  <p className="text-sm leading-relaxed text-fog-300">
                    {p.answer}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="FAQ"
          title="Common questions"
          description="If anything else is on your mind, talk to the team — we read every message personally."
        />
        <div className="mt-12 max-w-3xl mx-auto flex flex-col gap-4">
          {FAQ.map((item) => (
            <Card key={item.q} variant="glass" padding="lg">
              <h3 className="text-lg font-semibold tracking-tight text-fog-50 mb-3">
                {item.q}
              </h3>
              <p className="text-sm leading-relaxed text-fog-300">{item.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
