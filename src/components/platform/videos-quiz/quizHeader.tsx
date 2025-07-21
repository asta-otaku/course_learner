"use client";

import React, { useState } from "react";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { VideoTopic } from "@/lib/types";
import { ParamValue } from "next/dist/server/request/params";
import BackArrow from "@/assets/svgs/arrowback";

function QuizHeader({
  subtopicSlug,
  topicSlug,
  topic,
  activeTab,
  setActiveTab,
}: {
  subtopicSlug: ParamValue | undefined;
  topicSlug: ParamValue | undefined;
  topic: VideoTopic;
  activeTab: "overview" | "quiz";
  setActiveTab: React.Dispatch<React.SetStateAction<"overview" | "quiz">>;
}) {
  const defaultSubIndex = subtopicSlug
    ? topic.subtopics.findIndex((sub) => slugify(sub.name) === subtopicSlug)
    : 0;
  const initialIndex = defaultSubIndex >= 0 ? defaultSubIndex : 0;

  const [activeSubIndex, setActiveSubIndex] = useState(initialIndex);
  return (
    <div className="space-y-6">
      <Link
        href={`/videos-quiz/${topicSlug}${
          subtopicSlug ? `/${subtopicSlug}` : ""
        }`}
        className="flex items-center gap-4"
      >
        <BackArrow />
        <h1 className="text-sm md:text-base font-bold text-textGray uppercase">
          {topic.title}
        </h1>
      </Link>

      {/* subtopics nav */}
      <nav className="flex items-baseline gap-8 overflow-x-auto border-b border-bgWhiteGray">
        <span className="font-bold text-xs md:text-sm uppercase text-textSubtitle">
          Sub topics:
        </span>
        {topic.subtopics.map((sub, i) => {
          const isActive = i === activeSubIndex;
          return (
            <button
              key={sub.name}
              onClick={() => setActiveSubIndex(i)}
              className={`whitespace-nowrap uppercase ${
                isActive
                  ? "border-b-2 border-primaryBlue text-primaryBlue font-semibold pb-2"
                  : "text-textGray text-xs md:text-sm hover:text-gray-800"
              }`}
            >
              {sub.name}
            </button>
          );
        })}
      </nav>

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
    </div>
  );
}

export default QuizHeader;
