"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LessonQuizzesProps {
  quizzes: Quiz[];
  /** When false, omit the "Quizzes" heading (e.g. parent already has a title). */
  showHeading?: boolean;
  /** When false, omit top border and extra padding (embedded under another section). */
  withTopDivider?: boolean;
  className?: string;
}

export default function LessonQuizzes({
  quizzes,
  showHeading = true,
  withTopDivider = true,
  className,
}: LessonQuizzesProps) {
  const router = useRouter();

  const sortedQuizzes = useMemo(() => {
    return [...quizzes].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [quizzes]);

  if (sortedQuizzes.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        withTopDivider && "space-y-4 border-t pt-4",
        !withTopDivider && "space-y-4",
        className
      )}
    >
      {showHeading && <h3 className="text-xl font-bold">Quizzes</h3>}
      <div className="flex flex-col gap-4">
        {sortedQuizzes.map((quiz, index) => {
          const hasResumeAttempt = quiz.quizAttemptId != null;
          const actionLabel = hasResumeAttempt ? "Resume Quiz" : "Take Quiz";
          return (
            <div
              key={quiz.id || index}
              className="relative flex w-full items-center justify-between gap-4 rounded-2xl bg-bgOffwhite p-5"
            >
              <div className="z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-medium md:text-base">
                    {quiz.title}
                  </h4>
                  {quiz.passed ? (
                    <span
                      className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-600"
                      aria-label="Passed"
                    >
                      Passed
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-inter text-xs font-medium text-textSubtitle">
                    {quiz.questionsCount || quiz.questions?.length || 0} Questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/take-quiz/${quiz.id}`)}
                className="z-10 flex w-full max-w-[180px] justify-center rounded-full bg-demo-gradient py-2.5 font-medium text-xs text-white shadow-demoShadow md:text-sm"
              >
                {actionLabel}
              </button>
              <img
                src="/quiz-bulb.png"
                alt=""
                className="absolute bottom-0 left-[30%] z-0"
              />
              <img
                src="/quiz-tablet.png"
                alt=""
                className="absolute left-[42%] top-0 z-0"
              />
              <img
                src="/quiz-bulb-small.png"
                alt=""
                className="absolute bottom-0 left-[45%] z-0"
              />
              <img
                src="/quiz-bulb-top.png"
                alt=""
                className="absolute left-[58%] top-0 z-0"
              />
              <img
                src="/quiz-tablet-down.png"
                alt=""
                className="absolute bottom-0 left-[70%] z-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Green check in a green-outlined circle (lesson list / nav). */
export function LessonCompletedCheckIcon({
  className,
  "aria-label": ariaLabel = "Lesson completed",
}: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-600",
        className
      )}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
    </span>
  );
}
