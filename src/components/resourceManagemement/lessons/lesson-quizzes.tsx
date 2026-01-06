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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddQuizDialog } from "./add-quiz-dialog";
import { usePatchLessonQuizzes } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import {
  Plus,
  GraduationCap,
  Clock,
  HelpCircle,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Eye,
  Copy,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  time_limit: number | null;
  passing_score: number | null;
  max_attempts: number | null;
  question_count: number;
  created_by_name: string;
  created_at: string;
  allow_retakes: boolean | null;
  show_correct_answers: boolean | null;
  randomize_questions: boolean | null;
}

interface LessonQuizzesProps {
  lessonId: string;
  quizzes: Quiz[];
  canEdit?: boolean;
}

export function LessonQuizzes({
  lessonId,
  quizzes,
  canEdit = false,
}: LessonQuizzesProps) {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Patch lesson quizzes mutation to remove quiz from lesson
  const { mutate: patchLessonQuizzes, isPending: isPatchingQuizzes } =
    usePatchLessonQuizzes(lessonId);

  const handleRemoveQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowRemoveDialog(true);
  };

  const confirmRemoveQuiz = () => {
    if (!selectedQuiz) return;

    // Get all quiz IDs except the one being removed
    const remainingQuizIds = quizzes
      .filter((q) => q.id && q.id !== selectedQuiz.id)
      .map((q) => q.id)
      .filter((id): id is string => id !== undefined);

    patchLessonQuizzes(
      { quizIds: remainingQuizIds },
        {
          onSuccess: () => {
            toast.success(
            `"${selectedQuiz.title}" has been removed from this lesson.`
            );
            setSelectedQuiz(null);
          setShowRemoveDialog(false);
            router.refresh();
          },
          onError: (error) => {
          toast.error("Failed to remove quiz from lesson");
          console.error("Remove quiz error:", error);
          },
        }
      );
  };

  const handleStartQuiz = (quizId: string) => {
    // Navigate to test mode
    router.push(`/admin/take-quiz/${quizId}?mode=test`);
  };

  const getStatusColor = (status: string) => {
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

  if (quizzes.length === 0 && !canEdit) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No quizzes have been added to this lesson yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Assessment Quizzes
          </h2>
          <p className="text-muted-foreground">
            Test student understanding with quizzes
          </p>
        </div>

        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        )}
      </div>

      {/* Test Mode Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Test Mode:</strong> When students take a quiz in test mode,
          time limits are enforced, answers cannot be changed after submission,
          and results are only shown after completing the entire quiz.
        </AlertDescription>
      </Alert>

      {/* Quiz List */}
      {quizzes.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Order matters - quizzes will be presented to students in this
            sequence
          </div>
          <div className="space-y-3">
            {quizzes.map((quiz, index) => (
              <Card
                key={quiz.id}
                className="group hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Order Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-primaryBlue/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>

                    {/* Quiz Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold line-clamp-1">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {quiz.description}
                            </p>
                          )}

                          {/* Quiz Stats */}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <HelpCircle className="h-3 w-3" />
                              <span>{quiz.question_count} questions</span>
                            </div>
                            {quiz.time_limit && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{quiz.time_limit} min</span>
                              </div>
                            )}
                            {quiz.passing_score && (
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                <span>Pass: {quiz.passing_score}%</span>
                              </div>
                            )}
                            {quiz.max_attempts && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{quiz.max_attempts} attempts</span>
                              </div>
                            )}
                          </div>

                          {/* Quiz Settings */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {quiz.allow_retakes && (
                              <Badge variant="outline" className="text-xs">
                                Retakes allowed
                              </Badge>
                            )}
                            {quiz.randomize_questions && (
                              <Badge variant="outline" className="text-xs">
                                Random order
                              </Badge>
                            )}
                            {quiz.show_correct_answers && (
                              <Badge variant="outline" className="text-xs">
                                Shows answers
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Badge
                            className={cn(
                              "shrink-0",
                              getStatusColor(quiz.status)
                            )}
                          >
                            {quiz.status}
                          </Badge>

                          {/* Start Quiz Button for Published Quizzes */}
                          {quiz.status === "published" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartQuiz(quiz.id)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}

                          {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isPatchingQuizzes}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/admin/quizzes/${quiz.id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/admin/quizzes/${quiz.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Quiz
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/admin/quizzes/${quiz.id}/edit`
                                    )
                                  }
                                >
                                  <HelpCircle className="h-4 w-4 mr-2" />
                                  Manage Questions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRemoveQuiz(quiz)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove from Lesson
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first quiz to assess student understanding.
              </p>
              {canEdit && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Quiz Dialog */}
      <AddQuizDialog
        lessonId={lessonId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        existingQuizIds={quizzes.map((q) => q.id)}
        onSuccess={() => {
          setShowCreateDialog(false);
          router.refresh();
        }}
      />

      {/* Remove Quiz Alert Dialog */}
      <AlertDialog
        open={showRemoveDialog}
        onOpenChange={(open) => {
          setShowRemoveDialog(open);
          if (!open) {
            setSelectedQuiz(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Quiz from Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedQuiz?.title}" from this
              lesson? The quiz will no longer be associated with this lesson,
              but it will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRemoveDialog(false);
                setSelectedQuiz(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveQuiz}
              disabled={isPatchingQuizzes}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPatchingQuizzes ? "Removing..." : "Remove from Lesson"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
