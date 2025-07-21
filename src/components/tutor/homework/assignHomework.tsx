import { tutorHomeworkMockData } from "@/lib/utils";
import { useState } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

export default function AssignHomeworkForm({
  onBack,
  onAssign,
}: {
  onBack: () => void;
  onAssign: (assignment: {
    student: string;
    year: string;
    homework: string;
    topic: string;
    status: string;
    action: string;
    date: Date | undefined;
  }) => void;
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const [student, setStudent] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);

  // Use mockdata for students
  const students = tutorHomeworkMockData.map((s) => ({
    label: s.student,
    value: s.student,
    year: s.year,
  }));
  // Remove duplicates
  const uniqueStudents = Array.from(
    new Map(students.map((s) => [s.value, s])).values()
  );
  const filteredStudents = uniqueStudents.filter((s) =>
    s.label.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // For demo, quizzes are static
  const quizzes = [
    { label: "Quiz 1", value: "quiz1", topic: "Algebra" },
    { label: "Quiz 2", value: "quiz2", topic: "Geometry" },
    { label: "Quiz 3", value: "quiz3", topic: "Statistics" },
    { label: "Quiz 4", value: "quiz4", topic: "Numbers" },
  ];
  const selectedQuiz = quizzes.find((q) => q.value === quiz);

  const handleAssign = () => {
    if (!student || !quiz || !date) return;
    const studentObj = uniqueStudents.find((s) => s.value === student);
    onAssign({
      student,
      year: studentObj ? `Year ${studentObj.year}` : "",
      homework: selectedQuiz ? selectedQuiz.label : quiz,
      topic: selectedQuiz ? selectedQuiz.topic : "",
      status: "TO-DO",
      action: "Start",
      date,
    });
    // Reset form
    setStudent(null);
    setQuiz("");
    setDate(undefined);
    setStudentSearch("");
    setStudentDropdownOpen(false);
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] justify-center px-4">
      <div className="w-full max-w-xl mx-auto">
        <button
          onClick={onBack}
          className="mb-8 text-gray-500 flex items-center gap-2"
        >
          <BackArrow />{" "}
        </button>
        <h2 className="text-2xl font-medium mb-8">Assign Homework</h2>
        <div className="space-y-8">
          {/* Student Dropdown */}
          <div>
            <label className="block mb-2 font-medium">Student</label>
            <div className="relative">
              <button
                type="button"
                className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-6 py-5 text-gray-500 text-left flex items-center justify-between focus:outline-none text-base"
                onClick={() => setStudentDropdownOpen((v) => !v)}
              >
                {student ? (
                  <span>
                    {student}
                    <span className="block text-xs text-gray-400">
                      Year{" "}
                      {uniqueStudents.find((s) => s.value === student)?.year}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">Place@gmail.com</span>
                )}
                <ChevronDown className="h-5 w-5 ml-auto" />
              </button>
              {studentDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg z-10 max-h-72 overflow-y-auto border border-gray-100">
                  <div className="p-4 pb-2">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 focus:outline-none shadow-none bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    {filteredStudents.length === 0 && (
                      <div className="p-4 text-gray-400 text-center">
                        No students found
                      </div>
                    )}
                    {filteredStudents.map((s) => (
                      <button
                        key={s.value}
                        className="w-full text-left px-6 py-4 hover:bg-gray-100 focus:bg-gray-100 border-b last:border-b-0 border-gray-100"
                        onClick={() => {
                          setStudent(s.value);
                          setStudentDropdownOpen(false);
                          setStudentSearch("");
                        }}
                      >
                        <div className="font-medium">{s.label}</div>
                        <div className="text-xs text-gray-400">
                          Year {s.year}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Quiz Dropdown */}
          <div>
            <label className="block mb-2 font-medium">Quiz</label>
            <div className="relative">
              <select
                className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-6 py-5 text-gray-500 focus:outline-none text-base"
                value={quiz}
                onChange={(e) => setQuiz(e.target.value)}
              >
                <option value="">Select</option>
                {quizzes.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Date Input */}
          <div>
            <label className="block mb-2 font-medium">To be submitted</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={
                    "w-full rounded-2xl border border-gray-200 bg-gray-100 px-6 py-5 text-gray-500 text-left flex items-center focus:outline-none text-base"
                  }
                >
                  <span className={date ? "text-black" : "text-gray-400"}>
                    {date ? format(date, "PPP") : "Pick a date"}
                  </span>
                  <span className="ml-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V7.5a.75.75 0 00-.75-.75h-15a.75.75 0 00-.75.75v12.75c0 .414.336.75.75.75z"
                      />
                    </svg>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            className="w-full mt-8 bg-primaryBlue text-white rounded-full py-6 text-lg font-medium shadow-none"
            onClick={handleAssign}
            disabled={!student || !quiz || !date}
          >
            Assign Homework
          </Button>
        </div>
      </div>
    </div>
  );
}
