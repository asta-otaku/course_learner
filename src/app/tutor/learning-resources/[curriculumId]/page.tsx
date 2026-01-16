"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Layers, Play } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useGetSectionById } from "@/lib/api/queries";

export default function CurriculumLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const curriculumId = params.curriculumId as string;

  const { data: sectionData } = useGetSectionById(curriculumId);

  const section = sectionData?.data;

  // Get lessons and sort by orderIndex
  const curriculumLessons = useMemo(() => {
    const lessons = section?.lessons || [];
    return [...lessons].sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
  }, [section?.lessons]);

  if (!section) {
    return (
      <div className="p-8 text-center min-h-screen flex items-center justify-center">
        <div>Loading section...</div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/tutor/learning-resources")}
          className="cursor-pointer mb-4 text-xl text-[#141B34] flex items-center gap-2"
        >
          <BackArrow />
          <span className="text-sm md:text-base">
            Back to Learning Resources
          </span>
        </button>

        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primaryBlue" />
            <span className="text-primaryBlue font-medium text-sm md:text-base">
              {curriculumLessons.length}{" "}
              {curriculumLessons.length === 1 ? "Lesson" : "Lessons"}
            </span>
          </div>
        </div>

        <h1 className="text-textGray font-semibold text-xl md:text-2xl lg:text-3xl capitalize">
          {section.title}
        </h1>
      </div>

      {/* Lessons Grid */}
      {curriculumLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {curriculumLessons.map((lesson: any, index: number) => (
            <div
              key={lesson.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primaryBlue/10 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primaryBlue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-textSubtitle font-medium mb-1">
                    Lesson {index + 1}
                  </div>
                  <h3 className="text-textGray font-semibold text-base md:text-lg line-clamp-2">
                    {lesson.title}
                  </h3>
                </div>
              </div>

              {lesson.description && (
                <p className="text-textSubtitle text-sm mb-4 line-clamp-3 flex-1">
                  {lesson.description}
                </p>
              )}

              <Button
                onClick={() =>
                  router.push(
                    `/tutor/learning-resources/${curriculumId}/${lesson.id}`
                  )
                }
                className="w-full mt-auto py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow hover:opacity-90 transition-opacity"
              >
                View Lesson
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-textSubtitle text-lg">
            No lessons available in this section.
          </p>
        </div>
      )}
    </div>
  );
}
