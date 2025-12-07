"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useRouter } from "next/navigation";
import {
  useGetTutorAnalytics,
  useGetActivityLog,
  useGetCurrentUser,
} from "@/lib/api/queries";
import { getTutorUser } from "@/lib/services/axiosInstance";
import { useActivitySocket } from "@/context/ActivitySocketContext";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function TutorDashboard() {
  const router = useRouter();
  const { push } = router;

  // Get tutor name from localStorage immediately
  const [tutorName, setTutorName] = useState<string>("TUTOR");

  // Get tutor profile to fetch the ID
  const { data: tutorProfileResponse, isLoading: isLoadingProfile } =
    useGetCurrentUser();
  const tutorProfile = tutorProfileResponse?.data;
  //@ts-ignore
  const tutorId = tutorProfile?.tutorProfile?.id || "";

  // Extract tutor name from localStorage immediately (no waiting)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tutorUser = getTutorUser();
      if (tutorUser?.data) {
        const firstName = tutorUser.data.firstName || "";
        const lastName = tutorUser.data.lastName || "";
        setTutorName(`${firstName} ${lastName}`.trim() || "TUTOR");
      }
    }
  }, []);

  // Fetch analytics data
  const {
    data: analyticsResponse,
    isLoading,
    error,
  } = useGetTutorAnalytics(tutorId);
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
        // Initial load - merge with existing WebSocket activities
        setAllActivities((prev) => {
          // Get WebSocket activities that aren't in the API response
          const wsActivities = prev.filter((wsActivity: any) => {
            const wsTimestamp = wsActivity.timeStamp || wsActivity.timestamp;
            return !newActivities.some((apiActivity: any) => {
              const apiTimestamp =
                apiActivity.timeStamp || apiActivity.timestamp;
              return apiTimestamp === wsTimestamp;
            });
          });

          // Combine: WebSocket activities first, then API activities
          const merged = [...wsActivities, ...newActivities];
          return merged;
        });
      } else {
        // Loading more - append to existing activities
        setAllActivities((prev) => {
          return [...prev, ...newActivities];
        });
        setIsLoadingMore(false);
      }

      // Update pagination state
      setHasMore(activityLogResponse.pagination?.hasMore || false);
    }
  }, [activityLogResponse, cursor]);

  // Listen for new activities via WebSocket (studentActivity for tutors)
  useEffect(() => {
    if (lastActivity) {
      // Prepend new activity to the list
      setAllActivities((prev) => {
        // Check if activity already exists to avoid duplicates
        const activityTimestamp =
          lastActivity.timeStamp || lastActivity.timestamp;
        const exists = prev.some((activity: any) => {
          const prevTimestamp = activity.timeStamp || activity.timestamp;
          return prevTimestamp === activityTimestamp;
        });

        if (exists) {
          return prev;
        }

        return [lastActivity, ...prev];
      });
    }
  }, [lastActivity, isConnected]);

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
  const handleActivityClick = (activity: any) => {
    // If activity has a student ID, navigate to student page
    if (activity.studentId || activity.childId) {
      push(`/tutor/students/${activity.studentId || activity.childId}`);
    }
  };

  // Show loading state while fetching tutor profile
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if no tutor ID found
  if (!tutorId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600">Unable to load tutor information</p>
          <p className="text-sm text-gray-500 mt-2">Please sign in again</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching analytics
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

  // Show error state if query failed
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

  // Calculate statistics from analytics
  const totalStudents = analytics?.totalStudents || 0;
  const upcomingSessions = analytics?.confirmedSessions || 0;
  const submittedHomework = 0; // Not available in analytics, keeping as 0 for now
  const averageResponseTime = "7 Hours"; // Not available in analytics, keeping as mock

  return (
    <div>
      {/* Welcome Section */}
      <div className="my-8">
        <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">
          WELCOME,
        </span>
        <h1 className="font-medium text-lg md:text-xl">
          {tutorName.toUpperCase()}
        </h1>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-medium">
                Recent Activity
              </h2>
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
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-[400px] h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {allActivities.length === 0 && !isLoadingActivities ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No activities yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allActivities.map((activity, idx) => {
                    const timestamp = activity.timeStamp || activity.timestamp;
                    const message = activity.message || activity.action || "";
                    return (
                      <div
                        key={timestamp + idx}
                        onClick={() => handleActivityClick(activity)}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 border ring-borderGray ring-2 bg-primaryBlue border-white"></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 font-medium text-sm">
                              {message}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {timestamp
                                ? formatActivityTime(timestamp)
                                : "Recently"}
                            </div>
                          </div>
                        </div>
                        <BackArrow flipped color="#286CFF" />
                      </div>
                    );
                  })}

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
