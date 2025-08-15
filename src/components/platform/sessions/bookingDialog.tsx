import { Session, TimeSlot } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export default function BookingDialog({
  open,
  onOpenChange,
  selectedDate,
  availableSessions,
  onBookMeeting,
  sessionToEdit,
  isBooking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  availableSessions: any[];
  onBookMeeting: (sessionId: string, notes: string) => Promise<void>;
  sessionToEdit?: Session;
  isBooking?: boolean;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Reset form when dialog opens/closes or date changes
    setSelectedSessionId("");
    setNotes("");
  }, [open, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedSessionId) return;

    try {
      await onBookMeeting(selectedSessionId, notes);
      onOpenChange(false);
    } catch (error) {
      // Error is already handled in the parent component
      // Modal stays open so user can try again
    }
  };

  // Filter sessions for the selected date
  const sessionsForDate = availableSessions.filter(
    (session) => session.sessionDate === selectedDate
  );

  const displayDate = selectedDate ? formatDisplayDate(selectedDate) : null;
  const pathname = usePathname();
  const isTutor = pathname.includes("tutor");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg px-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-base md:text-lg">
            {sessionToEdit ? "Reschedule Meeting" : "Meeting"}
            <p className="text-xs mt-1 text-textSubtitle font-normal">
              Choose date and time slot
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedDate && displayDate && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700">
                SELECTED DATE
              </h4>
              <p className="font-medium">
                {displayDate.day}, {displayDate.date}
              </p>
            </div>
          )}

          {/* Available Sessions */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              SELECT AVAILABLE SESSION
            </label>
            {sessionsForDate.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No available sessions for this date</p>
                <p className="text-sm">Please select a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {sessionsForDate.map((session) => (
                  <Button
                    key={session.id}
                    variant={
                      selectedSessionId === session.id ? "default" : "outline"
                    }
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`rounded-xl flex flex-col justify-center py-4 h-auto ${
                      selectedSessionId === session.id
                        ? "bg-black text-white"
                        : "bg-bgWhiteGray"
                    }`}
                  >
                    <div className="font-medium">
                      {session.startTime?.slice(0, 5)} -{" "}
                      {session.endTime?.slice(0, 5)}
                    </div>
                    <div className="text-sm opacity-75">
                      with {session.tutor}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Session Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              SESSION NOTES (OPTIONAL)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes or requirements for this session..."
              className="rounded-xl"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedSessionId || isBooking}
            className="w-full rounded-full text-xs py-5 bg-primaryBlue disabled:bg-textSubtitle disabled:cursor-not-allowed"
          >
            {isBooking
              ? "Booking..."
              : sessionToEdit
              ? "Update Meeting"
              : "Book Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
