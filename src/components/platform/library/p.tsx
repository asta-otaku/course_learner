"use client";

import { courses, dummyQuizzes, slugify } from "@/lib/utils";
import Link from "next/link";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/profileContext";
import BackArrow from "@/assets/svgs/arrowback";

function Library() {
  const router = useRouter();
  const { activeProfile, isLoaded } = useProfile();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [user, setUser] = React.useState<any>({});

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  // Group courses by course name
  const groupedCourses = useMemo(() => {
    return courses.reduce((acc, course) => {
      if (!acc[course.course]) {
        acc[course.course] = [];
      }
      acc[course.course].push(course);
      return acc;
    }, {} as Record<string, typeof courses>);
  }, []);

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

  // Get distinct course names for dropdown
  const distinctCourseNames = useMemo(
    () => Object.keys(groupedCourses),
    [groupedCourses]
  );

  // Get topics for selected course
  const selectedCourseTopics = useMemo(() => {
    if (!selectedCourse) return [];
    return groupedCourses[selectedCourse].flatMap((course) => course.topics);
  }, [selectedCourse, groupedCourses]);

  // Get current topic details
  const currentTopic = useMemo(() => {
    if (!selectedTopic || !selectedCourse) return null;
    return selectedCourseTopics.find((t) => t.title === selectedTopic) as {
      title: string;
      number_of_quizzes: number;
      quizzes: {
        title: string;
        attempts: { label: string; date: string; score: number }[];
      }[];
    };
  }, [selectedTopic, selectedCourse, selectedCourseTopics]);

  // Initialize with first course if none selected
  useEffect(() => {
    if (distinctCourseNames.length > 0 && !selectedCourse) {
      setSelectedCourse(distinctCourseNames[0]);
    }
  }, [distinctCourseNames, selectedCourse]);

  // Reset selected topic when course changes
  useEffect(() => {
    setSelectedTopic("");
  }, [selectedCourse]);

  if (!selectedCourse || distinctCourseNames.length === 0) {
    return <div className="p-8 text-center">Loading courses...</div>;
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

      {/* Course Selector Dropdown */}
      <div className="mb-6 mt-8">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="bg-white py-2 px-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent min-w-[200px]"
        >
          <option value="">Select a Course</option>
          {distinctCourseNames.map((courseName, idx) => (
            <option key={idx} value={courseName}>
              {courseName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* First Column - Course Topics List (Hidden on mobile when topic selected) */}
        <div
          className={`md:max-w-xs w-full border border-dashed flex flex-col max-h-[80vh] h-fit scrollbar-hide overflow-auto ${
            selectedTopic ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedCourseTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTopic(topic.title)}
              className={`border-b last-of-type:border-none border-dashed p-4 hover:bg-[#EEEEEE]/20 w-full text-left ${
                topic.title === selectedTopic ? "bg-[#EEEEEE]" : "bg-white"
              }`}
            >
              <span
                className={`${
                  topic.title === selectedTopic
                    ? "text-primaryBlue font-semibold"
                    : "text-textSubtitle"
                } font-medium text-sm md:text-base max-w-[300px] whitespace-nowrap truncate inline-block`}
              >
                {topic.title}
              </span>
              <p className="text-textSubtitle text-sm font-inter mt-2">
                {topic.number_of_quizzes} Quiz
                {topic.number_of_quizzes !== 1 ? "zes" : ""}
              </p>
            </button>
          ))}
        </div>

        {/* Second Column - Topic Content (Show when topic is selected) */}
        <div
          className={`w-full flex justify-center ${
            selectedTopic ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="space-y-6 max-w-2xl w-full">
            {/* Mobile Back Button */}
            {selectedTopic && (
              <button
                onClick={() => setSelectedTopic("")}
                className="md:hidden mb-4 text-primaryBlue font-medium flex items-center gap-2"
              >
                <BackArrow color="#286cff" /> Back to Topics
              </button>
            )}

            {!selectedTopic ? (
              <div className="text-center py-12">
                <p className="text-textSubtitle text-lg">
                  Select a topic from the left to view content
                </p>
              </div>
            ) : (
              <>
                {/* Tutorial Video Section */}
                <div className="bg-primaryBlue rounded-2xl flex items-center gap-4 justify-between py-4 px-6">
                  <h2 className="font-medium md:text-xl text-white">
                    Tutorial Video
                  </h2>
                  <Button
                    variant="outline"
                    className="rounded-full text-primaryBlue font-medium text-xs"
                    onClick={() =>
                      router.push(
                        `/videos-quiz/${slugify(selectedCourse)}/${slugify(
                          selectedTopic
                        )}`
                      )
                    }
                  >
                    Watch Video <img src="/play.svg" alt="" />
                  </Button>
                </div>

                {/* Quizzes Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Quiz</h3>
                    <select className="bg-white py-2 px-3 rounded-full font-medium text-sm">
                      <option>All Quizzes</option>
                    </select>
                  </div>

                  {/* Quizzes List */}
                  {(currentTopic?.quizzes || dummyQuizzes).map(
                    (quiz, quizIdx) => (
                      <div
                        key={quiz.title}
                        className="border rounded-2xl bg-white overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-6 py-4">
                          <div>
                            <h4 className="font-medium">Quiz {quizIdx + 1}</h4>
                            <p className="text-sm text-textSubtitle">
                              20 Questions
                              {quiz.attempts.length > 0 && (
                                <span className="ml-2 text-primaryBlue">
                                  Previous Score -{" "}
                                  {
                                    quiz.attempts[quiz.attempts.length - 1]
                                      .score
                                  }
                                  %
                                </span>
                              )}
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              router.push(
                                `/videos-quiz/${slugify(
                                  selectedCourse
                                )}/${slugify(selectedTopic)}/${slugify(
                                  quiz.title
                                )}`
                              )
                            }
                            className="rounded-full bg-primaryBlue text-white text-xs py-2 px-4"
                          >
                            {quiz.attempts.length > 0
                              ? "Retake Quiz"
                              : "Start Quiz"}
                          </Button>
                        </div>

                        {/* Attempts Table - Only show if there are attempts */}
                        {quiz.attempts.length > 0 && (
                          <table className="w-full table-fixed border-y border-collapse">
                            <thead>
                              <tr>
                                <th className="border-b border-r border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left">
                                  N/O
                                </th>
                                <th className="border-b border-r border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left">
                                  Date
                                </th>
                                <th className="border-b border-r border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left">
                                  Score
                                </th>
                                <th className="border-b border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {quiz.attempts.map((attempt) => (
                                <tr key={attempt.label}>
                                  <td className="border-b border-r border-gray-200 py-3 px-4 text-sm">
                                    {attempt.label}
                                  </td>
                                  <td className="border-b border-r border-gray-200 py-3 px-4 text-sm">
                                    {attempt.date}
                                  </td>
                                  <td className="border-b border-r border-gray-200 py-3 px-4 text-sm">
                                    {attempt.score}%
                                  </td>
                                  <td className="border-b border-gray-200 py-3 px-4 text-sm">
                                    <Link
                                      href="#"
                                      className="flex items-center gap-2 font-medium text-sm text-primaryBlue"
                                    >
                                      View Breakdown <span>&rarr;</span>
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )
                  )}
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
