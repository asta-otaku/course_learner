"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
} from "@/components/resourceManagemement/questions";

import { createQuestion } from "@/app/actions/questions";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import type { Question } from "@/lib/validations/question";
import dynamic from "next/dynamic";

const BulkUploadDialog = dynamic(
  () =>
    import(
      "@/components/resourceManagemement/questions/bulk-upload-dialog"
    ).then((mod) => mod.BulkUploadDialog),
  {
    ssr: false,
  }
);

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "free_text", label: "Free Text" },
  { value: "matching", label: "Matching" },
] as const;

export default function NewQuestionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const [formData, setFormData] = useState<Partial<Question>>({
    title: "",
    content: "",
    type: "multiple_choice",
    time_limit: null,
    tags: [],
    hint: "",
    explanation: "",
    is_public: false,
    points: 1, // Default points for backend
    difficulty_level: 3, // Default difficulty for backend
  });

  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title?.trim()) {
      toast.error("Please enter a question title");
      return;
    }

    if (!formData.content?.trim()) {
      toast.error("Please enter question content");
      return;
    }

    // Validate answers based on question type
    if (formData.type === "multiple_choice") {
      if (!formData.answers || formData.answers.length < 2) {
        toast.error("Please add at least 2 answer options");
        return;
      }
      const hasCorrectAnswer = formData.answers.some((a: any) => a.is_correct);
      if (!hasCorrectAnswer) {
        toast.error("Please mark at least one answer as correct");
        return;
      }
    }

    if (formData.type === "free_text") {
      if (!formData.acceptedAnswers || formData.acceptedAnswers.length === 0) {
        toast.error("Please add at least one accepted answer");
        return;
      }
    }

    if (formData.type === "true_false") {
      if (!formData.answers || formData.answers.length !== 2) {
        toast.error("True/False questions must have exactly 2 options");
        return;
      }
      const hasCorrectAnswer = formData.answers.some((a: any) => a.is_correct);
      if (!hasCorrectAnswer) {
        toast.error("Please mark either True or False as correct");
        return;
      }
    }

    if (formData.type === "matching") {
      if (!formData.matching_pairs || formData.matching_pairs.length < 2) {
        toast.error("Please add at least 2 matching pairs");
        return;
      }
      const hasEmptyPairs = formData.matching_pairs.some(
        (p: any) => !p.left?.trim() || !p.right?.trim()
      );
      if (hasEmptyPairs) {
        toast.error("Please fill in all matching pairs");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Clean up the data - remove undefined fields
      const cleanData: any = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        time_limit: formData.time_limit,
        tags: formData.tags || [],
        hint: formData.hint || "",
        explanation: formData.explanation || "",
        is_public: formData.is_public || false,
        points: formData.points || 1,
        difficulty_level: formData.difficulty_level || 3,
      };

      // Add type-specific fields
      if (
        formData.type === "multiple_choice" ||
        formData.type === "true_false"
      ) {
        cleanData.answers = formData.answers;
      } else if (formData.type === "free_text") {
        cleanData.acceptedAnswers = formData.acceptedAnswers;
      } else if (formData.type === "matching") {
        cleanData.matching_pairs = formData.matching_pairs;
      }

      const result = await createQuestion(cleanData);

      if (!result.success) {
        toast.error((result as any).error);
        return;
      }

      toast.success("Question created successfully");
      router.push(`/questions/${result.data.id}`);
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: Question["type"]) => {
    const baseFormData = {
      title: formData.title,
      content: formData.content,
      time_limit: formData.time_limit,
      tags: formData.tags,
      hint: formData.hint,
      explanation: formData.explanation,
      is_public: formData.is_public,
      points: formData.points,
      difficulty_level: formData.difficulty_level,
      type,
    };

    setFormData(baseFormData as any);
  };

  const handleTagAdd = () => {
    if (
      tagInput.trim() &&
      formData.tags &&
      !formData.tags.includes(tagInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto py-10 max-w-4xl flex-1 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/questions"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Link>
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          <form onSubmit={handleSubmit}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Question</CardTitle>
                <CardDescription>
                  Add a new question to your question bank
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter question title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Question Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Enter the question content. You can use Markdown and LaTeX."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Question Type</Label>
                    <Select
                      value={formData.type || "multiple_choice"}
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger id="type">
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
                      value={formData.time_limit || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          time_limit: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        }))
                      }
                      placeholder="Optional time limit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleTagAdd();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTagAdd}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleTagRemove(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hint">Hint (optional)</Label>
                    <Textarea
                      id="hint"
                      value={formData.hint || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hint: e.target.value,
                        }))
                      }
                      placeholder="Provide a hint to help students"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="explanation">Explanation (optional)</Label>
                    <Textarea
                      id="explanation"
                      value={formData.explanation || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          explanation: e.target.value,
                        }))
                      }
                      placeholder="Explain the correct answer"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public"
                      checked={formData.is_public || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_public: checked,
                        }))
                      }
                    />
                    <Label htmlFor="public">Make this question public</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Answer Configuration</CardTitle>
                <CardDescription>
                  Configure the answer options based on the question type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.type === "multiple_choice" && (
                  <MultipleChoiceEditor
                    value={
                      {
                        type: "multiple_choice",
                        options:
                          formData.answers?.map(
                            (answer: any, index: number) => ({
                              id: String(index + 1),
                              content: answer.content || "",
                              isCorrect: answer.is_correct || false,
                              explanation: answer.explanation,
                            })
                          ) || [],
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
                      setFormData((prev) => ({
                        ...prev,
                        ...data,
                        answers: answers || [],
                      }));
                    }}
                  />
                )}
                {formData.type === "true_false" && (
                  <TrueFalseEditor
                    question={formData}
                    onChange={(data) =>
                      setFormData((prev) => ({ ...prev, ...data }))
                    }
                  />
                )}
                {formData.type === "free_text" && (
                  <FreeTextEditor
                    question={formData}
                    onChange={(data) =>
                      setFormData((prev) => ({ ...prev, ...data }))
                    }
                  />
                )}
                {formData.type === "matching" && (
                  <MatchingEditor
                    question={formData}
                    onChange={(data) =>
                      setFormData((prev) => ({ ...prev, ...data }))
                    }
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/questions")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Question
              </Button>
            </div>
          </form>

          <BulkUploadDialog
            open={showBulkUpload}
            onOpenChange={setShowBulkUpload}
            onSuccess={() => {
              toast.success("Questions uploaded successfully");
              router.push("/questions");
            }}
          />
        </div>
      </div>
    </div>
  );
}
