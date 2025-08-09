import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Save } from "lucide-react";
import TimeSlotForm from "./timeSlotForm";
import TimeSlotCard from "./timeSlotCard";
import EditTimeSlotForm from "./EditTimeSlotForm";
import { TimeSlot } from "@/lib/types";

interface DayCardProps {
  day: string;
  timeSlots: TimeSlot[];
  onAddTimeSlot: (
    day: string,
    startTime: string,
    endTime: string,
    chunkSize: number
  ) => Promise<void>;
  onRemoveTimeSlot: (day: string, slotId: string) => Promise<void>;
  isAdding?: boolean;
  isRemoving?: boolean;
}

export default function DayCard({
  day,
  timeSlots,
  onAddTimeSlot,
  onRemoveTimeSlot,
  isAdding = false,
  isRemoving = false,
}: DayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
  };

  const handleSaveEdit = () => {
    setEditingSlot(null);
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
  };

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{day}</h3>
          <p className="text-sm text-gray-500">
            {timeSlots.length} time slot(s) configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {isEditing && (
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Add New Time Slot Form */}
      {isEditing && (
        <div>
          <TimeSlotForm
            day={day}
            onAddTimeSlot={onAddTimeSlot}
            isAdding={isAdding}
          />
        </div>
      )}

      {/* Existing Time Slots */}
      <div className="space-y-3">
        {timeSlots.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No time slots configured for{" "}
            <span className="capitalize">{day.toLowerCase()}</span>
          </p>
        ) : (
          timeSlots.map((slot) => (
            <div key={slot.id}>
              {editingSlot?.id === slot.id ? (
                <EditTimeSlotForm
                  slot={slot}
                  day={day}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <TimeSlotCard
                  slot={slot}
                  isEditing={isEditing}
                  onRemove={(slotId) => onRemoveTimeSlot(day, slotId)}
                  onEdit={handleEditSlot}
                  isRemoving={isRemoving}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
