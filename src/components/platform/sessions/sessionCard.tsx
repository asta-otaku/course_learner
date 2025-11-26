"use client";

import React from "react";
import { CalendarDays, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useGetSessionMeetingUrl } from "@/lib/api/queries";

const SessionSection = ({
  title,
  description,
  sessions,
  onCancel,
  onConfirm,
  onComplete,
}: {
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onConfirm?: (session: Session) => void;
  onComplete?: (session: Session) => void;
}) => {
  if (sessions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border">
      <div className="mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-textSubtitle">{description}</p>
      </div>

      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onCancel={onCancel}
          onConfirm={onConfirm}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
};

// Individual Session Card Component with Meeting URL support
const SessionCard = ({
  session,
  onCancel,
  onConfirm,
  onComplete,
}: {
  session: Session;
  onCancel: (id: string) => void;
  onConfirm?: (session: Session) => void;
  onComplete?: (session: Session) => void;
}) => {
  const displayDate = formatDisplayDate(session.date);
  const isConfirmedOrBooked =
    session.status === "confirmed" || session.status === "booked";

  // Only fetch meeting URL for confirmed/booked sessions
  const { data: meetingUrlData, isLoading: isLoadingUrl } =
    useGetSessionMeetingUrl(isConfirmedOrBooked ? session.id : "");

  // Append role parameter to meeting URL for regular users
  const meetingUrl = meetingUrlData?.data
    ? `${meetingUrlData.data}?role=user`
    : undefined;

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3 last:mb-0">
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
          {session.status && (
            <div className="text-xs">
              <span
                className={`font-medium ${
                  session.status === "booked" || session.status === "confirmed"
                    ? "text-green-600"
                    : session.status === "cancelled"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {session.status.charAt(0).toUpperCase() +
                  session.status.slice(1)}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-fit justify-center md:justify-normal">
          {/* Join Meeting button for confirmed/booked sessions */}
          {isConfirmedOrBooked && (
            <>
              {isLoadingUrl ? (
                <Button
                  disabled
                  className="bg-green-600 text-white rounded-full text-xs flex items-center gap-1"
                >
                  <Video className="w-3 h-3" />
                  Loading...
                </Button>
              ) : meetingUrl ? (
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors"
                >
                  <Video className="w-3 h-3" />
                  Join Meeting
                </a>
              ) : null}
            </>
          )}

          {onConfirm && session.status === "pending" && (
            <Button
              variant="outline"
              onClick={() => onConfirm(session)}
              className="bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700"
            >
              Confirm
            </Button>
          )}
          {onComplete && session.status === "confirmed" && (
            <Button
              variant="outline"
              onClick={() => onComplete(session)}
              className="bg-purple-600 text-white rounded-full text-xs hover:bg-purple-700"
            >
              Complete
            </Button>
          )}

          {session.status !== "cancelled" && session.status !== "completed" && (
            <Button
              variant="outline"
              className="rounded-full text-xs text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => onCancel(session.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
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
