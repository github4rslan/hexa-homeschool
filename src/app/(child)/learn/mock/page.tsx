import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, BookText, FlaskConical, ArrowLeft, Timer } from "lucide-react";
import { currentParentId, getActiveChild } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";

export const metadata: Metadata = { title: "Mock exam" };
export const dynamic = "force-dynamic";

const SUBJECTS = [
  { id: "mathematics", label: "Maths", icon: Calculator, accent: "from-violet-500 to-violet-700" },
  { id: "english", label: "English", icon: BookText, accent: "from-cyan-500 to-cyan-700" },
  { id: "science", label: "Science", icon: FlaskConical, accent: "from-neon-500 to-neon-600" },
] as const;

export default async function MockHubPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn/mock");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/learn"
        className="child-touch mb-6 inline-flex items-center gap-2 text-base text-fog-300 hover:text-fog-100"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-semibold text-fog-50">Mock exam</h1>
        <p className="mt-3 text-xl text-fog-300">
          A short, calm practice paper. No pressure — it just shows where
          you&apos;re at today.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-base text-fog-400">
          <Timer className="h-5 w-5" /> About 15 minutes · 10 questions
        </p>
      </div>

      <div className="grid gap-5">
        {SUBJECTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.id}
              href={`/learn/mock/${s.id}`}
              className="child-touch child-panel group flex items-center gap-5 p-6 transition-all hover:scale-[1.01]"
            >
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${s.accent} text-white`}
              >
                <Icon className="h-9 w-9" />
              </div>
              <div className="flex-1 text-2xl font-semibold text-fog-50">
                {s.label} mock
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
