import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, X, Edit2, Loader } from "lucide-react";
import { TimeSlot } from "@/lib/types";

interface TimeSlotCardProps {
  slot: TimeSlot;
  isEditing: boolean;
  onRemove: (slotId: string) => Promise<void>;
  onEdit: (slot: TimeSlot) => void;
  isRemoving?: boolean;
  isPatching?: boolean;
}

export default function TimeSlotCard({
  slot,
  isEditing,
  onRemove,
  onEdit,
  isRemoving = false,
  isPatching = false,
}: TimeSlotCardProps) {
  return (
    <div
      className={`p-2 md:p-4 rounded-lg border ${
        isEditing
          ? "bg-red-50 border-red-200"
          : slot.isActive
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              slot.isActive ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{slot.label}</span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  slot.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {slot.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">
                {slot.chunkSize} minute chunks
              </span>
            </div>
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(slot)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(slot.id)}
              className="text-red-500 hover:text-red-700"
              disabled={isRemoving || isPatching}
            >
              {isRemoving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
