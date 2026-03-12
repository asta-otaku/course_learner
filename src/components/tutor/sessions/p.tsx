"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Session } from "@/lib/types";
import { formatDateString } from "@/lib/utils";
import { useGetMySessions } from "@/lib/api/queries";
import {
  usePutCancelSession,
  usePutRescheduleSession,
  usePutConfirmSession,
  usePutCompleteSession,
} from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import SessionsList from "./SessionsList";
import CancelSessionDialog from "@/components/admin/session-management/cancelSessionDialog";
import CompleteSessionDialog from "./CompleteSessionDialog";
import RescheduleSessionDialog from "./RescheduleSessionDialog";
import ConfirmSessionDialog from "./ConfirmSessionDialog";

function Sessions() {
  const [allSessions, setAllSessions] = useState<Session[]>([]);

  // Session action states
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] =
    useState<Session | null>(null);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(
    null
  );
  const [sessionToConfirm, setSessionToConfirm] = useState<Session | null>(
    null
  );

  // New dialog states for proper modal handling
  const [showCompleteSessionDialog, setShowCompleteSessionDialog] =
    useState(false);
  const [showRescheduleSessionDialog, setShowRescheduleSessionDialog] =
    useState(false);
  const [showConfirmSessionDialog, setShowConfirmSessionDialog] =
    useState(false);

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

  // Get sessions from API with filters and pagination
  const {
    data: sessionsData,
    isLoading,
    error,
  } = useGetMySessions({
    status: filters.status === "all" ? undefined : filters.status || undefined,
    date: filters.date || undefined,
    dayOfWeek:
      filters.dayOfWeek === "all" ? undefined : filters.dayOfWeek || undefined,
    page: pagination.page,
    limit: pagination.limit,
  });

  // Session action mutations - will be recreated with correct IDs when needed
  const [cancelSessionId, setCancelSessionId] = useState<string>("");
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string>("");
  const [confirmSessionId, setConfirmSessionId] = useState<string>("");
  const [completeSessionId, setCompleteSessionId] = useState<string>("");

  const cancelSessionMutation = usePutCancelSession(cancelSessionId);
  const rescheduleSessionMutation =
    usePutRescheduleSession(rescheduleSessionId);
  const confirmSessionMutation = usePutConfirmSession(confirmSessionId);
  const completeSessionMutation = usePutCompleteSession(completeSessionId);

  // Transform API sessions and sync pagination from API response
  useEffect(() => {
    const raw = (sessionsData as any)?.data;
    if (raw?.data) {
      const transformedSessions: Session[] = raw.data.map((apiSession: any) => {
        const sessionName = `Session with ${apiSession.bookedBy || "Student"}`;
        const startTime = apiSession.startTime?.slice(0, 5) || "00:00";
        const endTime = apiSession.endTime?.slice(0, 5) || "00:00";
        const timeDisplay = `${startTime} - ${endTime}`;
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
          tutor: apiSession.tutor || "You",
          tutorId: apiSession.tutorId || "current-user",
          student: apiSession.bookedBy || undefined,
          participants: apiSession.bookedBy ? [apiSession.bookedBy] : [],
          issue: undefined,
          status: statusDisplay,
          bookedAt: apiSession.bookedAt,
          bookedBy: apiSession.bookedBy || null,
          bookedById: apiSession.bookedById?.toString() || null,
          notes: apiSession.notes,
        };
      });
      setAllSessions(transformedSessions);

      if (raw.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: raw.pagination.totalCount ?? prev.total,
          page: raw.pagination.page ?? prev.page,
          totalPages: raw.pagination.totalPages ?? prev.totalPages,
          hasNextPage: raw.pagination.hasNextPage ?? false,
          hasPreviousPage: raw.pagination.hasPreviousPage ?? false,
        }));
      }
    }
  }, [sessionsData]);

  // Apply client-side filtering only (pagination is server-side via API)
  const filteredSessions = useMemo(() => {
    let filtered = allSessions;

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.name.toLowerCase().includes(searchTerm) ||
          session.tutor.toLowerCase().includes(searchTerm) ||
          (session.student &&
            session.student.toLowerCase().includes(searchTerm)) ||
          session.status?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (session) => session.status === filters.status
      );
    }

    if (filters.date) {
      filtered = filtered.filter((session) => session.date === filters.date);
    }

    if (filters.dayOfWeek !== "all") {
      filtered = filtered.filter((session) => {
        const sessionDate = new Date(session.date);
        const dayName = sessionDate
          .toLocaleDateString("en-US", { weekday: "long" })
          .toUpperCase();
        return dayName === filters.dayOfWeek;
      });
    }

    return filtered;
  }, [allSessions, filters]);

  // Categorize: upcoming = today + future, previous = past
  const { previous, upcoming } = useMemo(() => {
    const todayStr = formatDateString(new Date());

    return {
      previous: filteredSessions.filter(
        (session) => session.date < todayStr
      ),
      upcoming: filteredSessions.filter(
        (session) => session.date >= todayStr
      ),
    };
  }, [filteredSessions]);

  // Check if there are no sessions at all
  const noSessions = useMemo(() => {
    return filteredSessions.length === 0;
  }, [filteredSessions]);

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

  // Session action handlers
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

      toast.success("Session cancelled successfully");
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

  const handleRescheduleSession = (session: Session) => {
    setRescheduleSessionId(session.id);
    setSessionToReschedule(session);
    setShowRescheduleSessionDialog(true);
  };

  const handleConfirmReschedule = async (
    newSessionId: string,
    reason: string
  ) => {
    if (!sessionToReschedule) return;

    try {
      await rescheduleSessionMutation.mutateAsync({
        newSessionId,
        reason,
      });

      toast.success("Session rescheduled successfully");
      // Remove the old session from local state and refresh
      setAllSessions((prev) =>
        prev.filter((session) => session.id !== sessionToReschedule.id)
      );
      setShowRescheduleSessionDialog(false);
      setSessionToReschedule(null);
    } catch (error) {
      console.error("Failed to reschedule session:", error);
    }
  };

  const handleConfirmSession = (session: Session) => {
    setConfirmSessionId(session.id);
    setSessionToConfirm(session);
    setShowConfirmSessionDialog(true);
  };

  const handleConfirmSessionAction = async (notes: string) => {
    if (!sessionToConfirm) return;

    try {
      await confirmSessionMutation.mutateAsync({
        notes,
      });

      toast.success("Session confirmed successfully");
      // Update local state to mark session as confirmed
      setAllSessions((prev) =>
        prev.map((session) =>
          session.id === sessionToConfirm.id
            ? { ...session, status: "confirmed", notes: notes }
            : session
        )
      );
      setShowConfirmSessionDialog(false);
      setSessionToConfirm(null);
    } catch (error) {
      console.error("Failed to confirm session:", error);
    }
  };

  const handleCompleteSession = (session: Session) => {
    setCompleteSessionId(session.id);
    setSessionToComplete(session);
    setShowCompleteSessionDialog(true);
  };

  const handleConfirmComplete = async (sessionNotes: string) => {
    if (!sessionToComplete) return;

    try {
      await completeSessionMutation.mutateAsync({
        sessionNotes,
      });

      toast.success("Session marked as completed");
      // Update local state to mark session as completed
      setAllSessions((prev) =>
        prev.map((session) =>
          session.id === sessionToComplete.id
            ? { ...session, status: "completed", notes: sessionNotes }
            : session
        )
      );
      setShowCompleteSessionDialog(false);
      setSessionToComplete(null);
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-medium my-6 text-gray-900">Sessions</h2>

      {/* Session filters and overview hidden per product requirement */}

      <div className="space-y-4">
        <SessionsList
          isLoading={isLoading}
          error={error}
          noSessions={noSessions}
          upcoming={upcoming}
          previous={previous}
          onCancel={handleCancel}
          onReschedule={handleRescheduleSession}
          onConfirm={handleConfirmSession}
          onComplete={handleCompleteSession}
        />

        {/* Pagination */}
        {!isLoading && !error && !noSessions && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
              {pagination.total > 0 && (
                <span className="text-gray-500 ml-1">
                  ({pagination.total} total)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Session Dialog */}
      <CancelSessionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        sessionName={
          sessionToCancel
            ? `${sessionToCancel.student || "Student"} on ${
                sessionToCancel.date
              }`
            : ""
        }
        onConfirm={handleConfirmCancel}
        isLoading={cancelSessionMutation.isPending}
      />

      {/* Complete Session Dialog */}
      <CompleteSessionDialog
        open={showCompleteSessionDialog}
        onOpenChange={setShowCompleteSessionDialog}
        session={sessionToComplete}
        onConfirm={handleConfirmComplete}
        isLoading={completeSessionMutation.isPending}
      />

      {/* Reschedule Session Dialog */}
      <RescheduleSessionDialog
        open={showRescheduleSessionDialog}
        onOpenChange={setShowRescheduleSessionDialog}
        session={sessionToReschedule}
        allSessions={allSessions}
        onConfirm={handleConfirmReschedule}
        isLoading={rescheduleSessionMutation.isPending}
      />

      {/* Confirm Session Dialog */}
      <ConfirmSessionDialog
        open={showConfirmSessionDialog}
        onOpenChange={setShowConfirmSessionDialog}
        session={sessionToConfirm}
        onConfirm={handleConfirmSessionAction}
        isLoading={confirmSessionMutation.isPending}
      />
    </div>
  );
}

export default Sessions;
