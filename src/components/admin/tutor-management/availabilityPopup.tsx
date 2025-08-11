"use client";

import React from "react";
import { X } from "lucide-react";
import { CalendarIcon } from "@/assets/svgs/calendar";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface AvailabilityPopupProps {
  tutorName: string;
  availability: {
    [day: string]: string[];
  };
}

const AvailabilityPopup = ({
  tutorName,
  availability,
}: AvailabilityPopupProps) => {
  // Get all unique time slots from the availability data
  const allTimeSlots = new Set<string>();
  Object.values(availability).forEach((timeSlots) => {
    timeSlots.forEach((slot) => allTimeSlots.add(slot));
  });

  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  return (
    <div className="p-4 max-w-sm md:max-w-3xl w-full shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon />
          <h3 className="font-medium text-xs md:text-sm max-w-72 md:max-w-none truncate md:truncate-none text-gray-900">
            {tutorName.toUpperCase()}'S AVAILABILITY
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Header row with days */}
        <div className="col-span-7 grid grid-cols-7 gap-1 bg-bgWhiteGray/50 rounded-lg">
          {daysOfWeek.map((day, index) => (
            <div
              key={day}
              className={`text-xs font-medium p-2 text-center truncate md:truncate-none ${
                index % 2 === 0 ? "text-gray-900" : "text-textSubtitle"
              }`}
            >
              {day.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Time slots rows */}
        {sortedTimeSlots.map((timeSlot, index) => (
          <div
            key={timeSlot}
            className={`grid grid-cols-7 gap-1 col-span-7 ${
              index % 2 === 0 ? "bg-transparent" : "bg-bgWhiteGray/50"
            }`}
          >
            {daysOfWeek.map((day) => {
              const isAvailable = availability[day]?.includes(timeSlot);
              return (
                <div
                  key={`${day}-${timeSlot}`}
                  className="text-[10px] md:text-xs p-2 text-center whitespace-nowrap"
                >
                  {isAvailable ? timeSlot : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityPopup;
