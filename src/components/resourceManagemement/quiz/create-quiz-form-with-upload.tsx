"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuizSchema, type CreateQuizInput } from "@/lib/validations/quiz";
import { createQuizWithQuestions } from "@/app/actions/quiz-with-upload";
import { parseCSV, downloadCSV, getCSVTemplate } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FolderSelect } from "../questions/folder-select";
import { QuestionPreviewModal } from "../questions/question-preview-modal";
import {
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Download,
  Eye,
  X,
  HelpCircle,
  Sparkles,
  Copy,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  getPromptForClipboard,
  getBulkUploadPrompt,
} from "@/lib/bulk-upload-prompt";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateQuizFormWithUploadProps {
  lessonId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateQuizFormWithUpload({
  lessonId,
  onSuccess,
  onCancel,
}: CreateQuizFormWithUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bulk upload state
  const [enableBulkUpload, setEnableBulkUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    count: 20,
    subject: "Mathematics",
    grade: "Year Three",
    customSubject: "",
    customGrade: "",
    difficulty: "mixed",
    questionTypes: ["multiple_choice", "true_false", "free_text", "matching"],
  });

  const form = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      description: "",
      lessonId: lessonId || undefined,
      tags: [],
      settings: {
        timeLimit: 30,
        randomizeQuestions: false,
        showCorrectAnswers: true,
        passingScore: 70,
        preventSkipping: false,
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      handleFileUpload(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const { questions, errors } = parseCSV(text);

      setParsedQuestions(questions);
      setParseErrors(errors);

      if (questions.length > 0 && errors.length === 0) {
        toast({
          title: "CSV parsed successfully",
          description: `${questions.length} questions ready to import`,
        });
      }
    } catch (error) {
      toast({
        title: "Error parsing file",
        description:
          error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    const template = getCSVTemplate();
    downloadCSV("question_import_template.csv", template);
  };

  const handleGeneratePrompt = async () => {
    try {
      const prompt = getBulkUploadPrompt({
        count: aiConfig.count,
        subject:
          aiConfig.subject === "custom"
            ? aiConfig.customSubject
            : aiConfig.subject,
        grade:
          aiConfig.grade === "custom" ? aiConfig.customGrade : aiConfig.grade,
        difficulty: aiConfig.difficulty,
        questionTypes: aiConfig.questionTypes,
      });
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Prompt copied!",
        description: `AI prompt for ${aiConfig.count} questions has been copied to your clipboard.`,
      });
      setAiPromptOpen(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or manually copy the prompt.",
        variant: "destructive",
      });
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedQuestions([]);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CreateQuizInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        ...data,
        lessonId: lessonId || data.lessonId,
        questions:
          enableBulkUpload && parsedQuestions.length > 0
            ? parsedQuestions
            : undefined,
        folderId:
          enableBulkUpload && targetFolderId ? targetFolderId : undefined,
      };

      const result = await createQuizWithQuestions(submitData);

      if (result.success) {
        const successMessage =
          enableBulkUpload && parsedQuestions.length > 0
            ? `Quiz created with ${parsedQuestions.length} questions`
            : "Quiz created successfully";

        toast({
          title: successMessage,
          description: "You can now manage your quiz.",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/quizzes/${result.data?.id}/builder`);
        }
      } else {
        setError(result.error || "Failed to create quiz");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "free_text":
        return "Free Text";
      case "matching":
        return "Matching";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buttonText =
    enableBulkUpload && parsedQuestions.length > 0
      ? `Create Quiz & Upload ${parsedQuestions.length} Questions`
      : "Create Quiz";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details for your quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Chapter 5 Review Quiz"
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe what this quiz covers"
              rows={3}
            />
          </div>

          {lessonId && (
            <input type="hidden" {...register("lessonId")} value={lessonId} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>Configure how the quiz will behave</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              {...register("settings.timeLimit", { valueAsNumber: true })}
              placeholder="0 for no limit"
              min={0}
              max={180}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave as 0 for no time limit
            </p>
          </div>

          <div>
            <Label htmlFor="passingScore">Passing Score (%)</Label>
            <Input
              id="passingScore"
              type="number"
              {...register("settings.passingScore", { valueAsNumber: true })}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                {...register("settings.randomizeQuestions")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="randomizeQuestions" className="font-normal">
                Randomize question order for each attempt
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                {...register("settings.showCorrectAnswers")}
                className="rounded border-gray-300 mt-1"
              />
              <div>
                <Label htmlFor="showCorrectAnswers" className="font-normal">
                  Show correct answers after submission
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  If unchecked, students will see feedback after each question.
                  If checked, answers are shown only after completing the entire
                  quiz.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="preventSkipping"
                {...register("settings.preventSkipping")}
                className="rounded border-gray-300 mt-1"
              />
              <div>
                <Label htmlFor="preventSkipping" className="font-normal">
                  Prevent skipping questions
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  When enabled, students must answer each question before moving
                  to the next
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bulk Upload Questions</CardTitle>
              <CardDescription>
                Optionally import questions from a CSV file
              </CardDescription>
            </div>
            <Switch
              id="enable-bulk-upload"
              checked={enableBulkUpload}
              onCheckedChange={setEnableBulkUpload}
            />
          </div>
        </CardHeader>
        {enableBulkUpload && (
          <CardContent className="space-y-4">
            <div>
              <Label>CSV File</Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : "Choose CSV file"}
                </Button>
              </div>
            </div>

            {parsedQuestions.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="folder-select">Import to Folder</Label>
                  <FolderSelect
                    value={targetFolderId}
                    onChange={setTargetFolderId}
                    placeholder="Select folder or leave empty for root level"
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {parsedQuestions.length} questions ready to import
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={clearFile}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  </div>

                  <div className="max-h-[200px] overflow-y-auto border rounded-lg p-4">
                    <div className="space-y-3">
                      {parsedQuestions.slice(0, 5).map((question, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg space-y-1 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedQuestion(question);
                            setPreviewOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-1">
                                {question.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {question.content}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "text-xs shrink-0 ml-2",
                                question.type === "multiple_choice" &&
                                  "bg-blue-100 text-blue-700",
                                question.type === "true_false" &&
                                  "bg-green-100 text-green-700",
                                question.type === "free_text" &&
                                  "bg-purple-100 text-purple-700",
                                question.type === "matching" &&
                                  "bg-orange-100 text-orange-700"
                              )}
                            >
                              {getQuestionTypeLabel(question.type)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {parsedQuestions.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          ... and {parsedQuestions.length - 5} more questions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p>
                    Your CSV file should include columns for all question
                    properties.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="p-0 h-auto"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download template
                    </Button>
                    <span className="text-muted-foreground">•</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setAiPromptOpen(true)}
                      className="p-0 h-auto text-purple-600 hover:text-purple-700"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate with AI
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Parse Errors:</p>
                    <div className="max-h-20 overflow-y-auto">
                      {parseErrors.map((error, index) => (
                        <p key={index} className="text-sm">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.back())}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </div>

      {/* Question Preview Modal */}
      <QuestionPreviewModal
        question={selectedQuestion}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* AI Prompt Configuration Dialog */}
      <Dialog open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate AI Prompt</DialogTitle>
            <DialogDescription>
              Configure the options for generating questions with AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-count">Number of Questions</Label>
                <Input
                  id="question-count"
                  type="number"
                  min="1"
                  max="500"
                  value={aiConfig.count}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      count: parseInt(e.target.value) || 20,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={aiConfig.difficulty}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (1-2)</SelectItem>
                    <SelectItem value="medium">Medium (3)</SelectItem>
                    <SelectItem value="hard">Hard (4-5)</SelectItem>
                    <SelectItem value="mixed">Mixed Difficulty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={aiConfig.subject}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, subject: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Maths</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="custom">Custom Subject</SelectItem>
                  </SelectContent>
                </Select>
                {aiConfig.subject === "custom" && (
                  <div className="mt-2">
                    <Textarea
                      placeholder="Enter custom subject..."
                      value={aiConfig.customSubject}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          customSubject: e.target.value,
                        })
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={aiConfig.grade}
                  onValueChange={(value) =>
                    setAiConfig({ ...aiConfig, grade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Year One">Year One</SelectItem>
                    <SelectItem value="Year Two">Year Two</SelectItem>
                    <SelectItem value="Year Three">Year Three</SelectItem>
                    <SelectItem value="Year Four">Year Four</SelectItem>
                    <SelectItem value="Year Five">Year Five</SelectItem>
                    <SelectItem value="Year Six">Year Six</SelectItem>
                    <SelectItem value="custom">Custom Grade</SelectItem>
                  </SelectContent>
                </Select>
                {aiConfig.grade === "custom" && (
                  <div className="mt-2">
                    <Textarea
                      placeholder="Enter custom grade level..."
                      value={aiConfig.customGrade}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          customGrade: e.target.value,
                        })
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "multiple_choice", label: "Multiple Choice" },
                  { value: "true_false", label: "True/False" },
                  { value: "free_text", label: "Free Text" },
                  { value: "matching", label: "Matching" },
                ].map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Switch
                      id={type.value}
                      checked={aiConfig.questionTypes.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAiConfig({
                            ...aiConfig,
                            questionTypes: [
                              ...aiConfig.questionTypes,
                              type.value,
                            ],
                          });
                        } else {
                          setAiConfig({
                            ...aiConfig,
                            questionTypes: aiConfig.questionTypes.filter(
                              (t) => t !== type.value
                            ),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={type.value}
                      className="font-normal cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                This will generate a custom prompt for creating {aiConfig.count}{" "}
                questions that can be used with ChatGPT, Claude, or any other
                AI.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiPromptOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePrompt}
              disabled={aiConfig.questionTypes.length === 0}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy AI Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
