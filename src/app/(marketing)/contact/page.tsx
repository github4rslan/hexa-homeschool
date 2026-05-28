import type { Metadata } from "next";
import {
  Building2,
  Headphones,
  Mail,
  MessageCircle,
  Newspaper,
  ShieldAlert,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/fx/reveal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach HEXA — by department, with response times.",
};

const CHANNELS = [
  {
    icon: Headphones,
    title: "Support",
    email: "support@hexa.education",
    sla: "Response under 24 hours",
    body: "Account help, billing, technical issues.",
    color: "violet" as const,
  },
  {
    icon: MessageCircle,
    title: "Sales",
    email: "hello@hexa.education",
    sla: "Response under 12 hours (business days)",
    body: "Pricing, plans, demos, partnerships.",
    color: "cyan" as const,
  },
  {
    icon: Building2,
    title: "Local Authority liaison",
    email: "la@hexa.education",
    sla: "Response under 24 hours",
    body: "EHE officer queries, formal correspondence, audit access.",
    color: "neon" as const,
  },
  {
    icon: ShieldAlert,
    title: "Safeguarding",
    email: "safeguarding@hexa.education",
    sla: "Monitored 24/7",
    body: "Concerns about a child's welfare or safety.",
    color: "amber" as const,
  },
  {
    icon: Newspaper,
    title: "Press & media",
    email: "press@hexa.education",
    sla: "Response under 48 hours",
    body: "Interviews, quotes, media kit requests.",
    color: "violet" as const,
  },
  {
    icon: Mail,
    title: "Privacy & data",
    email: "privacy@hexa.education",
    sla: "Response under 24 hours",
    body: "Subject access requests, data rights, DPO queries.",
    color: "cyan" as const,
  },
];

const colorClasses = {
  violet: "bg-violet-500/10 border-violet-400/30 text-violet-300",
  cyan: "bg-cyan-500/10 border-cyan-400/30 text-cyan-400",
  neon: "bg-neon-500/10 border-neon-400/30 text-neon-400",
  amber: "bg-amber-500/10 border-amber-400/30 text-amber-400",
};

export default function ContactPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Contact"
          title={
            <>
              We read
              <br />
              <span className="text-gradient-violet">every message.</span>
            </>
          }
          description="No tier-1 outsourced ticket queues. Real humans, real responses, real SLAs published below."
        />
      </Section>

      <Section padded={false} className="pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.email} delay={i * 0.06}>
              <Card variant="glass" padding="lg" interactive className="h-full">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${colorClasses[c.color]} mb-5`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-fog-50 mb-2">
                  {c.title}
                </h3>
                <p className="text-sm leading-relaxed text-fog-400 mb-4">
                  {c.body}
                </p>
                <a
                  href={`mailto:${c.email}`}
                  className="text-sm font-mono text-violet-300 hover:text-violet-200 transition-colors block mb-2"
                >
                  {c.email}
                </a>
                <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                  {c.sla}
                </span>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Container size="sm">
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fog-50 mb-2">
              Or send a message
            </h2>
            <p className="text-sm text-fog-400 mb-8">
              We'll route it to the right team within one working day.
            </p>

            <form className="flex flex-col gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input name="name" label="Your name" placeholder="Jane Smith" required />
                <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
              </div>
              <Input name="subject" label="Subject" placeholder="What's this about?" required />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-fog-300">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-fog-50 placeholder:text-fog-500 transition-all focus:bg-white/[0.05] focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20 resize-none"
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="mt-2 self-start">
                Send message
              </Button>
              <p className="text-xs text-fog-500 mt-2">
                We reply from a real human inbox. Your details are never used for marketing.
              </p>
            </form>
          </Card>
        </Container>
      </Section>
    </>
  );
}
