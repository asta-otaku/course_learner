"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { usePatchLessonQuizzes } from "@/lib/api/mutations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  BookOpen,
  FileText,
  Video,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Eye,
  Edit,
  Plus,
  Trash2,
  MoreVertical,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import { useGetQuizzesForLesson, useGetCurricula } from "@/lib/api/queries";
import {
  useDeleteLesson,
  usePostDuplicateLessonToCurriculum,
} from "@/lib/api/mutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { toast as toastify } from "react-toastify";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  content?: string | null;
  durationMinutes?: number;
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
  orderIndex?: number;
  activities?: any;
  resources?: any;
  videoFileName?: string | null;
  videoFileSize?: number | null;
  videoDuration?: number | null;
  videoMimeType?: string | null;
  isActive?: boolean;
  videoUrl?: string | null;
  quizzesCount?: number;
  difficultyLevel?: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  instructions?: string | null;
  timeLimit?: number | null;
  passingScore?: string | null;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
  allowRetakes?: boolean;
  allowReview?: boolean;
  maxAttempts?: number | null;
  status?: string;
  scheduledFor?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  tags?: string[];
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  questionCount?: number;
};

interface LessonDetailCardProps {
  lesson: Lesson;
  quizzes?: Quiz[];
  canEdit?: boolean;
  curriculumId: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onAddQuiz?: () => void;
}

export function LessonDetailCard({
  lesson,
  canEdit = true,
  curriculumId,
  isExpanded = false,
  onToggle,
  onAddQuiz,
}: LessonDetailCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(isExpanded);
  const [isRemovingQuiz, setIsRemovingQuiz] = useState<string | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showRemoveQuizDialog, setShowRemoveQuizDialog] = useState(false);
  const [selectedQuizToRemove, setSelectedQuizToRemove] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");
  const { data: quizzesResponse, isLoading: quizzesLoading } =
    useGetQuizzesForLesson(lesson.id);
  const quizzes = quizzesResponse?.data || [];
  const { mutate: deleteLesson, isPending: isDeletingLesson } = useDeleteLesson(
    lesson.id
  );
  const { mutateAsync: duplicateLesson, isPending: isDuplicating } =
    usePostDuplicateLessonToCurriculum(lesson.id);
  const { data: curriculaResponse } = useGetCurricula();

  // Use the patch lesson quizzes mutation hook to remove quizzes from lesson
  const { mutate: patchLessonQuizzes, isPending: isPatchingQuizzes } =
    usePatchLessonQuizzes(lesson.id);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggle?.();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleRemoveQuiz = (quizId: string, quizTitle: string) => {
    setSelectedQuizToRemove({ id: quizId, title: quizTitle });
    setShowRemoveQuizDialog(true);
  };

  const confirmRemoveQuiz = () => {
    if (!selectedQuizToRemove) return;

    setIsRemovingQuiz(selectedQuizToRemove.id);
    // Get all quiz IDs except the one being removed
    const remainingQuizIds = quizzes
      .filter((quiz) => quiz.id && quiz.id !== selectedQuizToRemove.id)
      .map((quiz) => quiz.id)
      .filter((id): id is string => id !== undefined);

    patchLessonQuizzes(
      { quizIds: remainingQuizIds },
      {
        onSuccess: () => {
          toast({
            title: "Quiz removed",
            description: `"${selectedQuizToRemove.title}" has been removed from this lesson.`,
          });
          setShowRemoveQuizDialog(false);
          setSelectedQuizToRemove(null);
          router.refresh();
        },
        onError: (error) => {
          toast({
            title: "Error removing quiz",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
          console.error("Remove quiz error:", error);
        },
        onSettled: () => {
          setIsRemovingQuiz(null);
        },
      }
    );
  };

  const handleDuplicate = async () => {
    if (!selectedCurriculumId) {
      toastify.error("Please select a curriculum");
      return;
    }
    try {
      const result = await duplicateLesson({
        targetCurriculumId: selectedCurriculumId,
      });
      if (result.status === 201) {
        toastify.success("Lesson duplicated successfully");
        setShowDuplicateDialog(false);
        setSelectedCurriculumId("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const availableCurricula =
    curriculaResponse?.curricula?.filter((c: any) => c.id !== curriculumId) ||
    [];

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleToggle}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                </div>
                {lesson.description && (
                  <CardDescription className="line-clamp-2">
                    {lesson.description}
                  </CardDescription>
                )}
              </div>

              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {lesson.durationMinutes ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(lesson.durationMinutes)}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {lesson.quizzesCount} quiz
                    {lesson.quizzesCount !== 1 ? "zes" : ""}
                  </div>
                  {lesson.videoUrl && (
                    <Video className="h-3.5 w-3.5 text-green-600" />
                  )}
                </div>
                <Badge variant={lesson.isActive ? "default" : "secondary"}>
                  {lesson.isActive ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Lesson Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Learning Objectives
                  </h4>
                  {lesson.objectives && lesson.objectives.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {lesson.objectives.map(
                        (objective: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {objective}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No objectives set
                    </p>
                  )}
                </div>

                {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Prerequisites</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {lesson.prerequisites.map(
                        (prereq: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {prereq}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Difficulty</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-6 rounded-sm",
                            i < (lesson.difficultyLevel || 1)
                              ? "bg-primary"
                              : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Level {lesson.difficultyLevel || 1}/5
                    </span>
                  </div>
                </div>

                {lesson.tags && lesson.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {lesson.tags.map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                {lesson.videoUrl && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/lessons/${lesson.id}#video`}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Video
                    </Link>
                  </Button>
                )}
                {canEdit && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/lessons/${lesson.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
                {canEdit && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDuplicateDialog(true);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <AlertDialog
                      open={showDuplicateDialog}
                      onOpenChange={(open) => {
                        setShowDuplicateDialog(open);
                        if (!open) {
                          setSelectedCurriculumId("");
                        }
                      }}
                    >
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Duplicate Lesson</AlertDialogTitle>
                          <AlertDialogDescription>
                            Select a curriculum to duplicate this lesson into.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="target-curriculum">
                              Curriculum
                            </Label>
                            <Select
                              value={selectedCurriculumId}
                              onValueChange={setSelectedCurriculumId}
                            >
                              <SelectTrigger id="target-curriculum">
                                <SelectValue placeholder="Select a curriculum" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCurricula.length === 0 ? (
                                  <SelectItem value="no-curricula" disabled>
                                    No other curricula available
                                  </SelectItem>
                                ) : (
                                  availableCurricula.map((curriculum: any) => (
                                    <SelectItem
                                      key={curriculum.id}
                                      value={curriculum.id}
                                    >
                                      {curriculum.title}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => {
                              setSelectedCurriculumId("");
                              setShowDuplicateDialog(false);
                            }}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate();
                            }}
                            disabled={
                              isDuplicating ||
                              !selectedCurriculumId ||
                              availableCurricula.length === 0
                            }
                          >
                            {isDuplicating ? "Duplicating..." : "Duplicate"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeletingLesson}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeletingLesson ? "Deleting..." : "Delete Lesson"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the lesson and its data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() =>
                            deleteLesson(undefined as any, {
                              onSuccess: () => {
                                router.refresh();
                              },
                            })
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddQuiz?.();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quiz
                </Button>
              )}
            </div>

            {/* Quizzes Section */}
            {quizzes && quizzes.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">
                  Quizzes ({quizzes.length})
                </h4>
                <div className="space-y-2">
                  {quizzes.map((quiz, index) => (
                    <div
                      key={quiz.id}
                      onClick={(e) => {
                        // Only navigate if click is directly on the card, not on interactive elements
                        if (
                          e.target === e.currentTarget ||
                          ((e.target as HTMLElement).closest("button") ===
                            null &&
                            (e.target as HTMLElement).closest("a") === null)
                        ) {
                          router.push(`/admin/quizzes/${quiz.id}/edit`);
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{quiz.title}</p>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                          {quiz.passingScore && (
                            <span>{quiz.passingScore}% to pass</span>
                          )}
                        </div>
                        <Badge
                          variant={
                            quiz.status === "published"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {quiz.status === "published" ? "Published" : "Draft"}
                        </Badge>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/take-quiz/${quiz.id}`}>
                            <PlayCircle className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/quizzes/${quiz.id}?tab=settings`}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Edit Quiz Settings
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleRemoveQuiz(
                                    quiz.id || "",
                                    quiz.title || "Untitled Quiz"
                                  )
                                }
                                disabled={isRemovingQuiz === quiz.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isRemovingQuiz === quiz.id
                                  ? "Removing..."
                                  : "Remove from Lesson"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Remove Quiz Alert Dialog */}
      <AlertDialog
        open={showRemoveQuizDialog}
        onOpenChange={(open) => {
          setShowRemoveQuizDialog(open);
          if (!open) {
            setSelectedQuizToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Quiz from Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedQuizToRemove?.title}"
              from this lesson? The quiz will no longer be associated with this
              lesson, but it will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRemoveQuizDialog(false);
                setSelectedQuizToRemove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveQuiz}
              disabled={isPatchingQuizzes || isRemovingQuiz !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPatchingQuizzes || isRemovingQuiz !== null
                ? "Removing..."
                : "Remove from Lesson"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
