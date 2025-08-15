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
import { CheckCircle2 } from "lucide-react";
import { Session } from "@/lib/types";

interface ConfirmSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: (notes: string) => void;
  isLoading?: boolean;
}

export default function ConfirmSessionDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isLoading = false,
}: ConfirmSessionDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes.trim() || "Session confirmed by tutor");
    setNotes(""); // Reset notes after confirmation
  };

  const handleCancel = () => {
    setNotes(""); // Reset notes when canceling
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Confirm Session</DialogTitle>
              <DialogDescription className="text-left">
                Confirm that this session is ready to proceed
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
              <p className="text-sm text-gray-600">
                <span className="font-medium">Student:</span>{" "}
                {session.student || "Available"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmNotes" className="text-sm font-medium">
              Confirmation Notes (Optional)
            </Label>
            <Textarea
              id="confirmNotes"
              placeholder="Add any notes about the session confirmation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500">
              Add any preparation notes or special instructions for the session.
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
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Confirming..." : "Confirm Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
