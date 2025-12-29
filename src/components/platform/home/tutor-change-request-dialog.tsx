"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePostTutorChangeRequest } from "@/lib/api/mutations";
import { toast } from "react-toastify";

interface TutorChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTutorId: string;
  currentTutorName: string;
  childProfileId: string;
  childName: string;
}

export function TutorChangeRequestDialog({
  open,
  onOpenChange,
  currentTutorId,
  currentTutorName,
  childProfileId,
  childName,
}: TutorChangeRequestDialogProps) {
  const [reason, setReason] = useState("");

  const createRequestMutation = usePostTutorChangeRequest();

  const handleSubmit = async () => {
    try {
      const result = await createRequestMutation.mutateAsync({
        childProfileId,
        currentTutorId,
        currentTutorName,
        requestedTutorId: null,
        requestedTutorName: null,
        reason: reason.trim() || null,
      });

      if (result.status === 201 || result.status === 200) {
        toast.success("Tutor change request submitted successfully");
        onOpenChange(false);
        // Reset form
        setReason("");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Request Tutor Change
          </DialogTitle>
          <DialogDescription>
            Request a tutor change for {childName}. Your current tutor is{" "}
            {currentTutorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change (Optional)
            </label>
            <Textarea
              placeholder="Please explain why you'd like to change tutors..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setReason("");
              }}
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRequestMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
