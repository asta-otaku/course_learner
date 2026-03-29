"use client";

import React, { useMemo, useEffect } from "react";
// import Streak from "./streaks";
import LearningCard, { ProgressCard } from "./learningCard";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import {
  useGetLibrary,
  useGetChildLastAccessedLessons,
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
import { Trophy } from "lucide-react";

function Home() {
  const {
    activeProfile,
    isChangingProfile,
    selectedCurriculumId: profileSelectedCurriculumId,
    setSelectedCurriculumId: setProfileSelectedCurriculumId,
  } = useSelectedProfile();

  // Fetch curricula first so we can resolve selectedCurriculumId for library + lessons
  const { data: curriculaData } = useGetCurricula({
    offerType: activeProfile?.offerType || "",
  });

  const curriculaList = useMemo(() => {
    return curriculaData?.curricula || [];
  }, [curriculaData?.curricula]);

  const reversedCurriculaList = useMemo(() => {
    return curriculaList.slice().reverse();
  }, [curriculaList]);

  const defaultCurriculumId = useMemo(() => {
    if (reversedCurriculaList.length > 0) {
      const firstCurriculum = reversedCurriculaList[0] as any;
      return firstCurriculum.id || "";
    }
    return "";
  }, [reversedCurriculaList]);

  const selectedCurriculumId = useMemo(() => {
    if (profileSelectedCurriculumId) {
      return profileSelectedCurriculumId;
    }
    return defaultCurriculumId;
  }, [profileSelectedCurriculumId, defaultCurriculumId]);

  useEffect(() => {
    if (defaultCurriculumId && !profileSelectedCurriculumId) {
      setProfileSelectedCurriculumId(defaultCurriculumId);
    }
  }, [
    defaultCurriculumId,
    profileSelectedCurriculumId,
    setProfileSelectedCurriculumId,
  ]);

  const { data: library } = useGetLibrary(
    activeProfile?.id || "",
    selectedCurriculumId
  );

  const sections = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  const sectionImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    sections.forEach((section: any) => {
      if (section.id && section.imageUrl) {
        map[section.id] = section.imageUrl;
      }
    });
    return map;
  }, [sections]);

  // Fetch last accessed lessons for the selected curriculum
  const { data: lessonsData } = useGetChildLastAccessedLessons(
    activeProfile?.id || "",
    selectedCurriculumId
  );

  // Get selected curriculum details
  const selectedCurriculum = useMemo(() => {
    return reversedCurriculaList.find(
      (curriculum: any) => curriculum.id === selectedCurriculumId
    ) as any;
  }, [reversedCurriculaList, selectedCurriculumId]);

  // Collect lessons from the selected curriculum
  const allLessons = useMemo(() => {
    const lessons: any[] = [];
    const rows = Array.isArray(lessonsData?.data) ? lessonsData.data : [];
    if (rows.length > 0 && selectedCurriculum) {
      rows.forEach((lesson: any) => {
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
            number_of_quizzes: section.progress?.totalLessons ?? 0,
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
      <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 items-start">
            <p className="font-medium text-lg text-textSubtitle ml-1">
              Welcome, <span className="text-textGray capitalize font-semibold">{activeProfile?.name}</span>
            </p>
          </div>
        </div>
      </div>
      {/* <Streak streakDays={12} /> */}
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
                  {reversedCurriculaList.length > 0 ? (
                    reversedCurriculaList.map((curriculum: any, index: number) => {
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
                Well done! You have completed every lesson!
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
              This shows your progress levels in each section
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
