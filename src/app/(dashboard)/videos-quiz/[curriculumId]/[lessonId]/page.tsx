"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/assets/svgs/arrowback";
import { useProfile } from "@/context/profileContext";
import {
  useGetLibrary,
  useGetChildLessons,
  useGetLessonById,
} from "@/lib/api/queries";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProfile } = useProfile();
  const curriculumId = params.curriculumId as string;
  const lessonId = params.lessonId as string;

  const { data: library } = useGetLibrary(activeProfile?.id || "");
  const { data: lessons } = useGetChildLessons(
    activeProfile?.id || "",
    curriculumId
  );
  const { data: lessonDetail, isLoading } = useGetLessonById(lessonId);

  const curriculum = library?.data?.find((c) => c.id === curriculumId);
  const curriculumLessons = lessons?.data || [];

  // Get lesson data from useGetLessonById
  const lessonData = lessonDetail?.data;

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!curriculum || !lessonData) {
    return <div className="p-8">Lesson not found</div>;
  }

  // Extract properties from lesson detail
  const lessonTitle = lessonData.title;
  const lessonDescription = lessonData.description || "";
  const videoUrl = lessonData.videoUrl || "";

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
            {curriculum.title}
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

      {/* Lesson title and description */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{lessonTitle}</h2>
        <p className="text-textSubtitle">
          {lessonDescription || "No description available"}
        </p>
      </div>

      {/* Video Player */}
      <div className="bg-gray-100 rounded-xl min-h-[70vh]">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full min-h-[70vh] object-contain rounded-lg"
            preload="auto"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center h-64 w-full bg-gray-200 rounded-lg px-8">
            <p className="text-textSubtitle">No video available</p>
          </div>
        )}
      </div>

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
  );
}
