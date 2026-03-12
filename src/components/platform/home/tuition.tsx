"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
  useGetChildLastAccessedLessons,
  useGetCurricula,
  useGetChildBaselineTest,
  useGetChildBaselineTestEntries,
} from "@/lib/api/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressCard } from "./learningCard";
import DoubleQuote from "@/assets/svgs/doubleQuote";
import { AlertTriangle } from "lucide-react";

function TuitionHome() {
  const {
    activeProfile,
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

  // Fetch last accessed lessons for the selected curriculum
  const { data: lessonsData } = useGetChildLastAccessedLessons(
    activeProfile?.id || "",
    selectedCurriculumId
  );

  // Fetch baseline test for this child (API returns a single object)
  const { data: baselineTestResponse } = useGetChildBaselineTest(
    activeProfile?.id || ""
  );
  const childBaselineTest = baselineTestResponse?.data ?? null;

  // Baseline attempts: if any attempt has submittedAt, baseline is "complete" → hide the block
  const { data: baselineAttemptsResponse } = useGetChildBaselineTestEntries(
    activeProfile?.id || ""
  );
  const hasCompletedBaseline = useMemo(() => {
    const attempts = baselineAttemptsResponse?.data || [];
    return attempts.some((a: { submittedAt?: string | null }) => a.submittedAt != null);
  }, [baselineAttemptsResponse?.data]);

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
          <div className="flex flex-col gap-1 items-start">
            <p className="font-medium text-sm text-textSubtitle ml-1">
              Welcome, <span className="text-textGray text-sm capitalize font-semibold">{activeProfile?.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="my-8 flex flex-col md:flex-row gap-3 w-full min-h-[40vh]">
        {/* Your Assignments – modern table */}
        <div className="md:w-3/5 rounded-2xl bg-white p-6 max-h-[80vh] overflow-auto scrollbar-hide shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              Your Assignments
            </h2>
            <div className="w-full md:w-auto min-w-[200px]">
              <Select
                value={selectedCurriculumId}
                onValueChange={(value) => {
                  setProfileSelectedCurriculumId(value);
                }}
              >
                <SelectTrigger className="h-9 rounded-lg border-gray-200 bg-gray-50/80 text-gray-700 font-normal">
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

          {allLessons.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider w-[56px]"> </th>
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Lesson</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Quiz</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Deadline</th>
                  <th className="pb-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {allLessons.map((lesson: any, idx: number) => {
                  const sectionImageUrl = lesson.sectionId
                    ? sectionImageMap[lesson.sectionId]
                    : null;
                  const imageUrl =
                    sectionImageUrl || lesson.curriculumImageUrl || "";
                  const lessonHref = lesson.id
                    ? `/library/${lesson.sectionId || lesson.curriculumId}/${lesson.id}`
                    : `/library/${lesson.curriculumId}`;
                  const quizLabel =
                    lesson.totalQuizzes != null && lesson.totalQuizzes > 0
                      ? `Quiz 1 – ${lesson.title}`
                      : "Lesson content";
                  const hasDeadline = false;
                  const deadlineMissed = false;
                  const deadlineDate = "";

                  return (
                    <tr
                      key={lesson.id || idx}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-4 pr-4 align-middle">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm ring-1 ring-gray-100">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt=""
                              width={44}
                              height={44}
                              className="w-11 h-11 object-cover"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-gray-200" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 align-middle">
                        <span className="text-gray-800 font-normal">
                          {lesson.title}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-gray-600 font-normal text-sm">
                        {quizLabel}
                      </td>
                      <td className="py-4 pr-4">
                        {hasDeadline ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-800 font-medium text-sm">{deadlineDate}</span>
                              {deadlineMissed && (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 fill-amber-100 stroke-amber-500" />
                              )}
                            </div>
                            {deadlineMissed && (
                              <span className="text-xs text-gray-500">
                                Deadline previously missed
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={lessonHref}
                          className="inline-flex items-center text-sm font-medium text-primaryBlue hover:text-blue-600 transition-colors"
                        >
                          Start
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 py-8">
              No assignments available.
            </p>
          )}
        </div>

        {/* Right Column */}
        <div className="md:w-2/5 flex flex-col gap-2">
          {/* Baseline Test - only show when not yet completed (not started or in progress) */}
          {!hasCompletedBaseline && (
            <div className="border border-[#00000033] rounded-2xl bg-white px-6 pt-4 pb-2">
              <p className="text-base font-semibold flex items-center gap-3">
                <DoubleQuote /> Baseline Test
              </p>
              {childBaselineTest ? (
                <>
                  <p className="text-sm font-medium mt-6 mb-3">QUIZ</p>
                  <p className="text-xs text-textSubtitle mb-2">
                    {childBaselineTest.title}
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    {childBaselineTest.yearGroup}
                  </p>
                  <div className="flex items-center gap-4 pb-2">
                    <Button
                      variant="link"
                      className="text-xs text-primaryBlue px-0"
                      asChild
                    >
                      <Link href={`/take-quiz/${childBaselineTest.quizId}?isBaselineTest=true&baselineTestId=${childBaselineTest.id}`}>
                        Start <BackArrow color="#286CFF" flipped />
                      </Link>
                    </Button>
                    <Button
                      variant="link"
                      className="text-xs text-primaryBlue px-0"
                      asChild
                    >
                      <Link href="/baseline-results">
                        View Results <BackArrow color="#286CFF" flipped />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mt-6 mb-3">QUIZ</p>
                  <p className="text-xs text-textSubtitle mb-4">
                    No baseline test assigned yet. Your tutor can assign one for
                    your year group.
                  </p>
                  <Button
                    variant="link"
                    className="text-xs text-primaryBlue px-0 mb-2"
                    asChild
                  >
                    <Link href="/baseline-results">
                      View Results <BackArrow color="#286CFF" flipped />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
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
      {/* <div className="my-8">
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
      </div> */}

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
