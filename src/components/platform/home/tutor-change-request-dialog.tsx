"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useGetTutors } from "@/lib/api/queries";
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

// Parent-specific tutor type (different from admin TutorDetails)
interface ParentTutorOption {
  id: string;
  tutorName: string;
}

export function TutorChangeRequestDialog({
  open,
  onOpenChange,
  currentTutorId,
  currentTutorName,
  childProfileId,
  childName,
}: TutorChangeRequestDialogProps) {
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tutorsResponse, isLoading: isFetchingTutors } = useGetTutors();
  const createRequestMutation = usePostTutorChangeRequest();

  // Filter tutors: exclude current tutor and apply search
  // Parent API returns: { id, tutorName } - different structure from admin
  const availableTutors = (
    (tutorsResponse?.data || []) as unknown as ParentTutorOption[]
  ).filter(
    (tutor) =>
      tutor.id !== currentTutorId &&
      tutor.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTutor = availableTutors.find((t) => t.id === selectedTutorId);

  const handleSubmit = async () => {
    if (!selectedTutorId || !selectedTutor) {
      toast.error("Please select a tutor");
      return;
    }

    try {
      const result = await createRequestMutation.mutateAsync({
        childProfileId,
        currentTutorId,
        currentTutorName,
        requestedTutorId: selectedTutorId,
        requestedTutorName: selectedTutor.tutorName,
        reason: reason.trim() || null,
      });

      if (result.status === 201 || result.status === 200) {
        toast.success("Tutor change request submitted successfully");
        onOpenChange(false);
        // Reset form
        setSelectedTutorId(null);
        setReason("");
        setSearchQuery("");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Request Tutor Change
          </DialogTitle>
          <DialogDescription>
            Select a new tutor for {childName}. Your current tutor is{" "}
            {currentTutorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tutors by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tutor List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {isFetchingTutors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableTutors.length > 0 ? (
              availableTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTutorId === tutor.id
                      ? "border-primary bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedTutorId(tutor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-primary font-semibold text-lg">
                          {tutor.tutorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {tutor.tutorName}
                        </h3>
                        <p className="text-sm text-gray-600">Tutor</p>
                      </div>
                    </div>
                    {selectedTutorId === tutor.id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "No tutors found matching your search"
                  : "No other tutors available at the moment"}
              </div>
            )}
          </div>

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
                setSelectedTutorId(null);
                setReason("");
                setSearchQuery("");
              }}
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedTutorId || createRequestMutation.isPending}
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
