"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Session, AdminSessionData } from "@/lib/types";
import { formatDateString } from "@/lib/utils";
import SessionSection, { EmptySessionsState } from "./sessionCard";
import SessionDetailsDialog from "./sessionDetailsDialog";
import SessionControls from "./sessionControls";
import CancelSessionDialog from "./cancelSessionDialog";
import { useGetSessions } from "@/lib/api/queries";
import { usePutCancelSession } from "@/lib/api/mutations";

function Sessions() {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Cancellation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [cancelSessionId, setCancelSessionId] = useState("");

  // Filter and pagination state
  const [filters, setFilters] = useState({
    status: "all",
    date: "",
    dayOfWeek: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Get sessions with filters and pagination
  const { data: sessionsData } = useGetSessions({
    status: filters.status === "all" ? undefined : filters.status || undefined,
    date: filters.date || undefined,
    dayOfWeek:
      filters.dayOfWeek === "all" ? undefined : filters.dayOfWeek || undefined,
    page: pagination.page,
    limit: pagination.limit,
    // Note: search filter would need to be implemented on the backend
    // For now, we'll filter client-side
  });

  // Use the defined usePutCancelSession mutation
  const cancelSessionMutation = usePutCancelSession(cancelSessionId);

  // Transform API sessions to match the expected Session format
  useEffect(() => {
    if (sessionsData?.data?.data) {
      const transformedSessions: Session[] = sessionsData.data.data.map(
        (apiSession: AdminSessionData) => {
          // Format the session name with more context
          const sessionName =
            apiSession.status === "available"
              ? `Available Session with ${apiSession.tutor}`
              : `Session with ${apiSession.tutor}`;

          // Format time for better readability
          const startTime = apiSession.startTime.slice(0, 5); // Remove seconds
          const endTime = apiSession.endTime.slice(0, 5);
          const timeDisplay = `${startTime} - ${endTime}`;

          // Determine if session is today, upcoming, or past
          const sessionDate = new Date(apiSession.sessionDate);
          const today = new Date();

          const isPast = sessionDate < today;

          let statusDisplay = apiSession.status;
          if (isPast && apiSession.status === "available") {
            statusDisplay = "expired";
          }

          return {
            id: apiSession.id,
            date: apiSession.sessionDate,
            name: sessionName,
            time: timeDisplay,
            timeSlot: timeDisplay,
            tutor: apiSession.tutor,
            tutorId: apiSession.tutorId,
            student: apiSession.bookedBy || undefined,
            participants: apiSession.bookedBy ? [apiSession.bookedBy] : [],
            issue: undefined,
            status: statusDisplay,
            bookedAt: apiSession.bookedAt,
            bookedBy: apiSession.bookedBy,
            bookedById: apiSession.bookedById,
            notes: apiSession.notes,
          };
        }
      );
      setAllSessions(transformedSessions);

      // Update pagination with backend metadata
      if (sessionsData.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: sessionsData.data.pagination.totalCount,
          page: sessionsData.data.pagination.page,
          totalPages: sessionsData.data.pagination.totalPages,
          hasNextPage: sessionsData.data.pagination.hasNextPage,
          hasPreviousPage: sessionsData.data.pagination.hasPreviousPage,
        }));
      }
    }
  }, [sessionsData]);

  // Apply client-side search filtering
  const filteredSessions = useMemo(() => {
    if (!filters.search.trim()) {
      return allSessions;
    }

    const searchTerm = filters.search.toLowerCase();
    return allSessions.filter(
      (session) =>
        session.name.toLowerCase().includes(searchTerm) ||
        session.tutor.toLowerCase().includes(searchTerm) ||
        (session.student &&
          session.student.toLowerCase().includes(searchTerm)) ||
        session.status?.toLowerCase().includes(searchTerm)
    );
  }, [allSessions, filters.search]);

  // Categorize sessions
  const { previous, today, upcoming } = useMemo(() => {
    const todayStr = formatDateString(new Date());

    return {
      previous: filteredSessions.filter((session) => session.date < todayStr),
      today: filteredSessions.filter((session) => session.date === todayStr),
      upcoming: filteredSessions.filter((session) => session.date > todayStr),
    };
  }, [filteredSessions]);

  // Check if there are no sessions at all
  const noSessions = useMemo(() => {
    return allSessions.length === 0;
  }, [allSessions]);

  // Filter and pagination handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 })); // Reset to first page when changing limit
  };

  const handleClearFilters = () => {
    setFilters({ status: "all", date: "", dayOfWeek: "all", search: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Session actions
  const handleCancel = (id: string) => {
    const session = allSessions.find((s) => s.id === id);
    if (session) {
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

      // Remove the session from local state after successful cancellation
      setAllSessions((prev) =>
        prev.filter((session) => session.id !== sessionToCancel.id)
      );
      setShowCancelDialog(false);
      setSessionToCancel(null);
    } catch (error) {
      console.error("Failed to cancel session:", error);
    }
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowDetailsDialog(true);
  };

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-medium my-6 text-gray-900">
        Session Management
      </h2>

      {/* Session Controls */}
      <SessionControls
        filters={filters}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onClearFilters={handleClearFilters}
      />

      {/* Session Statistics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Session Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {allSessions.length}
            </div>
            <div className="text-sm text-blue-800">Total Sessions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {allSessions.filter((s) => s.status === "available").length}
            </div>
            <div className="text-sm text-green-800">Available</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {allSessions.filter((s) => s.status === "booked").length}
            </div>
            <div className="text-sm text-blue-800">Booked</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {allSessions.filter((s) => s.status === "cancelled").length}
            </div>
            <div className="text-sm text-gray-800">Cancelled</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {allSessions.filter((s) => s.status === "expired").length}
            </div>
            <div className="text-sm text-orange-800">Expired</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {noSessions ? (
          <EmptySessionsState />
        ) : (
          <>
            <SessionSection
              title="TODAY'S SESSIONS"
              description="Click on a session to view details"
              sessions={today}
              onCancel={handleCancel}
              onSessionClick={handleSessionClick}
            />

            <SessionSection
              title="UPCOMING SESSIONS"
              description="Click on a session to view details"
              sessions={upcoming}
              onCancel={handleCancel}
              onSessionClick={handleSessionClick}
            />

            <SessionSection
              title="PREVIOUS SESSIONS"
              description="Past completed sessions"
              sessions={previous}
              onCancel={handleCancel}
              onSessionClick={handleSessionClick}
            />
          </>
        )}
      </div>

      <SessionDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        session={selectedSession}
        onCancel={handleCancel}
      />

      <CancelSessionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        sessionName={sessionToCancel?.name || ""}
        onConfirm={handleConfirmCancel}
        isLoading={cancelSessionMutation.isPending}
      />
    </div>
  );
}

export default Sessions;
