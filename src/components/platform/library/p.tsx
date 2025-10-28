"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/profileContext";
import BackArrow from "@/assets/svgs/arrowback";
import { useGetLibrary, useGetChildLessons } from "@/lib/api/queries";

interface LibraryProps {
  curriculumId?: string;
  lessonId?: string;
}

function Library({ curriculumId, lessonId }: LibraryProps) {
  const router = useRouter();
  const params = useParams();
  const { activeProfile, isLoaded } = useProfile();
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [user, setUser] = React.useState<any>({});

  // Get curriculumId and lessonId from params or props
  const urlCurriculumId = (params?.curriculumId as string) || curriculumId;
  const urlLessonId = (params?.lessonId as string) || lessonId;

  const { data: library } = useGetLibrary(activeProfile?.id || "");
  const { data: lessons } = useGetChildLessons(
    activeProfile?.id || "",
    selectedCurriculum
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  // Get curricula from library data
  const curricula = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  // Get lessons for selected curriculum
  const selectedCurriculumLessons = useMemo(() => {
    return lessons?.data || [];
  }, [lessons?.data]);

  // Get current lesson details
  const currentLesson = useMemo(() => {
    if (!selectedLesson || !selectedCurriculum) return null;
    return selectedCurriculumLessons.find(
      (lesson) => lesson.id === selectedLesson
    );
  }, [selectedLesson, selectedCurriculum, selectedCurriculumLessons]);

  // Handle URL parameters and initialize selections
  useEffect(() => {
    if (curricula.length > 0) {
      // If we have curriculumId in URL, use it
      if (urlCurriculumId) {
        setSelectedCurriculum(urlCurriculumId);

        // If we have lessonId in URL, use it
        if (urlLessonId) {
          setSelectedLesson(urlLessonId);
        } else {
          setSelectedLesson("");
        }
      } else if (!selectedCurriculum) {
        // No curriculum in URL and no selection yet, select first curriculum
        setSelectedCurriculum(curricula[0].id);
        setSelectedLesson("");
      }
    }
  }, [curricula, urlCurriculumId, urlLessonId, selectedCurriculum]);

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

  if (!selectedCurriculum || curricula.length === 0) {
    return <div className="p-8 text-center">Loading curricula...</div>;
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {user?.data?.offerType === "Offer One" && (
        <div>
          <h1 className="text-xl font-medium text-textGray">Library</h1>
          <p className="text-sm text-textSubtitle">
            This tab contains videos and worksheets for the entire 11+ Maths
            syllabus. We have numbered each section of the syllabus for easy
            navigation.
          </p>
        </div>
      )}

      {/* Curriculum Selector Dropdown */}
      <div className="mb-6 mt-8">
        <select
          value={selectedCurriculum}
          onChange={(e) => {
            const newCurriculumId = e.target.value;
            setSelectedCurriculum(newCurriculumId);
            setSelectedLesson(""); // Reset lesson when curriculum changes
            router.push(`/library/${newCurriculumId}`);
          }}
          className="bg-white py-2 px-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent min-w-[200px]"
        >
          <option value="">Select a Curriculum</option>
          {curricula.map((curriculum, idx) => (
            <option key={idx} value={curriculum.id}>
              {curriculum.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* First Column - Lessons List (Hidden on mobile when lesson selected) */}
        <div
          className={`md:max-w-xs w-full border border-dashed flex flex-col max-h-[80vh] h-fit scrollbar-hide overflow-auto ${
            selectedLesson ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedCurriculumLessons.map((lesson, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedLesson(lesson.id);
                router.push(`/library/${selectedCurriculum}/${lesson.id}`);
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
                {lesson.totalQuizzes} Quiz
                {lesson.totalQuizzes !== 1 ? "zes" : ""}
                {lesson.completionPercentage > 0 && (
                  <span className="ml-2 text-primaryBlue">
                    {lesson.completionPercentage}% Complete
                  </span>
                )}
              </p>
            </button>
          ))}
        </div>

        {/* Second Column - Lesson Content (Show when lesson is selected) */}
        <div
          className={`w-full flex justify-center ${
            selectedLesson ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="space-y-6 max-w-2xl w-full">
            {/* Mobile Back Button */}
            {selectedLesson && (
              <button
                onClick={() => {
                  setSelectedLesson("");
                  router.push(`/library/${selectedCurriculum}`);
                }}
                className="md:hidden mb-4 text-primaryBlue font-medium flex items-center gap-2"
              >
                <BackArrow color="#286cff" /> Back to Lessons
              </button>
            )}

            {!selectedLesson ? (
              <div className="text-center py-12">
                <p className="text-textSubtitle text-lg">
                  Select a lesson from the left to view content
                </p>
              </div>
            ) : (
              <>
                {/* Lesson Video Section */}
                <div className="bg-primaryBlue rounded-2xl flex items-center gap-4 justify-between py-4 px-6">
                  <h2 className="font-medium md:text-xl text-white">
                    {currentLesson?.title}
                  </h2>
                  <Button
                    variant="outline"
                    className="rounded-full text-primaryBlue font-medium text-xs"
                    onClick={() =>
                      router.push(
                        `/videos-quiz/${selectedCurriculum}/${currentLesson?.id}`
                      )
                    }
                  >
                    Watch Video <img src="/play.svg" alt="" />
                  </Button>
                </div>

                {/* Lesson Progress */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Progress</h3>
                    <span className="text-sm text-textSubtitle">
                      {currentLesson?.completionPercentage}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primaryBlue h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${currentLesson?.completionPercentage || 0}%`,
                      }}
                    ></div>
                  </div>

                  {/* Lesson Details */}
                  <div className="border rounded-2xl bg-white overflow-hidden">
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-textSubtitle">
                            Video Status:
                          </span>
                          <span
                            className={`ml-2 ${currentLesson?.videoCompleted ? "text-green-600" : "text-gray-600"}`}
                          >
                            {currentLesson?.videoCompleted
                              ? "Completed"
                              : "Not Started"}
                          </span>
                        </div>
                        <div>
                          <span className="text-textSubtitle">Quizzes:</span>
                          <span className="ml-2 text-primaryBlue">
                            {currentLesson?.quizzesPassed}/
                            {currentLesson?.totalQuizzes} Passed
                          </span>
                        </div>
                        <div>
                          <span className="text-textSubtitle">
                            Watched Position:
                          </span>
                          <span className="ml-2 text-gray-600">
                            {Math.round(currentLesson?.watchedPosition || 0)}s
                          </span>
                        </div>
                        <div>
                          <span className="text-textSubtitle">
                            Lesson Status:
                          </span>
                          <span
                            className={`ml-2 ${currentLesson?.lessonCompleted ? "text-green-600" : "text-gray-600"}`}
                          >
                            {currentLesson?.lessonCompleted
                              ? "Completed"
                              : "In Progress"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Library;
