import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import React from "react";

// --- HOMEWORK TAB COMPONENT ---
const homeworkStatuses = [
  "ALL",
  "SUBMITTED",
  "NOT DONE",
  "DONE AND MARKED",
] as const;
type HomeworkStatus = (typeof homeworkStatuses)[number];

function StudentHomeworkScheduleTab() {
  const [status, setStatus] = React.useState<HomeworkStatus>("ALL");
  // Dummy data
  const homeworks = [
    {
      title: "Homework",
      due: "2024-02-04",
      status: "SUBMITTED",
      action: "MARK",
    },
    {
      title: "Homework",
      due: "2024-02-04",
      status: "NOT DONE",
      action: "SEND MESSAGE",
    },
    {
      title: "Homework",
      due: "2024-02-04",
      status: "DONE AND MARKED",
      action: "REVIEW",
    },
  ];
  const filtered =
    status === "ALL" ? homeworks : homeworks.filter((h) => h.status === status);
  const statusColor = {
    SUBMITTED: "bg-yellow-400 text-white",
    "NOT DONE": "bg-red-600 text-white",
    "DONE AND MARKED": "bg-green-500 text-white",
  };
  const actionColor = {
    MARK: "text-primaryBlue",
    "SEND MESSAGE": "text-primaryBlue",
    REVIEW: "text-primaryBlue",
  };
  return (
    <div className="bg-white rounded-2xl p-6 min-h-[60vh]">
      <div className="flex items-center gap-4 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="border rounded-full px-4 py-1 text-sm font-medium text-black flex items-center gap-1 bg-white">
              Status: {status} <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {homeworkStatuses.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map((hw, idx) => (
          <div
            key={idx}
            className="grid grid-cols-3 border-b last:border-b-0 py-4"
          >
            <div>
              <div className="font-medium text-sm">{hw.title}</div>
              <div className="text-xs text-muted-foreground">Due Feb 4</div>
            </div>

            <span
              className={`rounded-full px-3 py-1 w-fit h-fit text-xs font-semibold ${
                statusColor[hw.status as keyof typeof statusColor]
              }`}
            >
              {hw.status}
            </span>
            <Button
              variant="link"
              className={`text-xs px-0 ${
                actionColor[hw.action as keyof typeof actionColor]
              }`}
            >
              {hw.action} <span className="ml-1">→</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentHomeworkScheduleTab;
