import type { Metadata } from "next";
import {
  Building2,
  FileSearch,
  Fingerprint,
  Mail,
  Scale,
  Shield,
  Verified,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/fx/reveal";

export const metadata: Metadata = {
  title: "For Local Authorities",
  description:
    "Information for UK Local Authority EHE officers reviewing children registered on HEXA.",
};

const STATUTORY_CATEGORIES = [
  {
    title: "Breadth",
    description:
      "Demonstrates that the curriculum covers a sufficient range of subjects and topics.",
    icon: FileSearch,
  },
  {
    title: "Balance",
    description:
      "Shows appropriate weighting across subjects and learning modalities.",
    icon: Scale,
  },
  {
    title: "Progression",
    description:
      "Evidences a coherent, age-appropriate developmental trajectory.",
    icon: Verified,
  },
];

const FEATURES = [
  {
    icon: Fingerprint,
    title: "Cryptographic signatures",
    body: "Every dossier carries a SHA-256 signature computed from the underlying immutable database records. Tampering is mathematically detectable.",
  },
  {
    icon: Shield,
    title: "Read-only audit access",
    body: "On parent consent, we provide LA officers with a unique read-only verification URL. Access is logged. Downloads are tracked.",
  },
  {
    icon: Mail,
    title: "Direct case officer channel",
    body: "Dedicated email line for LA officers with formal queries. Average response time under 24 hours.",
  },
];

export default function LocalAuthoritiesPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="For Local Authorities"
          title={
            <>
              Built to make
              <br />
              <span className="text-gradient-aurora">
                your job easier.
              </span>
            </>
          }
          description="If a child registered with your authority is on HEXA, here's exactly what you can expect — and how to verify it."
        />
      </Section>

      <Section padded={false} className="pb-20">
        <div className="grid lg:grid-cols-3 gap-5">
          {STATUTORY_CATEGORIES.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <Card variant="glass-strong" padding="xl" className="h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
                    <c.icon className="h-5 w-5 text-violet-300" />
                  </div>
                  <Badge variant="violet" size="sm">
                    Statutory category
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-fog-50 mb-2">
                  {c.title}
                </h3>
                <p className="text-sm leading-relaxed text-fog-400">
                  {c.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Verification"
          title="Trust, but verify"
          description="HEXA portfolios are designed to be independently verifiable. You don't have to take our word for anything."
          align="left"
        />
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <Card variant="glass" padding="lg" className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30 mb-5">
                  <f.icon className="h-5 w-5 text-neon-400" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-fog-50 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-fog-400">{f.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="py-32">
        <Container size="md">
          <Card variant="glass-strong" padding="xl" className="text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/30 mb-6">
              <Building2 className="h-6 w-6 text-violet-300" />
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-fog-50 mb-4">
              Talk to our LA liaison
            </h2>
            <p className="text-base text-fog-300 leading-relaxed max-w-xl mx-auto mb-8">
              We retain a UK education law specialist who liaises directly with
              EHE officers. We can provide platform documentation, sample dossiers,
              and verification keys on request.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="mailto:la@hexa.education" variant="primary" size="lg">
                <Mail className="h-4 w-4" />
                la@hexa.education
              </Button>
              <Button href="/contact" variant="secondary" size="lg">
                General contact
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
