"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useProfile } from "@/context/profileContext";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import BackArrow from "@/assets/svgs/arrowback";
import {
  useGetLibrary,
  useGetChildLessons,
  useGetLessonById,
  useGetQuizzesForLesson,
  useGetCurricula,
} from "@/lib/api/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatchVideoLessonProgress } from "@/lib/api/mutations";
import LessonList from "./lessonList";
import LessonContent from "./lessonContent";

interface LibraryProps {
  curriculumId?: string;
  lessonId?: string;
}

function Library({ curriculumId, lessonId }: LibraryProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { activeProfile, isLoaded } = useProfile();
  const {
    selectedCurriculumId: profileSelectedCurriculumId,
    setSelectedCurriculumId: setProfileSelectedCurriculumId,
  } = useSelectedProfile();
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [user, setUser] = React.useState<any>({});

  // Get curriculumId (which is actually sectionId) and lessonId from params or props
  const urlSectionId = (params?.curriculumId as string) || curriculumId;
  const urlLessonId = (params?.lessonId as string) || lessonId;

  // Read tag from URL query parameter
  const tag = searchParams.get("tag");

  // Fetch curricula by offerType (wait for user data to be loaded)
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
  // Use profile's selectedCurriculumId, or default to first curriculum
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

  // Fetch lessons with curriculumId (from dropdown) and sectionId (from pathname)
  // Only fetch if tag doesn't exist (normal mode)
  const { data: lessons } = useGetChildLessons(
    activeProfile?.id || "",
    selectedCurriculum || "",
    tag ? undefined : urlSectionId
  );

  // When tag exists, use urlSectionId (curriculumId) as the lesson ID
  // Otherwise, use selectedLesson
  const lessonIdForFetch = tag ? urlSectionId : selectedLesson || "";
  const { data: lessonDetail, isLoading: lessonLoading } = useGetLessonById(
    lessonIdForFetch || ""
  );
  const { data: lessonQuizzes } = useGetQuizzesForLesson(
    lessonIdForFetch || ""
  );

  // Progress patch mutation (child video progress)
  // When tag exists, use urlSectionId as lesson ID
  const progressLessonId = tag ? urlSectionId : selectedLesson || "";
  const { mutate: patchProgress } = usePatchVideoLessonProgress(
    progressLessonId || "",
    activeProfile?.id || ""
  );

  // Track last sent progress for throttling
  const lastSentRef = useRef<number>(0);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  // Get sections from library data (these are sections, not curricula)
  const sections = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

  // Get lesson data from useGetLessonById
  const lessonData = lessonDetail?.data;
  const quizzes = lessonQuizzes?.data || [];

  // Get section progress (using sectionId from pathname)
  const sectionProgress = useMemo(() => {
    const sectionId = selectedSection || urlSectionId;
    return (library?.data || []).find((c: any) => c.id === sectionId)
      ?.progress as
      | { watchedVideoDuration?: number; isCompleted?: boolean }
      | undefined;
  }, [library?.data, selectedSection, urlSectionId]);

  const isCompleted = Boolean(sectionProgress?.isCompleted);
  const resumePositionSec = Math.max(
    0,
    Math.floor((sectionProgress?.watchedVideoDuration as number) || 0)
  );

  // Get lessons for selected curriculum
  const selectedCurriculumLessons = useMemo(() => {
    return lessons?.data || [];
  }, [lessons?.data]);

  // Get current lesson details
  // When tag exists, create a minimal lesson object from lessonData
  const currentLesson = useMemo(() => {
    if (tag) {
      // When tag exists, create lesson object from lessonData
      if (!lessonData) return null;
      return {
        id: urlSectionId || "",
        title: lessonData.title || "",
        completionPercentage: 0,
        videoCompleted: false,
        quizzesPassed: 0,
        totalQuizzes: quizzes.length,
        watchedPosition: resumePositionSec,
        lessonCompleted: isCompleted,
      };
    }
    if (!selectedLesson) return null;
    return selectedCurriculumLessons.find(
      (lesson) => lesson.id === selectedLesson
    );
  }, [
    tag,
    selectedLesson,
    selectedCurriculumLessons,
    lessonData,
    urlSectionId,
    quizzes.length,
    resumePositionSec,
    isCompleted,
  ]);

  // Extract videos from lesson data
  const videos = useMemo(() => {
    return ((lessonData as any)?.videos || []) as Array<{
      playbackUrl?: string;
      title?: string;
      fileName?: string;
    }>;
  }, [lessonData]);

  const maybeSendProgress = (
    video: HTMLVideoElement | null,
    force?: boolean
  ) => {
    if (!video || !activeProfile?.id || !progressLessonId) return;
    if (isCompleted) return;
    const now = Date.now();
    if (!force && now - lastSentRef.current < 2000) return; // throttle ~2s
    const watchedPosition = Math.max(0, Math.floor(video.currentTime || 0));
    lastSentRef.current = now;
    patchProgress({ childId: activeProfile.id, watchedPosition });
  };

  const handleVideoEnd = (watchedPosition: number) => {
    if (!activeProfile?.id || isCompleted) return;
    patchProgress({ childId: activeProfile.id, watchedPosition });
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLesson(lessonId);
  };

  const handleBackToLessons = () => {
    setSelectedLesson("");
    const sectionId = selectedSection || urlSectionId;
    if (sectionId) {
      router.push(`/library/${sectionId}`);
    }
  };

  // Handle URL parameters and initialize selections
  useEffect(() => {
    // Set sectionId from URL (what we previously called curriculumId)
    if (urlSectionId) {
      setSelectedSection(urlSectionId);
    }

    // Set lessonId from URL
    if (urlLessonId) {
      setSelectedLesson(urlLessonId);
    } else if (urlSectionId) {
      // If we have sectionId but no lessonId, clear lesson selection
      setSelectedLesson("");
    }
  }, [urlSectionId, urlLessonId]);

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

  // When tag exists, skip curriculum loading check
  if (!tag && (!selectedCurriculum || curriculaList.length === 0)) {
    return <div className="p-8 text-center">Loading curricula...</div>;
  }

  // Handle back to tag navigation
  const handleBackToTag = () => {
    if (tag) {
      router.push(`/glossary?tag=${tag}`);
    }
  };

  // When tag exists, show only lesson content centered
  if (tag) {
    return (
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 min-h-screen">
        {/* Back Button - Top Right */}
        <div className="flex justify-start mb-6">
          <button
            onClick={handleBackToTag}
            className="text-sm font-medium flex items-center gap-2 text-primaryBlue capitalize"
          >
            <BackArrow color="#286cff" /> Back to {tag}
          </button>
        </div>

        {/* Centered Lesson Content */}
        <div className="flex justify-center">
          <div className="space-y-6 max-w-2xl w-full">
            <LessonContent
              selectedLesson={urlSectionId || ""}
              selectedCurriculum={urlSectionId || ""}
              lessonLoading={lessonLoading}
              lessonData={lessonData || null}
              currentLesson={currentLesson || null}
              videos={videos}
              quizzes={quizzes as any}
              resumePositionSec={resumePositionSec}
              isCompleted={isCompleted}
              activeProfileId={activeProfile?.id}
              onProgress={maybeSendProgress}
              onVideoEnd={handleVideoEnd}
              onBack={handleBackToTag}
            />
          </div>
        </div>
      </div>
    );
  }

  // Normal mode (no tag) - show everything as before
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

      {/* Curriculum and Section Selectors */}
      <div className="mb-6 mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Curriculum Selector Dropdown - Disabled (uses profile's selectedCurriculumId) */}
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

        {/* Section Selector Dropdown (opposite side) */}
        <div className="w-full md:w-auto min-w-[200px] md:ml-auto">
          <select
            value={selectedSection || urlSectionId || ""}
            onChange={(e) => {
              const newSectionId = e.target.value;
              setSelectedSection(newSectionId);
              setSelectedLesson(""); // Reset lesson when section changes
              router.push(`/library/${newSectionId}`);
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
        <LessonList
          lessons={selectedCurriculumLessons}
          selectedLesson={selectedLesson}
          selectedCurriculum={selectedSection || urlSectionId || ""}
          onSelectLesson={handleSelectLesson}
        />

        {/* Second Column - Lesson Content */}
        <div
          className={`w-full flex justify-center ${
            selectedLesson ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="space-y-6 max-w-2xl w-full">
            <LessonContent
              selectedLesson={selectedLesson}
              selectedCurriculum={selectedSection || urlSectionId || ""}
              lessonLoading={lessonLoading}
              lessonData={lessonData || null}
              currentLesson={currentLesson || null}
              videos={videos}
              quizzes={quizzes as any}
              resumePositionSec={resumePositionSec}
              isCompleted={isCompleted}
              activeProfileId={activeProfile?.id}
              onProgress={maybeSendProgress}
              onVideoEnd={handleVideoEnd}
              onBack={handleBackToLessons}
              showTitleAndDescription={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Library;
