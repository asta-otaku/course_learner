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
} from "@/components/resourceManagemement/questions";
import { MatchingPairsEditor } from "@/components/resourceManagemement/questions/matching-pairs-editor";
import { FolderSelect } from "@/components/resourceManagemement/questions/folder-select";
import { MarkdownEditor } from "@/components/resourceManagemement/editor/markdown-editor";

import { usePostQuestion } from "@/lib/api/mutations";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
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
  { value: "matching_pairs", label: "Matching Pairs" },
] as const;

function NewQuestionForm({
  initialFolderId,
}: {
  initialFolderId: string | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId);
  const { mutateAsync: createQuestion } = usePostQuestion();

  const [formData, setFormData] = useState<any>({
    title: "",
    content: "",
    type: "multiple_choice",
    hint: "",
    correct_feedback: "",
    incorrect_feedback: "",
    is_public: true,
    image: null,
    imageUrl: null,
  });

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

    if (formData.type === "matching_pairs") {
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
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("hint", formData.hint || "");
      formDataToSend.append("correctFeedback", formData.correct_feedback || "");
      formDataToSend.append(
        "incorrectFeedback",
        formData.incorrect_feedback || ""
      );
      formDataToSend.append("isPublic", String(formData.is_public || false));

      // Add folder ID if selected
      if (folderId) {
        formDataToSend.append("folderId", folderId);
      }

      // Add image file if present
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
              isCorrect: answer.is_correct || false,
              explanation: answer.explanation || "",
              orderIndex:
                answer.order_index !== undefined ? answer.order_index : index,
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
            (formData.matching_pairs || []).map((pair: any) => ({
              left: pair.left || "",
              right: pair.right || "",
            }))
          )
        );
      }

      const result = await createQuestion(formDataToSend);

      if (result.status !== 201) {
        toast.error((result as any).error);
        return;
      }

      toast.success("Question created successfully");
      router.push(`/admin/questions/${result.data.data.id}`);
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: any) => {
    const baseFormData = {
      title: formData.title,
      content: formData.content,
      hint: formData.hint,
      correct_feedback: formData.correct_feedback,
      incorrect_feedback: formData.incorrect_feedback,
      is_public: formData.is_public,
      image: formData.image,
      imageUrl: formData.imageUrl,
      type,
    };

    setFormData(baseFormData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto py-10 max-w-4xl flex-1 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin/questions"
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

        <div className="flex-1 overflow-y-auto pb-20">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                        setFormData((prev: any) => ({
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
                        setFormData((prev: any) => ({
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
                    <Label htmlFor="hint">Hint (optional)</Label>
                    <Textarea
                      id="hint"
                      value={formData.hint || ""}
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
                        Correct Answer Feedback (optional)
                      </Label>
                      <MarkdownEditor
                        value={formData.correct_feedback || ""}
                        onChange={(value) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            correct_feedback: value,
                          }))
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
                        value={formData.incorrect_feedback || ""}
                        onChange={(value) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            incorrect_feedback: value,
                          }))
                        }
                        placeholder="Message shown when the answer is incorrect. You can use Markdown and LaTeX."
                        height={150}
                        preview="edit"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Folder</Label>
                    <FolderSelect
                      value={folderId}
                      onChange={setFolderId}
                      placeholder="Select folder (optional)"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public"
                      checked={formData.is_public || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev: any) => ({
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
                <CardTitle>Question Image (Optional)</CardTitle>
                <CardDescription>
                  Add an image to accompany your question
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.image && formData.image instanceof File ? (
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
                ) : formData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={formData.imageUrl}
                      alt="Question image"
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
                          imageUrl: null,
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
                      setFormData((prev: any) => ({
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
                      setFormData((prev: any) => ({ ...prev, ...data }))
                    }
                  />
                )}
                {formData.type === "free_text" && (
                  <FreeTextEditor
                    question={formData}
                    onChange={(data) =>
                      setFormData((prev: any) => ({ ...prev, ...data }))
                    }
                  />
                )}
                {formData.type === "matching_pairs" && (
                  <MatchingPairsEditor
                    value={formData.matching_pairs || []}
                    onChange={(pairs) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        matching_pairs: pairs,
                      }))
                    }
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-6 border-t bg-background sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/questions")}
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
              router.push("/admin/questions");
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const params = await searchParams;
  const currentFolderId = params.folder || null;

  return <NewQuestionForm initialFolderId={currentFolderId} />;
}
