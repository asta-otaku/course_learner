"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultipleChoiceEditor,
  TrueFalseEditor,
  FreeTextEditor,
  MatchingEditor,
  OrderingEditor,
  CodingEditor,
} from "@/components/resourceManagemement/questions";
import { MatchingPairsEditor } from "@/components/resourceManagemement/questions/matching-pairs-editor";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { usePostQuestion } from "@/lib/api/mutations";
import { FolderSelect } from "./folder-select";

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "free_text", label: "Free Text" },
  { value: "matching_pairs", label: "Matching Pairs" },
] as const;

interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFolderId?: string | null;
  onSuccess?: (questionId: string) => void;
}

export function CreateQuestionDialog({
  open,
  onOpenChange,
  initialFolderId,
  onSuccess,
}: CreateQuestionDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createQuestionMutation = usePostQuestion();

  const initialFormData = {
    title: "",
    content: "",
    type: "multiple_choice",
    hint: "",
    correctFeedback: "",
    incorrectFeedback: "",
    isPublic: true,
    image: null,
    imageUrl: null,
  };
  const [formData, setFormData] = useState<any>(initialFormData);
  const [folderId, setFolderId] = useState<string | null>(
    initialFolderId ?? null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("hint", formData.hint || "");
      formDataToSend.append("correctFeedback", formData.correctFeedback || "");
      formDataToSend.append(
        "incorrectFeedback",
        formData.incorrectFeedback || ""
      );
      formDataToSend.append("isPublic", String(formData.isPublic || false));

      // Add image file if present
      if (formData.image && formData.image instanceof File) {
        formDataToSend.append("image", formData.image);
      } else if (formData.imageUrl) {
        formDataToSend.append("imageUrl", formData.imageUrl);
      }

      // Add folder ID if selected
      if (folderId) {
        formDataToSend.append("folderId", folderId);
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
      } else if (
        formData.type === "matching" ||
        formData.type === "matching_pairs"
      ) {
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

      const result = await createQuestionMutation.mutateAsync(formDataToSend);

      if (result.status === 201) {
        toast.success(result.data.message);
        onOpenChange(false);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionTypeEditor = () => {
    switch (formData.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceEditor
            value={{
              type: "multiple_choice",
              options:
                formData.answers?.map((ans: any, index: number) => ({
                  id: ans.id || String(index + 1),
                  content: ans.content || "",
                  isCorrect: ans.is_correct || false,
                })) || [],
            }}
            onChange={(value) =>
              setFormData((prev: any) => ({
                ...prev,
                answers: value.options.map((opt) => ({
                  content: opt.content,
                  is_correct: opt.isCorrect,
                })),
              }))
            }
          />
        );
      case "true_false":
        return (
          <TrueFalseEditor
            question={formData}
            onChange={(data) =>
              setFormData((prev: any) => ({ ...prev, ...data }))
            }
          />
        );
      case "free_text":
        return (
          <FreeTextEditor
            question={formData}
            onChange={(data) =>
              setFormData((prev: any) => ({ ...prev, ...data }))
            }
          />
        );
      case "matching":
        return (
          <MatchingEditor
            question={formData}
            onChange={(data) =>
              setFormData((prev: any) => ({ ...prev, ...data }))
            }
          />
        );
      case "matching_pairs":
        return (
          <MatchingPairsEditor
            value={formData.matchingPairs || []}
            onChange={(pairs) =>
              setFormData((prev: any) => ({
                ...prev,
                matchingPairs: pairs,
              }))
            }
          />
        );
      case "ordering":
        return (
          <OrderingEditor
            value={{
              type: "ordering",
              items: formData.orderingItems || [],
            }}
            onChange={(value) =>
              setFormData((prev: any) => ({
                ...prev,
                orderingItems: value.items,
              }))
            }
          />
        );
      case "coding":
        return (
          <CodingEditor
            question={formData}
            onChange={(data) =>
              setFormData((prev: any) => ({ ...prev, ...data }))
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new question
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 pb-6">
            {/* Step 1: Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the basic details for your question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Question Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter a descriptive title for the question"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Question Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Enter the question content. You can use Markdown and LaTeX."
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports Markdown formatting and LaTeX math expressions
                  </p>
                </div>

                <div>
                  <Label>Question Image (Optional)</Label>
                  {formData.image ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.image)}
                        alt="Question image preview"
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            image: null,
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            // 10MB limit
                            toast.error("Image size must be less than 10MB");
                            return;
                          }
                          setFormData((prev: any) => ({
                            ...prev,
                            image: file,
                          }));
                        }
                      }}
                      className="w-full p-2 border border-dashed border-gray-300 rounded-lg"
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an image to accompany your question (max 10MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Question Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData((prev: any) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Folder</Label>
                    <FolderSelect
                      value={folderId}
                      onChange={setFolderId}
                      placeholder="Select folder (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Question Type Specific */}
            <Card>
              <CardHeader>
                <CardTitle>Answer Configuration</CardTitle>
                <CardDescription>
                  Configure the answer options for your question
                </CardDescription>
              </CardHeader>
              <CardContent>{renderQuestionTypeEditor()}</CardContent>
            </Card>

            {/* Step 3: Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Options</CardTitle>
                <CardDescription>
                  Add hints, explanations, and other metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hint">Hint (Optional)</Label>
                  <Textarea
                    id="hint"
                    value={formData.hint}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        hint: e.target.value,
                      }))
                    }
                    placeholder="Provide a hint to help students"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="correct-feedback">
                      Correct Answer Feedback (Optional)
                    </Label>
                    <Textarea
                      id="correct-feedback"
                      value={formData.correctFeedback}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          correctFeedback: e.target.value,
                        }))
                      }
                      placeholder="Message shown when answer is correct"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="incorrect-feedback">
                      Incorrect Answer Feedback (Optional)
                    </Label>
                    <Textarea
                      id="incorrect-feedback"
                      value={formData.incorrectFeedback}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          incorrectFeedback: e.target.value,
                        }))
                      }
                      placeholder="Message shown when answer is incorrect"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-public"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        isPublic: checked,
                      }))
                    }
                  />
                  <Label htmlFor="is-public">Make this question public</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-4 bg-background pt-4 pb-1 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Create Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
