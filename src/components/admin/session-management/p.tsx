"use client";

import React, { useState, useMemo } from "react";
import { Session, TimeSlot } from "@/lib/types";
import {
  formatDateString,
  dummyProfiles,
  dummyTutorProfiles,
} from "@/lib/utils";
import Calendar from "./calendar";
import BookingDialog from "./bookingDialog";
import SessionSection, { EmptySessionsState } from "./sessionCard";

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

  // Available tutors and students from dummy data
  const tutors = dummyTutorProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    displayName: profile.name,
  }));

  const students = dummyProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    displayName: `${profile.name} (Year ${profile.year}, ${profile.subscriptionName})`,
  }));

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
      <h2 className="text-xl font-medium my-6 text-gray-900">
        Session Management
      </h2>

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
        tutors={tutors}
        students={students}
        sessionToEdit={sessionToEdit || undefined}
      />
    </div>
  );
}

export default Sessions;
