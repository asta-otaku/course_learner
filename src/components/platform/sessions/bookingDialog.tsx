import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Step = "time" | "tutor" | "problem";

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
  const [step, setStep] = useState<Step>("time");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("time");
      setSelectedTimeSlot("");
      setSelectedSessionId("");
      setProblem("");
    }
  }, [open, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedSessionId || !problem.trim()) return;

    try {
      await onBookMeeting(selectedSessionId, problem.trim());
      onOpenChange(false);
    } catch {
      // Error handled in parent
    }
  };

  const sessionsForDate = availableSessions.filter(
    (s: any) => s.sessionDate === selectedDate
  );

  // Unique time slots for the selected date (e.g. "10:00 - 11:00")
  const timeSlots = Array.from(
    new Set(
      sessionsForDate.map(
        (s: any) =>
          `${s.startTime?.slice(0, 5) || ""} - ${s.endTime?.slice(0, 5) || ""}`
      )
    )
  ).filter(Boolean) as string[];

  // Sessions for the selected time slot (to show tutors)
  const sessionsForTime = sessionsForDate.filter(
    (s: any) =>
      `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)}` ===
      selectedTimeSlot
  );

  const displayDate = selectedDate ? formatDisplayDate(selectedDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg px-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-base md:text-lg">
            {sessionToEdit ? "Reschedule meeting" : "Book meeting"}
          </DialogTitle>
          <p className="text-xs mt-1 text-muted-foreground font-normal">
            You can book a session up to one hour before it starts.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedDate && displayDate && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700">
                Selected date
              </h4>
              <p className="font-medium">
                {displayDate.day}, {displayDate.date}
              </p>
            </div>
          )}

          {sessionsForDate.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No available sessions for this date.</p>
              <p className="text-sm mt-1">Please select a different date.</p>
            </div>
          ) : (
            <>
              {/* Step 1: Choose time */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Select time
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTimeSlot === slot ? "default" : "outline"}
                      onClick={() => {
                        setSelectedTimeSlot(slot);
                        setSelectedSessionId("");
                        setStep("tutor");
                      }}
                      className={`rounded-xl flex flex-col justify-center py-4 h-auto ${
                        selectedTimeSlot === slot
                          ? "bg-black text-white"
                          : "bg-bgWhiteGray"
                      }`}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose tutor (after time selected) */}
              {selectedTimeSlot && sessionsForTime.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Selected time: {selectedTimeSlot}
                  </p>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Select tutor
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {sessionsForTime.map((session: any) => (
                      <Button
                        key={session.id}
                        variant={
                          selectedSessionId === session.id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setStep("problem");
                        }}
                        className={`rounded-xl flex flex-col justify-center py-4 h-auto ${
                          selectedSessionId === session.id
                            ? "bg-black text-white"
                            : "bg-bgWhiteGray"
                        }`}
                      >
                        {session.tutor}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Describe problem (required) */}
              {step !== "time" && selectedSessionId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    What is the problem or what are you stuck on? *
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Please be as detailed as possible. Ideally include the name
                    of the section, lesson, and name of quiz, and the question
                    you are stuck on, if appropriate.
                  </p>
                  <Textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="e.g. Section 3, Lesson 2, Quiz ‘Fractions’ – stuck on question 5 about equivalent fractions."
                    className="rounded-xl"
                    rows={4}
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedSessionId || !problem.trim() || isBooking
                }
                className="w-full rounded-full text-xs py-5 bg-primaryBlue disabled:bg-textSubtitle disabled:cursor-not-allowed"
              >
                {isBooking
                  ? "Booking..."
                  : sessionToEdit
                    ? "Update meeting"
                    : "Confirm booking"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
