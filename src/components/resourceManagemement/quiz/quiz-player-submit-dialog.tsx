"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface QuizPlayerSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  answeredCount: number;
  questionsLength: number;
  isTestMode: boolean;
}

export function QuizPlayerSubmitDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  answeredCount,
  questionsLength,
  isTestMode,
}: QuizPlayerSubmitDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
          <AlertDialogDescription>
            {isTestMode ? (
              <>
                You have answered {answeredCount} of {questionsLength} questions.
                {answeredCount < questionsLength && (
                  <span className="block mt-2 font-medium">
                    Unanswered questions will be marked as incorrect.
                  </span>
                )}
                Once submitted, you cannot change your answers.
              </>
            ) : (
              <>
                You have answered {answeredCount} of {questionsLength} questions.
                Once submitted, you cannot change your answers.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            Yes, submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
