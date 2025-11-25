"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dummyTutorProfiles } from "@/lib/utils";
import { useGetAnalytics } from "@/lib/api/queries";
import { Loader2 } from "lucide-react";

export function SessionStatistics() {
  const [selectedTutor, setSelectedTutor] = useState("everyone");
  const [timePeriod, setTimePeriod] = useState("this-month");

  // Fetch analytics data
  const { data: analyticsResponse, isLoading, error } = useGetAnalytics();
  const analytics = analyticsResponse?.data;

  // Map analytics data to metrics
  const metrics = analytics
    ? [
        {
          title: "TOTAL SESSION",
          value: (
            analytics.completedSessions +
            analytics.confirmedSessions +
            analytics.cancelledSessions
          ).toString(),
        },
        {
          title: "CANCELLED SESSION",
          value: analytics.cancelledSessions.toString(),
        },
      ]
    : [
        {
          title: "TOTAL SESSION",
          value: "0",
        },
        {
          title: "CANCELLED SESSION",
          value: "0",
        },
      ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading session statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Failed to load session statistics</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center mb-8">
        <h2 className="text-sm md:text-base font-medium">SESSION ENGAGEMENT</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={selectedTutor} onValueChange={setSelectedTutor}>
            <SelectTrigger className="w-40 bg-white border-gray-200 text-textSubtitle text-sm">
              <SelectValue placeholder="Select tutor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              {dummyTutorProfiles.map((tutor) => (
                <SelectItem key={tutor.id} value={tutor.id}>
                  {tutor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40 bg-white border-gray-200 text-textSubtitle text-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="last-two-months">Last Two Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:w-[650px]">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-8 shadow-sm border border-[#00000033] hover:shadow-md transition-shadow"
          >
            <h3 className="text-xs md:text-sm font-medium">{metric.title}</h3>
            <h1 className="font-medium text-3xl md:text-7xl mt-10 md:mt-20">
              {metric.value}
            </h1>
          </div>
        ))}
      </div>
    </div>
  );
}
