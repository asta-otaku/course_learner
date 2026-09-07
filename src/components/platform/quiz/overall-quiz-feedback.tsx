"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MathPreview } from "@/components/resourceManagement/editor/math-preview";
import { usePatchQuizAttemptOverallFeedback } from "@/lib/api/mutations";
import { parseQuizFeedbackText } from "@/lib/utils";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

export function StudentOverallQuizFeedback({
  feedback,
}: {
  feedback?: string | null;
}) {
  const text = parseQuizFeedbackText(feedback ?? undefined).trim();
  if (!text) return null;

  return (
    <div className="mt-4">
      <p className="text-base font-medium mb-2 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-amber-600" />
        Your tutor&apos;s overall feedback:
      </p>
      <Alert className="border-2 border-amber-400 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <MathPreview
            content={text}
            renderMarkdown
            className="text-amber-900 whitespace-pre-wrap"
          />
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function TutorOverallQuizFeedback({
  attemptId,
  existingFeedback,
}: {
  attemptId: string;
  existingFeedback?: string | null;
}) {
  const parsed = parseQuizFeedbackText(existingFeedback ?? undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(parsed);

  useEffect(() => {
    if (!isEditing) {
      setLocalFeedback(parsed);
    }
  }, [parsed, isEditing]);

  const { mutate: saveFeedback, isPending } =
    usePatchQuizAttemptOverallFeedback(attemptId);

  const handleSave = () => {
    saveFeedback(
      { feedback: localFeedback },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Overall feedback saved");
        },
        onError: () => {
          toast.error("Failed to save overall feedback. Please try again.");
        },
      },
    );
  };

  const handleCancel = () => {
    setLocalFeedback(parsed);
    setIsEditing(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <Label className="text-base font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Overall quiz feedback
        </Label>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {parsed ? "Edit overall feedback" : "Add overall feedback"}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={localFeedback}
            onChange={(e) => setLocalFeedback(e.target.value)}
            placeholder="Write general feedback for the student about this quiz..."
            className="min-h-[100px]"
            disabled={isPending}
            aria-label="Overall quiz feedback"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
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
      ) : parsed ? (
        <Alert className="border-2 border-amber-400 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <MathPreview
              content={parsed}
              renderMarkdown
              className="whitespace-pre-wrap text-amber-900"
            />
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-dashed border-muted bg-muted/30">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-sm text-muted-foreground italic">
            Optional. Use &quot;Add overall feedback&quot; to leave a general
            note for the student about this quiz (separate from per-question
            feedback).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
