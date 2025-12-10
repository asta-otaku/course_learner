"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
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
} from "@/components/resourceManagemement/questions";
import { MatchingPairsEditor } from "@/components/resourceManagemement/questions/matching-pairs-editor";
import { useGetQuestionById } from "@/lib/api/queries";
import { usePutQuestion } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { ArrowLeft, Loader2, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ImageControls } from "@/components/resourceManagemement/editor/image-controls";
import { QuestionImage } from "@/components/ui/question-image";

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "free_text", label: "Free Text" },
  { value: "matching", label: "Matching" },
  { value: "matching_pairs", label: "Matching" },
] as const;

export default function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id: questionId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalType, setOriginalType] = useState<string>("multiple_choice");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    title: "",
    content: "",
    type: "multiple_choice",
    difficultyLevel: 3,
    points: 0,
    timeLimit: null,
    tags: [],
    hint: "",
    explanation: "",
    isPublic: false,
    imageUrl: null,
    image: null,
    metadata: {
      correctFeedback: "",
      incorrectFeedback: "",
    },
  });

  const [tagInput, setTagInput] = useState("");

  const {
    data: result,
    isLoading: isFetching,
    error,
  } = useGetQuestionById(questionId);
  const updateQuestionMutation = usePutQuestion(questionId);

  useEffect(() => {
    if (result?.data) {
      loadQuestionData(result.data);
    }
  }, [result]);

  const loadQuestionData = (question: any) => {
    const answers = question.answers || [];
    const questionData: any = { ...question };

    // Map the image field from API response to imageUrl for consistency
    if (question.image) {
      questionData.imageUrl = question.image;
      questionData.image = null; // Reset the file input
    }

    // Ensure metadata object exists and has the required fields
    if (!questionData.metadata) {
      questionData.metadata = {};
    }

    // Handle cases where feedback might be in the root of the response
    if (question.correctFeedback && !questionData.metadata.correctFeedback) {
      questionData.metadata.correctFeedback = question.correctFeedback;
    }
    if (
      question.incorrectFeedback &&
      !questionData.metadata.incorrectFeedback
    ) {
      questionData.metadata.incorrectFeedback = question.incorrectFeedback;
    }

    // Handle image settings - check both top level and metadata
    // Backend returns imageSettings at top level (camelCase)
    if (question.imageSettings) {
      questionData.metadata.image_settings = question.imageSettings;
    } else if (question.image_settings) {
      // Also check snake_case version
      questionData.metadata.image_settings = question.image_settings;
    } else if (question.metadata?.image_settings) {
      // Fallback to metadata if present
      questionData.metadata.image_settings = question.metadata.image_settings;
    }

    // Transform answers based on question type
    if (question.type === "multiple_choice" || question.type === "true_false") {
      questionData.answers = answers.map((a: any) => ({
        content: a.content,
        isCorrect: a.isCorrect,
        explanation: a.explanation,
        orderIndex: a.orderIndex,
      }));
    } else if (question.type === "free_text" && answers.length > 0) {
      // Free text questions might have sample answers
      questionData.sampleAnswer = answers[0]?.content || "";
    } else if (question.type === "matching" && question.metadata) {
      // Matching questions would have pairs in metadata
      const metadata = question.metadata as any;
      questionData.matchingPairs = metadata.matchingPairs || [];
    } else if (question.type === "matching_pairs") {
      // For matching_pairs, prioritize metadata.matchingPairs over answers[0].matchingPairs
      if (question.metadata?.matchingPairs) {
        questionData.matchingPairs = question.metadata.matchingPairs;
      } else if (answers.length > 0 && answers[0].matchingPairs) {
        questionData.matchingPairs = answers[0].matchingPairs;
      }
    }

    setFormData(questionData);
    setOriginalType(question.type);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data submission
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
        formDataToSend.append("image", formData.imageUrl);
      }

      // Add image settings at top level if present
      if (formData.metadata?.image_settings) {
        formDataToSend.append(
          "imageSettings",
          JSON.stringify(formData.metadata.image_settings)
        );
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
        // Store matching pairs as top-level field for API compatibility
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
        toast.success(result.data.message);
        setTimeout(() => {
          router.push(`/admin/questions/${questionId}`);
        }, 1000);
      }
    } catch (error) {
      toast.error("Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagAdd = () => {
    if (
      tagInput.trim() &&
      formData.tags &&
      !formData.tags.includes(tagInput.trim())
    ) {
      setFormData((prev: any) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tags: prev.tags?.filter((t: string) => t !== tag) || [],
    }));
  };

  if (isLoading || isFetching) {
    return (
      <div className="mx-auto py-10 max-w-4xl w-full">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !result?.data) {
    return (
      <div className="mx-auto py-10 max-w-4xl w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Question Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            The question you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/questions">Back to Questions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto py-10 max-w-4xl w-full">
      <div className="mb-8">
        <Link
          href={`/admin/questions/${questionId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Question
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Edit Question</CardTitle>
            <CardDescription>Update the question details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
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
                <Label>Question Image (Optional)</Label>
                {formData.image && formData.image instanceof File ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <QuestionImage
                        src={URL.createObjectURL(formData.image)}
                        metadata={formData.metadata}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 z-10"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            image: null,
                            metadata: {
                              ...prev.metadata,
                              image_settings: undefined,
                            },
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <ImageControls
                      settings={
                        formData.metadata?.image_settings || {
                          size_mode: "auto",
                          alignment: "center",
                          object_fit: "contain",
                          max_height: "600px",
                        }
                      }
                      onChange={(settings: any) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            image_settings: settings,
                          },
                        }));
                      }}
                      imageUrl={URL.createObjectURL(formData.image)}
                    />
                  </div>
                ) : formData.imageUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <QuestionImage
                        src={formData.imageUrl}
                        metadata={formData.metadata}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 z-10"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            imageUrl: null,
                            metadata: {
                              ...prev.metadata,
                              image_settings: undefined,
                            },
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <ImageControls
                      settings={
                        formData.metadata?.image_settings || {
                          size_mode: "auto",
                          alignment: "center",
                          object_fit: "contain",
                          max_height: "600px",
                        }
                      }
                      onChange={(settings: any) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            image_settings: settings,
                          },
                        }));
                      }}
                      imageUrl={formData.imageUrl}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
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
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Click to upload an image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Upload an image to accompany your question (max 10MB)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Question Type</Label>
                  <Select
                    value={formData.type || "multiple_choice"}
                    disabled={true} // Type cannot be changed after creation
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
                  {formData.type !== originalType && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Warning: Changing question type will reset answers
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">
                    Difficulty Level: {formData.difficultyLevel}
                  </Label>
                  <Slider
                    id="difficulty"
                    min={1}
                    max={10}
                    step={1}
                    value={[formData.difficultyLevel || 3]}
                    onValueChange={([value]) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        difficultyLevel: value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    value={formData.points || 0}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        points: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Points for this question"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="time-limit">Time Limit (seconds)</Label>
                <Input
                  id="time-limit"
                  type="number"
                  min="0"
                  value={formData.timeLimit || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      timeLimit: e.target.value
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
                  {formData.tags?.map((tag: string) => (
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
                    setFormData((prev: any) => ({
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
                    setFormData((prev: any) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  placeholder="Explain the correct answer"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="correct-feedback">
                    Correct Feedback (optional)
                  </Label>
                  <Textarea
                    id="correct-feedback"
                    value={formData.metadata?.correctFeedback || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          correctFeedback: e.target.value,
                        },
                      }))
                    }
                    placeholder="Message shown when answer is correct"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="incorrect-feedback">
                    Incorrect Feedback (optional)
                  </Label>
                  <Textarea
                    id="incorrect-feedback"
                    value={formData.metadata?.incorrectFeedback || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          incorrectFeedback: e.target.value,
                        },
                      }))
                    }
                    placeholder="Message shown when answer is incorrect"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={formData.isPublic || false}
                  onCheckedChange={(checked) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      isPublic: checked,
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
                value={{
                  type: "multiple_choice",
                  options:
                    formData.answers?.map((ans: any, index: number) => ({
                      id: ans.id || String(index + 1),
                      content: ans.content || "",
                      isCorrect: ans.isCorrect || false,
                    })) || [],
                }}
                onChange={(value) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    answers: value.options.map((opt) => ({
                      content: opt.content,
                      isCorrect: opt.isCorrect,
                    })),
                  }))
                }
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
              <div className="text-muted-foreground">
                Free text questions don't require answer configuration. Students
                will provide their own answers.
              </div>
            )}
            {formData.type === "matching" && (
              <div className="text-muted-foreground">
                Matching question editor is not yet implemented.
              </div>
            )}
            {formData.type === "matching_pairs" && (
              <MatchingPairsEditor
                value={formData.matchingPairs || []}
                onChange={(pairs) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    matchingPairs: pairs,
                  }))
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/questions/${questionId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Question
          </Button>
        </div>
      </form>
    </div>
  );
}
