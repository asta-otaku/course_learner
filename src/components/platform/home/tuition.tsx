"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import profileIcon from "@/assets/profileIcon.svg";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useRouter } from "next/navigation";
import { usePostCreateChat } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { TutorChangeRequestDialog } from "./tutor-change-request-dialog";
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
import LearningCard, { ProgressCard } from "./learningCard";

function TuitionHome() {
  const {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles,
    selectedCurriculumId: profileSelectedCurriculumId,
    setSelectedCurriculumId: setProfileSelectedCurriculumId,
  } = useSelectedProfile();
  const [showChangeRequestDialog, setShowChangeRequestDialog] = useState(false);
  const { push } = useRouter();
  const { mutateAsync: createChat } = usePostCreateChat();

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

  const handleMessage = async () => {
    if (
      !activeProfile?.tutorId ||
      !activeProfile?.id ||
      !activeProfile?.tutorFirstName ||
      !activeProfile?.tutorLastName ||
      !activeProfile?.name
    )
      return;
    const chat = await createChat({
      tutorId: activeProfile?.tutorId,
      childId: activeProfile?.id,
      tutorName:
        activeProfile?.tutorFirstName + " " + activeProfile?.tutorLastName,
      childName: activeProfile?.name,
    });
    if (chat.status === 201) {
      toast.success(chat.data.message);
      push(`/messages`);
    }
  };

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center">
        <div className="flex items-center gap-2">
          <Image
            src={activeProfile?.avatar || profileIcon}
            alt="Profile Icon"
            width={32}
            height={32}
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
                className="bg-transparent font-medium uppercase border-none focus:outline-none"
              >
                {profiles.map((profile, index) => (
                  <option key={index} value={profile.name}>
                    {profile.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="my-8 flex flex-col md:flex-row gap-3 w-full min-h-[40vh]">
        {/* Lessons Panel */}
        <div className="md:w-3/5 border border-[#00000033] rounded-3xl bg-white p-6 max-h-[80vh] overflow-auto scrollbar-hide">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="font-semibold text-base md:text-lg">Your Lessons</h2>
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
          <div className="space-y-3 mt-4">
            {allLessons.length > 0 ? (
              allLessons.map((lesson, idx) => (
                <LearningCard
                  key={lesson.id || idx}
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
              <p className="text-xs text-muted-foreground">
                No lessons available.
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="md:w-2/5 flex flex-col gap-2">
          {/* Tutor Info */}
          {activeProfile?.tutorId && (
            <div className="border border-[#00000033] rounded-2xl bg-white p-6 text-center">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-semibold">Tutor</h3>
                <Button
                  variant="link"
                  onClick={() => push("/settings/support")}
                  className="text-xs text-primaryBlue px-0"
                >
                  Provide Feedback <BackArrow color="#286CFF" flipped />
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 mb-3">
                  <Image
                    src={profileIcon}
                    alt="Profile Icon"
                    width={32}
                    height={32}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
                <p className="font-medium text-sm">
                  {activeProfile?.tutorFirstName} {activeProfile?.tutorLastName}
                </p>
                <p className="text-xs text-muted-foreground mb-8 font-medium">
                  Your Tutor
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    className="rounded-full text-xs px-4 bg-gradient-to-tr from-[#545454] to-black text-white hover:opacity-90"
                    onClick={() => setShowChangeRequestDialog(true)}
                  >
                    Request Change
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleMessage}
                    className="rounded-full text-xs px-9 bg-[#34C759] hover:bg-green-700"
                  >
                    Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="my-8">
        <div>
          <h2 className="text-textGray font-medium text-base md:text-lg mb-2">
            Your Progress
          </h2>
          <p className="text-xs text-textSubtitle">
            Track your progress across all curricula
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {curriculaAsCourses.length > 0 ? (
            curriculaAsCourses.map((course, index) => (
              <ProgressCard
                key={course.curriculumId || index}
                course={course}
              />
            ))
          ) : (
            <div className="text-center py-8 text-textSubtitle col-span-full">
              No progress data available
            </div>
          )}
        </div>
      </div>

      {/* Tutor Change Request Dialog */}
      {activeProfile?.tutorId && (
        <TutorChangeRequestDialog
          open={showChangeRequestDialog}
          onOpenChange={setShowChangeRequestDialog}
          childProfileId={activeProfile.id}
          childName={activeProfile.name}
          currentTutorId={activeProfile.tutorId}
          currentTutorName={`${activeProfile.tutorFirstName} ${activeProfile.tutorLastName}`}
        />
      )}
    </div>
  );
}

export default TuitionHome;
