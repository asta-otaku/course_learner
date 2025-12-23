"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import React from "react";
import { useGetHomework } from "@/lib/api/queries";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import BackArrow from "@/assets/svgs/arrowback";
// --- HOMEWORK TAB COMPONENT ---
const homeworkStatuses = [
  "All",
  "to-do",
  "submitted",
  "done and marked",
] as const;
type HomeworkStatus = (typeof homeworkStatuses)[number];

const statusLabels: Record<string, string> = {
  "to-do": "TO-DO",
  submitted: "SUBMITTED",
  "done and marked": "DONE AND MARKED",
};

function StudentHomeworkScheduleTab({ studentId }: { studentId: string }) {
  const [status, setStatus] = React.useState<HomeworkStatus>("All");
  const router = useRouter();

  // Fetch homework data for this student
  const { data: homeworkResponse, isLoading } = useGetHomework(studentId);
  const homeworks = homeworkResponse?.data || [];

  // Filter by status
  const filtered =
    status === "All"
      ? homeworks
      : homeworks.filter(
          (h) => h.status?.toLowerCase() === status.toLowerCase()
        );

  const statusColor: Record<string, string> = {
    "to-do": "bg-primaryBlue text-white",
    submitted: "bg-yellow-400 text-white",
    "done and marked": "bg-green-500 text-white",
  };

  const actionColor = {
    REVIEW: "text-primaryBlue",
  };
  return (
    <div className="bg-white rounded-2xl p-6 min-h-[60vh]">
      <div className="flex items-center gap-4 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="border rounded-full px-4 py-1 text-sm font-medium text-black flex items-center gap-1 bg-white">
              Status:{" "}
              {status === "All"
                ? "All"
                : statusLabels[status as keyof typeof statusLabels]}{" "}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {homeworkStatuses.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
                {s === "All"
                  ? "All"
                  : statusLabels[s as keyof typeof statusLabels]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
            <p className="text-gray-500 text-sm">Loading homework...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-medium mb-1">
                No homework found
              </p>
              <p className="text-gray-500 text-sm">
                {status !== "All"
                  ? "No homework with this status"
                  : "This student has no homework assigned yet"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((hw, idx) => {
            const hwStatus = hw.status?.toLowerCase();
            const canReview =
              hwStatus === "submitted" || hwStatus === "done and marked";

            return (
              <div
                key={hw.id || idx}
                className="grid grid-cols-3 border-b last:border-b-0 py-4"
              >
                <div>
                  <div className="font-medium text-sm">Quiz Assignment</div>
                  <div className="text-xs text-muted-foreground">
                    {hw.dueDate
                      ? `Due ${format(new Date(hw.dueDate), "MMM d, yyyy")}`
                      : "No due date"}
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 w-fit h-fit text-xs font-semibold ${
                    statusColor[hwStatus || ""] || "bg-gray-500 text-white"
                  }`}
                >
                  {statusLabels[hwStatus as keyof typeof statusLabels] ||
                    hw.status?.toUpperCase() ||
                    "UNKNOWN"}
                </span>
                {canReview ? (
                  <Button
                    variant="link"
                    className="text-xs px-0 text-primaryBlue"
                    onClick={() => {
                      router.push(`/tutor/homework/${hw.id}/review`);
                    }}
                  >
                    Review <BackArrow color="#286CFF" flipped />
                  </Button>
                ) : (
                  <div className="text-xs text-gray-400 font-medium">
                    Waiting for submission
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentHomeworkScheduleTab;
