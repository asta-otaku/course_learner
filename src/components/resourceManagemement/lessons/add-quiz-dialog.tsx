"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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

// Use the Quiz type from the API
import type { Quiz } from "@/lib/types";

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

  // New quiz form state
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizDescription, setNewQuizDescription] = useState("");
  const [newQuizInstructions, setNewQuizInstructions] = useState("");

  // Quiz settings state
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [passingScore, setPassingScore] = useState<string>("70");
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(true);
  const [showFeedback, setShowFeedback] = useState<boolean>(true);
  const [allowRetakes, setAllowRetakes] = useState<boolean>(true);
  const [allowReview, setAllowReview] = useState<boolean>(true);

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
  const { mutate: createQuiz, isPending: isCreating } = usePostQuiz();

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

  const handleCreateNewQuiz = () => {
    if (!newQuizTitle.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    const quizData: Quiz = {
      title: newQuizTitle.trim(),
      description: newQuizDescription.trim(),
      instructions: newQuizInstructions.trim(),
      status: "draft",
      lessonId: lessonId,
      timeLimit: timeLimit,
      maxAttempts: maxAttempts,
      passingScore: passingScore,
      randomizeQuestions: randomizeQuestions,
      showCorrectAnswers: showCorrectAnswers,
      showFeedback: showFeedback,
      allowRetakes: allowRetakes,
      allowReview: allowReview,
    };

    createQuiz(quizData, {
      onSuccess: (response) => {
        const quizId = (response.data as any)?.id;
        if (quizId) {
          // Add the newly created quiz to the lesson
          const updatedQuizIds = [...existingQuizIds, quizId];
          patchLessonQuizzes(
            { quizIds: updatedQuizIds },
            {
              onSuccess: () => {
                toast.success("Quiz created and added to lesson successfully");
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
          toast.error("Failed to create quiz");
        }
      },
      onError: (error) => {
        toast.error("Failed to create quiz. Please try again.");
        console.error("Create quiz error:", error);
      },
    });
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-title">Quiz Title *</Label>
                  <Input
                    id="quiz-title"
                    placeholder="Enter quiz title"
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea
                    id="quiz-description"
                    placeholder="Enter quiz description"
                    value={newQuizDescription}
                    onChange={(e) => setNewQuizDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-instructions">Instructions</Label>
                  <Textarea
                    id="quiz-instructions"
                    placeholder="Enter quiz instructions"
                    value={newQuizInstructions}
                    onChange={(e) => setNewQuizInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Quiz Settings</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        min="1"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-attempts">Max Attempts</Label>
                      <Input
                        id="max-attempts"
                        type="number"
                        min="1"
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passing-score">Passing Score (%)</Label>
                      <Input
                        id="passing-score"
                        type="number"
                        min="0"
                        max="100"
                        value={passingScore}
                        onChange={(e) => setPassingScore(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="randomize-questions">
                          Randomize Questions
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Questions will be presented in random order
                        </p>
                      </div>
                      <Switch
                        id="randomize-questions"
                        checked={randomizeQuestions}
                        onCheckedChange={setRandomizeQuestions}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-correct-answers">
                          Show Correct Answers
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Display correct answers after quiz completion
                        </p>
                      </div>
                      <Switch
                        id="show-correct-answers"
                        checked={showCorrectAnswers}
                        onCheckedChange={setShowCorrectAnswers}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-feedback">Show Feedback</Label>
                        <p className="text-sm text-muted-foreground">
                          Provide feedback on answers
                        </p>
                      </div>
                      <Switch
                        id="show-feedback"
                        checked={showFeedback}
                        onCheckedChange={setShowFeedback}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allow-retakes">Allow Retakes</Label>
                        <p className="text-sm text-muted-foreground">
                          Students can retake the quiz
                        </p>
                      </div>
                      <Switch
                        id="allow-retakes"
                        checked={allowRetakes}
                        onCheckedChange={setAllowRetakes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allow-review">Allow Review</Label>
                        <p className="text-sm text-muted-foreground">
                          Students can review their answers
                        </p>
                      </div>
                      <Switch
                        id="allow-review"
                        checked={allowReview}
                        onCheckedChange={setAllowReview}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNewQuiz}
                  disabled={isCreating || !newQuizTitle.trim()}
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Quiz
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
