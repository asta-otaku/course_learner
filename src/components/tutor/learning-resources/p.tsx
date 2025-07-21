"use client";

import BackArrow from "@/assets/svgs/arrowback";
import {
  TopicCard,
  TopicDetail,
} from "@/components/platform/glossary/TopicComponents";
import LibraryComponent from "@/components/platform/library/p";
import { courses } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import React, { useState } from "react";

function LearningResource() {
  const [step, setStep] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [selectedTopic, setSelectedTopic] = useState<{
    title: string;
    course: string;
    number_of_quizzes: number;
  } | null>(null);

  const groupedTopics = courses
    .flatMap((course) =>
      course.topics.map((topic) => ({
        ...topic,
        course: course.course,
        image: course.image.src,
      }))
    )
    .reduce((acc, topic) => {
      const firstLetter = topic.title[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(topic);
      return acc;
    }, {} as Record<string, Array<{ title: string; course: string; number_of_quizzes: number; image: string }>>);

  return (
    <div>
      {
        {
          0: (
            <div className="py-6">
              <h1 className="font-medium text-lg md:text-xl">
                Learning Resources
              </h1>
              <div className="my-6 md:my-12 lg:my-16 xl:my-20 flex flex-col w-full items-center gap-4">
                <div
                  onClick={() => setStep(1)}
                  className="border border-gray-200 bg-white max-w-2xl w-full rounded-3xl p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="space-y-2 max-w-lg">
                    <h1 className="font-medium text-lg md:text-xl">Glossary</h1>
                    <p className="text-sm text-gray-500">
                      Access a comprehensive collection of key terms and
                      concepts to enhance your understanding of important topics
                      in your learning journey
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-[#141B34]" />
                </div>
                <div
                  onClick={() => setStep(2)}
                  className="border border-gray-200 bg-white max-w-2xl w-full rounded-3xl p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="space-y-2 max-w-lg">
                    <h1 className="font-medium text-lg md:text-xl">Library</h1>
                    <p className="text-sm text-gray-500">
                      Explore our curated library of educational resources,
                      including study materials, reference guides, and
                      supplementary content to support your learning goals
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-[#141B34]" />
                </div>
              </div>
            </div>
          ),
          1: (
            <div className="py-6">
              <button
                onClick={() => setStep(0)}
                className="text-sm text-primaryBlue flex items-center gap-1 mb-2"
              >
                <BackArrow />
              </button>
              <h1 className="font-medium text-lg md:text-xl">Glossary</h1>
              <div className="flex md:justify-center gap-6 my-8 overflow-x-auto scrollbar-hide py-6">
                {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                  <button
                    key={letter}
                    className={`text-sm flex-shrink-0 ${
                      letter === selectedLetter
                        ? "font-bold text-primaryBlue"
                        : "text-textGray"
                    }`}
                    onClick={() => setSelectedLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              <div className="space-y-4 relative max-w-xl w-full mx-auto">
                {selectedLetter && (
                  <h2 className="absolute -left-[10%] top-[7%] font-medium text-xl md:text-2xl lg:text-3xl">
                    {selectedLetter}
                  </h2>
                )}
                {(groupedTopics[selectedLetter] || []).length > 0 ? (
                  (groupedTopics[selectedLetter] || []).map((topic, idx) => (
                    <TopicCard
                      key={idx}
                      topic={topic}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setStep(3);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-textSubtitle">
                    No topics found for letter {selectedLetter}
                  </div>
                )}
              </div>
            </div>
          ),
          2: (
            <div className="py-6">
              <button
                onClick={() => setStep(0)}
                className="text-sm text-primaryBlue flex items-center gap-1 mb-2"
              >
                <BackArrow />
              </button>
              <h1 className="font-medium text-lg md:text-xl">Library</h1>
              <p className="text-sm text-textSubtitle">
                This tab contains videos and worksheets for the entire 11+ Maths
                syllabus. We have numbered each section of the syllabus for easy
                navigation.
              </p>

              <LibraryComponent />
            </div>
          ),
          3: selectedTopic && (
            <TopicDetail
              topic={selectedTopic}
              onClose={() => {
                setSelectedTopic(null);
                setStep(1);
              }}
            />
          ),
        }[step]
      }
    </div>
  );
}

export default LearningResource;
