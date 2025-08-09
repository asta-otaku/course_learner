import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader } from "lucide-react";
import { toast } from "react-toastify";

interface TimeSlotFormProps {
  day: string;
  onAddTimeSlot: (
    day: string,
    startTime: string,
    endTime: string,
    chunkSize: number
  ) => Promise<void>;
  isAdding?: boolean;
}

export default function TimeSlotForm({
  day,
  onAddTimeSlot,
  isAdding = false,
}: TimeSlotFormProps) {
  const [newSlot, setNewSlot] = useState({
    startTime: "",
    endTime: "",
    chunkSize: "",
  });

  const formatAndValidateTime = (value: string): string => {
    // Remove any non-digit and non-colon characters
    let cleaned = value.replace(/[^\d:]/g, "");

    // Limit to 5 characters (HH:MM)
    if (cleaned.length > 5) {
      cleaned = cleaned.substring(0, 5);
    }

    // Auto-add colon after 2 digits if not present
    if (cleaned.length === 2 && !cleaned.includes(":")) {
      cleaned += ":";
    }

    // Validate and constrain hours and minutes
    if (cleaned.includes(":")) {
      const parts = cleaned.split(":");
      let hours = parts[0];
      let minutes = parts[1] || "";

      // Constrain hours (00-23)
      if (hours.length >= 2) {
        const hourNum = parseInt(hours);
        if (hourNum > 23) {
          hours = "23";
        }
      }

      // Constrain minutes (00-59)
      if (minutes.length >= 2) {
        const minuteNum = parseInt(minutes);
        if (minuteNum > 59) {
          minutes = "59";
        }
      }

      // Reconstruct the time
      cleaned = hours + (minutes ? ":" + minutes : ":");
    }

    return cleaned;
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    const formattedTime = formatAndValidateTime(value);
    setNewSlot((prev) => ({
      ...prev,
      [field]: formattedTime,
    }));
  };

  const isValidCompleteTime = (time: string): boolean => {
    // More flexible regex that allows single digit minutes
    return /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/.test(time);
  };

  const handleAddTimeSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      return;
    }

    if (!isValidCompleteTime(newSlot.startTime)) {
      toast.error("Invalid start time format");
      return;
    }

    if (!isValidCompleteTime(newSlot.endTime)) {
      toast.error("Invalid end time format");
      return;
    }

    const chunkSize = parseInt(newSlot.chunkSize) || 20;
    if (chunkSize < 5 || chunkSize > 120) {
      toast.error("Invalid chunk size");
      return;
    }

    // Validate time range
    const [startHours, startMinutes] = newSlot.startTime.split(":").map(Number);
    const [endHours, endMinutes] = newSlot.endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (startTotalMinutes >= endTotalMinutes) {
      toast.error("Invalid time range: start >= end");
      return;
    }

    // Format times to ensure consistent HH:MM format
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    };

    const formattedStartTime = formatTime(newSlot.startTime);
    const formattedEndTime = formatTime(newSlot.endTime);

    await onAddTimeSlot(day, formattedStartTime, formattedEndTime, chunkSize);

    // Reset form
    setNewSlot({ startTime: "", endTime: "", chunkSize: "" });
  };

  return (
    <div className="mb-4 p-2 md:p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-3">Add New Time Slot</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <Input
            type="text"
            placeholder="HH:MM (24h)"
            value={newSlot.startTime}
            onChange={(e) => handleTimeChange("startTime", e.target.value)}
            className="w-full"
            maxLength={5}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <Input
            type="text"
            placeholder="HH:MM (24h)"
            value={newSlot.endTime}
            onChange={(e) => handleTimeChange("endTime", e.target.value)}
            className="w-full"
            maxLength={5}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chunk Size (minutes)
          </label>
          <Input
            type="number"
            min="5"
            max="120"
            value={newSlot.chunkSize || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNewSlot((prev) => ({
                ...prev,
                chunkSize: value,
              }));
            }}
            className="w-full"
            placeholder="20"
          />
        </div>
        <Button
          onClick={handleAddTimeSlot}
          className="flex items-center gap-2"
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Enter time in 24-hour format (e.g., 09:30, 14:00). Chunk size determines
        how the time slot is divided.
      </p>
    </div>
  );
}
