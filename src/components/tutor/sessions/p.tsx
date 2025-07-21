"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Session, TimeSlot } from "@/lib/types";
import { formatDateString, dummyProfiles } from "@/lib/utils";
import Calendar from "@/components/platform/sessions/calendar";
import BookingDialog from "@/components/platform/sessions/bookingDialog";
import SessionSection, {
  EmptySessionsState,
} from "@/components/platform/sessions/sessionCard";

const timeSlots: TimeSlot[] = [
  { id: "4-5", label: "4 - 5PM", value: "4:00-5:00PM" },
  { id: "5-6", label: "5 - 6PM", value: "5:00-6:00PM" },
  { id: "6-7", label: "6 - 7PM", value: "6:00-7:00PM" },
];

function Sessions() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Available students
  const students = dummyProfiles
    .filter((profile) => profile.status === "active")
    .map((profile) => profile.name);

  // Initialize with sample sessions
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
  }, []);

  // Categorize sessions
  const { previous, today, upcoming } = useMemo(() => {
    const todayStr = formatDateString(new Date());

    return {
      previous: allSessions.filter((session) => session.date < todayStr),
      today: allSessions.filter((session) => session.date === todayStr),
      upcoming: allSessions.filter((session) => session.date > todayStr),
    };
  }, [allSessions]);

  // Check if there are no sessions at all
  const noSessions = useMemo(() => {
    return allSessions.length === 0;
  }, [allSessions]);

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
  const handleBookMeeting = (sessionData: Omit<Session, "id">) => {
    if (sessionToEdit) {
      // Update existing session
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === sessionToEdit.id ? { ...s, ...sessionData } : s
        )
      );
    } else {
      // Create new session
      setAllSessions((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...sessionData,
        },
      ]);
    }
  };

  const handleCancel = (id: number) => {
    setAllSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const handleReschedule = (session: Session) => {
    setSessionToEdit(session);
    setSelectedDate(session.date);
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-medium my-6 text-gray-900">Sessions</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-4 col-span-1 lg:col-span-3">
          {noSessions ? (
            <EmptySessionsState />
          ) : (
            <>
              <SessionSection
                title="TODAY'S SESSION"
                description="You can cancel or reschedule by one day only"
                sessions={today}
                onCancel={handleCancel}
                onReschedule={handleReschedule}
              />

              <SessionSection
                title="UPCOMING SESSIONS"
                description="You can cancel or reschedule by one day only"
                sessions={upcoming}
                onCancel={handleCancel}
                onReschedule={handleReschedule}
              />

              <SessionSection
                title="PREVIOUS SESSIONS"
                description="Past completed sessions"
                sessions={previous}
                onCancel={handleCancel}
                onReschedule={handleReschedule}
              />
            </>
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
        timeSlots={timeSlots}
        onBookMeeting={handleBookMeeting}
        tutors={students}
        sessionToEdit={sessionToEdit || undefined}
      />
    </div>
  );
}

export default Sessions;
