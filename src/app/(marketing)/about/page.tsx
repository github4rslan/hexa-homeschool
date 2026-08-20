import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CTA } from "@/components/marketing/cta";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  title: "About Edway",
  description:
    "Meet Aziz — founder, father, believer in childhood. The story behind Edway, written by the parent who built it.",
});

/**
 * Founder's Story — Section J. Verbatim from the approved Edway Website
 * Implementation Guide. Editorial feature layout: left-aligned, generous
 * margins, lead-in labels, signature sign-off. Wording is unchanged.
 */
const STORY: { lead: string; paragraphs: string[] }[] = [
  {
    lead: "",
    paragraphs: [
      "I am a dad who works from home. I have three daughters. Three, nine, and twelve. And I chose a different path for them. Not because I am anti-school. Because I am pro-childhood.",
    ],
  },
  {
    lead: "The Moment I Knew",
    paragraphs: [
      "My eight-year-old came home and asked me something no child should need to ask: “Dad, what is a vape?” A classmate was selling them. In school. At eight years old. I reported it. But that night, lying awake, I asked myself: What else is happening that I do not know about? What influences are shaping my girls when I am not there?",
      "Social media was not built for children. Neither were crowded classrooms with one exhausted teacher trying to manage thirty different minds. I wanted my girls to be children. To run. To play. To breathe. To explore the world before the world explored them.",
    ],
  },
  {
    lead: "Every Child Learns Differently",
    paragraphs: [
      "In one home, three completely different minds. One races ahead. One needs time to sit with an idea, turn it over, understand it deeply. One learns best in short bursts with movement between. Traditional school sees one age. One pace. One schedule. I saw three unique children who deserved to be seen.",
    ],
  },
  {
    lead: "The Discovery",
    paragraphs: [
      "I did not even know homeschooling was legal in the UK. Then I met parents at my daughters' jiu-jitsu classes. Elite athletes training full-time, homeschooled so their education bent around their passion, not the other way around. Their children were disciplined, happy, thriving. That was my first spark. I joined Facebook groups. I spoke to dozens of parents. I heard the same fears, the same hopes, the same love.",
    ],
  },
  {
    lead: "The Hidden Cost of Freedom",
    paragraphs: [
      "The joy was real. The freedom was real. But so was the weight. Private tutors. Small group sessions. Endless planning. Spreadsheets at midnight. The Sunday-night panic of what are we doing this week? And the tutors? They could only come after school hours. My girls were training jiu-jitsu daily, competing weekly, building friendships on the mat, the pool, the hiking trail. Not a classroom. But education was chained to someone else's schedule. We wanted to travel. To learn on a plane, on a beach, anywhere in the world. We wanted mornings that started gently. Breakfast, a little rest, then learning from 9:30 to 12:00. Done by lunch. The rest of the day for swimming, hiking, climbing, libraries, living. We wanted to fully enjoy our children. And we wanted them to fully enjoy us. But the system fought us at every turn.",
    ],
  },
  {
    lead: "Why I Built Edway",
    paragraphs: [
      "I did not set out to build a company. I set out to build the life my family deserved. A way for my daughters to learn at their pace, in their way, without me losing sleep over paperwork. A way to prove to myself and any authority that my children were not just keeping up, but flourishing. A way to bring expert education within reach of normal families, without the crushing cost of private tutoring. And now, with new laws coming—registration, scrutiny, compliance—I want to protect parents who feel that same anxiety I felt. Who lie awake wondering if they are enough. You are enough. And you do not have to do it alone.",
    ],
  },
  {
    lead: "What Edway Means to Me",
    paragraphs: [
      "Edway is the assistant I wished I had. It plans the lessons I used to plan at midnight. It teaches the concepts I was not sure how to explain. It tracks the progress I used to guess at. And when the letter comes—the one every homeschooling parent fears—it generates the proof that lets me sleep. Not because I am replacing myself as a parent. Because I am finally present as one.",
    ],
  },
  {
    lead: "To Every Parent Who Is Wondering",
    paragraphs: [
      "Maybe you are where I was. Staring at a system that does not fit your child. Hearing stories that keep you up at night. Wanting something different but not knowing if you can pull it off. You can. You do not need to be a teacher. You need to be a parent who cares enough to try. Edway handles the rest.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "About", path: "/about" }]} />
      {/* Editorial masthead */}
      <header className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-warm-hero pointer-events-none" />
        <Container size="md">
          <div className="relative max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-clay-600">
              Founder&apos;s story
            </span>
            <h1 className="mt-4 font-editorial text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-forest-900 leading-[1.05]">
              Meet Aziz. Founder. Father.{" "}
              <span className="text-gradient-forest italic">
                Believer in childhood.
              </span>
            </h1>
          </div>
        </Container>
      </header>

      {/* Body — editorial column */}
      <Container size="md">
        <article className="max-w-2xl pb-20">
          {STORY.map((section, si) => (
            <section key={si} className="mb-10">
              {section.lead && (
                <h2 className="font-editorial text-2xl md:text-3xl font-semibold text-forest-900 mb-4 mt-4">
                  {section.lead}
                </h2>
              )}
              <div className="flex flex-col gap-5">
                {section.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className={`text-lg leading-relaxed text-ink-700 ${
                      si === 0 && i === 0
                        ? "first-letter:font-editorial first-letter:text-6xl first-letter:font-semibold first-letter:text-forest-700 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.85]"
                        : ""
                    }`}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {/* Signature sign-off */}
          <div className="mt-12 pt-8 border-t border-forest-900/15">
            <p className="font-editorial text-xl italic text-ink-700">
              From my family to yours,
            </p>
            <p className="mt-3 font-editorial text-3xl font-semibold text-forest-900">
              Aziz Ahmed
            </p>
            <p className="mt-1 text-sm text-ink-600">
              Founder, Edway · Father of three · Homeschooler · Jiu-jitsu dad
            </p>
          </div>
        </article>
      </Container>

      <CTA />
    </>
  );
}
