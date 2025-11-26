"use client";

import React, { useState } from "react";
import { Users, Video, Calendar, XCircle } from "lucide-react";
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

interface TutorSessionCardProps {
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onReschedule: (session: Session) => void;
  onConfirm: (session: Session) => void;
  onComplete: (session: Session) => void;
}

const TutorSessionCard = ({
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
    // Only open modal for sessions that have actionable states
    const actionableStatuses = ["pending", "confirmed", "completed"];

    if (actionableStatuses.includes(session.status || "")) {
      setSelectedSession(session);
      setShowModal(true);
    }
    // Do nothing for "available" and "cancelled" sessions
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
                className={`flex flex-col md:flex-row gap-4 md:gap-1 md:items-center justify-between space-x-4 w-full bg-bgWhiteGray border py-2 px-4 rounded-2xl transition-colors ${
                  ["pending", "confirmed", "completed"].includes(
                    session.status || ""
                  )
                    ? "cursor-pointer hover:bg-gray-100"
                    : "cursor-default"
                }`}
                onClick={() => handleSessionClick(session)}
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
                </div>
                <div className="text-xs text-textSubtitle">
                  Click for actions
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Actions Modal */}
      <SessionActionsDialog
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onAction: (action: string, session: Session) => void;
}

const SessionActionsDialog = ({
  open,
  onOpenChange,
  session,
  onAction,
}: SessionActionsDialogProps) => {
  const { data: meetingUrlData, isLoading: isLoadingUrl } =
    useGetSessionMeetingUrl(session?.id || "");

  const meetingUrl = meetingUrlData?.data;

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Session Actions</DialogTitle>
          <DialogDescription>
            Manage your session with available actions
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
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`font-medium ${
                    session.status === "confirmed"
                      ? "text-green-600"
                      : session.status === "pending"
                        ? "text-yellow-600"
                        : session.status === "cancelled"
                          ? "text-red-600"
                          : "text-gray-600"
                  }`}
                >
                  {session.status
                    ? session.status.charAt(0).toUpperCase() +
                      session.status.slice(1)
                    : "Unknown"}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons in a grid layout */}
          <div className="space-y-3">
            {/* Confirmed sessions: Join Meeting (primary), Reschedule, Cancel */}
            {session.status === "confirmed" && (
              <>
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
                    Join Video Meeting
                  </a>
                ) : (
                  <Button
                    className="w-full bg-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Meeting URL Unavailable
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onAction("reschedule", session)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onAction("cancel", session)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {/* Pending sessions: Confirm, Reschedule, Cancel */}
            {session.status === "pending" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => onAction("confirm", session)}
                >
                  Confirm Session
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onAction("reschedule", session)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onAction("cancel", session)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {/* Cancelled sessions: Reschedule only */}
            {session.status === "cancelled" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onAction("reschedule", session)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Reschedule Session
              </Button>
            )}

            {/* Completed sessions: No actions */}
            {session.status === "completed" && (
              <p className="text-center text-gray-500 py-4">
                This session has been completed
              </p>
            )}

            {/* Available/Expired sessions: Confirm only */}
            {(session.status === "available" ||
              session.status === "expired") && (
              <Button
                className="w-full"
                onClick={() => onAction("confirm", session)}
              >
                Confirm Session
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorSessionCard;
