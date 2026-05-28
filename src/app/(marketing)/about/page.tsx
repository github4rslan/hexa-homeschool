import type { Metadata } from "next";
import {
  Compass,
  Eye,
  Flag,
  Heart,
  Microscope,
  Shield,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/fx/reveal";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "About HEXA",
  description:
    "Why HEXA exists, who we serve, and the principles we won't compromise.",
};

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Outcomes over engagement",
    body: "We measure success in GCSE results, not screen time. No streaks, no dark patterns, no engagement loops.",
  },
  {
    icon: Shield,
    title: "Safeguarding before automation",
    body: "Every workflow has a defined point at which it hands control to a human. Children always come first.",
  },
  {
    icon: Microscope,
    title: "Verifiable, not just believable",
    body: "Every claim — academic, compliance, security — is backed by cryptographic evidence or independent audit.",
  },
  {
    icon: Compass,
    title: "Parents in the driving seat",
    body: "We assist; we don't replace. Parents see everything, control everything, and own all their data.",
  },
  {
    icon: Heart,
    title: "UK-first, UK-only",
    body: "Built for the UK regulatory frontier. Hosted in the UK. No data leaves UK soil.",
  },
  {
    icon: Flag,
    title: "Honest about limits",
    body: "We tell parents what AI can do and what only a human can. We never overpromise.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="About"
          title={
            <>
              We exist because
              <br />
              <span className="text-gradient-aurora">
                parents kept asking.
              </span>
            </>
          }
          description="HEXA was founded by a small team of engineers, educators and homeschool parents who couldn't find a platform that did what they actually needed. So we built one."
        />
      </Section>

      <Section>
        <Container size="md">
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fog-50 mb-6">
              The story
            </h2>
            <div className="flex flex-col gap-5 text-base text-fog-300 leading-relaxed">
              <p>
                Three things happened in 2023 that made HEXA inevitable:
              </p>
              <p>
                <strong className="text-fog-100">First</strong>, UK elective
                home education numbers crossed 92,000 — a 50% increase in five
                years, with no sign of slowing. Mainstream school stopped being
                the default for a meaningful slice of British families.
              </p>
              <p>
                <strong className="text-fog-100">Second</strong>, Local
                Authority EHE teams across 153 councils faced the same workload
                with inconsistent guidance. Parents were caught in a paperwork
                trap that varied by postcode.
              </p>
              <p>
                <strong className="text-fog-100">Third</strong>, AI got good
                enough — but only just — to deliver genuine, individually
                paced education at scale, with the right architecture around
                it. The keyword being <em>right architecture</em>. A chatbot
                is not a school.
              </p>
              <p>
                HEXA is what we built when we couldn't find a platform that
                took all three seriously at once. It's an autonomous learning
                system wrapped in a compliance engine wrapped in a safeguarding
                net. Because that's what UK homeschooling families actually
                need.
              </p>
            </div>
          </Card>
        </Container>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Principles"
          title="What we won't compromise"
          description="Six commitments encoded into every product decision we make."
        />
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.07}>
              <Card variant="glass" padding="lg" interactive className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30 mb-5">
                  <p.icon className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-fog-50 mb-2">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-fog-400">{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
