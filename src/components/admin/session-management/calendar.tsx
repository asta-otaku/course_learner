"use client";

import { Session } from "@/lib/types";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, X, Users, ChevronDown } from "lucide-react";
import {
  daysOfWeek,
  formatDateString,
  months,
  formatDisplayDate,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { usePathname } from "next/navigation";

interface HoverPopupProps {
  date: Date;
  sessions: Session[];
}

const HoverPopup = ({ date, sessions }: HoverPopupProps) => {
  const displayDate = formatDisplayDate(formatDateString(date));
  const dayOfWeek = displayDate.day.toUpperCase();
  const monthDay = `${months[date.getMonth()].toUpperCase()} ${date.getDate()}`;

  return (
    <div className="p-4 min-w-[320px] max-w-[400px]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium text-sm">{monthDay}</div>
          <div className="text-xs text-gray-500">{dayOfWeek}</div>
        </div>
        <div className="text-xs font-medium text-gray-600">
          {sessions.length} SESSION{sessions.length !== 1 ? "S" : ""}
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border-b border-gray-100 pb-2 last:border-b-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {session.tutor}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Users className="w-3 h-3" />
                  {session.participants?.length || 1} Participant
                  {(session.participants?.length || 1) !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-xs text-gray-600">{session.time}</div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CalendarComponent({
  currentMonth,
  onMonthChange,
  onDateClick,
  allSessions,
}: {
  currentMonth: Date;
  onMonthChange: (direction: number) => void;
  onDateClick: (day: number) => void;
  allSessions: Session[];
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

  const getSessionsForDate = (day: number): Session[] => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = formatDateString(date);
    return allSessions.filter((session) => session.date === dateString);
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

      <div className="grid grid-cols-7 gap-1 px-8">
        {days.map((day, index) => {
          if (day === null) return <div key={index} className="h-8" />;

          const isPast = isDateInPast(day);
          const hasSession = hasSessionOnDate(day);
          const isToday =
            day === new Date().getDate() &&
            currentMonth.getMonth() === new Date().getMonth() &&
            currentMonth.getFullYear() === new Date().getFullYear();

          const sessionsForDate = hasSession ? getSessionsForDate(day) : [];
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
          );

          return (
            <div key={index} className="relative">
              {hasSession ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => onDateClick(day)}
                      disabled={isPast}
                      className={`h-8 w-8 p-0 rounded-lg font-medium mx-auto relative
                        ${isPast ? "text-textSubtitle" : "text-black"}
                        bg-[#0097FF] text-white hover:bg-[#0097FF]/50
                        ${isToday ? "ring-2 ring-primaryBlue" : ""}
                      `}
                    >
                      {day}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-auto p-0 !rounded-2xl"
                    align="center"
                  >
                    <HoverPopup date={date} sessions={sessionsForDate} />
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => onDateClick(day)}
                  disabled={isPast}
                  className={`h-8 w-8 p-0 rounded-lg font-medium mx-auto relative
                    ${isPast ? "text-textSubtitle" : "text-black"}
                    ${isToday ? "ring-2 ring-primaryBlue" : ""}
                  `}
                >
                  {day}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
