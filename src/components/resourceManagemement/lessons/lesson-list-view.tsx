"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Clock,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  EyeOff,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

interface LessonWithQuizCount {
  lesson: LessonRow;
  quiz_count: number;
}

interface LessonListViewProps {
  lessons: LessonWithQuizCount[];
  onEdit?: (lesson: LessonRow) => void;
  onDelete?: (lesson: LessonRow) => void;
  onView?: (lesson: LessonRow) => void;
  onAddQuiz?: (lesson: LessonRow) => void;
  canEdit?: boolean;
}

export function LessonListView({
  lessons,
  onEdit,
  onDelete,
  onView,
  onAddQuiz,
  canEdit = false,
}: LessonListViewProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const getDifficultyLabel = (level: number | null) => {
    if (!level) return "Not Set";
    if (level <= 2) return "Easy";
    if (level <= 3) return "Medium";
    if (level <= 4) return "Hard";
    return "Expert";
  };

  const getDifficultyColor = (level: number | null) => {
    if (!level) return "bg-gray-100 text-gray-800";
    if (level <= 2) return "bg-green-100 text-green-800";
    if (level <= 3) return "bg-yellow-100 text-yellow-800";
    if (level <= 4) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium">
        <div className="col-span-1 flex items-center">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="col-span-4">Title</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Difficulty</div>
        <div className="col-span-1">Duration</div>
        <div className="col-span-1">Quizzes</div>
        <div className="col-span-2">Actions</div>
      </div>

      {/* List Items */}
      <div className="divide-y">
        {lessons.map(({ lesson, quiz_count }) => {
          const isLoading = loadingStates[lesson.id];

          return (
            <div
              key={lesson.id}
              className={cn(
                "grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/25 transition-colors",
                !lesson.is_published &&
                  "bg-yellow-50/50 border-l-4 border-l-yellow-500"
              )}
            >
              {/* Order */}
              <div className="col-span-1">
                <span className="text-sm text-muted-foreground">
                  {lesson.order_index + 1}
                </span>
              </div>

              {/* Title & Description */}
              <div className="col-span-4">
                <div className="space-y-1">
                  <h3 className="font-medium line-clamp-1">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {lesson.description}
                    </p>
                  )}
                  {!lesson.is_published && (
                    <div className="flex items-center gap-1">
                      <EyeOff className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-yellow-600">
                        Not visible to students
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <Badge
                  variant={lesson.is_published ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    lesson.is_published
                      ? "bg-green-500/10 text-green-700 border-green-200"
                      : "bg-yellow-500/10 text-yellow-700 border-yellow-200"
                  )}
                >
                  {lesson.is_published ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Published
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Draft
                    </>
                  )}
                </Badge>
              </div>

              {/* Difficulty */}
              <div className="col-span-1">
                {lesson.difficulty_level && (
                  <Badge
                    className={cn(
                      "text-xs",
                      getDifficultyColor(lesson.difficulty_level)
                    )}
                  >
                    {getDifficultyLabel(lesson.difficulty_level)}
                  </Badge>
                )}
              </div>

              {/* Duration */}
              <div className="col-span-1">
                {lesson.duration_minutes ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{lesson.duration_minutes}m</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>

              {/* Quiz Count */}
              <div className="col-span-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <GraduationCap className="h-3 w-3" />
                  <span>{quiz_count}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center gap-2">
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(lesson)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isLoading}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(lesson)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Lesson
                      </DropdownMenuItem>
                    )}
                    {onAddQuiz && (
                      <DropdownMenuItem onClick={() => onAddQuiz(lesson)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Quiz
                      </DropdownMenuItem>
                    )}
                    {(onEdit || onAddQuiz || canEdit) && onDelete && (
                      <DropdownMenuSeparator />
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(lesson)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Lesson
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
