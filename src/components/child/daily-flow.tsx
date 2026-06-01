"use client";

import { useState } from "react";
import { Explainer } from "./explainer";
import { PracticePlayer } from "./practice-player";
import type { Question } from "@/components/lesson/lesson-player";

/**
 * Sequences the child's lesson: Explainer → Practice/Mastery.
 * (Check-in happens on the /learn hub before this.)
 */
export function DailyFlow({
  title,
  summary,
  points,
  questions,
  curriculumTopic,
}: {
  title: string;
  summary: string;
  points: string[];
  questions: Question[];
  curriculumTopic: string;
}) {
  const [phase, setPhase] = useState<"explainer" | "practice">("explainer");

  if (phase === "explainer") {
    return (
      <Explainer
        title={title}
        summary={summary}
        points={points}
        onContinue={() => setPhase("practice")}
      />
    );
  }

  return (
    <PracticePlayer
      questions={questions}
      curriculumTopic={curriculumTopic}
      lessonTitle={title}
    />
  );
}
