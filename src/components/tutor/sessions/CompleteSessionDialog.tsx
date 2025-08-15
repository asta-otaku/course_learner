"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { Session } from "@/lib/types";

interface CompleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: (sessionNotes: string) => void;
  isLoading?: boolean;
}

export default function CompleteSessionDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isLoading = false,
}: CompleteSessionDialogProps) {
  const [sessionNotes, setSessionNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(sessionNotes.trim() || "Session completed by tutor");
    setSessionNotes(""); // Reset notes after confirmation
  };

  const handleCancel = () => {
    setSessionNotes(""); // Reset notes when canceling
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Complete Session</DialogTitle>
              <DialogDescription className="text-left">
                Mark this session as completed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {session && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Session:</span> {session.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {session.date}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Time:</span> {session.time}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sessionNotes" className="text-sm font-medium">
              Session Notes (Optional)
            </Label>
            <Textarea
              id="sessionNotes"
              placeholder="Add any notes about the session completion..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500">
              Add any relevant notes about the session outcome.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Completing..." : "Complete Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
