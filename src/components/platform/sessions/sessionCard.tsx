"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { usePathname } from "next/navigation";

const SessionSection = ({
  title,
  description,
  sessions,
  onCancel,
  onReschedule,
}: {
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onReschedule: (session: Session) => void;
}) => {
  if (sessions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border">
      <div className="mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-textSubtitle">{description}</p>
      </div>

      {sessions.map((session) => {
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
                {session.issue && (
                  <div className="text-xs mt-1 line-clamp-1">
                    Issue: {session.issue}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 w-full md:w-fit justify-center md:justify-normal">
                <Button
                  variant="outline"
                  onClick={() => onReschedule(session)}
                  className="bg-primaryBlue text-white rounded-full text-xs"
                >
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-full text-xs"
                  onClick={() => onCancel(session.id)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionSection;

// Empty State Component
export const EmptySessionsState = () => {
  const pathname = usePathname();
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border text-center flex flex-col items-center">
      <div className="bg-blue-100 p-4 rounded-full mb-4">
        <CalendarDays className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        No Sessions Booked Yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        You haven't booked any sessions yet. Select a date on the calendar to
        schedule your first session with a{" "}
        {pathname.includes("tutor") ? "student" : "tutor"}.
      </p>
    </div>
  );
};
