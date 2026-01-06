"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  totalQuizzes: number;
  quizzesCount?: number;
  completionPercentage: number;
  sectionId: string;
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
      {lessons.map((lesson, idx) => (
        <button
          key={idx}
          onClick={() => {
            onSelectLesson(lesson.id);
            router.push(`/library/${lesson.sectionId}/${lesson.id}`);
          }}
          className={`border-b last-of-type:border-none border-dashed p-4 hover:bg-[#EEEEEE]/20 w-full text-left ${
            lesson.id === selectedLesson ? "bg-[#EEEEEE]" : "bg-white"
          }`}
        >
          <span
            className={`${
              lesson.id === selectedLesson
                ? "text-primaryBlue font-semibold"
                : "text-textSubtitle"
            } font-medium text-sm md:text-base max-w-[300px] whitespace-nowrap truncate inline-block`}
          >
            {lesson.title}
          </span>
          <p className="text-textSubtitle text-sm font-inter mt-2">
            {lesson.quizzesCount} Quiz
            {lesson.quizzesCount !== 1 ? "zes" : ""}
            {lesson.completionPercentage > 0 && (
              <span className="ml-2 text-primaryBlue">
                {lesson.completionPercentage}% Complete
              </span>
            )}
          </p>
        </button>
      ))}
    </div>
  );
}
