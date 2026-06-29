import type { Metadata } from "next";
import { TrendingUp, Building2, AlertCircle, Lightbulb } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/fx/count-up";
import { Reveal } from "@/components/fx/reveal";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Why now",
  description:
    "Why Edway, and why now? The UK homeschooling movement is at an inflection point. Here's the data.",
};

const SIGNALS = [
  {
    value: 92000,
    suffix: "+",
    label: "UK children in elective home education",
    sublabel: "Up from 60,000 in 2020. Roughly 50% growth in five years.",
  },
  {
    value: 153,
    label: "UK Local Authorities",
    sublabel: "Each enforcing slightly different EHE monitoring criteria.",
  },
  {
    value: 75,
    suffix: "%",
    label: "of parents cite school 'didn't suit my child'",
    sublabel: "ADHD, autism, anxiety, bullying, accelerated pacing.",
  },
  {
    value: 4,
    suffix: "yrs",
    label: "Average GCSE preparation window",
    sublabel: "Edway compresses this to 2 years without compromising depth.",
  },
];

const NARRATIVE = [
  {
    icon: TrendingUp,
    title: "The numbers are accelerating",
    body: "Elective home education in the UK has grown from roughly 60,000 children in 2020 to over 92,000 today. Post-pandemic, mainstream school is no longer the assumed default for a meaningful subset of families.",
  },
  {
    icon: Building2,
    title: "Local Authority capacity hasn't kept up",
    body: "EHE teams across 153 LAs face the same workload with inconsistent guidance from the Department for Education. The variability isn't malicious — it's structural. Parents need a portfolio standard that works regardless of which LA they're under.",
  },
  {
    icon: AlertCircle,
    title: "Children are bored, anxious, or both",
    body: "Standardised pacing is one of the leading reasons cited by parents for withdrawal: high-ability kids stall, struggling kids fall behind, and SEND kids get accommodated rather than served. AI personalisation finally has the chops to do better.",
  },
  {
    icon: Lightbulb,
    title: "GCSEs are content-based, not age-based",
    body: "Private candidate entry is open to anyone, at any age. A 14-year-old can sit and pass the same paper as a 16-year-old. The system was never the bottleneck — pacing infrastructure was.",
  },
];

export default function WhyNowPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Why now"
          title={
            <>
              UK homeschooling is at
              <br />
              <span className="text-gradient-aurora">an inflection point.</span>
            </>
          }
          description="The pandemic broke the assumption that mainstream school is the only credible path. The infrastructure to do it well hasn't existed — until now."
        />
      </Section>

      <Section padded={false} className="pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {SIGNALS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <Card variant="glass-strong" padding="lg" className="h-full">
                <div className="text-5xl font-semibold tracking-tight text-gradient-violet mb-3">
                  <CountUp end={s.value} suffix={s.suffix} duration={2.5} />
                </div>
                <div className="text-sm font-semibold text-fog-100 mb-1">
                  {s.label}
                </div>
                <div className="text-xs text-fog-500 leading-relaxed">
                  {s.sublabel}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-widest text-fog-600 text-center font-mono">
          Source figures rounded · DfE EHE Survey 2024, ONS, internal research
        </p>
      </Section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-5">
          {NARRATIVE.map((n, i) => (
            <Reveal key={n.title} delay={i * 0.1}>
              <Card variant="glass" padding="xl" className="h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30 mb-5">
                  <n.icon className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-fog-50 mb-3">
                  {n.title}
                </h3>
                <p className="text-base text-fog-300 leading-relaxed">{n.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
