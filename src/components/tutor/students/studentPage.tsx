"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useGetChildProfileById,
  useGetCurrentUser,
  useGetLibrary,
} from "@/lib/api/queries";
import { Badge } from "@/components/ui/badge";
import BackArrow from "@/assets/svgs/arrowback";
import MailIcon from "@/assets/svgs/mail";
import { ProgressCard } from "@/components/platform/home/learningCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Homework from "./homeworkTab";
// import WorkSchedule from "./homeworkScheduleTab";
import { usePostCreateChat } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import algebra from "@/assets/algebra.png";
import measurement from "@/assets/measurement.png";
import ratio from "@/assets/ratio.png";

const availableImages = [algebra, measurement, ratio];

export default function StudentPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: profileData, isLoading, error } = useGetChildProfileById(id);
  const profile = profileData?.data;

  // Get tutor information
  const { data: tutorProfileResponse } = useGetCurrentUser();
  const tutorProfile = tutorProfileResponse?.data;
  //@ts-ignore
  const tutorId = tutorProfile?.tutorProfile?.id || "";
  //@ts-ignore
  const tutorFirstName = tutorProfile?.firstName || "";
  //@ts-ignore
  const tutorLastName = tutorProfile?.lastName || "";

  const { mutateAsync: createChat } = usePostCreateChat();

  // Fetch library data for the student
  const { data: library } = useGetLibrary(id);

  // Get curricula from library data
  const curricula = useMemo(() => {
    return library?.data || [];
  }, [library?.data]);

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

  const handleMessage = async () => {
    if (
      !tutorId ||
      !id ||
      !tutorFirstName ||
      !tutorLastName ||
      !profile?.name
    ) {
      toast.error("Unable to create chat. Missing information.");
      return;
    }

    try {
      const chat = await createChat({
        tutorId: tutorId,
        childId: id,
        tutorName: `${tutorFirstName} ${tutorLastName}`,
        childName: profile.name,
      });

      if (chat.status === 201) {
        toast.success(chat.data.message);
        router.push(`/tutor/messages`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading student details...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <div className="p-8">Student not found.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[90vh]">
      {/* Left: Student Details */}
      <div className="w-full md:w-2/5 p-6 m-4 flex flex-col gap-6">
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-black"
          onClick={() => router.back()}
        >
          <BackArrow color="#808080" />
        </button>
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar || ""}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/80x80?text=Avatar";
                  }}
                />
              </div>
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  {profile.name}
                </div>
              </div>
            </div>
            <span className="cursor-pointer" onClick={handleMessage}>
              <MailIcon />
            </span>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="font-medium border px-4 py-2.5 rounded-xl bg-white">
              DETAILS
            </div>
            <div className="flex gap-1 w-full justify-between text-sm">
              <div className="flex flex-col gap-3">
                <span className="text-textSubtitle font-medium text-xs">
                  Year
                </span>
                <span className="font-medium">{profile.year}</span>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-textSubtitle font-medium text-xs">
                  Subscription Type
                </span>
                <div className="flex gap-2">
                  <span className="font-medium text-sm">
                    {profile.offerType === "Offer One"
                      ? "The Platform"
                      : "Tuition"}
                  </span>
                  <Badge
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      profile.isActive
                        ? "bg-[#34C759] text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {profile.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-textSubtitle font-medium text-xs">
                  Joined
                </span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Tabbed Content */}
      <div className="w-full md:w-3/5 flex flex-col p-4 gap-4 md:border-l border-gray-200">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="homework">Home-Work</TabsTrigger>
            {/* <TabsTrigger value="schedule">Home-Work Schedule</TabsTrigger> */}
          </TabsList>
          <TabsContent value="progress">
            {curriculaAsCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {curriculaAsCourses.map((course, index) => (
                  <ProgressCard
                    key={course.curriculumId || index}
                    course={course}
                    isTutor={true}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-medium mb-1">
                      No progress data
                    </p>
                    <p className="text-gray-500 text-sm">
                      This student hasn&apos;t started any courses yet
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="homework">
            <Homework studentId={id} />
          </TabsContent>
          {/* <TabsContent value="schedule">
            <WorkSchedule />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}
