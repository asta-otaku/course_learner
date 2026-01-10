"use client";

import React, { useMemo, useState, useEffect } from "react";
import profileIcon from "@/assets/profileIcon.svg";
import Image from "next/image";
import Streak from "./streaks";
import LearningCard, { ProgressCard } from "./learningCard";
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
import ProfileLoader from "../profile-loader";

function Home() {
  const {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles,
    isChangingProfile,
    selectedCurriculumId: profileSelectedCurriculumId,
    setSelectedCurriculumId: setProfileSelectedCurriculumId,
  } = useSelectedProfile();

  const { data: library } = useGetLibrary(activeProfile?.id || "");

  // Get sections from library data (for Your Progress section only)
  const sections = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  // Create a mapping from sectionId to section imageUrl
  const sectionImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    sections.forEach((section: any) => {
      if (section.id && section.imageUrl) {
        map[section.id] = section.imageUrl;
      }
    });
    return map;
  }, [sections]);

  // Fetch curricula by offerType
  const { data: curriculaData } = useGetCurricula({
    offerType: activeProfile?.offerType || "",
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
  const selectedCurriculumId = useMemo(() => {
    // If profile has a stored curriculum ID, use it
    if (profileSelectedCurriculumId) {
      return profileSelectedCurriculumId;
    }
    // Otherwise, use default (first curriculum)
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

  // Fetch lessons for the selected curriculum
  const { data: lessonsData } = useGetChildLessons(
    activeProfile?.id || "",
    selectedCurriculumId,
    undefined // No sectionId needed
  );

  // Get selected curriculum details
  const selectedCurriculum = useMemo(() => {
    return curriculaList.find(
      (curriculum: any) => curriculum.id === selectedCurriculumId
    ) as any;
  }, [curriculaList, selectedCurriculumId]);

  // Collect lessons from the selected curriculum
  const allLessons = useMemo(() => {
    const lessons: any[] = [];
    if (lessonsData?.data && selectedCurriculum) {
      lessonsData.data.forEach((lesson: any) => {
        // Get section image from library data based on lesson's sectionId
        const sectionImageUrl = lesson.sectionId
          ? sectionImageMap[lesson.sectionId]
          : null;
        lessons.push({
          ...lesson,
          curriculumId: selectedCurriculumId,
          curriculumTitle: selectedCurriculum.title,
          curriculumImageUrl: sectionImageUrl || selectedCurriculum.imageUrl,
        });
      });
    }
    return lessons;
  }, [
    lessonsData?.data,
    selectedCurriculum,
    selectedCurriculumId,
    sectionImageMap,
  ]);

  // Transform library sections to Course format, sorted by orderIndex
  const curriculaAsCourses = useMemo(() => {
    return sections
      .slice()
      .sort((a: any, b: any) => {
        const orderA = a.orderIndex ?? 0;
        const orderB = b.orderIndex ?? 0;
        return orderA - orderB;
      })
      .map((section: any) => ({
        imageUrl: section.imageUrl,
        course: section.title,
        topics: [
          {
            title: "Start Learning",
            number_of_quizzes: section.progress?.totalQuizzes || 0,
          },
        ],
        progress: section.progress?.completionPercentage || 0,
        duration: 0, // Sections don't have durationWeeks
        total_section: section.progress?.totalLessons || 0,
        completed_section: section.progress?.completedLessons || 0,
        curriculumId: section.id, // Using section.id as curriculumId
      }));
  }, [sections]);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize">
                continue Learning
              </h1>
              <span className="text-xs text-textSubtitle">
                We recommend the following baseline tests.
              </span>
            </div>
            <div className="w-full md:w-auto min-w-[200px]">
              <Select
                value={selectedCurriculumId}
                onValueChange={(value) => {
                  setProfileSelectedCurriculumId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a curriculum..." />
                </SelectTrigger>
                <SelectContent>
                  {curriculaList.length > 0 ? (
                    curriculaList.map((curriculum: any, index: number) => {
                      const curriculumId =
                        curriculum.id || `curriculum-${index}`;
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
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {allLessons.length > 0 ? (
              allLessons.map((lesson, index) => (
                <LearningCard
                  key={lesson.id || index}
                  course={{
                    course: lesson.curriculumTitle,
                    imageUrl: lesson.curriculumImageUrl,
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
            ) : (
              <div className="text-center py-8 text-textSubtitle">
                No lessons found
              </div>
            )}
          </div>
        </div>

        <div>
          <div>
            <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize">
              Your Progress
            </h1>
            <span className="text-xs text-textSubtitle">
              This shows your progress levels in each curriculum
            </span>
          </div>
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
