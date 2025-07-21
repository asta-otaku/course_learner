import { Button } from "@/components/ui/button";
import { dummyTutorProfiles } from "@/lib/utils";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TutorAssigmentModal({
  isOpen,
  selectedUser,
  userData,
  onTutorSelection,
  onClose,
}: {
  isOpen: boolean;
  selectedUser: string | null;
  userData: any[];
  onTutorSelection: (tutorName: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Tutor</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Select a tutor for{" "}
            {userData.find((u) => u.id === selectedUser)?.user}:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {dummyTutorProfiles.map((tutor) => (
              <div
                key={tutor.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onTutorSelection(tutor.name)}
              >
                <div>
                  <p className="font-medium text-sm">{tutor.name}</p>
                  <p className="text-xs text-gray-500">{tutor.activity}</p>
                </div>
                <Button variant="ghost" className="text-primaryBlue text-sm">
                  Select
                </Button>
              </div>
            ))}
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
