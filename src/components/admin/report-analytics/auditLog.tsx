"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Calendar, BadgeCheck, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetActivityLog } from "@/lib/api/queries";
import { format } from "date-fns";
import { useActivitySocket } from "@/context/ActivitySocketContext";

interface AuditEntry {
  id: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  description: string;
  date: string;
}

export function AuditLog() {
  const [timePeriod, setTimePeriod] = useState("this-month");

  // Activity log state
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: activityLogResponse, isLoading: isLoadingActivities } =
    useGetActivityLog(cursor, 10);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get activity socket
  const { isConnected, lastActivity } = useActivitySocket();

  // Update activities when new data arrives
  useEffect(() => {
    if (activityLogResponse?.data) {
      const newActivities = activityLogResponse.data;

      if (cursor === undefined) {
        // Initial load - replace all activities
        setAllActivities(newActivities);
      } else {
        // Loading more - append to existing activities
        setAllActivities((prev) => [...prev, ...newActivities]);
        setIsLoadingMore(false);
      }

      // Update pagination state
      setHasMore(activityLogResponse.pagination?.hasMore || false);
    }
  }, [activityLogResponse, cursor]);

  // Listen for new activities via WebSocket
  useEffect(() => {
    if (lastActivity) {
      // Prepend new activity to the list
      setAllActivities((prev) => {
        // Check if activity already exists to avoid duplicates
        const exists = prev.some(
          (activity) => activity.timeStamp === lastActivity.timeStamp
        );
        if (exists) return prev;
        return [lastActivity, ...prev];
      });
    }
  }, [lastActivity]);

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore || isLoadingActivities) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Trigger when scrolled to 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      const nextCursor = activityLogResponse?.pagination?.nextCursor;
      if (nextCursor) {
        setIsLoadingMore(true);
        setCursor(nextCursor);
      }
    }
  }, [hasMore, isLoadingMore, isLoadingActivities, activityLogResponse]);

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

  // Convert activity log data to audit entries format
  const auditEntries: AuditEntry[] = allActivities.map((activity) => {
    const activityDate = new Date(activity.timeStamp);
    return {
      id: activity.timeStamp,
      timestamp: format(activityDate, "h:mm a"),
      status: "completed" as const,
      description: activity.message,
      date: format(activityDate, "MMMM d, yyyy"),
    };
  });

  // Group entries by date
  const groupedEntries = auditEntries.reduce(
    (groups, entry) => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
      return groups;
    },
    {} as Record<string, AuditEntry[]>
  );

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
    <div className="w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 w-full">
          <div className="flex items-center gap-3">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              AUDIT LOG
            </h2>
            {isLoadingActivities && !isLoadingMore && (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200 text-textSubtitle text-sm">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="last-two-months">Last Two Months</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-textSubtitle flex-shrink-0" />
              <span className="text-textSubtitle text-sm truncate">
                {getDateRangeText(timePeriod)}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative max-h-[800px] lg:max-h-[900px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-4"
        >
          {allActivities.length === 0 && !isLoadingActivities ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No activities yet</p>
            </div>
          ) : (
            <div className="relative min-h-full">
              {/* Main vertical timeline line - extends through all content */}
              <div
                className="hidden md:block absolute left-[50px] top-0 w-px bg-gray-200"
                style={{ height: "100%", minHeight: "100%" }}
              ></div>

              <div className="space-y-12">
                {Object.entries(groupedEntries).map(([date, entries], _) => (
                  <div key={date} className="relative">
                    {/* Date label positioned on the left of the timeline */}
                    <div className="hidden md:block absolute left-0 top-0 bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600 transform -translate-y-1/2 z-10">
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>

                    {/* Timeline entries */}
                    <div className="md:pl-32 w-full">
                      <div className="p-1 rounded-3xl bg-[#ECEFF3] w-full">
                        {/* Date header - visible on mobile */}
                        <h2 className="text-xs pl-4 py-1 md:hidden font-medium text-gray-700">
                          {date}
                        </h2>
                        <div className="bg-white rounded-3xl border border-gray-200 px-6 md:px-8">
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="relative border-b border-gray-200 last:border-b-0 py-6"
                            >
                              {/* Timeline dot */}
                              <div className="hidden md:block absolute -left-[120px] top-6 w-3 h-3 bg-white rounded-full border-2 border-primaryBlue shadow-sm"></div>

                              {/* Content */}
                              <div className="w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                                  <div className="text-xs text-[#7B7B7B] font-medium">
                                    {entry.timestamp}
                                  </div>
                                  {getStatusBadge(entry.status)}
                                </div>
                                <p className="text-sm leading-relaxed w-full break-words text-gray-800">
                                  {entry.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading more activities...
                  </span>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && allActivities.length > 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  No more activities to load
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
