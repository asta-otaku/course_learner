import { Button } from "@/components/ui/button";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePatchChildTutor } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";

export default function TutorAssigmentModal({
  isOpen,
  selectedUser,
  userData,
  tutorsData,
  onTutorSelection,
  onClose,
}: {
  isOpen: boolean;
  selectedUser: string | null;
  userData: any[];
  tutorsData?: any[];
  onTutorSelection: () => void;
  onClose: () => void;
}) {
  const { mutateAsync: assignTutor, isPending } = usePatchChildTutor();

  const selectedChild = userData.find((u) => u.id === selectedUser);

  const handleTutorAssignment = async (tutorId: string, tutorName: string) => {
    if (!selectedUser) return;

    try {
      const response = await assignTutor({
        childProfileId: selectedUser,
        tutorId: tutorId,
      });

      if (response.status === 200) {
        toast.success(
          `Successfully assigned ${tutorName} to ${selectedChild?.childName}`
        );
        onTutorSelection(); // This will close modal and handle any cleanup
      }
    } catch (error) {
      console.error("Error assigning tutor:", error);
      toast.error("Failed to assign tutor. Please try again.");
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Tutor</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Select a tutor for{" "}
            <span className="font-medium">{selectedChild?.childName}</span>:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tutorsData && tutorsData.length > 0 ? (
              tutorsData.map((tutor) => (
                <div
                  key={tutor.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    handleTutorAssignment(
                      tutor.id,
                      `${tutor.user.firstName} ${tutor.user.lastName}`
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      {tutor.avatar && tutor.avatar !== "null" ? (
                        <img
                          src={tutor.avatar}
                          alt={`${tutor.user.firstName} ${tutor.user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">
                            {tutor.user.firstName[0]}
                            {tutor.user.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tutor.user.firstName} {tutor.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tutor.assignedStudents?.length || 0} assigned students
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-primaryBlue text-sm"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      "Select"
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No tutors available</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
