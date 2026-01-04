"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { Layers } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import videoLine from "@/assets/video-line.svg";
import groupLines from "@/assets/grouplines.svg";
import completedStep from "@/assets/completedStep.svg";
import incompletedStep from "@/assets/incompleteStep.svg";
import currentStep from "@/assets/currentStep.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useProfile } from "@/context/profileContext";
import { useGetSectionById } from "@/lib/api/queries";
import algebra from "@/assets/algebra.png";
import measurement from "@/assets/measurement.png";
import ratio from "@/assets/ratio.png";

const availableImages = [algebra, measurement, ratio];

export default function CurriculumLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProfile } = useProfile();
  const curriculumId = params.curriculumId as string;

  const { data: sectionData } = useGetSectionById(
    curriculumId,
    activeProfile?.offerType || ""
  );

  const section = sectionData?.data;

  // Get lessons and sort by orderIndex
  const curriculumLessons = useMemo(() => {
    const lessons = section?.lessons || [];
    return [...lessons].sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
  }, [section?.lessons]);

  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const scrollTimeout = useRef<number | null>(null);

  useEffect(() => {
    const currentIndex = curriculumLessons.findIndex(
      (lesson: any) => !lesson.lessonCompleted && !lesson.videoCompleted
    );
    const start = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
    setCurrentStartIndex(start);
    setTotalSteps(curriculumLessons.length);
  }, [curriculumLessons]);

  const canGoPrev = currentStartIndex > 0;
  const canGoNext = currentStartIndex + 5 < totalSteps;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (scrollTimeout.current !== null) {
      window.clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = window.setTimeout(() => {
      if (e.deltaY > 0 && canGoNext) {
        setCurrentStartIndex((idx) => Math.min(totalSteps - 5, idx + 1));
      } else if (e.deltaY < 0 && canGoPrev) {
        setCurrentStartIndex((idx) => Math.max(0, idx - 1));
      }
    }, 100);
  };

  const getStatusTiles = () => {
    const positions = [
      "absolute w-fit top-0",
      "absolute w-fit top-28 left-40",
      "absolute w-fit top-64",
      "absolute w-fit bottom-[300px] right-40",
      "absolute w-fit bottom-[160px]",
    ];

    const visible = curriculumLessons
      .slice(currentStartIndex, currentStartIndex + 5)
      .concat(
        Array(5).fill({
          lessonCompleted: false,
          videoCompleted: false,
          title: "",
        })
      )
      .slice(0, 5);

    return visible.map((lesson: any, i: number) => {
      let src = incompletedStep;
      if (lesson.lessonCompleted) src = completedStep;
      else if (!lesson.videoCompleted) src = currentStep;

      return (
        <div key={i} className={`${positions[i]} flex flex-col items-center`}>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  src={src}
                  alt={lesson.title || `step-${i}`}
                  width={80}
                  height={80}
                  className="w-24 cursor-pointer hover:scale-105 transition-transform"
                />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-white border shadow-lg shadow-black/20 rounded-xl"
              >
                <div className="py-4 px-6 flex flex-col gap-4 text-center">
                  <h3 className="font-semibold text-sm md:text-base text-textGray">
                    {lesson.title}
                  </h3>
                  <p className="text-textSubtitle text-xs md:text-sm">
                    {lesson.description ||
                      section?.title ||
                      "No description available"}
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/videos-quiz/${curriculumId}/${lesson.id}`)
                    }
                    className="w-full flex gap-2 my-3 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
                  >
                    Proceed
                  </Button>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="absolute -bottom-6 -right-12 text-xs uppercase font-semibold text-gray-600 whitespace-nowrap text-center">
            {lesson.title}
          </p>
        </div>
      );
    });
  };

  if (!section) {
    return <div className="p-8 text-center">Loading section...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto h-screen grid grid-cols-2 relative py-6">
      <button
        onClick={() => router.push("/videos-quiz")}
        className="cursor-pointer absolute top-4 left-4 text-xl text-[#141B34] z-20"
      >
        <BackArrow />
      </button>

      {/* Left: Curriculum Info */}
      <div className="flex flex-col items-center h-full -translate-y-24">
        <Image src={videoLine} alt="" className="w-fit" />
        <div className="bg-bgOffwhite rounded-[40px] max-w-[600px] min-h-[320px] w-full border flex items-center p-8 relative">
          <span className="w-16 h-2 rounded-full bg-borderGray absolute top-3 left-[45%]" />
          <div className="flex flex-col justify-center space-y-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-6 h-6 text-blue-500" />
              <span className="text-blue-500 font-medium">
                {curriculumLessons.length} LESSONS
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold max-w-[420px]">
              {section.title.toUpperCase()}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              No description available
            </p>
            <Image
              src={availableImages[0]}
              alt={section.title}
              width={120}
              height={120}
              className="object-contain absolute top-12 right-4"
            />
          </div>
        </div>
      </div>

      {/* Right: Scrollable Steps */}
      <div
        className="flex flex-col justify-center items-center space-y-6 max-h-[780px] px-12 relative h-full overflow-hidden"
        onWheel={handleWheel}
      >
        <Image src={groupLines} alt="" className="h-[750px]" />
        {getStatusTiles()}
      </div>
    </div>
  );
}
