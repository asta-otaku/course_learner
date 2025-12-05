"use client";

import React, { useMemo } from "react";
import profileIcon from "@/assets/profileIcon.svg";
import Image from "next/image";
import Streak from "./streaks";
import LearningCard, { ProgressCard } from "./learningCard";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import { useGetLibrary, useGetChildLessons } from "@/lib/api/queries";
import ProfileLoader from "../profile-loader";
import algebra from "@/assets/algebra.png";
import measurement from "@/assets/measurement.png";
import ratio from "@/assets/ratio.png";

const availableImages = [algebra, measurement, ratio];

function Home() {
  const {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles,
    isChangingProfile,
  } = useSelectedProfile();

  const { data: library } = useGetLibrary(activeProfile?.id || "");

  // Get curricula from library data
  const curricula = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  // Fetch lessons for the first 4 curricula to display in "Continue Learning"
  const { data: lessons1 } = useGetChildLessons(
    activeProfile?.id || "",
    curricula[0]?.id || ""
  );
  const { data: lessons2 } = useGetChildLessons(
    activeProfile?.id || "",
    curricula[1]?.id || ""
  );
  const { data: lessons3 } = useGetChildLessons(
    activeProfile?.id || "",
    curricula[2]?.id || ""
  );
  const { data: lessons4 } = useGetChildLessons(
    activeProfile?.id || "",
    curricula[3]?.id || ""
  );

  // Collect all lessons from the first 4 curricula
  const allLessons = useMemo(() => {
    const lessons: any[] = [];
    [lessons1, lessons2, lessons3, lessons4].forEach((lessonData, index) => {
      const curriculum = curricula[index];
      if (lessonData?.data && curriculum) {
        lessonData.data.forEach((lesson: any) => {
          lessons.push({
            ...lesson,
            curriculumId: curriculum.id,
            curriculumTitle: curriculum.title,
            curriculumImage: availableImages[index % availableImages.length],
          });
        });
      }
    });
    return lessons;
  }, [lessons1, lessons2, lessons3, lessons4, curricula]);

  // Transform library curricula to Course format
  const curriculaAsCourses = useMemo(() => {
    return curricula.map((curriculum, index) => ({
      image: availableImages[index % availableImages.length],
      course: curriculum.title,
      topics: [
        {
          title: "Start Learning",
          number_of_quizzes: curriculum.progress.totalQuizzes,
        },
      ],
      progress: curriculum.progress.completionPercentage,
      duration: curriculum.durationWeeks * 7, // Convert weeks to days
      total_section: curriculum.lessonsCount,
      completed_section: curriculum.progress.completedLessons,
      curriculumId: curriculum.id, // Add curriculumId for navigation
    }));
  }, [curricula]);

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center">
      <div className="flex items-center gap-2">
        <Image
          src={activeProfile?.avatar || profileIcon}
          alt="Profile Icon"
          width={0}
          height={0}
          className="rounded-full"
        />
        <div className="flex flex-col gap-1 items-start">
          <p className="uppercase font-medium text-sm text-textSubtitle ml-1">
            Welcome,
          </p>
          {isLoaded ? (
            <select
              value={activeProfile?.name || ""}
              onChange={(e) => changeProfile(e.target.value)}
              className="bg-transparent font-medium uppercase border-none focus:outline-none focus:ring-0 active:outline-none max-w-fit active:ring-0"
            >
              {profiles.map((profile, index) => (
                <option
                  key={index}
                  value={profile.name}
                  className="text-sm text-textSubtitle"
                >
                  {profile.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          )}
        </div>
      </div>
      <Streak streakDays={12} />
    </div>
  );

  return (
    <>
      {isChangingProfile && <ProfileLoader />}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
        {renderHeader()}

        <div className="my-8">
          <div>
            <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize">
              continue Learning
            </h1>
            <span className="text-xs text-textSubtitle">
              We recommend the following baseline tests.
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {allLessons.length > 0 ? (
              allLessons.map((lesson, index) => (
                <LearningCard
                  key={lesson.id || index}
                  course={{
                    course: lesson.curriculumTitle,
                    image: lesson.curriculumImage,
                    topics: [],
                    progress: lesson.completionPercentage,
                    duration: 0,
                    total_section: 0,
                    completed_section: 0,
                    curriculumId: lesson.curriculumId,
                  }}
                  lesson={lesson}
                />
              ))
            ) : curriculaAsCourses.length > 0 ? (
              curriculaAsCourses.map((course, index) => (
                <LearningCard
                  key={course.curriculumId || index}
                  course={course}
                />
              ))
            ) : (
              <div className="text-center py-8 text-textSubtitle">
                No lessons found
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize">
            Your Progress
          </h1>
          <span className="text-xs text-textSubtitle">
            This shows your progress levels in each curriculum
          </span>
          <div className="my-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {curriculaAsCourses.length > 0 ? (
              curriculaAsCourses.map((course, index) => (
                <ProgressCard
                  key={course.curriculumId || index}
                  course={course}
                />
              ))
            ) : (
              <div className="text-center py-8 text-textSubtitle">
                No progress found
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export default Home;
