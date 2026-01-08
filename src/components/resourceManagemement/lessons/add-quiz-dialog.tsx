"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuizSchema, type CreateQuizInput } from "@/lib/validations/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetQuizzes } from "@/lib/api/queries";
import { usePatchLessonQuizzes, usePostQuiz } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Search,
  Plus,
  CheckCircle,
  Clock,
  HelpCircle,
  Users,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Use the Quiz and QuizUpdateData types from the API
import type { Quiz, QuizUpdateData } from "@/lib/types";

interface AddQuizDialogProps {
  lessonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  existingQuizIds?: string[]; // IDs of quizzes already in the lesson
}

export function AddQuizDialog({
  lessonId,
  open,
  onOpenChange,
  onSuccess,
  existingQuizIds = [],
}: AddQuizDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("existing");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // React Hook Form for new quiz
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      lessonId: lessonId,
      settings: {
        timeLimit: 0,
        randomizeQuestions: false,
        passingScore: 80,
        feedbackMode: "immediate",
        availableFrom: "",
        availableUntil: "",
      },
    },
  });

  // Reset form and state when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setActiveTab("existing");
      setSearchTerm("");
      setSelectedQuiz(null);
    }
  }, [open, reset]);

  // Use the useGetQuizzes hook instead of server action
  const { data: quizzesData, isLoading: loading } = useGetQuizzes({
    search: searchTerm,
    status: "published", // Only show published quizzes
    page: 1,
    limit: 50,
  });

  const quizzes = quizzesData?.quizzes || [];

  // Mutation for adding quiz to lesson
  const { mutate: patchLessonQuizzes, isPending: isPatching } =
    usePatchLessonQuizzes(lessonId);

  // Mutation for creating new quiz
  const createQuizMutation = usePostQuiz();
  const isCreating = createQuizMutation.isPending;

  const isQuizAlreadyAdded = (quizId: string | undefined) => {
    return quizId ? existingQuizIds.includes(quizId) : false;
  };

  const handleAddQuiz = () => {
    if (
      !selectedQuiz ||
      !selectedQuiz.id ||
      isQuizAlreadyAdded(selectedQuiz.id)
    )
      return;

    // Add the selected quiz to the existing quiz IDs
    const updatedQuizIds = [...existingQuizIds, selectedQuiz.id];

    patchLessonQuizzes(
      { quizIds: updatedQuizIds },
      {
        onSuccess: () => {
          toast.success(
            `"${selectedQuiz.title}" has been added to this lesson.`
          );
          onOpenChange(false);
          if (onSuccess) onSuccess();
          router.refresh();
        },
        onError: (error) => {
          toast.error("Failed to add quiz. Please try again.");
          console.error("Add quiz error:", error);
        },
      }
    );
  };

  const handleCreateNewQuiz = async (data: CreateQuizInput) => {
    try {
      // Build the payload conforming to QuizUpdateData
      const payload: any = {
        title: data.title,
        description: data.description,
        curriculumLessonId: lessonId,
      };

      // Add tags if provided
      if (data.tags && data.tags.length > 0) {
        payload.tags = data.tags;
      }

      // Add settings if any are provided
      if (data.settings) {
        const settings: any = {};

        if (data.settings.timeLimit !== undefined) {
          settings.timeLimit = data.settings.timeLimit;
        }
        if (data.settings.randomizeQuestions !== undefined) {
          settings.randomizeQuestions = data.settings.randomizeQuestions;
        }
        if (data.settings.passingScore !== undefined) {
          settings.passingScore = data.settings.passingScore;
        }
        if (data.settings.feedbackMode) {
          settings.feedbackMode = data.settings.feedbackMode;
        }
        if (data.settings.availableFrom?.trim()) {
          settings.availableFrom = data.settings.availableFrom;
        }
        if (data.settings.availableUntil?.trim()) {
          settings.availableUntil = data.settings.availableUntil;
        }

        // Only include settings if at least one setting is defined
        if (Object.keys(settings).length > 0) {
          payload.settings = settings;
        }
      }

      const result = await createQuizMutation.mutateAsync(payload);

      if (result.status === 200 || result.status === 201) {
        // Extract quiz ID from nested response structure
        const quizId = result?.data?.data?.id || (result.data as any)?.id;

        if (quizId) {
          // Add the newly created quiz to the lesson
          const updatedQuizIds = [...existingQuizIds, quizId];
          patchLessonQuizzes(
            { quizIds: updatedQuizIds },
            {
              onSuccess: () => {
                toast.success(
                  result?.data?.message || "Quiz created successfully"
                );
                reset();
                onOpenChange(false);
                if (onSuccess) onSuccess();
                router.refresh();
              },
              onError: (error) => {
                toast.error("Quiz created but failed to add to lesson");
                console.error("Add quiz to lesson error:", error);
              },
            }
          );
        } else {
          toast.error("Failed to get quiz ID from response");
          console.error("Response structure:", result);
        }
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Quiz to Lesson</DialogTitle>
            <DialogDescription>
              Select an existing quiz or create a new one for this lesson
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="existing">
                <FileText className="h-4 w-4 mr-2" />
                Existing Quiz
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="existing"
              className="flex-1 overflow-y-auto mt-4"
            >
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quizzes by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-3" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "No published quizzes found matching your search"
                          : "No published quizzes available"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((quiz) => {
                        const isAlreadyAdded = isQuizAlreadyAdded(quiz.id);
                        return (
                          <div
                            key={quiz.id || "unknown"}
                            className={cn(
                              "p-4 border rounded-lg transition-colors",
                              isAlreadyAdded
                                ? "cursor-not-allowed opacity-60 bg-muted/30"
                                : "cursor-pointer",
                              !isAlreadyAdded && selectedQuiz?.id === quiz.id
                                ? "border-primaryBlue bg-primaryBlue/5"
                                : !isAlreadyAdded && "hover:bg-muted/50"
                            )}
                            onClick={() =>
                              !isAlreadyAdded && setSelectedQuiz(quiz)
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium line-clamp-1">
                                  {quiz.title}
                                </h4>
                                {quiz.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {quiz.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <HelpCircle className="h-3 w-3" />
                                    <span>
                                      {quiz.questionsCount || 0} questions
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{quiz.createdBy || "Unknown"}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {quiz.createdAt
                                        ? new Date(
                                            quiz.createdAt
                                          ).toLocaleDateString()
                                        : "Unknown date"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 ml-2">
                                <Badge
                                  className={cn(getStatusColor(quiz.status))}
                                >
                                  {quiz.status}
                                </Badge>
                                {isAlreadyAdded && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800"
                                  >
                                    Already Added
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!isAlreadyAdded &&
                              selectedQuiz?.id === quiz.id && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-primaryBlue">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Selected</span>
                                </div>
                              )}
                            {isAlreadyAdded && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>This quiz is already in the lesson</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedQuiz && !isQuizAlreadyAdded(selectedQuiz.id) && (
                  <Alert className="border-primaryBlue">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Selected:</strong> {selectedQuiz.title} (
                      {selectedQuiz.questionsCount || 0} questions)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPatching}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuiz}
                  disabled={
                    !selectedQuiz ||
                    isPatching ||
                    (selectedQuiz && isQuizAlreadyAdded(selectedQuiz.id))
                  }
                >
                  {isPatching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedQuiz && isQuizAlreadyAdded(selectedQuiz.id)
                    ? "Already Added"
                    : "Add Selected Quiz"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-y-auto mt-4">
              <form
                onSubmit={handleSubmit(handleCreateNewQuiz)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Provide the essential details for your quiz. You'll add
                      questions in the next step.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Quiz Title *</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="Enter quiz title"
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe what this quiz covers"
                        rows={3}
                        className={
                          errors.description ? "border-destructive" : ""
                        }
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Settings</CardTitle>
                    <CardDescription>
                      Configure how the quiz will behave
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        {...register("settings.timeLimit", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                        min={0}
                        max={180}
                        className={
                          errors.settings?.timeLimit ? "border-destructive" : ""
                        }
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Leave as 0 for no time limit
                      </p>
                      {errors.settings?.timeLimit && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.settings.timeLimit.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="passingScore">Passing Score (%)</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        {...register("settings.passingScore", {
                          valueAsNumber: true,
                        })}
                        min={0}
                        max={100}
                        className={
                          errors.settings?.passingScore
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {errors.settings?.passingScore && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.settings.passingScore.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="randomizeQuestions"
                        {...register("settings.randomizeQuestions")}
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor="randomizeQuestions"
                        className="font-normal"
                      >
                        Randomize question order for each attempt
                      </Label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-base">Feedback Mode</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose when and how students receive feedback on their
                          answers
                        </p>
                      </div>

                      <Controller
                        name="settings.feedbackMode"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-4"
                          >
                            <div className="flex items-start space-x-3 space-y-0">
                              <RadioGroupItem
                                value="immediate"
                                id="immediate"
                                className="mt-1"
                              />
                              <div className="space-y-1 leading-none">
                                <Label
                                  htmlFor="immediate"
                                  className="font-medium cursor-pointer"
                                >
                                  Immediate Feedback
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Students see correct answers immediately after
                                  answering each question
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3 space-y-0">
                              <RadioGroupItem
                                value="after_completion"
                                id="after_completion"
                                className="mt-1"
                              />
                              <div className="space-y-1 leading-none">
                                <Label
                                  htmlFor="after_completion"
                                  className="font-medium cursor-pointer"
                                >
                                  After Completion
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Students see all feedback only after
                                  completing the entire quiz
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3 space-y-0">
                              <RadioGroupItem
                                value="delayed_random"
                                id="delayed_random"
                                className="mt-1"
                              />
                              <div className="space-y-1 leading-none">
                                <Label
                                  htmlFor="delayed_random"
                                  className="font-medium cursor-pointer"
                                >
                                  Delayed Random Feedback
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Feedback is delivered at a random time between
                                  the specified hours after completion
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3 space-y-0">
                              <RadioGroupItem
                                value="manual_tutor_review"
                                id="manual_tutor_review"
                                className="mt-1"
                              />
                              <div className="space-y-1 leading-none">
                                <Label
                                  htmlFor="manual_tutor_review"
                                  className="font-medium cursor-pointer"
                                >
                                  Manual Tutor Review
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Quiz is sent to assigned tutor for review and
                                  personalized feedback
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        )}
                      />
                      {errors.settings?.feedbackMode && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.settings.feedbackMode.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Quiz
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
