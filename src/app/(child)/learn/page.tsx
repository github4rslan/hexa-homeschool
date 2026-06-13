import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, BookText, FlaskConical, ArrowRight, Map } from "lucide-react";
import { EmojiCheckin } from "@/components/child/emoji-checkin";
import {
  currentParentId,
  getActiveChild,
  firstTopic,
  certifiedBySubject,
  todaysCheckin,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

const TOPICS_PER_SUBJECT = 10;

const SUBJECTS: {
  id: Subject;
  label: string;
  icon: typeof Calculator;
  accent: string;
  ring: string;
}[] = [
  { id: "mathematics", label: "Maths", icon: Calculator, accent: "from-violet-500 to-violet-700", ring: "text-violet-300" },
  { id: "english", label: "English", icon: BookText, accent: "from-cyan-500 to-cyan-700", ring: "text-cyan-300" },
  { id: "science", label: "Science", icon: FlaskConical, accent: "from-neon-500 to-neon-600", ring: "text-neon-300" },
];

export default async function LearnHubPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  const certified = await certifiedBySubject(child._id);
  const checkedIn = !!(await todaysCheckin(child._id));

  // Resolve a starting topic per subject (first in sequence for now).
  const firstTopics = await Promise.all(
    SUBJECTS.map((s) => firstTopic(s.id)),
  );

  const firstName = child.full_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-semibold text-fog-50">
          Hi {firstName}! 👋
        </h1>
        <p className="mt-3 text-xl text-fog-300">
          Ready to learn something today?
        </p>
      </div>

      {!checkedIn && (
        <div className="mb-8">
          <EmojiCheckin />
        </div>
      )}

      <div className="grid gap-5">
        {SUBJECTS.map((s, i) => {
          const Icon = s.icon;
          const done = certified[s.id] ?? 0;
          const pct = Math.round((done / TOPICS_PER_SUBJECT) * 100);
          const topic = firstTopics[i];
          const href = topic
            ? `/learn/lesson?topic=${topic.topic_tag}`
            : "/learn/lesson";
          return (
            <Link
              key={s.id}
              href={href}
              className="child-touch child-panel group flex items-center gap-5 p-6 transition-all hover:scale-[1.01]"
            >
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${s.accent} text-white`}
              >
                <Icon className="h-9 w-9" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-semibold text-fog-50">
                  {s.label}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-neon-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${s.ring}`}>
                    {done}/{TOPICS_PER_SUBJECT}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-7 w-7 text-fog-400 transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>

      <Link
        href="/learn/map"
        className="child-touch child-panel mt-5 flex items-center justify-center gap-3 p-5 text-lg font-semibold text-fog-100 transition-all hover:scale-[1.01]"
      >
        <Map className="h-6 w-6 text-fog-300" />
        See my journey
      </Link>

      <p className="mt-8 text-center text-fog-500">
        Pick a subject to start your lesson. You&apos;ve got this! 💪
      </p>
    </div>
  );
}
