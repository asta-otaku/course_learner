"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
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
import { usePostTutorAvailability } from "@/lib/api/mutations";
import { toast } from "react-toastify";

export default function AvailabilitySetup({
  currentStep,
}: {
  currentStep: number;
}) {
  const [selectedTimeslotIds, setSelectedTimeslotIds] = useState<string[]>([]);
  const { data: timeslotsData, isLoading } = useGetTimeslots();

  const toggleSlot = (slotId: string) => {
    setSelectedTimeslotIds((prev) => {
      return prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId];
    });
  };

  const { push } = useRouter();
  const { mutateAsync: postTutorAvailability, isPending } =
    usePostTutorAvailability();

  const handleSubmit = async () => {
    if (selectedTimeslotIds.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    try {
      const response = await postTutorAvailability({
        timeSlotIds: selectedTimeslotIds,
        startToday: false,
      });
      if (response.status === 201) {
        toast.success(response.data.message);
        push("/tutor");
      }
    } catch (error) {
      console.error("Error submitting availability:", error);
    }
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
        {getAvailableDays(timeslotsData).map((day) => (
          <div
            key={day}
            className="bg-white border rounded-2xl p-4 mb-4 shadow-sm"
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
                    className={`cursor-pointer rounded-lg py-2 text-center font-medium ${
                      selected
                        ? "bg-primaryBlue text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  >
                    {formatTimeSlotLabel(slot.startTime, slot.endTime)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending || selectedTimeslotIds.length === 0}
        className="w-full mt-12 bg-primaryBlue rounded-full flex items-center gap-2"
      >
        {isPending ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </div>
  );
}
