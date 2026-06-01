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
      "The Local Authority officer told me it was the clearest portfolio she'd seen in twelve years.",
    name: "Priya M.",
    role: "Parent",
    location: "Manchester",
    initial: "P",
    color: "#A78BFA",
  },
  {
    quote:
      "My son was bored at school. HEXA showed us he was ready for harder work. He chooses his pace. We choose when he's ready to sit exams.",
    name: "James K.",
    role: "Parent",
    location: "Bristol",
    initial: "J",
    color: "#06FFA5",
  },
  {
    quote:
      "When my daughter got stuck on fractions, a real tutor was on video within twelve minutes. That's when I knew this wasn't just an app.",
    name: "Sarah T.",
    role: "Parent",
    location: "Edinburgh",
    initial: "S",
    color: "#00D4FF",
  },
  {
    quote:
      "I used to spend my weekends on paperwork. Now I press one button. Thirty seconds. Done.",
    name: "David L.",
    role: "Parent",
    location: "Cardiff",
    initial: "D",
    color: "#06FFA5",
  },
];

export function Testimonials() {
  return (
    <Section className="relative">
      <SectionHeader
        eyebrow="Parents on HEXA"
        title={
          <>
            What parents
            <br />
            <span className="text-gradient-aurora">say about HEXA.</span>
          </>
        }
        description="Built with real homeschooling families across the UK. Quotes shown reflect early pilot participants and are reproduced with consent."
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
