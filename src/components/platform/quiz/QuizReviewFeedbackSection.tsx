"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertCircle, CheckCircle, Loader2, MessageSquare } from "lucide-react";
import { MathPreview } from "@/components/resourceManagement/editor/math-preview";
import {
  usePatchAddQuizFeedback,
  usePatchMarkQuizQuestionAsCorrect,
} from "@/lib/api/mutations";
import { parseQuizFeedbackText } from "@/lib/utils";
import { toast } from "react-toastify";

interface QuizReviewFeedbackSectionProps {
  questionId: string;
  questionAttemptId: string;
  isCorrect: boolean;
  invalidateQueryKey: readonly unknown[];
  existingFeedback: string;
  feedbackText: string;
  onFeedbackChange: (text: string) => void;
  editingFeedback: string | null;
  setEditingFeedback: (id: string | null) => void;
}

export function QuizReviewFeedbackSection({
  questionId,
  questionAttemptId,
  isCorrect,
  invalidateQueryKey,
  existingFeedback,
  feedbackText,
  onFeedbackChange,
  editingFeedback,
  setEditingFeedback,
}: QuizReviewFeedbackSectionProps) {
  const queryClient = useQueryClient();
  const [showMarkCorrectDialog, setShowMarkCorrectDialog] = useState(false);
  const [addToCorrectOptions, setAddToCorrectOptions] = useState(false);

  const parsedExistingFeedback = parseQuizFeedbackText(existingFeedback);
  const parsedFeedbackText = parseQuizFeedbackText(feedbackText);
  const currentFeedback = parsedFeedbackText || parsedExistingFeedback;

  const [localFeedback, setLocalFeedback] = useState(currentFeedback);
  const isEditing = editingFeedback === questionId;

  useEffect(() => {
    if (!isEditing) {
      setLocalFeedback(currentFeedback);
    }
  }, [questionId, currentFeedback, isEditing]);

  const { mutate: addFeedback, isPending } =
    usePatchAddQuizFeedback(questionAttemptId);

  const {
    mutate: markQuestionAsCorrect,
    isPending: isMarkingQuestionAsCorrect,
  } = usePatchMarkQuizQuestionAsCorrect(questionAttemptId);

  const handleSaveFeedback = () => {
    addFeedback(
      { feedback: localFeedback },
      {
        onSuccess: () => {
          onFeedbackChange(localFeedback);
          setEditingFeedback(null);
          toast.success("Feedback saved successfully!");
        },
        onError: (error) => {
          console.error("Error saving feedback:", error);
          toast.error("Failed to save feedback. Please try again.");
        },
      },
    );
  };

  const handleMarkAsCorrect = () => {
    if (!questionAttemptId) {
      toast.error("Missing question attempt ID. Cannot mark as correct.");
      return;
    }

    const trimmed = localFeedback.trim();
    markQuestionAsCorrect(
      {
        ...(trimmed ? { feedback: trimmed } : {}),
        addToCorrectOptions,
      },
      {
        onSuccess: () => {
          if (trimmed) onFeedbackChange(trimmed);
          setEditingFeedback(null);
          setShowMarkCorrectDialog(false);
          setAddToCorrectOptions(false);
          queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey] });
          toast.success("Question marked as correct.");
        },
        onError: (error) => {
          console.error("Error marking question as correct:", error);
          toast.error("Failed to mark question as correct. Please try again.");
        },
      },
    );
  };

  const handleCancel = () => {
    setLocalFeedback(currentFeedback);
    setEditingFeedback(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <Label className="text-base font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Your tutor&apos;s feedback:
        </Label>
        <div className="flex items-center gap-2">
          {!isCorrect && questionAttemptId && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => {
                setAddToCorrectOptions(false);
                setShowMarkCorrectDialog(true);
              }}
              disabled={isMarkingQuestionAsCorrect}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Mark as Correct
            </Button>
          )}
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingFeedback(questionId)}
            >
              Add more feedback
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={localFeedback}
            onChange={(e) => setLocalFeedback(e.target.value)}
            placeholder="Write additional feedback for the student..."
            className="min-h-[100px]"
            disabled={isPending || isMarkingQuestionAsCorrect}
            aria-label="Your tutor's feedback"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending || isMarkingQuestionAsCorrect}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFeedback}
              disabled={isPending || isMarkingQuestionAsCorrect}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Feedback"
              )}
            </Button>
          </div>
        </div>
      ) : currentFeedback ? (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <MathPreview
              content={currentFeedback}
              renderMarkdown
              className="whitespace-pre-wrap text-yellow-800"
            />
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-dashed border-muted bg-muted/30">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-sm text-muted-foreground italic">
            No tutor feedback yet. Use &quot;Add more feedback&quot; to leave a
            note for the student (separate from the system feedback above).
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog
        open={showMarkCorrectDialog}
        onOpenChange={(open) => {
          if (!isMarkingQuestionAsCorrect) {
            setShowMarkCorrectDialog(open);
            if (!open) setAddToCorrectOptions(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this question as correct?</AlertDialogTitle>
            <AlertDialogDescription>
              This overrides the automatic grade and awards full points for this
              question. You can optionally include feedback for the student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`mark-correct-feedback-${questionId}`}>
                Your tutor&apos;s feedback (optional)
              </Label>
              <Textarea
                id={`mark-correct-feedback-${questionId}`}
                value={localFeedback}
                onChange={(e) => setLocalFeedback(e.target.value)}
                placeholder="Optional note for the student..."
                className="min-h-[90px]"
                disabled={isMarkingQuestionAsCorrect}
              />
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id={`add-to-correct-options-${questionId}`}
                checked={addToCorrectOptions}
                onCheckedChange={(checked) =>
                  setAddToCorrectOptions(checked === true)
                }
                disabled={isMarkingQuestionAsCorrect}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor={`add-to-correct-options-${questionId}`}
                  className="cursor-pointer font-medium"
                >
                  Also add this answer to correct options
                </Label>
                <p className="text-xs text-muted-foreground">
                  Include the student&apos;s answer in the question&apos;s
                  correct answers for future attempts.
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isMarkingQuestionAsCorrect}
              onClick={() => setAddToCorrectOptions(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleMarkAsCorrect();
              }}
              disabled={isMarkingQuestionAsCorrect}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarkingQuestionAsCorrect ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                "Mark as Correct"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
