"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { timeSlots } from "@/lib/utils";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilitySetup({
  currentStep,
}: {
  currentStep: number;
}) {
  const [availability, setAvailability] = useState<{
    [day: string]: string[];
  }>({});

  const toggleSlot = (day: string, slotId: string) => {
    setAvailability((prev) => {
      const current = prev[day] || [];
      const updated = current.includes(slotId)
        ? current.filter((id) => id !== slotId)
        : [...current, slotId];
      return { ...prev, [day]: updated };
    });
  };

  const isDaySelected = (day: string) => {
    return (availability[day] || []).length > 0;
  };

  const { push } = useRouter();

  return (
    <div>
      <div className="text-center my-6">
        <h5 className="text-textSubtitle font-medium uppercase text-sm md:text-base">
          step {currentStep + 1}/2
        </h5>
        <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 uppercase">
          SET UP YOUR AVAILABILITY
        </h2>
        <p className="text-textSubtitle font-medium mb-2">
          Choose dates and time slots
        </p>
      </div>

      <div className="max-w-lg mx-auto w-full overflow-auto hide-scrollbar h-[65vh]">
        {days.map((day) => (
          <div
            key={day}
            className="bg-white border rounded-2xl p-4 mb-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3
                  className={`font-medium ${
                    isDaySelected(day) ? "text-primaryBlue" : "text-black"
                  }`}
                >
                  {day}
                </h3>
                <p className="text-xs text-gray-500">
                  Please select time slots
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full border-2 ${
                  isDaySelected(day)
                    ? "ring-primaryBlue ring-2 bg-primaryBlue border-white"
                    : "ring-gray-400 ring-2 bg-white border-white"
                }`}
              ></div>
            </div>

            <div className="space-y-2">
              {timeSlots.map((slot) => {
                const selected = availability[day]?.includes(slot.id);
                return (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(day, slot.id)}
                    className={`cursor-pointer rounded-lg py-2 text-center font-medium ${
                      selected
                        ? "bg-primaryBlue text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  >
                    {slot.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => push("/tutor/sign-in")}
        className="w-full mt-12 bg-primaryBlue rounded-full"
      >
        Create Account
      </Button>
    </div>
  );
}
