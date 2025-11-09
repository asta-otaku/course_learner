"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useDeleteQuiz } from "@/lib/api/mutations";
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
}

export function LessonDetailCard({
  lesson,
  canEdit = true,
  curriculumId,
  isExpanded = false,
  onToggle,
}: LessonDetailCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(isExpanded);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState<string | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
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

  // Use the delete quiz mutation hook
  const { mutate: deleteQuiz, isPending: isDeleting } = useDeleteQuiz();

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

  const handleDeleteQuiz = (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${quizTitle}"?`)) {
      return;
    }

    setIsDeletingQuiz(quizId);
    deleteQuiz(
      { quizIds: [quizId] },
      {
        onSuccess: () => {
          toast({
            title: "Quiz deleted",
            description: `"${quizTitle}" has been deleted successfully.`,
          });
          router.refresh();
        },
        onError: (error) => {
          toast({
            title: "Error deleting quiz",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
          console.error("Delete quiz error:", error);
        },
        onSettled: () => {
          setIsDeletingQuiz(null);
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
    curriculaResponse?.curricula?.filter((c) => c.id !== curriculumId) || [];

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
                  {lesson.durationMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(lesson.durationMinutes)}
                    </div>
                  )}
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
                <Button asChild size="sm">
                  <Link href={`/admin/lessons/${lesson.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Lesson
                  </Link>
                </Button>
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
                                  availableCurricula.map((curriculum) => (
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
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/lessons/${lesson.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Quiz
                  </Link>
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
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <Link
                            href={`/admin/quizzes/${quiz.id}`}
                            className="font-medium hover:underline"
                          >
                            {quiz.title}
                          </Link>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
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
                                <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Quiz
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleDeleteQuiz(
                                    quiz.id || "",
                                    quiz.title || "Untitled Quiz"
                                  )
                                }
                                disabled={isDeletingQuiz === quiz.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeletingQuiz === quiz.id
                                  ? "Deleting..."
                                  : "Delete Quiz"}
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
    </Card>
  );
}
