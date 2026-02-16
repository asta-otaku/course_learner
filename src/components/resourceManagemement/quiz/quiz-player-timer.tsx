"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUIZ_TIMER_URGENT_SECONDS,
  QUIZ_TIMER_WARNING_SECONDS,
  formatTimeSeconds,
} from "@/lib/utils";

export function QuizPlayerTimer({ timeRemaining }: { timeRemaining: number }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg border-2 font-mono transition-colors",
        timeRemaining <= QUIZ_TIMER_URGENT_SECONDS
          ? "bg-red-50 border-red-300 text-red-700"
          : timeRemaining <= QUIZ_TIMER_WARNING_SECONDS
            ? "bg-orange-50 border-orange-300 text-orange-700"
            : "bg-blue-50 border-blue-300 text-blue-700"
      )}
    >
      <Clock
        className={cn(
          "h-5 w-5",
          timeRemaining <= QUIZ_TIMER_URGENT_SECONDS
            ? "text-red-600"
            : timeRemaining <= QUIZ_TIMER_WARNING_SECONDS
              ? "text-orange-600"
              : "text-blue-600"
        )}
      />
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-75">Time Remaining</span>
        <span className="text-xl font-bold">
          {formatTimeSeconds(timeRemaining)}
        </span>
      </div>
    </div>
  );
}
