"use client";

import React, { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAnalytics } from "@/lib/api/queries";

export function UserEngagement() {
  const [timePeriod, setTimePeriod] = useState("this-month");

  // Fetch analytics data
  const { data: analyticsResponse, isLoading, error } = useGetAnalytics();
  const analytics = analyticsResponse?.data;

  // Helper function to get date range display text
  const getDateRangeText = (range: string) => {
    const today = new Date();
    const oneMonthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 2,
      today.getDate()
    );

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    switch (range) {
      case "this-month":
        return `${formatDate(oneMonthAgo)} - ${formatDate(today)}`;
      case "this-week":
        return `${formatDate(oneWeekAgo)} - ${formatDate(today)}`;
      case "last-two-months":
        return `${formatDate(twoMonthsAgo)} - ${formatDate(today)}`;
      default:
        return `${formatDate(oneMonthAgo)} - ${formatDate(today)}`;
    }
  };

  const metrics = analytics
    ? [
        {
          title: "DAILY ACTIVE USERS",
          value: analytics.totalChildren.toString(),
        },
        {
          title: "USER THAT CONFIRMED THEIR SESSIONS",
          value: analytics.confirmedSessions.toString(),
        },
        {
          title: "USER THAT MISSED THEIR SESSIONS",
          value: analytics.cancelledSessions.toString(),
        },
        {
          title: "NEW SIGN UPS",
          value: analytics.newSignups.toString(),
        },
      ]
    : [
        {
          title: "DAILY ACTIVE USERS",
          value: "0",
        },
        {
          title: "USER THAT CONFIRMED THEIR SESSIONS",
          value: "0",
        },
        {
          title: "USER THAT MISSED THEIR SESSIONS",
          value: "0",
        },
        {
          title: "NEW SIGN UPS",
          value: "0",
        },
      ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading user engagement data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Failed to load user engagement data</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center mb-8">
        <h2 className="text-sm md:text-base font-medium">USER ENGAGEMENT</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
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

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <Calendar className="w-4 h-4 text-textSubtitle" />
            <span className="text-textSubtitle text-sm">
              {getDateRangeText(timePeriod)}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
