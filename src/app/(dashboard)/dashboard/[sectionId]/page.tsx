"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProfile } from "@/context/profileContext";
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
import type { ChildLesson } from "@/lib/types";
import { isLessonFullyPassed } from "@/lib/lesson-progress";
import { LessonCompletedCheckIcon } from "@/components/platform/library/lessonQuizzes";

function formatAttemptPercentage(value: number | string | undefined): string {
  if (value === undefined || value === null) return "0";
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value.toFixed(0);
  }
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? "0" : n.toFixed(0);
}

function DashboardSectionPage() {
  const router = useRouter();
  const params = useParams();
  const {
    activeProfile,
    isLoaded,
    selectedCurriculumId,
    hasHydratedSelectedCurriculumId,
  } = useProfile();
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

  const selectedCurriculum = useMemo(() => {
    if (!hasHydratedSelectedCurriculumId) return "";
    if (selectedCurriculumId) return selectedCurriculumId;
    return defaultCurriculumId;
  }, [
    hasHydratedSelectedCurriculumId,
    selectedCurriculumId,
    defaultCurriculumId,
  ]);

  const { data: library } = useGetLibrary(
    activeProfile?.id || "",
    selectedCurriculum || ""
  );

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

  // Get lessons for selected section (sorted by orderIndex)
  const sectionLessons = useMemo(() => {
    const raw = (lessons?.data || []) as ChildLesson[];
    return [...raw].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [lessons?.data]);

  // Get current lesson
  const currentLesson = useMemo(() => {
    if (!selectedLesson) return null;
    return sectionLessons.find((lesson) => lesson.id === selectedLesson);
  }, [selectedLesson, sectionLessons]);

  // Handle URL parameters and initialize selections
  useEffect(() => {
    // Prefer URL sectionId; otherwise preselect the first available section.
    if (sectionId) {
      setSelectedSection(sectionId);
    } else if (!selectedSection && sections.length > 0) {
      const firstSectionId = sections[0]?.id;
      if (firstSectionId) {
        setSelectedSection(firstSectionId);
        router.replace(`/dashboard/${firstSectionId}`);
      }
    }
    // Auto-select first lesson if available
    if (sectionLessons.length > 0) {
      const stillExists = selectedLesson
        ? sectionLessons.some((l) => l.id === selectedLesson)
        : false;
      if (!stillExists) {
        setSelectedLesson(sectionLessons[0].id);
      }
    }
  }, [
    router,
    sectionId,
    sections,
    selectedSection,
    sectionLessons,
    selectedLesson,
  ]);

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
      {user?.data?.offerType === "platform" && (
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
            className="bg-white py-2 px-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent min-w-[400px] w-full"
          >
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
          className={`md:max-w-xs w-full border border-dashed flex flex-col max-h-[80vh] h-fit scrollbar-hide overflow-auto ${selectedLesson ? "hidden md:flex" : "flex"
            }`}
        >
          {sectionLessons.map((lesson, idx) => {
            const qc = lesson.quizzesCount ?? lesson.totalQuizzes ?? 0;
            const lessonPassed = isLessonFullyPassed(lesson);
            return (
              <button
                key={lesson.id || idx}
                onClick={() => {
                  setSelectedLesson(lesson.id);
                }}
                className={`flex w-full gap-3 border-b border-dashed p-4 text-left last-of-type:border-none hover:bg-[#EEEEEE]/20 ${lesson.id === selectedLesson ? "bg-[#EEEEEE]" : "bg-white"
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={`${lesson.id === selectedLesson
                      ? "font-semibold text-primaryBlue"
                      : "text-textSubtitle"
                      } inline-block max-w-full truncate text-sm font-medium md:text-base`}
                  >
                    {lesson.title}
                  </span>
                  <p className="mt-2 font-inter text-sm text-textSubtitle">
                    {qc} Quiz
                    {qc !== 1 ? "zes" : ""}
                  </p>
                </div>
                {lessonPassed ? (
                  <LessonCompletedCheckIcon className="mt-0.5 self-start" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Second Column - Lesson Content */}
        <div
          className={`w-full flex justify-center ${selectedLesson ? "flex" : "hidden md:flex"
            }`}
        >
          <div className="space-y-6 max-w-4xl w-full">
            {currentLesson ? (
              <>
                {/* Tutorial Video Section */}
                <Card className="bg-primaryBlue text-white">
                  <CardHeader>
                    <div className="flex items-center justify-end">
                      {/* <CardTitle className="text-white">
                        Tutorial Video
                      </CardTitle> */}
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
                  [...currentLesson.quizAttempts]
                    .sort(
                      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                    )
                    .map((quiz) => {
                      const resumeLabel =
                        quiz.quizAttemptId != null
                          ? "Resume Quiz"
                          : "Attempt Quiz";
                      return (
                        <Card key={quiz.id}>
                          <CardHeader>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <CardTitle className="text-base">
                                  {quiz.title}
                                </CardTitle>
                                {quiz.passed ? (
                                  <span
                                    className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-600"
                                    aria-label="Passed"
                                  >
                                    Passed
                                  </span>
                                ) : null}
                              </div>
                              <Link
                                href={`/take-quiz/${quiz.id}${quiz.quizAttemptId ? `?attemptId=${quiz.quizAttemptId}` : ""}`}
                                className="shrink-0"
                              >
                                <Button
                                  variant="default"
                                  className="bg-primaryBlue"
                                >
                                  {resumeLabel}
                                </Button>
                              </Link>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {quiz.attempts && quiz.attempts.length > 0 ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 border-b pb-2 text-sm font-medium text-textSubtitle">
                                  <div>Attempt</div>
                                  <div>Date</div>
                                  <div>Score</div>
                                </div>
                                {quiz.attempts.map((attempt, index: number) => (
                                  <div
                                    key={attempt.id}
                                    className="grid grid-cols-3 gap-4 items-center border-b py-2 last:border-none"
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
                                        {formatAttemptPercentage(
                                          attempt.percentage
                                        )}
                                        %
                                      </span>
                                      <Link
                                        href={`/quiz/${attempt.id}/review`}
                                        className="flex items-center gap-1 text-sm font-medium text-primaryBlue hover:underline"
                                      >
                                        View Breakdown
                                        <ChevronRight className="h-4 w-4" />
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="py-4 text-center text-sm text-textSubtitle">
                                No attempts yet
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
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
