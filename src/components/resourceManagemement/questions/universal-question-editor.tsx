"use client";

import { useState, useEffect } from "react";
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
import { MultipleChoiceEditor } from "@/components/resourceManagemement/questions";
import { TrueFalseEditor } from "@/components/resourceManagemement/questions";
import { FreeTextEditor } from "@/components/resourceManagemement/questions";
import { MatchingEditor } from "@/components/resourceManagemement/questions";
import { MathPreview } from "../editor";
import { MarkdownEditor } from "../editor";
import { ImageUpload } from "../editor/image-upload";
import { ImageControls } from "../editor/image-controls";
import { QuestionImage } from "@/components/ui/question-image";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Question } from "@/lib/validations/question";

interface UniversalQuestionEditorProps {
  question: any;
  onChange: (question: any) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "free_text", label: "Free Text" },
  { value: "matching", label: "Matching" },
  { value: "matching_pairs", label: "Matching Pairs" },
] as const;

export function UniversalQuestionEditor({
  question,
  onChange,
  onValidationChange,
}: UniversalQuestionEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate on mount
  useEffect(() => {
    validateQuestion(question);
  }, [question]);

  const handleFieldChange = (field: string, value: any) => {
    const updatedQuestion = { ...question, [field]: value };
    onChange(updatedQuestion);
    validateQuestion(updatedQuestion);
  };

  const handleTypeChange = (newType: any) => {
    let updatedQuestion: any = {
      ...question,
      type: newType,
      // Reset type-specific fields when changing type
      answers: undefined,
      acceptedAnswers: undefined,
      matching_pairs: undefined,
      metadata: question.metadata || {},
    };

    // Initialize default data for the new type
    if (newType === "multiple_choice") {
      updatedQuestion.answers = [
        { content: "", is_correct: false, order_index: 0 },
        { content: "", is_correct: false, order_index: 1 },
        { content: "", is_correct: false, order_index: 2 },
        { content: "", is_correct: false, order_index: 3 },
      ];
    } else if (newType === "true_false") {
      updatedQuestion.answers = [
        { content: "True", is_correct: false, order_index: 0 },
        { content: "False", is_correct: false, order_index: 1 },
      ];
    } else if (newType === "free_text") {
      updatedQuestion.acceptedAnswers = [{ content: "" }];
    } else if (newType === "matching" || newType === "matching_pairs") {
      updatedQuestion.matching_pairs = [
        { left: "", right: "" },
        { left: "", right: "" },
      ];
    }

    onChange(updatedQuestion);
    validateQuestion(updatedQuestion);
  };

  const validateQuestion = (q: any) => {
    const errors: string[] = [];

    // Basic validation
    if (!q.content?.trim()) {
      errors.push("Question content is required");
    }

    // Type-specific validation
    if (q.type === "multiple_choice") {
      if (!q.answers || q.answers.length < 2) {
        errors.push("Multiple choice questions need at least 2 options");
      } else {
        const hasCorrect = q.answers.some(
          (a: any) => a.is_correct || a.isCorrect
        );
        if (!hasCorrect) {
          errors.push("At least one option must be marked as correct");
        }
      }
    } else if (q.type === "true_false") {
      if (q.answers && q.answers.length === 2) {
        const hasCorrect = q.answers.some(
          (a: any) => a.is_correct || a.isCorrect
        );
        if (!hasCorrect) {
          errors.push("Either True or False must be marked as correct");
        }
      }
    } else if (q.type === "free_text") {
      if (
        !q.acceptedAnswers ||
        q.acceptedAnswers.length === 0 ||
        !q.acceptedAnswers.some((a: any) => a.content?.trim())
      ) {
        errors.push("At least one accepted answer is required");
      }
    } else if (q.type === "matching" || q.type === "matching_pairs") {
      const matchingPairs = (q as any).matching_pairs;
      if (!matchingPairs || matchingPairs.length < 2) {
        errors.push("At least 2 matching pairs are required");
      } else {
        const hasEmptyPair = matchingPairs.some(
          (p: any) => !p.left?.trim() || !p.right?.trim()
        );
        if (hasEmptyPair) {
          errors.push("All matching pairs must be filled");
        }
      }
    }

    setValidationErrors(errors);
    onValidationChange?.(errors.length === 0, errors);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content">Question Content *</Label>
            <Textarea
              id="content"
              value={question.content || ""}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              placeholder="Enter the question content. You can use Markdown and LaTeX."
              rows={4}
              className="mt-1"
            />
            {question.content && (
              <div className="mt-2 p-3 border rounded-md bg-muted/50">
                <Label className="text-xs text-muted-foreground">
                  Preview:
                </Label>
                <MathPreview
                  content={question.content}
                  renderMarkdown={true}
                  className="text-sm mt-1"
                />
              </div>
            )}
          </div>

          <div>
            <Label>Question Image (Optional)</Label>
            {question.image_url ? (
              <div className="space-y-4">
                <div className="relative">
                  <QuestionImage
                    src={question.image_url}
                    metadata={question.metadata}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => {
                      const updatedQuestion = {
                        ...question,
                        image_url: null,
                        metadata: {
                          ...question.metadata,
                          image_settings: undefined,
                        },
                      };
                      onChange(updatedQuestion);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ImageControls
                  settings={
                    question.metadata?.image_settings || {
                      size_mode: "auto",
                      alignment: "center",
                      object_fit: "contain",
                      max_height: "600px",
                    }
                  }
                  onChange={(settings) => {
                    const updatedQuestion = {
                      ...question,
                      metadata: {
                        ...question.metadata,
                        image_settings: settings,
                      },
                    };
                    onChange(updatedQuestion);
                  }}
                  imageUrl={question.image_url}
                />
              </div>
            ) : (
              <ImageUpload
                onUpload={(url) => handleFieldChange("image_url", url)}
                onError={(error) => toast.error(`Image Upload Error: ${error}`)}
                maxSize={10 * 1024 * 1024} // 10MB
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Upload an image to accompany your question (max 10MB)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Question Type *</Label>
              <Select
                value={question.type || "multiple_choice"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="type" className="mt-1">
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
              <Label htmlFor="time-limit">Time Limit (seconds)</Label>
              <Input
                id="time-limit"
                type="number"
                min="0"
                value={question.time_limit || ""}
                onChange={(e) =>
                  handleFieldChange(
                    "time_limit",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Optional time limit"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hint">Hint (optional)</Label>
            <Textarea
              id="hint"
              value={question.hint || ""}
              onChange={(e) => handleFieldChange("hint", e.target.value)}
              placeholder="Provide a hint to help students"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="correct-feedback">
                Correct Answer Feedback (optional)
              </Label>
              <MarkdownEditor
                value={question.correct_feedback || ""}
                onChange={(value) =>
                  handleFieldChange("correct_feedback", value)
                }
                placeholder="Message shown when the answer is correct. You can use Markdown and LaTeX."
                height={150}
                preview="edit"
              />
            </div>

            <div>
              <Label htmlFor="incorrect-feedback">
                Incorrect Answer Feedback (optional)
              </Label>
              <MarkdownEditor
                value={question.incorrect_feedback || ""}
                onChange={(value) =>
                  handleFieldChange("incorrect_feedback", value)
                }
                placeholder="Message shown when the answer is incorrect. You can use Markdown and LaTeX."
                height={150}
                preview="edit"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={question.is_public || false}
              onCheckedChange={(checked) =>
                handleFieldChange("is_public", checked)
              }
            />
            <Label htmlFor="public">Make this question public</Label>
          </div>
        </CardContent>
      </Card>

      {/* Answer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Configuration</CardTitle>
          <CardDescription>
            Configure the answer options based on the question type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {question.type === "multiple_choice" && (
            <MultipleChoiceEditor
              value={
                {
                  type: "multiple_choice",
                  options:
                    question.answers?.map((answer: any, index: number) => ({
                      id: String(index + 1),
                      content: answer.content || "",
                      isCorrect: answer.is_correct || false,
                      explanation: answer.explanation,
                    })) || [],
                } as any
              }
              onChange={(data) => {
                // Convert options to answers format for the backend
                const answers = data.options?.map(
                  (opt: any, index: number) => ({
                    content: opt.content || opt.text || "",
                    is_correct: opt.isCorrect,
                    order_index: index,
                    explanation: opt.explanation,
                  })
                );
                handleFieldChange("answers", answers || []);
              }}
            />
          )}

          {question.type === "true_false" && (
            <TrueFalseEditor
              question={question}
              onChange={(data) => {
                const updatedQuestion = { ...question, ...data };
                onChange(updatedQuestion);
                validateQuestion(updatedQuestion);
              }}
            />
          )}

          {question.type === "free_text" && (
            <FreeTextEditor
              question={question}
              onChange={(data) => {
                const updatedQuestion = { ...question, ...data };
                onChange(updatedQuestion);
                validateQuestion(updatedQuestion);
              }}
            />
          )}

          {(question.type === "matching" ||
            question.type === "matching_pairs") && (
            <MatchingEditor
              question={question as any}
              onChange={(data) => {
                const updatedQuestion = { ...question, ...data };
                onChange(updatedQuestion);
                validateQuestion(updatedQuestion);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-800">
                Please fix the following issues:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
