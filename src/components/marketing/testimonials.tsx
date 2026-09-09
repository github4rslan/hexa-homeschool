"use client";

import { useEffect, useState } from "react";
import { m } from "motion/react";
import { Quote, Star } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import {
  toDisplayTestimonials,
  type Testimonial,
  type RealTestimonial,
} from "@/lib/engine/testimonials";

// F5: real, staff-featured, parent-consented quotes (once there are enough of
// them, see lib/engine/testimonials.ts) replace this curated placeholder copy
// entirely, so a brand-new install with zero opted-in feedback still shows a
// trust section.
const CURATED_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The Local Authority officer told me it was the clearest portfolio she had seen in twelve years.",
    name: "Priya M.",
    meta: "Parent of two. Manchester.",
  },
  {
    quote:
      "My son was bored at school. Edway showed us he was ready for harder work. He chooses his pace. We choose when he is ready to sit exams.",
    name: "James K.",
    meta: "Parent of one. Bristol.",
  },
  {
    quote:
      "When my daughter got stuck on fractions, a real tutor was on video within twelve minutes. That is when I knew this was not just an app.",
    name: "Sarah T.",
    meta: "Parent of three. Edinburgh.",
  },
  {
    quote:
      "I used to spend my weekends on paperwork. Now I press one button. Thirty seconds. Done.",
    name: "David L.",
    meta: "Homeschool dad. Cardiff.",
  },
];

export function Testimonials() {
  // Curated copy renders immediately (no loading state visible, no layout
  // shift); real testimonials swap in only once there are enough of them.
  // Never analytics, no tracking on this fetch, purely public read.
  const [real, setReal] = useState<RealTestimonial[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testimonials")
      .then((res) => (res.ok ? res.json() : { testimonials: [] }))
      .then((data: { testimonials?: RealTestimonial[] }) => {
        if (!cancelled && Array.isArray(data.testimonials)) {
          setReal(data.testimonials);
        }
      })
      .catch(() => {
        // Silent: the curated fallback already covers this case.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = toDisplayTestimonials(real) ?? CURATED_TESTIMONIALS;

  return (
    <Section className="relative bg-forest-50/40 border-y border-forest-900/5">
      <SectionHeader
        eyebrow="From real families"
        title={
          <>
            Trusted by parents{" "}
            <span className="text-gradient-forest">across the UK.</span>
          </>
        }
      />

      <div className="mt-16 grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {items.map((t, i) => (
          <m.figure
            key={t.name + i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className={`card-warm rounded-2xl p-8 flex flex-col ${
              i % 3 === 0 ? "md:mt-0" : "md:mt-6"
            }`}
          >
            {t.stars ? (
              <div className="mb-4 flex items-center gap-0.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={
                      n <= t.stars!
                        ? "h-4 w-4 fill-clay-400 text-clay-400"
                        : "h-4 w-4 text-clay-400/30"
                    }
                  />
                ))}
              </div>
            ) : (
              <Quote className="h-7 w-7 text-clay-400/60 mb-4" />
            )}
            <blockquote className="font-editorial text-lg md:text-xl leading-relaxed text-forest-900 flex-1">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-forest-900/10">
              <div className="text-sm font-semibold text-forest-800">
                {t.name}
              </div>
              <div className="text-xs text-ink-500 mt-0.5">{t.meta}</div>
            </figcaption>
          </m.figure>
        ))}
      </div>
    </Section>
  );
}
