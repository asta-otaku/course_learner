"use client";

import React from "react";
import zap from "@/assets/zap.svg";
import Image from "next/image";
import type { ChildStreak } from "@/lib/types";
import { cn } from "@/lib/utils";

function dayLabel(day: string) {
  return day.slice(0, 3).toUpperCase();
}

function isToday(date: string) {
  const today = new Date();
  const iso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return date.startsWith(iso);
}

function streakMessage(streak: ChildStreak) {
  if (streak.currentStreak <= 0) {
    return "Complete an activity today to start your streak.";
  }
  if (streak.todayCompleted) {
    return "Nice work today. Come back tomorrow to keep it going.";
  }
  return "Complete today's activity so your streak doesn't end.";
}

export default function Streak({ streak }: { streak: ChildStreak }) {
  const days = streak.week ?? [];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex shrink-0 items-center gap-3">
        <Image
          src={zap}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0"
        />
        <div className="flex flex-col leading-tight whitespace-nowrap">
          <span className="text-textGray font-semibold md:text-lg">
            You are on a{" "}
            <span className="font-semibold text-primaryBlue">
              {streak.currentStreak} Day
            </span>{" "}
            Streak
          </span>
          <span className="text-xs text-textSubtitle">{streakMessage(streak)}</span>
        </div>
      </div>
      {days.length > 0 && (
        <div className="hidden shrink-0 md:flex items-center">
          {days.map((entry, index) => {
            const today = isToday(entry.date);
            return (
              <div key={`${entry.date}-${index}`} className="flex shrink-0 items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      "h-0.5 w-4 shrink-0",
                      days[index - 1]?.completed && entry.completed
                        ? "bg-primaryBlue"
                        : "bg-gray-200",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    entry.completed
                      ? "bg-primaryBlue text-white"
                      : "bg-white text-textSubtitle border border-gray-200",
                    today && "ring-2 ring-primaryBlue ring-offset-2",
                  )}
                  title={today ? "Today" : undefined}
                >
                  <span className="text-[9px] uppercase font-medium">
                    {dayLabel(entry.day)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
