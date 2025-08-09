import React, { useState } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import { Button } from "@/components/ui/button";
import { useGetTimeslots } from "@/lib/api/queries";
import { Loader } from "lucide-react";
import { Timeslot } from "@/lib/types";
import {
  days,
  formatTimeSlotLabel,
  getAvailableDays,
  isDaySelected,
  getTimeslotsForDay,
} from "@/lib/utils";

function StepThree({ setStep }: { setStep: (step: number) => void }) {
  const [selectedTimeslotIds, setSelectedTimeslotIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const { data: timeslotsData, isLoading } = useGetTimeslots();

  const toggleSlot = (slotId: string) => {
    if (!editMode) return;
    setSelectedTimeslotIds((prev) => {
      return prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId];
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-lg text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            Loading time slots...
          </div>
        </div>
      </div>
    );
  }

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
        {getAvailableDays(timeslotsData).map((day) => (
          <div
            key={day}
            className="bg-white border rounded-2xl p-6 mb-2 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3
                  className={`font-medium ${
                    isDaySelected(day, timeslotsData, selectedTimeslotIds)
                      ? "text-primaryBlue"
                      : "text-black"
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
                  isDaySelected(day, timeslotsData, selectedTimeslotIds)
                    ? "ring-primaryBlue ring-2 bg-primaryBlue border-white"
                    : "ring-gray-400 ring-2 bg-white border-white"
                }`}
              ></div>
            </div>
            <div className="space-y-2">
              {getTimeslotsForDay(day, timeslotsData).map((slot: Timeslot) => {
                const selected = selectedTimeslotIds.includes(slot.id);
                return (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
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
                    {formatTimeSlotLabel(slot.startTime, slot.endTime)}
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
