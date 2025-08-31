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
import { getQuestionById, updateQuestion } from "@/app/actions/questions";
import { TrueFalseEditor } from "./true-false-editor";
import { FreeTextEditor } from "./free-text-editor";
import { MatchingEditor } from "./matching-editor";
import { toast } from "@/components/ui/use-toast";
import { ImageUpload } from "../editor";
import { X } from "lucide-react";
import type { Database } from "@/lib/database.types";
import type { UpdateQuestion } from "@/lib/validations/question";

type QuestionType = Database["public"]["Enums"]["question_type"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["question_answers"]["Row"];

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [formData, setFormData] = useState<Partial<UpdateQuestion>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load question data when dialog opens
  useEffect(() => {
    if (open && questionId && !hasLoaded) {
      setLoading(true);
      setHasLoaded(true);

      getQuestionById(questionId)
        .then((result) => {
          if (result.success) {
            setQuestion(result.data.question);
            setAnswers(result.data.answers);

            // Initialize form data
            setFormData({
              id: result.data.question.id,
              content: result.data.question.content,
              type: result.data.question.type as any,
              time_limit: result.data.question.time_limit,
              hint: result.data.question.hint,
              is_public: result.data.question.is_public,
              image_url: result.data.question.image_url,
              metadata: result.data.question.metadata as any,
              correct_feedback: result.data.question.correct_feedback,
              incorrect_feedback: result.data.question.incorrect_feedback,
            });
          } else {
            toastError((result as any).error);
            onOpenChange(false);
          }
        })
        .catch(() => {
          toastError("Failed to load question");
          onOpenChange(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // Reset hasLoaded when dialog closes
    if (!open) {
      setHasLoaded(false);
    }
  }, [open, questionId, toastError, onOpenChange]);

  const handleTypeSpecificChange = (typeData: any) => {
    setFormData((prev) => ({ ...prev, ...typeData }));
  };

  const handleSave = async () => {
    if (!question) return;

    setSaving(true);
    try {
      // Prepare update data based on question type
      const updateData: UpdateQuestion = {
        id: question.id,
        ...formData,
      };

      // Add type-specific data
      if (
        formData.type === "multiple_choice" ||
        formData.type === "true_false"
      ) {
        if (formData.answers) {
          updateData.answers = formData.answers;
        }
      } else if (formData.type === "free_text") {
        if (formData.acceptedAnswers) {
          updateData.acceptedAnswers = formData.acceptedAnswers;
        }
      } else if (formData.type === "matching") {
        if (formData.matching_pairs) {
          updateData.metadata = {
            ...updateData.metadata,
            matching_pairs: formData.matching_pairs,
          };
        }
      }

      const result = await updateQuestion(updateData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toastError((result as any).error);
      }
    } catch (_error) {
      toastError("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionEditor = () => {
    if (!question) return null;

    const questionData = {
      ...formData,
      // Convert answers for type-specific editors
      answers: answers.map((a) => ({
        content: a.content,
        is_correct: a.is_correct || false,
        explanation: a.explanation,
        order_index: a.order_index,
      })),
      acceptedAnswers: answers
        .filter((a) => a.is_correct)
        .map((a) => ({
          content: a.content,
          grading_criteria: a.grading_criteria,
        })),
      matching_pairs: formData.metadata?.matching_pairs || [],
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
                      checked={answer.is_correct}
                      onChange={() => {
                        const newAnswers = (
                          formData.answers ||
                          questionData.answers ||
                          []
                        ).map((a, i) => ({
                          ...a,
                          is_correct: i === index,
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
                        is_correct: false,
                        order_index: currentAnswers.length,
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
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
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
