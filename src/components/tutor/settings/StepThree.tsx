import React, { useState, useEffect } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import { Button } from "@/components/ui/button";
import { useGetTimeslots, useGetTutorAvailability } from "@/lib/api/queries";
import { usePostTutorAvailability } from "@/lib/api/mutations";
import { Loader } from "lucide-react";
import { Timeslot } from "@/lib/types";
import {
  formatTimeSlotLabel,
  getAvailableDays,
  getTimeslotsForDay,
} from "@/lib/utils";
import { toast } from "react-toastify";

function StepThree({ setStep }: { setStep: (step: number) => void }) {
  const [selectedTimeslotIds, setSelectedTimeslotIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: timeslotsData, isLoading } = useGetTimeslots();
  const { data: tutorAvailability, isLoading: isTutorAvailabilityLoading } =
    useGetTutorAvailability();

  const { mutateAsync: postTutorAvailability, isPending } =
    usePostTutorAvailability();

  // Initialize selected timeslots with existing tutor availability
  useEffect(() => {
    if (tutorAvailability?.data && timeslotsData?.data) {
      // The API returns an array of time slots directly
      const existingSlotIds = Array.isArray(tutorAvailability.data)
        ? tutorAvailability.data.map((slot: any) => slot.id)
        : [];
      setSelectedTimeslotIds(existingSlotIds);
    }
  }, [tutorAvailability, timeslotsData]);

  const toggleSlot = (slotId: string) => {
    if (!editMode) return;
    setSelectedTimeslotIds((prev) => {
      return prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId];
    });
  };

  const handleSaveChanges = async () => {
    if (selectedTimeslotIds.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await postTutorAvailability({
        timeSlotIds: selectedTimeslotIds,
        startToday: false,
      });

      if (response.status === 201) {
        toast.success(response.data.message);
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original selection
    if (tutorAvailability?.data && Array.isArray(tutorAvailability.data)) {
      const existingSlotIds = tutorAvailability.data.map(
        (slot: any) => slot.id
      );
      setSelectedTimeslotIds(existingSlotIds);
    }
    setEditMode(false);
  };

  if (isLoading || isTutorAvailabilityLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-lg text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            Loading availability data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setStep(2)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <BackArrow />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Availability Settings
          </h1>
          <p className="text-gray-600">Manage your available time slots</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Time Slots</h2>
            <p className="text-sm text-gray-600">
              Select the time slots when you're available for tutoring sessions
            </p>
          </div>

          <div className="flex gap-3">
            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-primaryBlue hover:bg-primaryBlue/90"
              >
                Edit Availability
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isUpdating || selectedTimeslotIds.length === 0}
                  className="bg-primaryBlue hover:bg-primaryBlue/90"
                >
                  {isUpdating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {getAvailableDays(timeslotsData).map((day) => (
            <div key={day} className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 capitalize">
                {day.toLowerCase()}
              </h3>

              <div className="space-y-2">
                {getTimeslotsForDay(day, timeslotsData).map(
                  (slot: Timeslot) => {
                    const isSelected = selectedTimeslotIds.includes(slot.id);
                    return (
                      <div
                        key={slot.id}
                        onClick={() => toggleSlot(slot.id)}
                        className={`cursor-pointer rounded-lg py-2 text-center font-medium transition-all ${
                          editMode
                            ? isSelected
                              ? "bg-primaryBlue text-white"
                              : "bg-gray-100 text-black hover:bg-gray-200"
                            : isSelected
                            ? "bg-primaryBlue text-white"
                            : "bg-gray-100 text-black"
                        } ${!editMode ? "cursor-default" : ""}`}
                      >
                        {formatTimeSlotLabel(slot.startTime, slot.endTime)}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>

        {editMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Edit Mode</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Click on time slots to select or deselect them. Your changes
                  will be saved when you click "Save Changes".
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            {selectedTimeslotIds.length} time slot(s) selected
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepThree;
