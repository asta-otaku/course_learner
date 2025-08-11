"use client";

import React from "react";
import { CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { usePathname } from "next/navigation";

const SessionSection = ({
  title,
  description,
  sessions,
  onCancel,
  onSessionClick,
}: {
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onSessionClick: (session: Session) => void;
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
        const participantCount = session.participants?.length || 1;

        return (
          <div
            key={session.id}
            className="flex flex-col md:flex-row md:items-center gap-2 mb-3 last:mb-0"
          >
            <div className="rounded-2xl py-3 px-4 md:max-w-24 text-center bg-bgWhiteGray border">
              <div className="text-sm font-medium text-textSubtitle">
                {displayDate.date}
              </div>
              <div className="text-sm font-medium text-textSubtitle">
                {displayDate.day}
              </div>
              <div className="text-xs text-textSubtitle">
                {new Date(session.date).getFullYear()}
              </div>
            </div>
            <div
              className="flex flex-col md:flex-row gap-4 md:gap-1 md:items-center justify-between space-x-4 w-full bg-bgWhiteGray border py-2 px-4 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onSessionClick(session)}
            >
              <div className="text-textSubtitle space-y-2">
                <div className="font-medium text-sm">{session.name}</div>
                <div className="text-xs">
                  {session.time} • {session.tutor}
                  {session.student && ` • ${session.student}`}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Users className="w-3 h-3" />
                  {participantCount} Participant
                  {participantCount !== 1 ? "s" : ""}
                </div>
                {session.status && (
                  <div className="text-xs">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        session.status === "available"
                          ? "text-green-600"
                          : session.status === "booked"
                          ? "text-blue-600"
                          : session.status === "cancelled"
                          ? "text-red-600"
                          : session.status === "expired"
                          ? "text-orange-600"
                          : "text-gray-600"
                      }`}
                    >
                      {session.status.charAt(0).toUpperCase() +
                        session.status.slice(1)}
                    </span>
                  </div>
                )}
                {session.bookedAt && (
                  <div className="text-xs">
                    Booked: {new Date(session.bookedAt).toLocaleDateString()}
                  </div>
                )}
                {session.notes && (
                  <div className="text-xs mt-1 line-clamp-1">
                    Notes: {session.notes}
                  </div>
                )}
                {session.issue && (
                  <div className="text-xs mt-1 line-clamp-1">
                    Issue: {session.issue}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 w-full md:w-fit justify-center md:justify-normal">
                <Button
                  variant="destructive"
                  className="rounded-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening the dialog when clicking cancel
                    onCancel(session.id);
                  }}
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
        No Sessions Available
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        There are no sessions available at the moment. Sessions will appear here
        once they are created.
      </p>
    </div>
  );
};
