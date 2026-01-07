"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProfile } from "@/context/profileContext";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import {
  useGetLibrary,
  useGetChildLessons,
  useGetCurricula,
} from "@/lib/api/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface QuizAttempt {
  id: string;
  submittedAt: string;
  percetage: string;
}

interface QuizWithAttempts {
  id: string;
  title: string;
  attempts: QuizAttempt[];
}

interface LessonWithQuizzes {
  id: string;
  title: string;
  description: string;
  sectionId: string;
  orderIndex: number;
  quizzesCount: number;
  quizAttempts?: QuizWithAttempts[];
}

function DashboardSectionPage() {
  const router = useRouter();
  const params = useParams();
  const { activeProfile, isLoaded } = useProfile();
  const {
    selectedCurriculumId: profileSelectedCurriculumId,
    setSelectedCurriculumId: setProfileSelectedCurriculumId,
  } = useSelectedProfile();
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [user, setUser] = React.useState<any>({});

  const sectionId = params.sectionId as string;

  // Fetch curricula by offerType
  const { data: curriculaData } = useGetCurricula({
    offerType: user?.data?.offerType || activeProfile?.offerType || "",
  });

  // Get curricula list for dropdown
  const curriculaList = useMemo(() => {
    return curriculaData?.curricula || [];
  }, [curriculaData?.curricula]);

  // Get default curriculum (first one)
  const defaultCurriculumId = useMemo(() => {
    if (curriculaList.length > 0) {
      const firstCurriculum = curriculaList[0] as any;
      return firstCurriculum.id || "";
    }
    return "";
  }, [curriculaList]);

  // Determine the actual selected curriculum ID
  const selectedCurriculum = useMemo(() => {
    if (profileSelectedCurriculumId) {
      return profileSelectedCurriculumId;
    }
    return defaultCurriculumId;
  }, [profileSelectedCurriculumId, defaultCurriculumId]);

  // Update profile's selectedCurriculumId when default changes (if not already set)
  useEffect(() => {
    if (defaultCurriculumId && !profileSelectedCurriculumId) {
      setProfileSelectedCurriculumId(defaultCurriculumId);
    }
  }, [
    defaultCurriculumId,
    profileSelectedCurriculumId,
    setProfileSelectedCurriculumId,
  ]);

  const { data: library } = useGetLibrary(activeProfile?.id || "");

  // Fetch lessons with curriculumId and sectionId
  const { data: lessons } = useGetChildLessons(
    activeProfile?.id || "",
    selectedCurriculum || "",
    sectionId
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  // Get sections from library data
  const sections = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  // Get lessons for selected section
  const sectionLessons = useMemo(() => {
    return (lessons?.data || []) as unknown as LessonWithQuizzes[];
  }, [lessons?.data]);

  // Get current lesson
  const currentLesson = useMemo(() => {
    if (!selectedLesson) return null;
    return sectionLessons.find((lesson) => lesson.id === selectedLesson);
  }, [selectedLesson, sectionLessons]);

  // Handle URL parameters and initialize selections
  useEffect(() => {
    if (sectionId) {
      setSelectedSection(sectionId);
    }
    // Auto-select first lesson if available
    if (sectionLessons.length > 0 && !selectedLesson) {
      setSelectedLesson(sectionLessons[0].id);
    }
  }, [sectionId, sectionLessons, selectedLesson]);

  // Early returns after all hooks
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }
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

  if (!selectedCurriculum || curriculaList.length === 0) {
    return <div className="p-8 text-center">Loading curricula...</div>;
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {user?.data?.offerType === "Offer One" && (
        <div>
          <h1 className="text-xl font-medium text-textGray">Dashboard</h1>
          <p className="text-sm text-textSubtitle">
            View your lessons and quiz progress
          </p>
        </div>
      )}

      {/* Curriculum and Section Selectors */}
      <div className="mb-6 mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Curriculum Selector Dropdown - Disabled */}
        <div className="w-full md:w-auto min-w-[200px]">
          <Select value={selectedCurriculum} disabled={true}>
            <SelectTrigger>
              <SelectValue placeholder="Select a Curriculum" />
            </SelectTrigger>
            <SelectContent>
              {curriculaList.length > 0 ? (
                curriculaList.map((curriculum: any, index: number) => {
                  const curriculumId = curriculum.id || `curriculum-${index}`;
                  return (
                    <SelectItem key={curriculumId} value={curriculumId}>
                      {curriculum.title}
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="no-curricula" disabled>
                  No curricula available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Section Selector Dropdown */}
        <div className="w-full md:w-auto min-w-[200px] md:ml-auto">
          <select
            value={selectedSection || sectionId || ""}
            onChange={(e) => {
              const newSectionId = e.target.value;
              setSelectedSection(newSectionId);
              setSelectedLesson("");
              router.push(`/dashboard/${newSectionId}`);
            }}
            className="bg-white py-2 px-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent min-w-[200px] w-full md:w-fit"
          >
            <option value="" className="text-textGray">
              Select a Section
            </option>
            {sections.map((section: any, idx) => (
              <option
                key={idx}
                value={section.id}
                className="text-textGray w-fit"
              >
                {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* First Column - Lessons List */}
        <div
          className={`md:max-w-xs w-full border border-dashed flex flex-col max-h-[80vh] h-fit scrollbar-hide overflow-auto ${
            selectedLesson ? "hidden md:flex" : "flex"
          }`}
        >
          {sectionLessons.map((lesson, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedLesson(lesson.id);
              }}
              className={`border-b last-of-type:border-none border-dashed p-4 hover:bg-[#EEEEEE]/20 w-full text-left ${
                lesson.id === selectedLesson ? "bg-[#EEEEEE]" : "bg-white"
              }`}
            >
              <span
                className={`${
                  lesson.id === selectedLesson
                    ? "text-primaryBlue font-semibold"
                    : "text-textSubtitle"
                } font-medium text-sm md:text-base max-w-[300px] whitespace-nowrap truncate inline-block`}
              >
                {lesson.title}
              </span>
              <p className="text-textSubtitle text-sm font-inter mt-2">
                {lesson.quizzesCount || 0} Quiz
                {lesson.quizzesCount !== 1 ? "zes" : ""}
              </p>
            </button>
          ))}
        </div>

        {/* Second Column - Lesson Content */}
        <div
          className={`w-full flex justify-center ${
            selectedLesson ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="space-y-6 max-w-4xl w-full">
            {currentLesson ? (
              <>
                {/* Tutorial Video Section */}
                <Card className="bg-primaryBlue text-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        Tutorial Video
                      </CardTitle>
                      <Link
                        href={`/library/${currentLesson.sectionId}/${currentLesson.id}`}
                      >
                        <Button className="bg-white text-primaryBlue hover:bg-gray-100">
                          <Play className="h-4 w-4 mr-2" />
                          Watch Video
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>

                {/* Quiz Sections */}
                {currentLesson.quizAttempts &&
                currentLesson.quizAttempts.length > 0 ? (
                  currentLesson.quizAttempts.map((quiz: any) => (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{quiz.title}</CardTitle>
                          <Link href={`/take-quiz/${quiz.id}`}>
                            <Button
                              variant="default"
                              className="bg-primaryBlue"
                            >
                              Attempt Quiz
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {quiz.attempts && quiz.attempts.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-textSubtitle border-b pb-2">
                              <div>N/O</div>
                              <div>Date</div>
                              <div>Score</div>
                            </div>
                            {quiz.attempts.map(
                              (attempt: any, index: number) => (
                                <div
                                  key={attempt.id}
                                  className="grid grid-cols-3 gap-4 items-center py-2 border-b last:border-none"
                                >
                                  <div className="text-sm font-medium">
                                    Attempt {index + 1}
                                  </div>
                                  <div className="text-sm text-textSubtitle">
                                    {format(
                                      new Date(attempt.submittedAt),
                                      "dd-MM-yyyy"
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                      {parseFloat(attempt.percentage).toFixed(
                                        0
                                      )}
                                      %
                                    </span>
                                    <Link
                                      href={`/quiz/${attempt.id}/review`}
                                      className="flex items-center gap-1 text-primaryBlue text-sm font-medium hover:underline"
                                    >
                                      View Breakdown
                                      <ChevronRight className="h-4 w-4" />
                                    </Link>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-textSubtitle text-center py-4">
                            No attempts yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-textSubtitle">
                      No quizzes available for this lesson
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-textSubtitle">
                  Select a lesson to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSectionPage;
