"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/fx/spotlight";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  location: string;
  initial: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The Local Authority visit used to be the worst week of my year. Now I just hand them the dossier. The case officer told me it was the cleanest portfolio she'd seen in 12 years.",
    name: "Priya M.",
    role: "Parent of two",
    location: "Manchester",
    initial: "P",
    color: "#A78BFA",
  },
  {
    quote:
      "My son was bored stiff at school. Three months on HEXA and he's pacing through Year 11 maths at 12. The diagnostic was brutally honest — exactly what we needed.",
    name: "James K.",
    role: "Parent of one",
    location: "Bristol",
    initial: "J",
    color: "#06FFA5",
  },
  {
    quote:
      "When the AI flagged that my daughter was getting frustrated with quadratics, a real tutor was on a video call within 12 minutes. That's the moment I knew this wasn't just chatbot fluff.",
    name: "Sarah T.",
    role: "Parent of three",
    location: "Edinburgh",
    initial: "S",
    color: "#00D4FF",
  },
  {
    quote:
      "I spent £40k a year on private school for marginal results. HEXA does more in 60 minutes a day. My daughter sits her first GCSE next summer aged 13.",
    name: "Olivia R.",
    role: "Parent of one",
    location: "London",
    initial: "O",
    color: "#A78BFA",
  },
  {
    quote:
      "The monthly mocks predicted her grade within half a band of the real GCSE result. Compliance paperwork that used to take me a weekend now takes 30 seconds.",
    name: "David L.",
    role: "Homeschool dad",
    location: "Cardiff",
    initial: "D",
    color: "#06FFA5",
  },
  {
    quote:
      "What sold me was the safety net. The platform halted lessons the day my son typed 'I give up' — and a tutor was assigned before I'd even finished my coffee.",
    name: "Aisha N.",
    role: "Parent of two",
    location: "Birmingham",
    initial: "A",
    color: "#00D4FF",
  },
];

export function Testimonials() {
  return (
    <Section className="relative">
      <SectionHeader
        eyebrow="Parents on HEXA"
        title={
          <>
            UK parents who stopped
            <br />
            <span className="text-gradient-aurora">waiting for permission.</span>
          </>
        }
        description="Built with real homeschooling families across the UK. Quotes shown reflect platform pilot participants and are reproduced with consent."
      />

      <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.06 }}
          >
            <Spotlight color="rgba(167, 139, 250, 0.15)" className="rounded-2xl h-full">
              <Card variant="glass" padding="lg" className="h-full flex flex-col">
                <Quote className="h-6 w-6 text-violet-400/40 mb-4" />

                <p className="text-base leading-relaxed text-fog-200 mb-6 flex-1">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${t.color}, ${t.color}80)`,
                    }}
                  >
                    {t.initial}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-fog-50">
                      {t.name}
                    </div>
                    <div className="text-xs text-fog-500">
                      {t.role} · {t.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Spotlight>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
