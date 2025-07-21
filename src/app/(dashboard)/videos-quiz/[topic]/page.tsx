"use client";

import Image from "next/image";
import { Layers } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import videoLine from "@/assets/video-line.svg";
import { dummyVideoTopics, slugify } from "@/lib/utils";
import groupLines from "@/assets/grouplines.svg";
import completedStep from "@/assets/completedStep.svg";
import incompletedStep from "@/assets/incompleteStep.svg";
import currentStep from "@/assets/currentStep.svg";
import { useEffect, useState, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";

export default function VideoTopicPage() {
  const params = useParams();
  const topic = dummyVideoTopics.find((t) => slugify(t.title) === params.topic);
  if (!topic) notFound();
  const { push } = useRouter();

  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const scrollTimeout = useRef<number | null>(null);

  useEffect(() => {
    const currentIndex = topic.subtopics.findIndex(
      (st) => st.status === "current"
    );
    const start = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
    setCurrentStartIndex(start);
    setTotalSteps(topic.subtopics.length);
  }, [topic]);

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

    const visible = topic.subtopics
      .slice(currentStartIndex, currentStartIndex + 5)
      .concat(Array(5).fill({ status: "incomplete", name: "" }))
      .slice(0, 5);

    return visible.map((st, i) => {
      let src = incompletedStep;
      if (st.status === "complete") src = completedStep;
      if (st.status === "current") src = currentStep;

      return (
        <div key={i} className={`${positions[i]} flex flex-col items-center`}>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  src={src}
                  alt={st.name || `step-${i}`}
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
                    {st.name}
                  </h3>
                  <p className="text-textSubtitle text-xs md:text-sm">
                    {topic.description}
                  </p>
                  <Button
                    onClick={() => push(`${params.topic}/${slugify(st.name)}`)}
                    className="w-full flex gap-2 my-3 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
                  >
                    Proceed
                  </Button>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="absolute -bottom-6 -right-12 text-xs uppercase font-semibold text-gray-600 whitespace-nowrap text-center">
            {st.name}
          </p>
        </div>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto h-screen grid grid-cols-2 relative py-6">
      <button
        onClick={() => push("/videos-quiz")}
        className="cursor-pointer absolute top-4 left-4 text-xl text-[#141B34] z-20"
      >
        <BackArrow />
      </button>

      {/* Left: Video Placeholder */}
      <div className="flex flex-col items-center h-full -translate-y-24">
        <Image src={videoLine} alt="" className="w-fit" />
        <div className="bg-bgOffwhite rounded-[40px] max-w-[600px] min-h-[320px] w-full border flex items-center p-8 relative">
          <span className="w-16 h-2 rounded-full bg-borderGray absolute top-3 left-[45%]" />
          <div className="flex flex-col justify-center space-y-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-6 h-6 text-blue-500" />
              <span className="text-blue-500 font-medium">
                {topic.subtopics.length} SUB-TOPICS
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold max-w-[420px]">
              {topic.title.toUpperCase()}
            </h1>
            <p className="text-gray-600 leading-relaxed">{topic.description}</p>
            <Image
              src={topic.image}
              alt={topic.title}
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
