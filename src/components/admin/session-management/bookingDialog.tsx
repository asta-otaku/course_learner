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
  timeSlots,
  onBookMeeting,
  tutors,
  students,
  sessionToEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  timeSlots: TimeSlot[];
  onBookMeeting: (session: Omit<Session, "id">) => void;
  tutors: { id: string; name: string; displayName: string }[];
  students: { id: string; name: string; displayName: string }[];
  sessionToEdit?: Session;
}) {
  const [title, setTitle] = useState(sessionToEdit?.name || "");
  const [issue, setIssue] = useState(sessionToEdit?.issue || "");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    sessionToEdit?.timeSlot || ""
  );
  const [selectedTutor, setSelectedTutor] = useState(
    sessionToEdit?.tutor || tutors[0]?.id || ""
  );
  const [selectedStudent, setSelectedStudent] = useState(
    sessionToEdit?.student || ""
  );

  useEffect(() => {
    if (sessionToEdit) {
      setTitle(sessionToEdit.name);
      setIssue(sessionToEdit.issue || "");
      setSelectedTimeSlot(sessionToEdit.timeSlot);
      setSelectedTutor(sessionToEdit.tutor);
      setSelectedStudent(sessionToEdit.student || "");
    } else {
      setTitle("");
      setIssue("");
      setSelectedTimeSlot("");
      setSelectedTutor(tutors[0]?.id || "");
      setSelectedStudent("");
    }
  }, [sessionToEdit, tutors, students]);

  const handleSubmit = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedTutor || !title) return;

    const timeSlotData = timeSlots.find((slot) => slot.id === selectedTimeSlot);
    const selectedTutorData = tutors.find((t) => t.id === selectedTutor);
    const selectedStudentData = students.find((s) => s.id === selectedStudent);

    onBookMeeting({
      date: selectedDate,
      name: title,
      time: timeSlotData?.value || "",
      timeSlot: selectedTimeSlot,
      tutor: selectedTutorData?.name || "",
      student: selectedStudentData?.name || "",
      participants: selectedStudentData
        ? [selectedTutorData?.name || "", selectedStudentData.name]
        : [selectedTutorData?.name || ""],
      issue,
    });

    onOpenChange(false);
  };

  const displayDate = selectedDate ? formatDisplayDate(selectedDate) : null;
  const pathname = usePathname();
  const isTutor = pathname.includes("tutor");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg px-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-base md:text-lg">
            {sessionToEdit ? "Reschedule Meeting" : "Schedule Meeting"}
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

          {/* Added Session Title Input */}
          <div>
            <label className="block text-xs font-medium mb-2">
              SESSION TITLE
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Calculus Review Session"
              className="rounded-xl h-12"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              WHAT ISSUE ARE YOU CURRENTLY FACING?
            </label>
            <Textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe your learning challenge"
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              SELECT TIME SLOT
            </label>
            <div className="grid grid-cols-1 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                  onClick={() => setSelectedTimeSlot(slot.id)}
                  className={`rounded-xl flex justify-center py-5 ${
                    selectedTimeSlot === slot.id
                      ? "bg-black text-white"
                      : "bg-bgWhiteGray"
                  }`}
                >
                  {slot.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              SELECT TUTOR
            </label>
            <Select
              value={selectedTutor || "none"}
              onValueChange={(value) =>
                setSelectedTutor(value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select tutor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No tutor selected</SelectItem>
                {tutors.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              SELECT STUDENT (OPTIONAL)
            </label>
            <Select
              value={selectedStudent || "none"}
              onValueChange={(value) =>
                setSelectedStudent(value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select student (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No student selected</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedTimeSlot || !selectedTutor || !title}
            className="w-full rounded-full text-xs py-5 bg-primaryBlue disabled:bg-textSubtitle disabled:cursor-not-allowed"
          >
            {sessionToEdit ? "Update Meeting" : "Schedule Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
