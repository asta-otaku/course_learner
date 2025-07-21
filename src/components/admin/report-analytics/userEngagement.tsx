"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackArrow from "@/assets/svgs/arrowback";

export function UserEngagement() {
  const [timePeriod, setTimePeriod] = useState("this-month");

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

  const metrics = [
    {
      title: "DAILY ACTIVE USERS",
      value: "50",
      change: "+20%",
      changeText: "increase in daily user",
      isPositive: true,
    },
    {
      title: "USER THAT JOINED THEIR SESSIONS",
      value: "20",
      change: "-20%",
      changeText: "decrease in daily user",
      isPositive: false,
    },
    {
      title: "USER THAT MISSED THEIR SESSIONS",
      value: "50",
      change: "+20%",
      changeText: "increase in daily user",
      isPositive: true,
    },
    {
      title: "NEW SIGN UPS",
      value: "20",
      change: "-20%",
      changeText: "decrease in daily user",
      isPositive: false,
    },
  ];

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
            <h1 className="font-medium text-3xl md:text-7xl mt-10 md:mt-20 mb-4">
              {metric.value}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {metric.isPositive ? (
                <div className="rotate-90 p-2 bg-[#E0FFE8] rounded-full w-8 h-8 flex items-center justify-center">
                  <BackArrow color="#34C759" />
                </div>
              ) : (
                <div className="-rotate-90 p-2 bg-[#FFE8E8] rounded-full w-8 h-8 flex items-center justify-center">
                  <BackArrow color="#FF0000" />
                </div>
              )}
              <span
                className={`text-xs md:text-sm  ${
                  metric.isPositive ? "text-[#34C759]" : "text-[#FF0000]"
                }`}
              >
                {metric.change.slice(1)} {metric.changeText}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
