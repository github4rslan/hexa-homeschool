import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "About HEXA",
  description:
    "Meet Aziz — founder, father, believer in childhood. The story behind HEXA, written by the parent who built it.",
};

/**
 * Founder letter — verbatim from the approved HEXA Web Content ("About Us").
 * Structured into headed sections for readability; wording is unchanged.
 */
const STORY: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "Meet Aziz — Founder, Father, Believer in Childhood",
    paragraphs: [
      "I'm a dad who works from home. I have three daughters—three, nine, and twelve. And I chose a different path for them.",
      "Not because I'm anti-school. Because I'm pro-childhood.",
    ],
  },
  {
    heading: "The Moment I Knew",
    paragraphs: [
      "My eight-year-old came home and asked me something no child should need to ask:",
      "\"Dad, what's a vape?\"",
      "A classmate was selling them. In school. At eight years old.",
      "I reported it. But that night, lying awake, I asked myself: What else is happening that I don't know about? What influences are shaping my girls when I'm not there?",
      "Social media wasn't built for children. Neither were crowded classrooms with one exhausted teacher trying to manage thirty different minds.",
      "I wanted my girls to be children. To run. To play. To breathe. To explore the world before the world explored them.",
    ],
  },
  {
    heading: "Every Child Learns Differently",
    paragraphs: [
      "In one home, three completely different minds.",
      "One races ahead. One needs time to sit with an idea, turn it over, understand it deeply. One learns best in short bursts with movement between.",
      "Traditional school sees one age. One pace. One schedule.",
      "I saw three unique children who deserved to be seen.",
    ],
  },
  {
    heading: "The Discovery",
    paragraphs: [
      "I didn't even know homeschooling was legal in the UK.",
      "Then I met parents at my daughters' jiu-jitsu classes—elite athletes training full-time, homeschooled so their education bent around their passion, not the other way around. Their children were disciplined, happy, thriving.",
      "That was my first spark.",
      "I joined Facebook groups. I spoke to dozens of parents. I heard the same fears, the same hopes, the same love:",
      "\"My son was drowning in a classroom of thirty.\"",
      "\"My daughter was bored—years ahead and no one noticed.\"",
      "\"We wanted our children to have childhoods, not just schedules.\"",
      "So my wife and I took the leap. We brought our girls home.",
      "We never looked back.",
    ],
  },
  {
    heading: "The Hidden Cost of Freedom",
    paragraphs: [
      "The joy was real. The freedom was real. But so was the weight.",
      "Private tutors. Small group sessions. Endless planning. Spreadsheets at midnight. The Sunday-night panic of what are we doing this week?",
      "And the tutors? They taught in traditional schools. They could only come after school hours. My girls were training jiu-jitsu daily, competing weekly, building friendships with other homeschooled athletes who shared their passion. Their social life was the mat, the pool, the hiking trail—not a classroom.",
      "But education was chained to someone else's schedule.",
      "We wanted to travel. To learn on a plane, on a beach, anywhere in the world. We wanted mornings that started gently—breakfast, a little rest, then learning from 9:30 to 12:00. Done by lunch. The rest of the day for swimming, hiking, climbing, libraries, living.",
      "We wanted to fully enjoy our children. And we wanted them to fully enjoy us.",
      "But the system fought us at every turn.",
    ],
  },
  {
    heading: "Why I Built HEXA",
    paragraphs: [
      "I didn't set out to build a company. I set out to build the life my family deserved.",
      "A way for my daughters to learn at their pace, in their way, without me losing sleep over paperwork.",
      "A way to prove—to myself, to any authority—that my children were not just keeping up, but flourishing.",
      "A way to bring expert education within reach of normal families, without the crushing cost of private tutoring.",
      "A way to learn anywhere. On a plane. On a beach. At 9:30 AM or 7:00 PM. Whenever life allows. Whenever inspiration strikes.",
      "And now, with new laws coming—registration, scrutiny, compliance—I want to protect parents who feel that same anxiety I felt. Who lie awake wondering if they're enough.",
      "You are enough. And you don't have to do it alone.",
    ],
  },
  {
    heading: "What HEXA Means to Me",
    paragraphs: [
      "HEXA is the assistant I wished I had.",
      "It plans the lessons I used to plan at midnight. It teaches the concepts I wasn't sure how to explain. It tracks the progress I used to guess at. And when the letter comes—the one every homeschooling parent fears—it generates the proof that lets me sleep.",
      "Not because I'm replacing myself as a parent. Because I'm finally present as one.",
      "My daughters still train jiu-jitsu. They still compete. They still have friends who share their passion. They still swim, hike, climb, and explore.",
      "But now, they also have structure. They have proof. They have a future they control.",
      "And I have the flexibility to be there for every moment of it.",
    ],
  },
  {
    heading: "To Every Parent Who's Wondering",
    paragraphs: [
      "Maybe you're where I was. Staring at a system that doesn't fit your child. Hearing stories that keep you up at night. Wanting something different but not knowing if you can pull it off.",
      "You can.",
      "You don't need to be a teacher. You need to be a parent who cares enough to try. HEXA handles the rest—the structure, the teaching, the tracking, the proof.",
      "Your child can train, travel, explore, live—and still have an education that opens every door.",
      "Your child is unique. Their education should be too. Their childhood should be sacred.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="From my family to yours"
          title={
            <>
              I built this
              <br />
              <span className="text-gradient-aurora">for my three girls.</span>
            </>
          }
          description="HEXA was built by a parent who lived the problem — not a faceless edtech team. This is his story, in his words."
        />
      </Section>

      <Section padded={false} className="pb-20">
        <Container size="md">
          <article className="flex flex-col gap-10">
            {STORY.map((section) => (
              <Card key={section.heading} variant="glass" padding="xl">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-fog-50 mb-5">
                  {section.heading}
                </h2>
                <div className="flex flex-col gap-4 text-base text-fog-300 leading-relaxed">
                  {section.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className={
                        p.startsWith("\"")
                          ? "text-fog-100 italic border-l-2 border-violet-400/40 pl-4"
                          : undefined
                      }
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </Card>
            ))}

            {/* Closing signature */}
            <Card variant="glass-strong" padding="xl" className="text-center">
              <p className="text-base text-fog-300 leading-relaxed mb-2">
                Not rushed. Not held back. Not squeezed into a box. Just supported.
                Guided. Given the space to become themselves — and the freedom to
                actually be children while they do it.
              </p>
              <p className="mt-6 text-sm text-fog-400 italic">
                With hope, and with proof,
              </p>
              <p className="mt-2 text-lg font-semibold text-fog-50">Aziz Ahmed</p>
              <p className="text-sm text-fog-400">Founder, HEXA</p>
              <p className="mt-1 text-xs text-fog-500">
                Father of three. Homeschooler. Jiu-jitsu dad. Believer in every
                child's potential.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Start your free diagnostic
                </Button>
              </div>
              <p className="mt-4 text-xs text-fog-500">
                No credit card. 14 days free. Built by a parent who understands.
              </p>
            </Card>
          </article>
        </Container>
      </Section>

      <CTA />
    </>
  );
}
