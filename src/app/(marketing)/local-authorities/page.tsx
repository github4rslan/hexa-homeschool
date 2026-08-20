import type { Metadata } from "next";
import {
  Building2,
  FileSearch,
  Scale,
  Verified,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/fx/reveal";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  path: "/local-authorities",
  title: "For Local Authorities",
  description:
    "Information for UK Local Authority EHE officers reviewing children registered on Edway. Cryptographically signed, statutorily defensible portfolios.",
});

const STATUTORY = [
  {
    title: "Intent",
    description:
      "The documented curriculum plan: what the child is set to learn, mapped to GCSE specifications.",
    icon: FileSearch,
  },
  {
    title: "Implementation",
    description:
      "Verified lesson logs and tracking trends evidencing how the plan was actually delivered.",
    icon: Scale,
  },
  {
    title: "Impact",
    description:
      "Assessment results and predictive grading showing a coherent, age-appropriate progression.",
    icon: Verified,
  },
  {
    title: "Next Steps",
    description:
      "A forward plan for the coming term — the trajectory toward exam readiness, on the child's timeline.",
    icon: ListChecks,
  },
];

const SECURITY_TAGS = [
  "AES-256 at Rest",
  "TLS 1.3 in Transit",
  "UK Data Residency",
  "SHA-256 Verification",
  "Children's Code Compliant",
  "Immutable Audit Trails",
];

/**
 * Section K — Local Authority Gateway (B2G). Brief: a completely distinct,
 * institutional appearance — white background, thin structural lines, technical
 * architecture tags. We force a crisp white surface here (over the warm linen
 * theme) to read as an audit interface for council officers.
 */
export default function LocalAuthoritiesPage() {
  return (
    <div className="bg-white">
      {/* Institutional masthead */}
      <header className="relative border-b border-forest-900/12 bg-white">
        <div className="absolute inset-0 bg-grid-warm pointer-events-none opacity-60" />
        <Container size="lg" className="relative py-16 md:py-20">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-forest-600">
            B2G · Local Authority audit interface
          </span>
          <h1 className="mt-4 font-editorial text-4xl md:text-5xl font-semibold tracking-tight text-forest-900 max-w-3xl leading-tight">
            Evidence That Speaks for Itself
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">
            Local Authorities do not accept screenshots. They accept proof. Every
            byte of your child&apos;s progress is cryptographically signed and
            statutorily defensible.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
            Edway generates portfolios in statutory format: Intent, Implementation,
            Impact, Next Steps. Professional. Thorough. Ready for inspection.
          </p>
          <div className="mt-8">
            <Button href="/contact" variant="forest" size="lg">
              Request a pilot partnership
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </header>

      {/* Statutory format grid */}
      <Section containerSize="lg" className="bg-white">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-forest-900/10 rounded-2xl overflow-hidden border border-forest-900/10">
          {STATUTORY.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="card-institutional h-full p-7 !border-0">
                <c.icon className="h-6 w-6 text-forest-600 mb-4" />
                <h3 className="text-lg font-semibold text-forest-900 mb-2">
                  {c.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-600">
                  {c.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Security architecture tags */}
      <Section padded={false} containerSize="lg" className="pb-16 bg-white">
        <div className="rounded-2xl border border-forest-900/12 bg-linen-50 p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {SECURITY_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-forest-900/12 bg-white px-3 py-1.5 text-xs font-mono text-ink-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* LA liaison CTA */}
      <section className="py-24 bg-white border-t border-forest-900/10">
        <Container size="md">
          <div className="card-institutional rounded-3xl p-10 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-forest-700 text-linen-50 mb-6">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="font-editorial text-3xl md:text-4xl font-semibold tracking-tight text-forest-900 mb-4">
              Talk to our LA liaison
            </h2>
            <p className="text-base text-ink-700 leading-relaxed max-w-xl mx-auto mb-8">
              We retain a UK education law specialist who liaises directly with
              EHE officers. We can provide platform documentation, sample
              dossiers, and verification keys on request.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="/contact" variant="forest" size="lg">
                Request a pilot partnership
              </Button>
              <Button href="/compliance" variant="warm-outline" size="lg">
                Review the compliance model
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
