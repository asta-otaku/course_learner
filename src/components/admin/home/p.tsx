"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useGetActivityLog, useGetAnalytics } from "@/lib/api/queries";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useActivitySocket } from "@/context/ActivitySocketContext";

function AdminDashboard() {
  const router = useRouter();

  // Fetch analytics data
  const { data: analyticsResponse, isLoading, error } = useGetAnalytics();
  const analytics = analyticsResponse?.data;

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

  // Format timestamp to relative time
  const formatActivityTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  // Handle activity click
  const handleActivityClick = () => {
    router.push("/admin/report-analysis?audit-log=true");
  };

  const stats = analytics
    ? [
        {
          label: "Total Children",
          value: analytics.totalChildren,
          route: "/admin/user-management",
        },
        {
          label: "Total Tutors",
          value: analytics.totalTutors,
          route: "/admin/user-management",
        },
        {
          label: "Completed Sessions",
          value: analytics.completedSessions,
          route: "/admin/session-management",
        },
        {
          label: "New Sign Ups",
          value: analytics.newSignups,
          route: "/admin/user-management",
        },
      ]
    : [
        {
          label: "Total Children",
          value: 0,
          route: "/admin/user-management",
        },
        {
          label: "Total Tutors",
          value: 0,
          route: "/admin/user-management",
        },
        {
          label: "Completed Sessions",
          value: 0,
          route: "/admin/session-management",
        },
        {
          label: "New Sign Ups",
          value: 0,
          route: "/admin/user-management",
        },
      ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load analytics</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

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
            <Link href={stat.route}>
              <Button
                variant="ghost"
                className="flex items-center text-primaryBlue p-0 text-xs font-medium mt-auto w-fit"
              >
                View All
                <BackArrow flipped color="#286CFF" />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-medium">Activity Log</h2>
        <div className="flex gap-2 items-center">
          {isLoadingActivities && !isLoadingMore && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          <span className="text-xs text-gray-500">
            {allActivities.length}{" "}
            {allActivities.length === 1 ? "activity" : "activities"}
          </span>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 md:p-8">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {allActivities.length === 0 && !isLoadingActivities ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No activities yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allActivities.map((activity, idx) => (
                <div
                  key={activity.timeStamp + idx}
                  onClick={handleActivityClick}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-primaryBlue border border-white ring-2 ring-borderGray flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium">
                        {activity.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatActivityTime(activity.timeStamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <BackArrow flipped color="#286CFF" />
                  </div>
                </div>
              ))}

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primaryBlue" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading more...
                  </span>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && allActivities.length > 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
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

export default AdminDashboard;
