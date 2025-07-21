"use client";

import React, { useState } from "react";
import { courses } from "@/lib/utils";
import { TopicCard, TopicDetail } from "./TopicComponents";
import LibraryComponent from "@/components/platform/library/p";
import { useProfile } from "@/context/profileContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Glossary = () => {
  const { activeProfile, isLoaded } = useProfile();
  const [selectedTopic, setSelectedTopic] = useState<{
    title: string;
    course: string;
    number_of_quizzes: number;
    image: string;
  } | null>(null);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [step, setStep] = useState(0);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // No profile selected
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

  const groupedTopics = courses
    .flatMap((course) =>
      course.topics.map((topic) => ({
        ...topic,
        course: course.course,
        image: course.image.src,
      }))
    )
    .reduce((acc, topic) => {
      const letter = topic.title.charAt(0).toUpperCase();
      acc[letter] = acc[letter] || [];
      acc[letter].push(topic);
      return acc;
    }, {} as Record<string, Array<{ title: string; course: string; number_of_quizzes: number; image: string }>>);

  // Platform subscription - original design
  if (activeProfile.subscriptionName === "The platform") {
    return (
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
        {
          {
            0: (
              <>
                <h1 className="text-xl font-medium text-textGray">Glossary</h1>
                <p className="text-sm text-textSubtitle">
                  This tab contains videos and worksheets for the entire 11+
                  Maths syllabus. We have numbered each section of the syllabus
                  for easy navigation.
                </p>

                <div className="flex md:justify-center gap-6 my-8 overflow-x-auto scrollbar-hide border-b-2 py-6">
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
                          setStep(1);
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-textSubtitle">
                      No topics found for letter {selectedLetter}
                    </div>
                  )}
                </div>
              </>
            ),
            1: selectedTopic && (
              <TopicDetail
                topic={selectedTopic}
                onClose={() => {
                  setSelectedTopic(null);
                  setStep(0);
                }}
              />
            ),
          }[step]
        }
      </div>
    );
  }

  // Non-platform subscriptions - tabbed interface
  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-textGray mb-2">
          Independent Learning
        </h1>
      </div>

      <Tabs defaultValue="glossary" className="w-full">
        <TabsList className="bg-transparent rounded-none border-b border-gray-300 p-1 w-full flex justify-start">
          <TabsTrigger
            value="glossary"
            className="data-[state=active]:text-primaryBlue data-[state=active]:border-b-2 data-[state=active]:border-primaryBlue text-sm py-2 px-0 text-textSubtitle font-medium rounded-none !shadow-none !bg-transparent"
          >
            Glossary
          </TabsTrigger>
          <TabsTrigger
            value="libraries"
            className="data-[state=active]:text-primaryBlue data-[state=active]:border-b-2 data-[state=active]:border-primaryBlue text-sm py-2 px-4 text-textSubtitle font-medium rounded-none !shadow-none !bg-transparent"
          >
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="glossary" className="space-y-4">
          {step === 0 ? (
            <>
              <div className="flex md:justify-center gap-6 my-8 overflow-x-auto scrollbar-hide border-b-2 py-6">
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
                {(groupedTopics[selectedLetter] || []).map((topic, idx) => (
                  <TopicCard
                    key={idx}
                    topic={topic}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setStep(1);
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            selectedTopic && (
              <TopicDetail
                topic={selectedTopic}
                onClose={() => {
                  setSelectedTopic(null);
                  setStep(0);
                }}
              />
            )
          )}
        </TabsContent>

        <TabsContent value="libraries" className="space-y-4">
          <LibraryComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Glossary;
