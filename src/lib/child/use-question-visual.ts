"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  visualFromApiPayload,
  type QuestionVisual,
} from "@/lib/child/question-visual";

interface VisualState {
  visual: QuestionVisual | null;
}

export function useQuestionVisual(
  questionId?: string | null,
  keyStage?: number,
): VisualState & { prefetch: (nextQuestionId?: string | null) => void } {
  const cacheRef = useRef<Map<string, QuestionVisual | null>>(new Map());
  const inflightRef = useRef<Map<string, Promise<QuestionVisual | null>>>(
    new Map(),
  );
  const [visual, setVisual] = useState<QuestionVisual | null>(null);

  const cacheKey = useCallback(
    (id: string) => `${id}:${keyStage ?? "unset"}`,
    [keyStage],
  );

  const fetchVisual = useCallback(
    (id: string): Promise<QuestionVisual | null> => {
      const key = cacheKey(id);
      if (cacheRef.current.has(key)) {
        return Promise.resolve(cacheRef.current.get(key) ?? null);
      }
      const existing = inflightRef.current.get(key);
      if (existing) return existing;

      const request = (async (): Promise<QuestionVisual | null> => {
        try {
          const response = await fetch("/api/question-visual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: id,
              ...(keyStage ? { keyStage } : {}),
            }),
          });
          if (!response.ok) return null;
          const parsed = visualFromApiPayload(await response.json());
          cacheRef.current.set(key, parsed);
          return parsed;
        } catch {
          cacheRef.current.set(key, null);
          return null;
        } finally {
          inflightRef.current.delete(key);
        }
      })();
      inflightRef.current.set(key, request);
      return request;
    },
    [cacheKey, keyStage],
  );

  useEffect(() => {
    let cancelled = false;
    const id = questionId?.trim();
    setVisual(null);
    if (!id) return;

    void fetchVisual(id).then((result) => {
      if (!cancelled) setVisual(result);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchVisual, questionId]);

  const prefetch = useCallback(
    (nextQuestionId?: string | null) => {
      const id = nextQuestionId?.trim();
      if (!id) return;
      void fetchVisual(id);
    },
    [fetchVisual],
  );

  return { visual, prefetch };
}
