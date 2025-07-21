"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { dummyProfiles } from "@/lib/utils";
import BackArrow from "@/assets/svgs/arrowback";
import { useRouter } from "next/navigation";

function TutorDashboard() {
  // Calculate statistics from dummy data
  const totalStudents = dummyProfiles.length;
  const upcomingSessions = dummyProfiles.filter(
    (p) => p.status === "active"
  ).length;
  const submittedHomework = Math.floor(dummyProfiles.length / 3); // Mock data
  const averageResponseTime = "7 Hours";

  // Generate recent activities
  const generateActivities = () => {
    const activities: {
      id: string;
      name: string;
      action: string;
      time: string;
    }[] = [];
    const activityTypes = [
      "submitted his homework",
      "requested a change in session time",
    ];

    dummyProfiles.forEach((profile, index) => {
      const activityType =
        index % 2 === 0 ? activityTypes[0] : activityTypes[1];
      activities.push({
        id: profile.id,
        name: profile.name,
        action: activityType,
        time: "Today, 9:04PM",
      });
    });

    return activities;
  };

  const recentActivities = generateActivities();

  const { push } = useRouter();

  return (
    <div>
      {/* Welcome Section */}
      <div className="my-8">
        <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">
          WELCOME,
        </span>
        <h1 className="font-medium text-lg md:text-xl">DOKU</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Left Side - Statistics Cards */}
        <div className="lg:col-span-1 space-y-3">
          {/* Students Card */}
          <div className="bg-white rounded-2xl px-6 pt-6 pb-3">
            <div className="text-xl md:text-2xl lg:text-4xl font-medium mb-2">
              {totalStudents}
            </div>
            <p className="text-sm md:text-base font-medium text-textSubtitle mb-4">
              No of Students
            </p>
            <Button
              variant="ghost"
              className="flex items-center text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
              onClick={() => push("/tutor/students")}
            >
              View All
              <BackArrow flipped color="#286CFF" />
            </Button>
          </div>

          {/* Upcoming Sessions Card */}
          <div className="bg-white rounded-2xl px-6 pt-6 pb-3">
            <div className="text-xl md:text-2xl lg:text-4xl font-medium mb-2">
              {upcomingSessions}
            </div>
            <p className="text-sm md:text-base font-medium text-textSubtitle mb-4">
              Upcoming Session
            </p>
            <Button
              variant="ghost"
              onClick={() => push("/tutor/sessions")}
              className="flex items-center text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
            >
              View All
              <BackArrow flipped color="#286CFF" />
            </Button>
          </div>

          {/* Submitted Homework Card */}
          <div className="bg-white rounded-2xl px-6 pt-6 pb-3">
            <div className="text-xl md:text-2xl lg:text-4xl font-medium mb-2">
              {submittedHomework}
            </div>
            <p className="text-sm md:text-base font-medium text-textSubtitle mb-4">
              Submitted Homework
            </p>
            <Button
              variant="ghost"
              className="flex items-center text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
              onClick={() => push("/tutor/homework")}
            >
              View All
              <BackArrow flipped color="#286CFF" />
            </Button>
          </div>
        </div>

        {/* Right Side - Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl">
          <div className="py-6 px-8">
            <h2 className="text-lg md:text-xl font-medium mb-4">
              Recent Activity
            </h2>
            <div className="max-h-[400px] h-full overflow-auto hide-scrollbar">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id + index}
                  onClick={() => push(`/tutor/students/${activity.id}`)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 border ring-borderGray ring-2 bg-primaryBlue border-white"></div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium text-sm">
                        {activity.name} {activity.action}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                  <BackArrow flipped color="#286CFF" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Average Response Time Card */}
      <div className="bg-white rounded-2xl p-6 flex justify-between items-center">
        <p className="text-sm md:text-base font-medium text-textSubtitle mb-6">
          Average <br />
          Response Time
        </p>
        <h2 className="text-2xl md:text-4xl font-medium">
          {averageResponseTime}
        </h2>
      </div>
    </div>
  );
}

export default TutorDashboard;
