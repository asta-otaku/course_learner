"use client";

import React from "react";
import BackArrow from "@/assets/svgs/arrowback";
import LessonVideoPlayer from "./lessonVideoPlayer";
import LessonQuizzes from "./lessonQuizzes";

interface Lesson {
  id: string;
  title: string;
  completionPercentage: number;
  videoCompleted: boolean;
  quizzesPassed: number;
  totalQuizzes: number;
  watchedPosition: number;
  lessonCompleted: boolean;
}

interface Video {
  playbackUrl?: string;
  title?: string;
  fileName?: string;
}

interface Quiz {
  id?: string;
  title: string;
  questionsCount?: number;
  questions?: any[];
  status: string;
}

interface LessonContentProps {
  selectedLesson: string;
  selectedCurriculum: string;
  lessonLoading: boolean;
  lessonData:
    | {
        title: string;
        description?: string;
        videos?: Video[];
      }
    | null
    | undefined;
  currentLesson: Lesson | null | undefined;
  videos: Video[];
  quizzes: Quiz[];
  resumePositionSec: number;
  isCompleted: boolean;
  activeProfileId: string | undefined;
  onProgress: (video: HTMLVideoElement | null, force?: boolean) => void;
  onVideoEnd: (watchedPosition: number) => void;
  onBack: () => void;
  showTitleAndDescription?: boolean;
}

export default function LessonContent({
  selectedLesson,
  selectedCurriculum,
  lessonLoading,
  lessonData,
  currentLesson,
  videos,
  quizzes,
  resumePositionSec,
  isCompleted,
  activeProfileId,
  onProgress,
  onVideoEnd,
  onBack,
  showTitleAndDescription = true,
}: LessonContentProps) {
  if (!selectedLesson) {
    return (
      <div className="text-center py-12">
        <p className="text-textSubtitle text-lg">
          Select a lesson from the left to view content
        </p>
      </div>
    );
  }

  if (lessonLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-textSubtitle">Loading lesson...</p>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="text-center py-12">
        <p className="text-textSubtitle">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Back Button */}
      <button
        onClick={onBack}
        className="md:hidden mb-4 text-primaryBlue font-medium flex items-center gap-2"
      >
        <BackArrow color="#286cff" /> Back to Lessons
      </button>

      {/* Lesson Title and Description */}
      {showTitleAndDescription && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{lessonData.title}</h2>
          <p className="text-textSubtitle">
            {lessonData.description || "No description available"}
          </p>
        </div>
      )}

      {/* Video Player(s) */}
      <LessonVideoPlayer
        videos={videos}
        resumePositionSec={resumePositionSec}
        isCompleted={isCompleted}
        activeProfileId={activeProfileId}
        onProgress={onProgress}
        onVideoEnd={onVideoEnd}
      />

      {/* Lesson Overview */}
      {lessonData.description && (
        <div className="space-y-2">
          <h3 className="font-semibold uppercase">Lesson Overview:</h3>
          <p className="text-gray-700">{lessonData.description}</p>
        </div>
      )}

      {/* Quizzes Section */}
      <LessonQuizzes quizzes={quizzes} />
    </div>
  );
}
