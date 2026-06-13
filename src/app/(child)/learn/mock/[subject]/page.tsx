import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentParentId, getActiveChild, buildMockPaper } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";
import { MockExamPlayer } from "@/components/child/mock-exam-player";

export const metadata: Metadata = { title: "Mock exam" };
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<Subject, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

function isSubject(s: string): s is Subject {
  return s === "mathematics" || s === "english" || s === "science";
}

export default async function MockSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  if (!isSubject(subject)) notFound();

  const parentId = await currentParentId();
  if (!parentId) redirect(`/login?redirect=/learn/mock/${subject}`);
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  const paper = await buildMockPaper(child._id, subject, 10);
  // No questions available for this subject yet — send back to the hub.
  if (paper.length === 0) redirect("/learn/mock");

  return (
    <div className="mx-auto max-w-2xl">
      <MockExamPlayer
        subject={subject}
        subjectLabel={SUBJECT_LABEL[subject]}
        questions={paper}
        durationSeconds={15 * 60}
      />
    </div>
  );
}
