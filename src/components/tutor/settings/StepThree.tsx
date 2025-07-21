import React, { useState } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import { Button } from "@/components/ui/button";
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

function StepThree({ setStep }: { setStep: (step: number) => void }) {
  const [availability, setAvailability] = useState<{ [day: string]: string[] }>(
    {}
  );
  const [editMode, setEditMode] = useState(false);

  const toggleSlot = (day: string, slotId: string) => {
    if (!editMode) return;
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

  return (
    <div className="w-full flex flex-col items-center px-4">
      {/* Header */}
      <div className="flex items-start gap-12 w-full">
        <div
          className="self-start text-sm cursor-pointer"
          onClick={() => setStep(1)}
        >
          <BackArrow color="#808080" />
        </div>
        <div className="flex-1 flex justify-end">
          {editMode ? (
            <Button
              className="bg-[#34C759] text-white rounded-full px-6 py-2 text-sm font-medium"
              onClick={() => setEditMode(false)}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              className="bg-primaryBlue text-white rounded-full px-6 py-2 text-sm font-medium"
              onClick={() => setEditMode(true)}
            >
              Edit Schedule
            </Button>
          )}
        </div>
      </div>
      <h1 className="text-black font-medium text-sm mb-2 w-full text-left">
        Your Schedule
      </h1>
      {/* Schedule Cards */}
      <div className="flex flex-col gap-6 w-full max-w-lg max-h-[60vh] overflow-auto mt-4">
        {days.map((day) => (
          <div
            key={day}
            className="bg-white border rounded-2xl p-6 mb-2 shadow-sm"
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
                    className={`cursor-pointer rounded-lg py-2 text-center font-medium transition-all
                      ${
                        selected
                          ? "bg-primaryBlue text-white"
                          : "bg-gray-100 text-black"
                      }
                      ${
                        editMode
                          ? "hover:bg-primaryBlue/80 hover:text-white"
                          : ""
                      }
                    `}
                  >
                    {slot.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StepThree;
