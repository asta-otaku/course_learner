"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/assets/svgs/arrowback";
import { useGetSectionById, useGetLessonById } from "@/lib/api/queries";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const curriculumId = params.curriculumId as string;
  const lessonId = params.lessonId as string;

  const { data: sectionData } = useGetSectionById(curriculumId);
  const { data: lessonDetail, isLoading } = useGetLessonById(lessonId);

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
          href={`/tutor/learning-resources/${curriculumId}`}
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
                  router.push(
                    `/tutor/learning-resources/${curriculumId}/${l.id}`
                  )
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
                  src={v?.playbackUrl || ""}
                  controls
                  controlsList="nodownload noremoteplayback"
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
      </div>
    </div>
  );
}
