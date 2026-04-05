"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { isLessonFullyPassed } from "@/lib/lesson-progress";
import { LessonCompletedCheckIcon } from "./lessonQuizzes";

interface Lesson {
  id: string;
  title: string;
  totalQuizzes: number;
  quizzesCount?: number;
  completionPercentage: number;
  sectionId: string;
  lessonCompleted?: boolean;
  quizzesPassed?: number;
  quizAttempts?: Array<{ passed?: boolean }>;
}

interface LessonListProps {
  lessons: Lesson[];
  selectedLesson: string;
  selectedCurriculum: string;
  onSelectLesson: (lessonId: string) => void;
}

export default function LessonList({
  lessons,
  selectedLesson,
  selectedCurriculum,
  onSelectLesson,
}: LessonListProps) {
  const router = useRouter();

  return (
    <div
      className={`md:max-w-xs w-full border border-dashed flex flex-col max-h-[80vh] h-fit scrollbar-hide overflow-auto ${
        selectedLesson ? "hidden md:flex" : "flex"
      }`}
    >
      {lessons.map((lesson, idx) => {
        const quizCount = lesson.quizzesCount ?? lesson.totalQuizzes ?? 0;
        const lessonPassed = isLessonFullyPassed(lesson);
        return (
          <button
            key={idx}
            onClick={() => {
              onSelectLesson(lesson.id);
              router.push(`/library/${lesson.sectionId}/${lesson.id}`);
            }}
            className={`flex w-full gap-3 border-b border-dashed p-4 text-left last-of-type:border-none hover:bg-[#EEEEEE]/20 ${
              lesson.id === selectedLesson ? "bg-[#EEEEEE]" : "bg-white"
            }`}
          >
            <div className="min-w-0 flex-1">
              <span
                className={`${
                  lesson.id === selectedLesson
                    ? "font-semibold text-primaryBlue"
                    : "text-textSubtitle"
                } inline-block max-w-full truncate text-sm font-medium md:text-base`}
              >
                {lesson.title}
              </span>
              <p className="mt-2 font-inter text-sm text-textSubtitle">
                {quizCount} Quiz
                {quizCount !== 1 ? "zes" : ""}
                {lesson.completionPercentage > 0 && (
                  <span className="ml-2 text-primaryBlue">
                    {lesson.completionPercentage}% Complete
                  </span>
                )}
              </p>
            </div>
            {lessonPassed ? (
              <LessonCompletedCheckIcon className="mt-0.5 self-start" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
