"use client";

import React, { useState, useMemo } from "react";
import { Session } from "@/lib/types";
import { formatDateString, formatDisplayDate } from "@/lib/utils";
import Calendar from "./calendar";
import BookingDialog from "./bookingDialog";
import SessionSection, { EmptySessionsState } from "./sessionCard";
import SessionControls from "@/components/admin/session-management/sessionControls";
import CancelSessionDialog from "@/components/admin/session-management/cancelSessionDialog";
import { useProfile } from "@/context/profileContext";
import {
  useGetBookedSessions,
  useGetAvailableSessions,
} from "@/lib/api/queries";
import { usePostBookSession, usePutCancelSession } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function Sessions() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { activeProfile } = useProfile();

  // Filter and pagination state
  const [filters, setFilters] = useState({
    status: "all",
    date: "",
    dayOfWeek: "all",
    search: "",
  });
  const [bookedPagination, setBookedPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [availablePagination, setAvailablePagination] = useState({
    page: 1,
    limit: 10,
  });

  // Get booked sessions for the active child profile
  const {
    data: bookedSessionsData,
    isLoading: bookedLoading,
    error: bookedError,
    refetch: refetchBooked,
  } = useGetBookedSessions(activeProfile?.id || "", {
    page: bookedPagination.page,
    limit: bookedPagination.limit,
  });

  // Get available sessions for the active child profile
  const {
    data: availableSessionsData,
    isLoading: availableLoading,
    error: availableError,
    refetch: refetchAvailable,
  } = useGetAvailableSessions(activeProfile?.id || "", {
    status: filters.status === "all" ? undefined : filters.status,
    date: filters.date || undefined,
    dayOfWeek: filters.dayOfWeek === "all" ? undefined : filters.dayOfWeek,
    search: filters.search || undefined,
    page: availablePagination.page,
    limit: availablePagination.limit,
  });

  // Book session mutation
  const bookSessionMutation = usePostBookSession();

  // Cancel session state and mutation
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState<string>("");
  const cancelSessionMutation = usePutCancelSession(cancelSessionId);

  // Transform and combine sessions data
  const allSessions = useMemo(() => {
    const sessionsMap = new Map<string, Session>();

    // Add booked sessions first (they take priority)
    if (bookedSessionsData?.data?.data) {
      bookedSessionsData.data.data.forEach((apiSession: any) => {
        const sessionId = apiSession.id.toString();
        sessionsMap.set(sessionId, {
          id: sessionId,
          date: apiSession.sessionDate,
          name: `Session with ${apiSession.tutor}`,
          time: `${apiSession.startTime?.slice(
            0,
            5
          )} - ${apiSession.endTime?.slice(0, 5)}`,
          timeSlot: `${apiSession.startTime?.slice(
            0,
            5
          )} - ${apiSession.endTime?.slice(0, 5)}`,
          tutor: apiSession.tutor,
          tutorId: apiSession.tutorId,
          student: activeProfile?.name || "Student",
          participants: activeProfile?.name ? [activeProfile.name] : [],
          issue: undefined,
          status: apiSession.status,
          bookedAt: apiSession.bookedAt,
          bookedBy: activeProfile?.name || null,
          bookedById: activeProfile?.id?.toString() || null,
          notes: apiSession.notes,
        });
      });
    }

    // Add available sessions only if they don't already exist (deduplicate by ID)
    if (availableSessionsData?.data?.data) {
      availableSessionsData.data.data.forEach((apiSession: any) => {
        const sessionId = apiSession.id.toString();
        // Only add if not already in the map (booked sessions take priority)
        if (!sessionsMap.has(sessionId)) {
          sessionsMap.set(sessionId, {
            id: sessionId,
            date: apiSession.sessionDate,
            name: `Available with ${apiSession.tutor}`,
            time: `${apiSession.startTime?.slice(
              0,
              5
            )} - ${apiSession.endTime?.slice(0, 5)}`,
            timeSlot: `${apiSession.startTime?.slice(
              0,
              5
            )} - ${apiSession.endTime?.slice(0, 5)}`,
            tutor: apiSession.tutor,
            tutorId: apiSession.tutorId,
            student: undefined,
            participants: [],
            issue: undefined,
            status: apiSession.status,
            bookedAt: null,
            bookedBy: null,
            bookedById: null,
            notes: apiSession.notes,
          });
        }
      });
    }

    return Array.from(sessionsMap.values());
  }, [bookedSessionsData, availableSessionsData, activeProfile]);

  // Extract unique tutors from available sessions
  const availableTutors = useMemo(() => {
    if (!availableSessionsData?.data?.data) return [];
    const tutorSet = new Set(
      availableSessionsData.data.data.map((session: any) => session.tutor)
    );
    return Array.from(tutorSet) as string[];
  }, [availableSessionsData]);

  // Create pagination objects for controls
  const bookedPaginationInfo = useMemo(
    () => ({
      page: bookedPagination.page,
      limit: bookedPagination.limit,
      total: bookedSessionsData?.data?.pagination?.totalCount || 0,
      totalPages: bookedSessionsData?.data?.pagination?.totalPages || 0,
      hasNextPage: bookedSessionsData?.data?.pagination?.hasNextPage || false,
      hasPreviousPage:
        bookedSessionsData?.data?.pagination?.hasPreviousPage || false,
    }),
    [bookedSessionsData, bookedPagination]
  );

  const availablePaginationInfo = useMemo(
    () => ({
      page: availablePagination.page,
      limit: availablePagination.limit,
      total: availableSessionsData?.data?.pagination?.totalCount || 0,
      totalPages: availableSessionsData?.data?.pagination?.totalPages || 0,
      hasNextPage:
        availableSessionsData?.data?.pagination?.hasNextPage || false,
      hasPreviousPage:
        availableSessionsData?.data?.pagination?.hasPreviousPage || false,
    }),
    [availableSessionsData, availablePagination]
  );

  // Transform available sessions from API data
  const availableSessions = useMemo(() => {
    if (!availableSessionsData?.data?.data) return [];

    return availableSessionsData.data.data.map((apiSession: any) => ({
      id: apiSession.id.toString(),
      date: apiSession.sessionDate,
      name: `Available with ${apiSession.tutor}`,
      time: `${apiSession.startTime?.slice(0, 5)} - ${apiSession.endTime?.slice(0, 5)}`,
      timeSlot: `${apiSession.startTime?.slice(0, 5)} - ${apiSession.endTime?.slice(0, 5)}`,
      tutor: apiSession.tutor,
      tutorId: apiSession.tutorId,
      student: undefined,
      participants: [],
      issue: undefined,
      status: apiSession.status,
      bookedAt: null,
      bookedBy: null,
      bookedById: null,
      notes: apiSession.notes,
    }));
  }, [availableSessionsData]);

  // Categorize sessions (only show booked sessions, not available ones)
  const { previous, today, upcoming } = useMemo(() => {
    const todayStr = formatDateString(new Date());
    const bookedSessions = allSessions.filter(
      (session) => session.status !== "available"
    );

    return {
      previous: bookedSessions.filter((session) => session.date < todayStr),
      today: bookedSessions.filter((session) => session.date === todayStr),
      upcoming: bookedSessions.filter((session) => session.date > todayStr),
    };
  }, [allSessions]);

  // Check if there are no booked sessions
  const noSessions = useMemo(() => {
    const bookedSessions = allSessions.filter(
      (session) => session.status !== "available"
    );
    return bookedSessions.length === 0;
  }, [allSessions]);

  // Filter and pagination handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset pagination when filtering
    setBookedPagination((prev) => ({ ...prev, page: 1 }));
    setAvailablePagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleBookedPageChange = (page: number) => {
    setBookedPagination((prev) => ({ ...prev, page }));
  };

  const handleBookedLimitChange = (limit: number) => {
    setBookedPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleAvailablePageChange = (page: number) => {
    setAvailablePagination((prev) => ({ ...prev, page }));
  };

  const handleAvailableLimitChange = (limit: number) => {
    setAvailablePagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ status: "all", date: "", dayOfWeek: "all", search: "" });
    setBookedPagination((prev) => ({ ...prev, page: 1 }));
    setAvailablePagination((prev) => ({ ...prev, page: 1 }));
  };

  // Calendar navigation
  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Handle date selection
  const handleDateClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = formatDateString(date);
    setSelectedDate(dateString);
    setSessionToEdit(null);
    setShowDialog(true);
  };

  // Session actions
  const handleBookMeeting = async (sessionId: string, notes: string) => {
    if (!activeProfile?.id) {
      toast.error("Please select a child profile first");
      return;
    }

    // Book the session with sessionId in URL and payload in body
    try {
      await bookSessionMutation.mutateAsync({
        sessionId: sessionId,
        childProfileId: activeProfile.id,
        notes: notes || "Session booked by parent",
      });

      toast.success("Session booked successfully!");

      // Refetch both booked and available sessions to update the UI
      refetchBooked();
      refetchAvailable();

      // Don't close dialog here - let BookingDialog handle it after successful completion
    } catch (error) {
      toast.error("Failed to book session. Please try again.");
      console.error("Error booking session:", error);
    }
  };

  const handleCancel = (id: string) => {
    const session = allSessions.find((s) => s.id === id);
    if (session && session.status !== "available") {
      setCancelSessionId(session.id);
      setSessionToCancel(session);
      setShowCancelDialog(true);
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!sessionToCancel) return;

    try {
      await cancelSessionMutation.mutateAsync({
        reason,
      });

      toast.success("Session cancelled successfully");

      // Refetch data to update the session lists
      refetchBooked();
      refetchAvailable();

      setShowCancelDialog(false);
      setSessionToCancel(null);
    } catch (error) {
      toast.error("Failed to cancel session");
      console.error("Failed to cancel session:", error);
    }
  };

  // Show loading state
  if (bookedLoading || availableLoading) {
    return (
      <div className="min-h-screen">
        <h2 className="text-xl font-medium my-6 text-gray-900">Sessions</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading sessions...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (bookedError || availableError) {
    return (
      <div className="min-h-screen">
        <h2 className="text-xl font-medium my-6 text-gray-900">Sessions</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load sessions</p>
            <button
              onClick={() => {
                refetchBooked();
                refetchAvailable();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-medium my-6 text-gray-900">Sessions</h2>

      {/* Session Controls for Booked Sessions */}
      <SessionControls
        filters={filters}
        pagination={bookedPaginationInfo}
        onFilterChange={handleFilterChange}
        onPageChange={handleBookedPageChange}
        onLimitChange={handleBookedLimitChange}
        onClearFilters={handleClearFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-4 col-span-1 lg:col-span-3">
          {noSessions ? (
            <EmptySessionsState />
          ) : (
            <>
              <SessionSection
                title="TODAY'S SESSION"
                description="You can cancel today's session if needed"
                sessions={today}
                onCancel={handleCancel}
              />

              <SessionSection
                title="UPCOMING SESSIONS"
                description="You can cancel upcoming sessions if needed"
                sessions={upcoming}
                onCancel={handleCancel}
              />

              <SessionSection
                title="PREVIOUS SESSIONS"
                description="Past completed sessions"
                sessions={previous}
                onCancel={handleCancel}
              />
            </>
          )}
          {/* Available Sessions Section */}
          {availableSessions.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">AVAILABLE SESSIONS</h3>
                  <span className="text-xs text-textSubtitle">
                    {availableSessions.length} session
                    {availableSessions.length !== 1 ? "s" : ""} found
                  </span>
                </div>
                <p className="text-xs text-textSubtitle mb-3">
                  Book an available session with your tutor
                </p>

                {/* Active Filters Display */}
                {(filters.status !== "all" ||
                  filters.date ||
                  filters.dayOfWeek !== "all" ||
                  filters.search) && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg border">
                      <span className="text-xs text-textSubtitle font-medium">
                        Active filters:
                      </span>
                      {filters.status !== "all" && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Status: {filters.status}
                          <button
                            onClick={() => handleFilterChange("status", "all")}
                            className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.date && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Date: {filters.date}
                          <button
                            onClick={() => handleFilterChange("date", "")}
                            className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.dayOfWeek !== "all" && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Day: {filters.dayOfWeek}
                          <button
                            onClick={() => handleFilterChange("dayOfWeek", "all")}
                            className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.search && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Search: {filters.search}
                          <button
                            onClick={() => handleFilterChange("search", "")}
                            className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  )}
              </div>

              {/* Render session cards directly */}
              {availableSessions.map((session: Session) => {
                const displayDate = formatDisplayDate(session.date);

                return (
                  <div
                    key={session.id}
                    className="flex flex-col md:flex-row md:items-center gap-2 mb-3 last:mb-0"
                  >
                    <div className="rounded-2xl py-3 px-4 md:max-w-20 text-center bg-bgWhiteGray border">
                      <div className="text-sm font-medium text-textSubtitle">
                        {displayDate.date}
                      </div>
                      <div className="text-sm font-medium text-textSubtitle">
                        {displayDate.day}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-1 md:items-center justify-between space-x-4 w-full bg-bgWhiteGray border py-2 px-4 rounded-2xl">
                      <div className="text-textSubtitle space-y-2">
                        <div className="font-medium text-sm">{session.name}</div>
                        <div className="text-xs">
                          {session.time} • {session.tutor}
                        </div>
                        {session.status && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-600">
                              {session.status.charAt(0).toUpperCase() +
                                session.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 w-full md:w-fit justify-center md:justify-normal">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedDate(session.date);
                            setSessionToEdit(session);
                            setShowDialog(true);
                          }}
                          className="bg-primaryBlue text-white rounded-full text-xs hover:bg-primaryBlue/90"
                        >
                          Book Session
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-1 lg:col-span-2">
          <Calendar
            currentMonth={currentMonth}
            onMonthChange={navigateMonth}
            onDateClick={handleDateClick}
            allSessions={allSessions}
          />
        </div>
      </div>

      <BookingDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedDate={selectedDate}
        availableSessions={availableSessionsData?.data?.data || []}
        onBookMeeting={handleBookMeeting}
        sessionToEdit={sessionToEdit || undefined}
        isBooking={bookSessionMutation.isPending}
      />

      {/* Cancel Session Dialog */}
      <CancelSessionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        sessionName={
          sessionToCancel
            ? `${sessionToCancel.name} on ${sessionToCancel.date}`
            : ""
        }
        onConfirm={handleConfirmCancel}
        isLoading={cancelSessionMutation.isPending}
      />
    </div>
  );
}

export default Sessions;
