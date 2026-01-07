"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TopicCard, TagDetail } from "./TopicComponents";
import LibraryComponent from "@/components/platform/library/p";
import { useProfile } from "@/context/profileContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetTags } from "@/lib/api/queries";
import { useQueries } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { axiosInstance } from "@/lib/services/axiosInstance";
import { APIGetResponse } from "@/lib/types";
import { useSearchParams } from "next/navigation";

const Glossary = () => {
  const { activeProfile, isLoaded } = useProfile();
  const [user, setUser] = React.useState<any>({});
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [step, setStep] = useState(0);

  // Fetch all tags
  const { data: tagsResponse, isLoading: isLoadingTags } = useGetTags();
  const tags = tagsResponse?.data || [];

  // Group tags by first letter
  const groupedTags = useMemo(() => {
    return tags.reduce(
      (acc, tag) => {
        const letter = tag.charAt(0).toUpperCase();
        if (!acc[letter]) {
          acc[letter] = [];
        }
        acc[letter].push(tag);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [tags]);

  // Get tags for selected letter
  const tagsForSelectedLetter = groupedTags[selectedLetter] || [];

  // Fetch lessons for all tags starting with selected letter using useQueries
  const tagLessonsQueries = useQueries({
    queries: tagsForSelectedLetter.map((tag) => ({
      queryKey: ["tag-lessons", tag],
      queryFn: async (): Promise<APIGetResponse<Lesson[]>> => {
        const response = await axiosInstance.get(`/tags/${tag}/lessons`);
        return response.data;
      },
      enabled: !!tag,
    })),
  });

  // Combine all lessons and group by tag
  const lessonsByTag = useMemo(() => {
    const result: Record<string, Lesson[]> = {};

    tagsForSelectedLetter.forEach((tag, index) => {
      const queryResult = tagLessonsQueries[index];
      if (queryResult.data?.data) {
        result[tag] = queryResult.data.data;
      }
    });

    return result;
  }, [tagsForSelectedLetter, tagLessonsQueries]);

  // Check if any lessons are loading
  const isLoadingLessons = tagLessonsQueries.some((query) => query.isLoading);

  // Get total lessons count for a tag
  const getLessonsCount = (tag: string) => {
    return lessonsByTag[tag]?.length || 0;
  };

  // Read tag from URL query parameter and set initial letter
  useEffect(() => {
    const tagParam = searchParams.get("tag");
    if (tagParam && tagParam.length > 0) {
      const firstLetter = tagParam.charAt(0).toUpperCase();
      setSelectedLetter(firstLetter);
      // Check if the tag exists in the tags list
      if (tags.includes(tagParam)) {
        setSelectedTag(tagParam);
        setStep(1);
      }
    }
  }, [searchParams, tags]);

  // Loading state
  if (!isLoaded || isLoadingTags) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
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

  // Platform subscription - original design
  if (user?.data?.offerType === "Offer One") {
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
                  {isLoadingLessons ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
                    </div>
                  ) : tagsForSelectedLetter.length > 0 ? (
                    tagsForSelectedLetter.map((tag, idx) => {
                      const lessonsCount = getLessonsCount(tag);
                      return (
                        <TopicCard
                          key={idx}
                          topic={{
                            title: tag,
                            course: "Glossary",
                            number_of_quizzes: lessonsCount,
                          }}
                          onClick={() => {
                            setSelectedTag(tag);
                            setStep(1);
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-textSubtitle">
                      No tags found for letter {selectedLetter}
                    </div>
                  )}
                </div>
              </>
            ),
            1: selectedTag && (
              <TagDetail
                tag={selectedTag}
                lessons={(lessonsByTag[selectedTag] as any) || []}
                onClose={() => {
                  setSelectedTag(null);
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
                {isLoadingLessons ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
                  </div>
                ) : tagsForSelectedLetter.length > 0 ? (
                  tagsForSelectedLetter.map((tag, idx) => {
                    const lessonsCount = getLessonsCount(tag);
                    return (
                      <TopicCard
                        key={idx}
                        topic={{
                          title: tag,
                          course: "Glossary",
                          number_of_quizzes: lessonsCount,
                        }}
                        onClick={() => {
                          setSelectedTag(tag);
                          setStep(1);
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-textSubtitle">
                    No tags found for letter {selectedLetter}
                  </div>
                )}
              </div>
            </>
          ) : (
            selectedTag && (
              <TagDetail
                tag={selectedTag}
                lessons={(lessonsByTag[selectedTag] as any) || []}
                onClose={() => {
                  setSelectedTag(null);
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
