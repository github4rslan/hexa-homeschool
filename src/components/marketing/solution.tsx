"use client";

import { m } from "framer-motion";
import { Building2, Users } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const SUBJECTS = ["Maths", "English", "Science"];

const AUDIENCES = [
  {
    icon: Users,
    label: "For parents",
    title: "Daily lessons planned for you.",
    body: "Progress tracked automatically. Council paperwork generated in one click. You focus on your child, not the admin.",
  },
  {
    icon: Building2,
    label: "For Local Authorities",
    title: "Professional verified portfolios.",
    body: "Cryptographic integrity. Clear evidence of intent, implementation, and impact. No ambiguity. No disputes.",
  },
];

export function Solution() {
  return (
    <Section className="relative bg-forest-50/40 border-y border-forest-900/5">
      <SectionHeader
        eyebrow="The solution"
        title={
          <>
            Three core subjects. One clear path.{" "}
            <span className="text-gradient-forest">Full protection.</span>
          </>
        }
        description="Mapped to GCSE specifications from day one. Not rushed. Not forced. Your child progresses at their pace, with full visibility on where they stand."
      />

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {SUBJECTS.map((s) => (
          <span
            key={s}
            className="rounded-full border border-forest-600/25 bg-linen-50 px-5 py-2 text-sm font-medium text-forest-800"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {AUDIENCES.map((a, i) => (
          <m.div
            key={a.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="card-warm rounded-2xl p-8 h-full"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-forest-600/20 bg-forest-50 text-forest-600 mb-5">
              <a.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-clay-600">
              {a.label}
            </span>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-forest-900">
              {a.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{a.body}</p>
          </m.div>
        ))}
      </div>
    </Section>
  );
}
