"use client";

import React from "react";

interface Lesson {
  completionPercentage: number;
  videoCompleted: boolean;
  quizzesPassed: number;
  totalQuizzes: number;
  watchedPosition: number;
  lessonCompleted: boolean;
}

interface LessonProgressProps {
  lesson: Lesson | null;
}

export default function LessonProgress({ lesson }: LessonProgressProps) {
  if (!lesson) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Progress</h3>
        <span className="text-sm text-textSubtitle">
          {lesson.completionPercentage}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primaryBlue h-2 rounded-full transition-all duration-300"
          style={{
            width: `${lesson.completionPercentage || 0}%`,
          }}
        ></div>
      </div>

      {/* Lesson Details */}
      <div className="border rounded-2xl bg-white overflow-hidden">
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-textSubtitle">Video Status:</span>
              <span
                className={`ml-2 ${
                  lesson.videoCompleted ? "text-green-600" : "text-gray-600"
                }`}
              >
                {lesson.videoCompleted ? "Completed" : "Not Started"}
              </span>
            </div>
            <div>
              <span className="text-textSubtitle">Quizzes:</span>
              <span className="ml-2 text-primaryBlue">
                {lesson.quizzesPassed}/{lesson.totalQuizzes} Passed
              </span>
            </div>
            <div>
              <span className="text-textSubtitle">Watched Position:</span>
              <span className="ml-2 text-gray-600">
                {Math.round(lesson.watchedPosition || 0)}s
              </span>
            </div>
            <div>
              <span className="text-textSubtitle">Lesson Status:</span>
              <span
                className={`ml-2 ${
                  lesson.lessonCompleted ? "text-green-600" : "text-gray-600"
                }`}
              >
                {lesson.lessonCompleted ? "Completed" : "In Progress"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

