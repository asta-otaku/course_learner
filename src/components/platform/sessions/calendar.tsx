"use client";

import { Session } from "@/lib/types";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  daysOfWeek,
  formatDateString,
  months,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";


export default function CalendarComponent({
  currentMonth,
  onMonthChange,
  onDateClick,
  allSessions,
  disabled,
}: {
  currentMonth: Date;
  onMonthChange: (direction: number) => void;
  onDateClick: (day: number) => void;
  allSessions: Session[];
  disabled?: boolean;
}) {
  const getDaysInMonth = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentMonth]);

  const isDateInPast = (day: number): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return checkDate < today;
  };

  const hasSessionOnDate = (day: number): boolean => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = formatDateString(date);
    return allSessions.some((session) => session.date === dateString);
  };


  const days = getDaysInMonth();

  const pathname = usePathname();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border col-span-1 lg:col-span-2">
      <div className="mb-4">
        <h3 className="font-medium text-sm">
          {pathname.includes("tutor") ? "CALENDAR" : "BOOK MEETING"}
        </h3>
        <p className="text-xs text-textSubtitle">
          You can control availability by booking any day
        </p>
      </div>

      <div className="flex items-center justify-center bg-[#F6F8FA] border border-[#00000033] w-fit mx-auto rounded-lg bg- mb-4">
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(-1)}>
          <ChevronLeft className="w-4 h-4 text-textSubtitle" />
        </Button>
        <h4 className="font-medium text-textSubtitle text-xs">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(1)}>
          <ChevronRight className="w-4 h-4 text-textSubtitle" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 px-8">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-center p-2 bg-bgWhiteGray rounded-full"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className={`grid grid-cols-7 gap-1 px-8 ${disabled ? "opacity-40 pointer-events-none select-none" : ""}`}>
          {days.map((day, index) => {
            if (day === null) return <div key={index} className="h-8" />;

            const isPast = isDateInPast(day);
            const hasSession = hasSessionOnDate(day);
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();

            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onDateClick(day)}
                disabled={isPast}
                className={`h-8 w-8 p-0 rounded-lg font-medium mx-auto relative
                  ${isPast ? "text-textSubtitle" : "text-black"}
                  ${hasSession ? "bg-[#0097FF] text-white hover:bg-[#0097FF]/50" : ""}
                  ${isToday ? "ring-2 ring-primaryBlue" : ""}
                `}
              >
                {day}
              </Button>
            );
          })}
        </div>

        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <p className="text-xs text-center text-gray-500 bg-white/80 rounded-lg px-3 py-2">
              You already have an upcoming session booked. You can book another
              once it&apos;s completed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
