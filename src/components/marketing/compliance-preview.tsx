"use client";

import { motion } from "framer-motion";
import { Database, FileCheck, KeyRound, Lock, MapPin, Shield } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const TRUST_PILLARS = [
  {
    icon: Lock,
    title: "AES-256 at rest",
    description: "All data payloads encrypted with AES-256. TLS 1.3 enforced for all transit.",
    accent: "violet",
  },
  {
    icon: MapPin,
    title: "UK data residency",
    description: "All storage localised to AWS London (eu-west-2). No data leaves UK soil.",
    accent: "cyan",
  },
  {
    icon: KeyRound,
    title: "SHA-256 portfolios",
    description: "Every Local Authority dossier carries a verifiable cryptographic signature.",
    accent: "neon",
  },
  {
    icon: Shield,
    title: "Children's Code",
    description: "Strict data minimisation. No behavioural tracking. No engagement loops.",
    accent: "violet",
  },
  {
    icon: FileCheck,
    title: "24-month destruction",
    description: "Full record destruction routines auto-initiate 24 months post account closure.",
    accent: "cyan",
  },
  {
    icon: Database,
    title: "Immutable audit",
    description: "Every compliance claim is backed by an immutable database reference.",
    accent: "neon",
  },
];

const accentClasses = {
  violet: "text-violet-300 bg-violet-500/10 border-violet-400/30",
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-400/30",
  neon: "text-neon-400 bg-neon-500/10 border-neon-400/30",
};

export function CompliancePreview() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Trust & Compliance"
        title={
          <>
            Built for the
            <br />
            <span className="text-gradient-violet">UK regulatory frontier</span>
          </>
        }
        description="Local Authorities don't accept screenshots. They accept evidence. Every byte of your child's progress is cryptographically signed and statutorily defensible."
      />

      <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TRUST_PILLARS.map((pillar, i) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
          >
            <Card variant="glass" padding="lg" interactive className="h-full">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accentClasses[pillar.accent as keyof typeof accentClasses]}`}>
                <pillar.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-fog-50">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fog-400">
                {pillar.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
