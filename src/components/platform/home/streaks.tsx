import React from "react";
import zap from "@/assets/zap.svg";
import Image from "next/image";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface StreakProps {
  streakDays: number;
}

export default function Streak({ streakDays }: StreakProps) {
  const todayIndex = new Date().getDay();
  const effectiveStreakDays = Math.min(streakDays, 7);

  const relevantDays = [];
  for (let i = Math.min(effectiveStreakDays - 1, todayIndex); i >= 0; i--) {
    relevantDays.unshift(WEEK_DAYS[todayIndex - i]);
  }
  if (relevantDays.length < effectiveStreakDays) {
    const daysNeeded = effectiveStreakDays - relevantDays.length;
    for (let i = 0; i < daysNeeded; i++) {
      const index = WEEK_DAYS.length - 1 - i;
      relevantDays.unshift(WEEK_DAYS[index]);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Icon + text */}
      <div className="flex items-center gap-2">
        <Image src={zap} alt="" width={0} height={0} className="w-fit" />
        <div className="flex flex-col leading-tight">
          <span className="text-textGray font-semibold md:text-lg lg:text-xl">
            You are on a{" "}
            <span className="font-semibold text-primaryBlue">
              {streakDays} Day
            </span>{" "}
            Streak
          </span>
          <span className="text-xs text-textSubtitle">
            Read everyday so your streak doesn't end.
            {streakDays > 7 && " (Showing last 7 days)"}
          </span>
        </div>
      </div>
      <div className="md:flex items-center hidden">
        {relevantDays.map((day, index) => (
          <div key={`${day}-${index}`} className="flex items-center">
            {index > 0 && <div className="h-0.5 w-5 bg-primaryBlue"></div>}
            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primaryBlue">
              <span className="text-[9px] uppercase font-medium text-white">
                {day}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
