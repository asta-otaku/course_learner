"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProfile } from "@/context/profileContext";
import {
  useGetLibrary,
  useGetChildLessons,
  useGetLessonById,
  useGetQuizzesForLesson,
} from "@/lib/api/queries";
import { usePatchVideoLessonProgress } from "@/lib/api/mutations";
import LessonList from "./lessonList";
import LessonContent from "./lessonContent";

interface LibraryProps {
  curriculumId?: string;
  lessonId?: string;
}

function Library({ curriculumId, lessonId }: LibraryProps) {
  const router = useRouter();
  const params = useParams();
  const { activeProfile, isLoaded } = useProfile();
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [user, setUser] = React.useState<any>({});

  // Get curriculumId and lessonId from params or props
  const urlCurriculumId = (params?.curriculumId as string) || curriculumId;
  const urlLessonId = (params?.lessonId as string) || lessonId;

  const { data: library } = useGetLibrary(activeProfile?.id || "");
  const { data: lessons } = useGetChildLessons(
    activeProfile?.id || "",
    selectedCurriculum
  );
  const { data: lessonDetail, isLoading: lessonLoading } = useGetLessonById(
    selectedLesson || ""
  );
  const { data: lessonQuizzes } = useGetQuizzesForLesson(selectedLesson || "");

  // Progress patch mutation (child video progress)
  const { mutate: patchProgress } = usePatchVideoLessonProgress(
    selectedLesson || "",
    activeProfile?.id || ""
  );

  // Track last sent progress for throttling
  const lastSentRef = useRef<number>(0);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  // Get curricula from library data
  const curricula = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  // Get lessons for selected curriculum
  const selectedCurriculumLessons = useMemo(() => {
    return lessons?.data || [];
  }, [lessons?.data]);

  // Get current lesson details
  const currentLesson = useMemo(() => {
    if (!selectedLesson || !selectedCurriculum) return null;
    return selectedCurriculumLessons.find(
      (lesson) => lesson.id === selectedLesson
    );
  }, [selectedLesson, selectedCurriculum, selectedCurriculumLessons]);

  // Get lesson data from useGetLessonById
  const lessonData = lessonDetail?.data;
  const quizzes = lessonQuizzes?.data || [];

  // Get curriculum progress
  const curriculumProgress = useMemo(() => {
    return (library?.data || []).find((c: any) => c.id === selectedCurriculum)
      ?.progress as
      | { watchedVideoDuration?: number; isCompleted?: boolean }
      | undefined;
  }, [library?.data, selectedCurriculum]);

  const isCompleted = Boolean(curriculumProgress?.isCompleted);
  const resumePositionSec = Math.max(
    0,
    Math.floor((curriculumProgress?.watchedVideoDuration as number) || 0)
  );

  // Extract videos from lesson data
  const videos = useMemo(() => {
    return ((lessonData as any)?.videos || []) as Array<{
      playbackUrl?: string;
      title?: string;
      fileName?: string;
    }>;
  }, [lessonData]);

  const maybeSendProgress = (
    video: HTMLVideoElement | null,
    force?: boolean
  ) => {
    if (!video || !activeProfile?.id || !selectedLesson) return;
    if (isCompleted) return;
    const now = Date.now();
    if (!force && now - lastSentRef.current < 2000) return; // throttle ~2s
    const watchedPosition = Math.max(0, Math.floor(video.currentTime || 0));
    lastSentRef.current = now;
    patchProgress({ childId: activeProfile.id, watchedPosition });
  };

  const handleVideoEnd = (watchedPosition: number) => {
    if (!activeProfile?.id || isCompleted) return;
    patchProgress({ childId: activeProfile.id, watchedPosition });
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLesson(lessonId);
  };

  const handleBackToLessons = () => {
    setSelectedLesson("");
    router.push(`/library/${selectedCurriculum}`);
  };

  // Handle URL parameters and initialize selections
  useEffect(() => {
    if (curricula.length > 0) {
      // If we have curriculumId in URL, use it
      if (urlCurriculumId) {
        setSelectedCurriculum(urlCurriculumId);

        // If we have lessonId in URL, use it
        if (urlLessonId) {
          setSelectedLesson(urlLessonId);
        } else {
          setSelectedLesson("");
        }
      } else if (!selectedCurriculum) {
        // No curriculum in URL and no selection yet, select first curriculum
        setSelectedCurriculum(curricula[0].id);
        setSelectedLesson("");
      }
    }
  }, [curricula, urlCurriculumId, urlLessonId, selectedCurriculum]);

  // Early returns after all hooks
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }
  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Profile Selected</h1>
          <p className="text-gray-600">Please select a profile</p>
        </div>
      </div>
    );
  }

  if (!selectedCurriculum || curricula.length === 0) {
    return <div className="p-8 text-center">Loading curricula...</div>;
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {user?.data?.offerType === "Offer One" && (
        <div>
          <h1 className="text-xl font-medium text-textGray">Library</h1>
          <p className="text-sm text-textSubtitle">
            This tab contains videos and worksheets for the entire 11+ Maths
            syllabus. We have numbered each section of the syllabus for easy
            navigation.
          </p>
        </div>
      )}

      {/* Curriculum Selector Dropdown */}
      <div className="mb-6 mt-8">
        <select
          value={selectedCurriculum}
          onChange={(e) => {
            const newCurriculumId = e.target.value;
            setSelectedCurriculum(newCurriculumId);
            setSelectedLesson(""); // Reset lesson when curriculum changes
            router.push(`/library/${newCurriculumId}`);
          }}
          className="bg-white py-2 px-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent min-w-[200px] w-fit"
        >
          <option value="" className="text-textGray">
            Select a Curriculum
          </option>
          {curricula.map((curriculum, idx) => (
            <option
              key={idx}
              value={curriculum.id}
              className="text-textGray w-fit"
            >
              {curriculum.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* First Column - Lessons List */}
        <LessonList
          lessons={selectedCurriculumLessons}
          selectedLesson={selectedLesson}
          selectedCurriculum={selectedCurriculum}
          onSelectLesson={handleSelectLesson}
        />

        {/* Second Column - Lesson Content */}
        <div
          className={`w-full flex justify-center ${
            selectedLesson ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="space-y-6 max-w-2xl w-full">
            <LessonContent
              selectedLesson={selectedLesson}
              selectedCurriculum={selectedCurriculum}
              lessonLoading={lessonLoading}
              lessonData={lessonData || null}
              currentLesson={currentLesson || null}
              videos={videos}
              quizzes={quizzes as any}
              resumePositionSec={resumePositionSec}
              isCompleted={isCompleted}
              activeProfileId={activeProfile?.id}
              onProgress={maybeSendProgress}
              onVideoEnd={handleVideoEnd}
              onBack={handleBackToLessons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Library;
