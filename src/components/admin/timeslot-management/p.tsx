"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";
import DayCard from "./dayCard";
import { DayAvailability, TimeslotCreateData } from "@/lib/types";
import {
  usePostTimeslots,
  usePostTimeslot,
  useDeleteTimeslot,
} from "@/lib/api/mutations";
import { useGetTimeslots } from "@/lib/api/queries";
import { days } from "@/lib/utils";

export default function TimeSlotManagement() {
  const [availability, setAvailability] = useState<DayAvailability>({});

  // API hooks
  const { data: timeslotsData, isLoading, refetch } = useGetTimeslots();
  const { mutateAsync: postTimeslots, isPending: isPostingTimeslots } =
    usePostTimeslots();
  const { mutateAsync: postTimeslot, isPending: isPostingTimeslot } =
    usePostTimeslot();
  const { mutateAsync: deleteTimeslot, isPending: isDeletingTimeslot } =
    useDeleteTimeslot();

  // Load existing timeslots on component mount
  useEffect(() => {
    if (timeslotsData?.data) {
      const timeslots = timeslotsData.data;
      const groupedSlots: DayAvailability = {};

      timeslots.forEach((slot: any) => {
        // Keep dayOfWeek capitalized for consistency
        const dayKey = slot.dayOfWeek;

        if (!groupedSlots[dayKey]) {
          groupedSlots[dayKey] = [];
        }

        // Format time to remove seconds (HH:MM:SS -> HH:MM)
        const formatTime = (time: string) => {
          return time.substring(0, 5);
        };

        const formattedSlot = {
          id: slot.id,
          label: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          chunkSize: slot.chunkSizeMinutes || 20,
          isActive: slot.isActive,
        };

        groupedSlots[dayKey].push(formattedSlot);
      });

      setAvailability(groupedSlots);
    }
  }, [timeslotsData]);

  const handleAddTimeSlot = async (
    day: string,
    startTime: string,
    endTime: string,
    chunkSize: number
  ) => {
    try {
      const timeslotData: TimeslotCreateData = {
        dayOfWeek: day,
        startTime,
        endTime,
        chunkSizeMinutes: chunkSize,
      };

      const response = await postTimeslot(timeslotData);

      if (response?.data?.data) {
        const newSlot = response.data.data;
        const slot = {
          id: newSlot.id,
          label: `${startTime} - ${endTime}`,
          startTime,
          endTime,
          chunkSize,
        };

        setAvailability((prev) => {
          const newAvailability = {
            ...prev,
            [day]: [...(prev[day] || []), slot],
          };
          return newAvailability;
        });

        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Failed to add time slot", error);
    }
  };

  const handleRemoveTimeSlot = async (day: string, slotId: string) => {
    try {
      const response = await deleteTimeslot({ id: slotId });

      setAvailability((prev) => ({
        ...prev,
        [day]: prev[day]?.filter((slot) => slot.id !== slotId) || [],
      }));
      toast.success(response.data.message);
    } catch (error) {
      console.error("Failed to remove time slot", error);
    }
  };

  const handleSaveAllChanges = async () => {
    try {
      // Convert availability to TimeslotCreateData format
      const allTimeSlots: TimeslotCreateData[] = [];

      Object.entries(availability).forEach(([day, slots]) => {
        slots.forEach((slot) => {
          allTimeSlots.push({
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            chunkSizeMinutes: slot.chunkSize,
          });
        });
      });

      if (allTimeSlots.length > 0) {
        const response = await postTimeslots({ timeSlots: allTimeSlots });
        toast.success(response.data.message);
        refetch(); // Refresh the data
      } else {
        toast.info("No time slots to save");
      }
    } catch (error) {
      console.error("Failed to save changes", error);
    }
  };

  const getTotalSlots = () => {
    return Object.values(availability).flat().length;
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Time Slot Management
        </h1>
        <p className="text-gray-600">
          Create and manage available time slots for each day of the week
        </p>
      </div>

      <div className="grid gap-6 w-full">
        {days.map((day) => (
          <DayCard
            key={day}
            day={day}
            timeSlots={availability[day] || []}
            onAddTimeSlot={handleAddTimeSlot}
            onRemoveTimeSlot={handleRemoveTimeSlot}
            isAdding={isPostingTimeslot}
            isRemoving={isDeletingTimeslot}
          />
        ))}
      </div>

      {/* Global Actions */}
      <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="text-sm text-gray-600">
          Total time slots: {getTotalSlots()}
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSaveAllChanges} disabled={isPostingTimeslots}>
            {isPostingTimeslots ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
