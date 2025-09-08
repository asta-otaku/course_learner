"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastError } from "@/hooks/use-toast-error";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useGetQuestionById } from "@/lib/api/queries";
import { usePutQuestion } from "@/lib/api/mutations";
import { TrueFalseEditor } from "./true-false-editor";
import { FreeTextEditor } from "./free-text-editor";
import { MatchingEditor } from "./matching-editor";
import { toast } from "@/components/ui/use-toast";
import { ImageUpload } from "../editor";
import { X } from "lucide-react";
import type { Database } from "@/lib/database.types";

type QuestionType = Database["public"]["Enums"]["question_type"];

interface QuestionEditDialogProps {
  questionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QuestionEditDialog({
  questionId,
  open,
  onOpenChange,
  onSuccess,
}: QuestionEditDialogProps) {
  const router = useRouter();
  const { showError: toastError } = useToastError();
  const [formData, setFormData] = useState<any>({});

  // Use React Query hooks
  const {
    data: result,
    isLoading: loading,
    error,
  } = useGetQuestionById(questionId);

  const updateQuestionMutation = usePutQuestion(questionId);

  // Load question data when it's available
  useEffect(() => {
    if (result?.data && open) {
      const question = result.data;

      // Initialize form data similar to the page editor
      const questionData: any = { ...question };

      // Map the image field from API response to imageUrl for consistency
      if (question.image) {
        questionData.imageUrl = question.image;
        questionData.image = null;
      }

      // Ensure metadata object exists and has the required fields
      if (!questionData.metadata) {
        questionData.metadata = {};
      }

      // Handle cases where feedback might be in the root of the response
      if (
        (question as any).correctFeedback &&
        !questionData.metadata.correctFeedback
      ) {
        questionData.metadata.correctFeedback = (
          question as any
        ).correctFeedback;
      }
      if (
        (question as any).incorrectFeedback &&
        !questionData.metadata.incorrectFeedback
      ) {
        questionData.metadata.incorrectFeedback = (
          question as any
        ).incorrectFeedback;
      }

      // Transform answers based on question type
      const answers = question.answers || [];
      if (
        question.type === "multiple_choice" ||
        question.type === "true_false"
      ) {
        questionData.answers = answers.map((a: any) => ({
          content: a.content,
          isCorrect: a.isCorrect,
          explanation: a.explanation,
          orderIndex: a.orderIndex,
        }));
      } else if (question.type === "free_text" && answers.length > 0) {
        questionData.acceptedAnswers = answers
          .filter((a: any) => a.isCorrect)
          .map((a: any) => ({
            content: a.content,
            gradingCriteria: a.gradingCriteria,
          }));
      } else if (question.type === "matching_pairs") {
        if (question.metadata?.matchingPairs) {
          questionData.matchingPairs = question.metadata.matchingPairs;
        } else if (answers.length > 0 && answers[0].matchingPairs) {
          questionData.matchingPairs = answers[0].matchingPairs;
        }
      }

      setFormData(questionData);
    }
  }, [result, open]);

  const handleTypeSpecificChange = (typeData: any) => {
    setFormData((prev) => ({ ...prev, ...typeData }));
  };

  const handleSave = async () => {
    if (!result?.data) return;

    try {
      // Create FormData for multipart/form-data submission (like the page editor)
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title || formData.content);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("type", formData.type);
      formDataToSend.append(
        "difficultyLevel",
        String(formData.difficultyLevel || 3)
      );
      formDataToSend.append("points", String(formData.points || 0));
      formDataToSend.append("timeLimit", String(formData.timeLimit || 0));
      formDataToSend.append("tags", JSON.stringify(formData.tags || []));
      formDataToSend.append("hint", formData.hint || "");
      formDataToSend.append("explanation", formData.explanation || "");
      formDataToSend.append("isPublic", String(formData.isPublic || false));
      formDataToSend.append(
        "correctFeedback",
        formData.metadata?.correctFeedback || ""
      );
      formDataToSend.append(
        "incorrectFeedback",
        formData.metadata?.incorrectFeedback || ""
      );

      // Add image file if present, or keep existing imageUrl if no new file
      if (formData.image && formData.image instanceof File) {
        formDataToSend.append("image", formData.image);
      } else if (formData.imageUrl) {
        formDataToSend.append("imageUrl", formData.imageUrl);
      }

      // Add type-specific fields
      if (
        formData.type === "multiple_choice" ||
        formData.type === "true_false"
      ) {
        formDataToSend.append(
          "answers",
          JSON.stringify(
            (formData.answers || []).map((answer: any, index: number) => ({
              content: answer.content || "",
              isCorrect: answer.isCorrect || false,
              explanation: answer.explanation || "",
              orderIndex:
                answer.orderIndex !== undefined ? answer.orderIndex : index,
            }))
          )
        );
      } else if (formData.type === "free_text") {
        formDataToSend.append(
          "acceptedAnswers",
          JSON.stringify(
            (formData.acceptedAnswers || []).map((answer: any) => ({
              content: answer.content || "",
              gradingCriteria: answer.gradingCriteria || "",
            }))
          )
        );
      } else if (formData.type === "matching_pairs") {
        formDataToSend.append(
          "matchingPairs",
          JSON.stringify(
            (formData.matchingPairs || []).map((pair: any) => ({
              left: pair.left || "",
              right: pair.right || "",
            }))
          )
        );
      }

      const result = await updateQuestionMutation.mutateAsync(formDataToSend);

      if (result.status === 200) {
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toastError("Failed to update question");
    }
  };

  const renderQuestionEditor = () => {
    if (!result?.data) return null;

    const questionData = {
      ...formData,
      // Convert answers for type-specific editors
      answers: formData.answers || [],
      acceptedAnswers: formData.acceptedAnswers || [],
      matching_pairs: formData.matchingPairs || [],
    };

    switch (formData.type) {
      case "multiple_choice":
        // For multiple choice, we'll create a simple inline editor
        return (
          <div className="space-y-4">
            <Label>Answer Options</Label>
            <div className="space-y-2">
              {(formData.answers || questionData.answers || []).map(
                (answer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={answer.isCorrect}
                      onChange={() => {
                        const newAnswers = (
                          formData.answers ||
                          questionData.answers ||
                          []
                        ).map((a, i) => ({
                          ...a,
                          isCorrect: i === index,
                        }));
                        setFormData((prev) => ({
                          ...prev,
                          answers: newAnswers,
                        }));
                      }}
                    />
                    <Input
                      value={answer.content}
                      onChange={(e) => {
                        const newAnswers = [
                          ...(formData.answers || questionData.answers || []),
                        ];
                        newAnswers[index] = {
                          ...newAnswers[index],
                          content: e.target.value,
                        };
                        setFormData((prev) => ({
                          ...prev,
                          answers: newAnswers,
                        }));
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                  </div>
                )
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentAnswers =
                  formData.answers || questionData.answers || [];
                if (currentAnswers.length < 10) {
                  setFormData((prev) => ({
                    ...prev,
                    answers: [
                      ...currentAnswers,
                      {
                        content: "",
                        isCorrect: false,
                        orderIndex: currentAnswers.length,
                      },
                    ],
                  }));
                }
              }}
              disabled={
                (formData.answers || questionData.answers || []).length >= 10
              }
            >
              Add Option
            </Button>
          </div>
        );
      case "true_false":
        return (
          <TrueFalseEditor
            question={questionData as any}
            onChange={handleTypeSpecificChange}
          />
        );
      case "free_text":
        return (
          <FreeTextEditor
            question={questionData as any}
            onChange={handleTypeSpecificChange}
          />
        );
      case "matching":
        return (
          <MatchingEditor
            question={questionData as any}
            onChange={handleTypeSpecificChange}
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Make changes to your question below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600">Failed to load question</p>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="mt-2"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Question Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Enter the main question content"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Question Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: QuestionType) =>
                        setFormData((prev) => ({ ...prev, type: value as any }))
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">
                          Multiple Choice
                        </SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="free_text">Free Text</SelectItem>
                        <SelectItem value="matching">Matching</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Question Image (Optional)</Label>
                  {formData.image_url ? (
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt="Question image"
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, image_url: null }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <ImageUpload
                      onUpload={(url) =>
                        setFormData((prev) => ({ ...prev, image_url: url }))
                      }
                      onError={(error) =>
                        toast({
                          title: "Image Upload Error",
                          description: error,
                          variant: "destructive",
                        })
                      }
                      maxSize={10 * 1024 * 1024} // 10MB
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an image to accompany your question
                  </p>
                </div>

                <div>
                  <Label htmlFor="hint">Hint (optional)</Label>
                  <Textarea
                    id="hint"
                    value={formData.hint || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hint: e.target.value }))
                    }
                    placeholder="Provide a helpful hint for students"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="correct-feedback">
                    Correct Answer Feedback (Optional)
                  </Label>
                  <Textarea
                    id="correct-feedback"
                    value={formData.correct_feedback || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        correct_feedback: e.target.value,
                      }))
                    }
                    placeholder="Message shown when answer is correct"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="incorrect-feedback">
                    Incorrect Answer Feedback (Optional)
                  </Label>
                  <Textarea
                    id="incorrect-feedback"
                    value={formData.incorrect_feedback || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        incorrect_feedback: e.target.value,
                      }))
                    }
                    placeholder="Message shown when answer is incorrect"
                    rows={2}
                  />
                </div>
              </div>

              {/* Type-specific editor */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">
                  Answer Configuration
                </h3>
                {renderQuestionEditor()}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateQuestionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || updateQuestionMutation.isPending}
          >
            {updateQuestionMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
