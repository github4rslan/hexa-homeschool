"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileCheck, FilePlus2, ShieldCheck, Landmark } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: FilePlus2, label: "Registration form pre-fill" },
  { icon: FileCheck, label: "Quarterly compliance reports" },
  { icon: ShieldCheck, label: "Verified tamper-evident portfolios" },
  { icon: Landmark, label: "Direct Local Authority portal launching 2027" },
];

export function CompliancePreview() {
  return (
    <Section containerSize="lg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="card-amber rounded-3xl p-8 md:p-12 max-w-4xl mx-auto"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-clay-300 bg-linen-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-clay-700">
          The Children&apos;s Wellbeing and Schools Act 2026
        </span>

        <h2 className="mt-6 font-editorial text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-forest-900">
          Built for the New Law
        </h2>

        <p className="mt-5 text-lg leading-relaxed text-ink-700 max-w-2xl">
          The Children&apos;s Wellbeing and Schools Act 2026 will soon require all
          home-educated children to be registered with Local Authorities. Evidence
          of suitable education will be mandatory.{" "}
          <span className="font-semibold text-forest-900">HEXA is ready.</span>
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-xl bg-linen-50/70 border border-clay-200/60 px-4 py-3"
            >
              <f.icon className="h-5 w-5 text-clay-600 shrink-0" />
              <span className="text-sm font-medium text-forest-900">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="font-editorial text-xl md:text-2xl font-semibold text-forest-900">
            Do not wait for the letter. Be ready now.
          </p>
          <Button href="/signup" variant="forest" size="lg">
            Start your free assessment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </Section>
  );
}
