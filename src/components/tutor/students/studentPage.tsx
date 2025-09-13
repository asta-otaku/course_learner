"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetChildProfileById } from "@/lib/api/queries";
import { Badge } from "@/components/ui/badge";
import BackArrow from "@/assets/svgs/arrowback";
import MailIcon from "@/assets/svgs/mail";
import { ProgressCard } from "@/components/platform/home/learningCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Homework from "./homeworkTab";
import WorkSchedule from "./homeworkScheduleTab";
import { courses } from "@/lib/utils";

export default function StudentPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: profileData, isLoading, error } = useGetChildProfileById(id);
  const profile = profileData?.data;

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
            <MailIcon />
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
            <TabsTrigger value="schedule">Home-Work Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="progress">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.slice(0, 3).map((course, index) => (
                <ProgressCard key={index} course={course} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="homework">
            <Homework />
          </TabsContent>
          <TabsContent value="schedule">
            <WorkSchedule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
