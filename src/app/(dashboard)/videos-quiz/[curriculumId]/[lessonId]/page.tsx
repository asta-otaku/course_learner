"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/assets/svgs/arrowback";
import { useProfile } from "@/context/profileContext";
import {
  useGetSectionById,
  useGetLessonById,
  useGetQuizzesForLesson,
} from "@/lib/api/queries";
import { usePatchVideoLessonProgress } from "@/lib/api/mutations";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProfile } = useProfile();
  const curriculumId = params.curriculumId as string;
  const lessonId = params.lessonId as string;

  const { data: sectionData } = useGetSectionById(
    curriculumId,
    activeProfile?.offerType || ""
  );
  const { data: lessonDetail, isLoading } = useGetLessonById(lessonId);
  const { data: lessonQuizzes } = useGetQuizzesForLesson(lessonId);

  const section = sectionData?.data;

  // Get lessons and sort by orderIndex
  const curriculumLessons = useMemo(() => {
    const lessons = section?.lessons || [];
    return [...lessons].sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
  }, [section?.lessons]);

  // Get lesson data from useGetLessonById
  const lessonData = lessonDetail?.data;
  const quizzes = lessonQuizzes?.data || [];
  const [activeTab, setActiveTab] = useState<"overview" | "quiz">("overview");

  // Progress patch mutation (child video progress)
  const { mutate: patchProgress } = usePatchVideoLessonProgress(
    lessonId,
    activeProfile?.id || ""
  );

  // Track refs to multiple videos and throttle updates
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const lastSentRef = useRef<number>(0);

  // Note: Progress tracking may need to be handled differently without library data
  // For now, we'll assume lessons don't have completion status from section endpoint
  const isCompleted = false;

  const maybeSendProgress = (
    video: HTMLVideoElement | null,
    force?: boolean
  ) => {
    if (!video || !activeProfile?.id) return;
    if (isCompleted) return;
    const now = Date.now();
    if (!force && now - lastSentRef.current < 2000) return; // throttle ~2s
    const watchedPosition = Math.max(0, Math.floor(video.currentTime || 0));
    lastSentRef.current = now;
    patchProgress({ childId: activeProfile.id, watchedPosition });
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!section || !lessonData) {
    return <div className="p-8">Lesson not found</div>;
  }

  // Extract properties from lesson detail
  const lessonTitle = lessonData.title;
  const lessonDescription = lessonData.description || "";
  const videos = ((lessonData as any)?.videos || []) as Array<{
    playbackUrl?: string;
    title?: string;
    fileName?: string;
  }>;
  // Note: Resume position may need to come from lesson data or a different endpoint
  const resumePositionSec = 0;

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-6">
      {/* header */}
      <div className="space-y-6">
        <Link
          href={`/videos-quiz/${curriculumId}`}
          className="flex items-center gap-4"
        >
          <BackArrow />
          <h1 className="text-sm md:text-base font-bold text-textGray uppercase">
            {section.title}
          </h1>
        </Link>

        {/* lessons nav */}
        <nav className="flex items-baseline gap-8 overflow-x-auto border-b border-bgWhiteGray">
          <span className="font-bold text-xs md:text-sm uppercase text-textSubtitle">
            Lessons:
          </span>
          {curriculumLessons.map((l: any, i: number) => {
            const isActive = l.id === lessonId;
            return (
              <button
                key={l.id}
                onClick={() =>
                  router.push(`/videos-quiz/${curriculumId}/${l.id}`)
                }
                className={`whitespace-nowrap uppercase ${
                  isActive
                    ? "border-b-2 border-primaryBlue text-primaryBlue font-semibold pb-2"
                    : "text-textGray text-xs md:text-sm hover:text-gray-800"
                }`}
              >
                Lesson {i + 1}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Progress steps (Video → Quiz) */}
      <div className="flex items-center gap-6 w-full">
        {(["overview", "quiz"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const isCompleted = tab === "overview" && activeTab === "quiz";
          const borderClass =
            isActive || isCompleted ? "border-green-500" : "border-bgWhiteGray";
          return (
            <div key={tab} className="flex-1">
              <button
                onClick={() => setActiveTab(tab)}
                className={`w-full pb-2 uppercase tracking-wide text-xs md:text-sm border-b-[3px] ${borderClass} text-left`}
              >
                {tab === "overview" ? "Video" : "Quiz"}
              </button>
            </div>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-4">
          {/* Lesson title and description */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{lessonTitle}</h2>
            <p className="text-textSubtitle">
              {lessonDescription || "No description available"}
            </p>
          </div>

          {/* Video Player(s) */}
          {videos.length > 0 ? (
            <div className="space-y-6">
              {videos.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 rounded-xl min-h-[70vh] select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                      return;
                    }}
                    src={v?.playbackUrl || ""}
                    controls
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    className="w-full h-full min-h-[70vh] object-contain rounded-lg pointer-events-auto"
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      const vid = e.currentTarget;
                      if (resumePositionSec > 0 && vid.duration > 0) {
                        const safe = Math.min(
                          resumePositionSec,
                          Math.floor(vid.duration - 1)
                        );
                        try {
                          vid.currentTime = safe > 0 ? safe : 0;
                        } catch {}
                      }
                    }}
                    onTimeUpdate={(e) => maybeSendProgress(e.currentTarget)}
                    onPlay={(e) => maybeSendProgress(e.currentTarget, true)}
                    onPause={(e) => maybeSendProgress(e.currentTarget, true)}
                    onEnded={(e) => {
                      if (!activeProfile?.id || isCompleted) return;
                      const vid = e.currentTarget;
                      const watchedPosition = Math.max(
                        0,
                        Math.floor(vid.duration || 0)
                      );
                      patchProgress({
                        childId: activeProfile.id,
                        watchedPosition,
                      });
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 w-full bg-gray-200 rounded-lg px-8">
              <p className="text-textSubtitle">No video available</p>
            </div>
          )}

          {/* footer with lesson overview */}
          <div className="flex flex-col gap-3">
            <div className="max-w-xl">
              <h2 className="font-semibold uppercase mb-2">Lesson Overview:</h2>
              <p className="text-gray-700">
                {lessonDescription || "No description available"}
              </p>
            </div>
          </div>
          {quizzes.length > 0 && (
            <button
              onClick={() => setActiveTab("quiz")}
              className="py-2.5 bg-demo-gradient rounded-full text-white shadow-demoShadow max-w-xs w-full flex justify-center mx-auto font-medium text-xs md:text-sm"
            >
              Proceed to Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Quizzes</h2>
          {quizzes.length === 0 ? (
            <p className="text-textSubtitle">No quizzes available</p>
          ) : (
            <div className="flex flex-col gap-4">
              {quizzes.map((quiz: any, index: number) => (
                <div
                  key={quiz.id || index}
                  className="bg-bgOffwhite p-5 w-full rounded-2xl flex items-center justify-between gap-4 relative"
                >
                  <div className="space-y-4 z-10">
                    <h3 className="text-sm md:text-base font-medium">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-textSubtitle font-inter">
                        {quiz.questionsCount || quiz.questions?.length || 0}{" "}
                        Questions
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
          )}
        </div>
      )}
    </div>
  );
}
