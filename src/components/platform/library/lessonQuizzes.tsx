"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Quiz {
  id?: string;
  title: string;
  questionsCount?: number;
  questions?: any[];
  status: string;
}

interface LessonQuizzesProps {
  quizzes: Quiz[];
}

export default function LessonQuizzes({ quizzes }: LessonQuizzesProps) {
  const router = useRouter();

  if (quizzes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-xl font-bold">Quizzes</h3>
      <div className="flex flex-col gap-4">
        {quizzes.map((quiz: Quiz, index: number) => (
          <div
            key={quiz.id || index}
            className="bg-bgOffwhite p-5 w-full rounded-2xl flex items-center justify-between gap-4 relative"
          >
            <div className="space-y-4 z-10">
              <h4 className="text-sm md:text-base font-medium">
                {quiz.title}
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-textSubtitle font-inter">
                  {quiz.questionsCount || quiz.questions?.length || 0} Questions
                </p>
                <span className="p-1 rounded-full bg-borderGray" />
                <p className="text-xs font-medium text-textSubtitle font-inter">
                  {quiz.status === "published" ? "Published" : "Draft"}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/take-quiz/${quiz.id}`)}
              className="py-2.5 bg-demo-gradient rounded-full text-white shadow-demoShadow max-w-[180px] w-full flex justify-center font-medium text-xs md:text-sm z-10"
            >
              Take Quiz
            </button>
            <img
              src="/quiz-bulb.png"
              alt=""
              className="absolute bottom-0 left-[30%] z-0"
            />
            <img
              src="/quiz-tablet.png"
              alt=""
              className="absolute top-0 left-[42%] z-0"
            />
            <img
              src="/quiz-bulb-small.png"
              alt=""
              className="absolute bottom-0 left-[45%] z-0"
            />
            <img
              src="/quiz-bulb-top.png"
              alt=""
              className="absolute top-0 left-[58%] z-0"
            />
            <img
              src="/quiz-tablet-down.png"
              alt=""
              className="absolute bottom-0 left-[70%] z-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

