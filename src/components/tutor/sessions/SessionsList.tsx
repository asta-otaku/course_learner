import React from "react";
import { Session } from "@/lib/types";
import { EmptySessionsState } from "@/components/platform/sessions/sessionCard";
import SessionSectionComponent from "./SessionSection";

interface SessionsListProps {
  isLoading: boolean;
  error: any;
  noSessions: boolean;
  today: Session[];
  upcoming: Session[];
  previous: Session[];
  onCancel: (id: string) => void;
  onReschedule: (session: Session) => void;
  onConfirm: (session: Session) => void;
  onComplete: (session: Session) => void;
}

export default function SessionsList({
  isLoading,
  error,
  noSessions,
  today,
  upcoming,
  previous,
  onCancel,
  onReschedule,
  onConfirm,
  onComplete,
}: SessionsListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          Failed to load sessions. Please try again.
        </p>
      </div>
    );
  }

  if (noSessions) {
    return <EmptySessionsState />;
  }

  return (
    <>
      <SessionSectionComponent
        title="TODAY'S SESSION"
        description="You can cancel or reschedule by one day only"
        sessions={today}
        onCancel={onCancel}
        onReschedule={onReschedule}
        onConfirm={onConfirm}
        onComplete={onComplete}
      />

      <SessionSectionComponent
        title="UPCOMING SESSIONS"
        description="You can cancel or reschedule by one day only"
        sessions={upcoming}
        onCancel={onCancel}
        onReschedule={onReschedule}
        onConfirm={onConfirm}
        onComplete={onComplete}
      />

      <SessionSectionComponent
        title="PREVIOUS SESSIONS"
        description="Past completed sessions"
        sessions={previous}
        onCancel={onCancel}
        onReschedule={onReschedule}
        onConfirm={onConfirm}
        onComplete={onComplete}
      />
    </>
  );
}
