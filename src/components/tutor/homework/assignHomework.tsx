import { useState, useEffect, useRef } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import { ChevronDown, Loader2 } from "lucide-react";
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
import {
  useGetTutorStudent,
  useGetQuizzes,
  useGetCurrentUser,
} from "@/lib/api/queries";
import { usePostHomework } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Quiz } from "@/lib/types";

export default function AssignHomeworkForm({
  onBack,
  onAssign,
}: {
  onBack: () => void;
  onAssign?: () => void;
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const [student, setStudent] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [quizSearch, setQuizSearch] = useState("");
  const [quizDropdownOpen, setQuizDropdownOpen] = useState(false);
  const [quizPage, setQuizPage] = useState(1);
  const [accumulatedQuizzes, setAccumulatedQuizzes] = useState<Quiz[]>([]);

  // Get tutor profile to fetch tutor ID
  const { data: tutorProfileResponse, isLoading: isLoadingProfile } =
    useGetCurrentUser();
  const tutorProfile = tutorProfileResponse?.data;
  //@ts-ignore
  const tutorId = tutorProfile?.tutorProfile?.id || "";

  // Fetch students assigned to tutor
  const { data: studentsResponse, isLoading: isLoadingStudents } =
    useGetTutorStudent(tutorId);
  const students = studentsResponse || [];

  // Filter students based on search
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Fetch quizzes with search and pagination
  const { data: quizzesResponse, isLoading: isLoadingQuizzes } = useGetQuizzes({
    search: quizSearch,
    status: "published",
    page: quizPage,
    limit: 20,
  });
  const quizPagination = quizzesResponse?.pagination;

  // Accumulate quizzes from different pages
  useEffect(() => {
    if (quizzesResponse?.quizzes) {
      if (quizPage === 1) {
        // Reset accumulated quizzes on first page or new search
        setAccumulatedQuizzes(quizzesResponse.quizzes);
      } else {
        // Append new quizzes to accumulated list
        setAccumulatedQuizzes((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const newQuizzes = quizzesResponse.quizzes.filter(
            (q) => !existingIds.has(q.id)
          );
          return [...prev, ...newQuizzes];
        });
      }
    }
  }, [quizzesResponse, quizPage]);

  // Reset page when search changes (accumulated quizzes will be reset by the above effect)
  useEffect(() => {
    setQuizPage(1);
  }, [quizSearch]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!quizDropdownOpen) {
      setQuizSearch("");
    }
  }, [quizDropdownOpen]);

  // Mutation for assigning homework
  const postHomeworkMutation = usePostHomework();

  // Ref for quiz dropdown scroll
  const quizDropdownRef = useRef<HTMLDivElement>(null);

  // Handle scroll to load more quizzes
  useEffect(() => {
    if (!quizDropdownOpen || !quizDropdownRef.current) return;

    const handleScroll = () => {
      const element = quizDropdownRef.current;
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (isNearBottom && quizPagination?.hasNextPage && !isLoadingQuizzes) {
        setQuizPage((prev) => prev + 1);
      }
    };

    const element = quizDropdownRef.current;
    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [quizDropdownOpen, quizPagination, isLoadingQuizzes]);

  const selectedQuiz = accumulatedQuizzes.find((q) => q.id === quiz);

  const handleAssign = async () => {
    if (!student || !quiz || !date) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await postHomeworkMutation.mutateAsync({
        studentId: student,
        quizId: quiz,
        dueAt: date.toISOString(),
      });

      toast.success("Homework assigned successfully!");

      // Reset form
      setStudent(null);
      setQuiz("");
      setDate(undefined);
      setStudentSearch("");
      setStudentDropdownOpen(false);
      setQuizDropdownOpen(false);

      // Call onAssign callback if provided
      if (onAssign) {
        onAssign();
      }

      // Go back to homework list
      onBack();
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error("Failed to assign homework:", error);
    }
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
                disabled={isLoadingStudents || isLoadingProfile}
              >
                {student ? (
                  <span>
                    {students.find((s) => s.id === student)?.name}
                    <span className="block text-xs text-gray-400">
                      Year {students.find((s) => s.id === student)?.year}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">
                    {isLoadingStudents
                      ? "Loading students..."
                      : "Select a student"}
                  </span>
                )}
                {isLoadingStudents ? (
                  <Loader2 className="h-5 w-5 ml-auto animate-spin" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-auto" />
                )}
              </button>
              {studentDropdownOpen && !isLoadingStudents && (
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
                        key={s.id}
                        className="w-full text-left px-6 py-4 hover:bg-gray-100 focus:bg-gray-100 border-b last:border-b-0 border-gray-100"
                        onClick={() => {
                          setStudent(s.id);
                          setStudentDropdownOpen(false);
                          setStudentSearch("");
                        }}
                      >
                        <div className="font-medium">{s.name}</div>
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
              <button
                type="button"
                className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-6 py-5 text-gray-500 text-left flex items-center justify-between focus:outline-none text-base"
                onClick={() => setQuizDropdownOpen((v) => !v)}
                disabled={isLoadingQuizzes && !accumulatedQuizzes.length}
              >
                {selectedQuiz ? (
                  <span>
                    <span className="text-black">{selectedQuiz.title}</span>
                    {selectedQuiz.description && (
                      <span className="block text-xs text-gray-400">
                        {selectedQuiz.description}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-400">Select a quiz</span>
                )}
                {isLoadingQuizzes && !accumulatedQuizzes.length ? (
                  <Loader2 className="h-5 w-5 ml-auto animate-spin" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-auto" />
                )}
              </button>
              {quizDropdownOpen && (
                <div
                  ref={quizDropdownRef}
                  className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg z-10 max-h-72 overflow-y-auto border border-gray-100"
                >
                  <div className="p-4 pb-2 sticky top-0 bg-white z-20">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search quizzes"
                        value={quizSearch}
                        onChange={(e) => {
                          setQuizSearch(e.target.value);
                        }}
                        className="w-full pl-9 pr-4 py-2 focus:outline-none shadow-none bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    {accumulatedQuizzes.length === 0 && !isLoadingQuizzes && (
                      <div className="p-4 text-gray-400 text-center">
                        No quizzes found
                      </div>
                    )}
                    {accumulatedQuizzes.map((q) => (
                      <button
                        key={q.id}
                        className="w-full text-left px-6 py-4 hover:bg-gray-100 focus:bg-gray-100 border-b last:border-b-0 border-gray-100"
                        onClick={() => {
                          setQuiz(q.id || "");
                          setQuizDropdownOpen(false);
                        }}
                      >
                        <div className="font-medium">{q.title}</div>
                        {q.description && (
                          <div className="text-xs text-gray-400 line-clamp-1">
                            {q.description}
                          </div>
                        )}
                        {q.questionsCount !== undefined && (
                          <div className="text-xs text-gray-400 mt-1">
                            {q.questionsCount} questions
                          </div>
                        )}
                      </button>
                    ))}
                    {isLoadingQuizzes && (
                      <div className="p-4 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                      </div>
                    )}
                    {quizPagination?.hasNextPage && !isLoadingQuizzes && (
                      <div className="p-2 text-center text-xs text-gray-400">
                        Scroll for more
                      </div>
                    )}
                  </div>
                </div>
              )}
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
            disabled={
              !student || !quiz || !date || postHomeworkMutation.isPending
            }
          >
            {postHomeworkMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              "Assign Homework"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
