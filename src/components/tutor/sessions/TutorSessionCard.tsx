"use client";

import React, { useState } from "react";
import { Users, Video, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { useGetSessionMeetingUrl } from "@/lib/api/queries";
import type { SessionSectionType } from "./SessionSection";

interface TutorSessionCardProps {
  sectionType: SessionSectionType;
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onReschedule: (session: Session) => void;
  onConfirm: (session: Session) => void;
  onComplete: (session: Session) => void;
}

const TutorSessionCard = ({
  sectionType,
  title,
  description,
  sessions,
  onCancel,
  onReschedule,
  onConfirm,
  onComplete,
}: TutorSessionCardProps) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (sessions.length === 0) return null;

  const handleSessionClick = (session: Session) => {
    // Upcoming: any booked/confirmed session can be acted on (Join or Cancel)
    const upcomingActionable = ["pending", "confirmed", "booked", "available"];
    // Previous: show details only
    const previousActionable = ["completed", "expired"];

    const actionable =
      sectionType === "upcoming"
        ? upcomingActionable.includes(session.status || "")
        : previousActionable.includes(session.status || "");

    if (actionable) {
      setSelectedSession(session);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  const handleAction = (action: string, session: Session) => {
    closeModal();
    switch (action) {
      case "cancel":
        onCancel(session.id);
        break;
      case "reschedule":
        onReschedule(session);
        break;
      case "confirm":
        onConfirm(session);
        break;
      case "complete":
        onComplete(session);
        break;
    }
  };

  return (
    <>
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
                className={`flex flex-col md:flex-row gap-4 md:gap-1 md:items-center justify-between space-x-4 w-full bg-bgWhiteGray border py-2 px-4 rounded-2xl transition-colors ${sectionType === "upcoming"
                  ? ["pending", "confirmed", "booked", "available"].includes(
                    session.status || ""
                  )
                    ? "cursor-pointer hover:bg-gray-100"
                    : "cursor-default"
                  : ["completed", "expired"].includes(session.status || "")
                    ? "cursor-pointer hover:bg-gray-100"
                    : "cursor-default"
                  }`}
                onClick={() => handleSessionClick(session)}
              >
                <div className="text-textSubtitle space-y-2">
                  <div className="font-medium text-sm">{session.name}</div>
                  <div className="text-xs">
                    {session.time}
                  </div>
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
                </div>
                {sectionType === "upcoming" && (
                  <div className="text-xs text-textSubtitle">
                    Click for actions
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Actions Modal */}
      <SessionActionsDialog
        sectionType={sectionType}
        open={showModal}
        onOpenChange={setShowModal}
        session={selectedSession}
        onAction={handleAction}
      />
    </>
  );
};

// Separate component for session actions dialog
interface SessionActionsDialogProps {
  sectionType: SessionSectionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onAction: (action: string, session: Session) => void;
}

const SessionActionsDialog = ({
  sectionType,
  open,
  onOpenChange,
  session,
  onAction,
}: SessionActionsDialogProps) => {
  const { data: meetingUrlData, isLoading: isLoadingUrl } =
    useGetSessionMeetingUrl(session?.id || "");

  const meetingUrl = meetingUrlData?.data
    ? `${meetingUrlData.data}?role=tutor`
    : undefined;

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
          <DialogDescription>
            {sectionType === "upcoming"
              ? "Join the meeting or cancel the session"
              : "Past session"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-3">Session Details</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Date:</span> {session.date}
              </p>
              <p>
                <span className="font-medium">Time:</span> {session.time}
              </p>
              <p>
                <span className="font-medium">Student:</span>{" "}
                {session.student || "Available"}
              </p>
              {sectionType === "previous" && (
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="font-medium text-gray-600">
                    {session.status
                      ? session.status.charAt(0).toUpperCase() +
                      session.status.slice(1)
                      : "Unknown"}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Upcoming: Join meeting + Cancel only. No Reschedule, no Confirm. */}
          {sectionType === "upcoming" && (
            <div className="space-y-3">
              {isLoadingUrl ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled
                >
                  <Video className="w-4 h-4 mr-2" />
                  Loading...
                </Button>
              ) : meetingUrl ? (
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join meeting
                </a>
              ) : (
                <Button
                  className="w-full bg-gray-400 cursor-not-allowed"
                  disabled
                >
                  <Video className="w-4 h-4 mr-2" />
                  Meeting URL unavailable
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onAction("cancel", session)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {sectionType === "previous" && (
            <p className="text-center text-gray-500 py-4">
              This session is in the past.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorSessionCard;
