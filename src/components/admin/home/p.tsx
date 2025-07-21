"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { dummyProfiles, dummyTutorProfiles } from "@/lib/utils";

function AdminDashboard() {
  // Dummy stats
  const stats = [
    { label: "No of Users", value: dummyTutorProfiles.length },
    { label: "No of Active User", value: dummyProfiles.length },
    { label: "No of Sessions", value: 72 },
    { label: "No of New Sign Ups", value: 72 },
  ];

  // Prepare right column activities from dummyProfiles
  const rightActivities = dummyProfiles.map((profile) => {
    let activity = "";
    if (profile.subscriptionName) {
      activity = `subscribed to ${profile.subscriptionName}`;
    } else {
      activity = `status changed to ${profile.status}`;
    }
    return {
      id: profile.id,
      name: profile.name,
      activity,
      time: "Today, 9:04PM",
    };
  });

  // Use all dummyTutorProfiles for left column
  const leftActivities = dummyTutorProfiles;

  return (
    <div>
      {/* Welcome */}
      <div className="my-8">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          WELCOME,
        </span>
        <h1 className="font-medium text-lg md:text-xl">ADMIN</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl px-6 pt-6 pb-3 flex flex-col border border-borderGray/50"
          >
            <span className="text-sm md:text-base font-medium text-textSubtitle">
              {stat.label}
            </span>
            <span className="text-xl md:text-2xl lg:text-4xl font-medium my-2.5">
              {stat.value}
            </span>
            <Button
              variant="ghost"
              className="flex items-center text-primaryBlue p-0 text-xs font-medium mt-auto w-fit"
            >
              View All
              <BackArrow flipped color="#286CFF" />
            </Button>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-medium">Activity</h2>
        <div className="flex gap-2 text-xs text-gray-400">
          <select className="bg-white rounded-md px-2 py-1 outline-none">
            <option>This Month</option>
          </select>
          <select className="bg-white rounded-md px-2 py-1 outline-none">
            <option>December 4 - January 4</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:max-h-[380px] overflow-y-auto scrollbar-hide">
          {[leftActivities, rightActivities].map((col, colIdx) => (
            <div key={colIdx} className="space-y-2">
              {col.map((activity, idx) => (
                <div
                  key={activity.id + idx}
                  className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primaryBlue border border-white ring-2 ring-borderGray flex-shrink-0" />
                    <div>
                      <div className="text-sm text-gray-900 font-medium">
                        {activity.name} {activity.activity}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                  <BackArrow flipped color="#286CFF" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
