"use client";

import React, { useState } from "react";
import { Calendar, BadgeCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditEntry {
  id: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  description: string;
  date: string;
}

export function AuditLog() {
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

  const auditEntries: AuditEntry[] = [
    {
      id: "1",
      timestamp: "11:40 AM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Pellentesque non nunc diam.",
      date: "December 29, 2024",
    },
    {
      id: "2",
      timestamp: "12:10 PM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      date: "December 29, 2024",
    },
    {
      id: "3",
      timestamp: "12:40 PM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      date: "December 29, 2024",
    },
    {
      id: "4",
      timestamp: "1:10 PM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      date: "December 29, 2024",
    },
    {
      id: "5",
      timestamp: "1:40 PM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      date: "December 29, 2024",
    },
    {
      id: "6",
      timestamp: "11:40 AM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      date: "December 30, 2024",
    },
    {
      id: "7",
      timestamp: "12:10 PM",
      status: "completed",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      date: "December 30, 2024",
    },
  ];

  // Group entries by date
  const groupedEntries = auditEntries.reduce((groups, entry) => {
    if (!groups[entry.date]) {
      groups[entry.date] = [];
    }
    groups[entry.date].push(entry);
    return groups;
  }, {} as Record<string, AuditEntry[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#E5F9EE] text-[#00C159] text-xs font-medium w-fit">
            <BadgeCheck className="w-3 h-3" />
            Completed
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium w-fit">
            Pending
          </div>
        );
      case "failed":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium w-fit">
            Failed
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center mb-8">
          <h2 className="text-sm md:text-base font-medium">AUDIT LOG</h2>

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

        {/* Timeline Content */}
        <div className="relative">
          {/* Main vertical timeline line */}
          <div className="hidden md:block absolute left-[42px] top-0 bottom-0 w-px bg-gray-200"></div>

          <div className="space-y-12">
            {Object.entries(groupedEntries).map(([date, entries], _) => (
              <div key={date} className="relative ">
                {/* Date label positioned on the left of the timeline */}
                <div className="hidden md:block absolute left-0 top-0 bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600 transform -translate-y-1/2">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Timeline entries */}
                <div className="md:ml-32 p-1 rounded-3xl bg-[#ECEFF3] w-full max-w-[650px]">
                  {/* Date header */}
                  <h2 className="text-xs pl-4 py-1">{date}</h2>
                  <div className="bg-white rounded-3xl border border-gray-200 px-6">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="relative border-b border-gray-200 last:border-b-0 py-6"
                      >
                        {/* Timeline dot */}
                        <div className="hidden md:block absolute -left-[120px] top-16 w-3 h-3 bg-white rounded-full border-2 border-white shadow-sm"></div>

                        {/* Content */}
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="text-xs text-[#7B7B7B]">
                              {entry.timestamp}
                            </div>
                            {getStatusBadge(entry.status)}
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-3">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
