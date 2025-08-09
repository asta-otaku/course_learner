import React from "react";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, X, Loader } from "lucide-react";
import { TimeSlot } from "@/lib/types";
import { usePutTimeslot } from "@/lib/api/mutations";
import { toast } from "react-toastify";

interface EditTimeSlotFormProps {
  slot: TimeSlot;
  day: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditTimeSlotForm({
  slot,
  day,
  onSave,
  onCancel,
}: EditTimeSlotFormProps) {
  const { mutateAsync: putTimeslot, isPending: isPuttingTimeslot } =
    usePutTimeslot(slot.isActive);

  const handleToggleStatus = async () => {
    try {
      const updateData = {
        id: slot.id,
        dayOfWeek: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        chunkSizeMinutes: slot.chunkSize,
      };

      const response = await putTimeslot(updateData);
      toast.success(response.data.message);
      onSave();
    } catch (error) {
      console.error("Toggle status error:", error);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-3">Time Slot Status</h4>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              slot.isActive ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="font-medium text-gray-800">{slot.label}</span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              slot.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {slot.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-sm text-gray-600">{slot.chunkSize} minute chunks</p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          onClick={handleToggleStatus}
          className={`flex items-center gap-2 ${
            slot.isActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          disabled={isPuttingTimeslot}
        >
          {isPuttingTimeslot ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {slot.isActive ? "Deactivating..." : "Activating..."}
            </>
          ) : (
            <>
              {slot.isActive ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  Activate
                </>
              )}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
