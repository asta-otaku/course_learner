import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { Users, Calendar, Clock, User, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SessionDetailsDialog({
  open,
  onOpenChange,
  session,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onCancel: (id: string) => void;
}) {
  if (!session) return null;

  const displayDate = formatDisplayDate(session.date);
  const participantCount = session.participants?.length || 1;

  const handleCancel = () => {
    onCancel(session.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg px-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-base md:text-lg">
            Session Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date and Time Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-700">DATE & TIME</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {displayDate.date}
                </div>
                <div className="text-sm text-gray-600">{displayDate.day}</div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">{session.time}</span>
              </div>
            </div>
          </div>

          {/* Session Information */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                SESSION TITLE
              </h4>
              <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                {session.name}
              </p>
            </div>

            {/* Participants */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-700">
                  PARTICIPANTS ({participantCount})
                </h4>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                {session.tutor && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">
                      {session.tutor} (Tutor)
                    </span>
                  </div>
                )}
                {session.student && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">
                      {session.student} (Student)
                    </span>
                  </div>
                )}
                {session.participants &&
                  session.participants.length > 0 &&
                  session.participants.map((participant, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-900">
                        {participant}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Status and Booking Info */}
            <div className="space-y-4">
              {session.status && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    SESSION STATUS
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === "available"
                          ? "bg-green-100 text-green-800"
                          : session.status === "booked"
                          ? "bg-blue-100 text-blue-800"
                          : session.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : session.status === "expired"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {session.status.charAt(0).toUpperCase() +
                        session.status.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              {session.bookedAt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    BOOKING INFORMATION
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Booked At:</span>{" "}
                      {new Date(session.bookedAt).toLocaleString()}
                    </div>
                    {session.bookedBy && (
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Booked By:</span>{" "}
                        {session.bookedBy}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {session.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    SESSION NOTES
                  </h4>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {session.notes}
                  </p>
                </div>
              )}

              {/* Issue/Notes */}
              {session.issue && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-medium text-gray-700">
                      ISSUE/NOTES
                    </h4>
                  </div>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {session.issue}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              className="rounded-full"
            >
              Cancel Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
