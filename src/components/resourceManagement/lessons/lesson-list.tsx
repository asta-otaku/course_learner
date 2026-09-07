"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  BookOpen,
  List,
  LayoutGrid,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


import { LessonCard } from "./lesson-card";
import { LessonListView } from "./lesson-list-view";
import { useGetCurriculum } from "@/lib/api/queries";
import { usePatchReorderLessons } from "@/lib/api/mutations";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

// Use the exact same interface structure as the API response
interface LessonWithQuizCount {
  lesson: LessonRow;
  quiz_count: number;
}

// Lesson type from API response
interface LessonFromAPI {
  id: string;
  title: string;
  description: string;
  content: string;
  orderIndex: number;
  videoUrl: string;
  quizzesCount: number;
}

interface LessonListProps {
  curriculumId: string;
  lessons?: LessonFromAPI[]; // Make lessons optional for backward compatibility
  onCreateLesson?: () => void;
  onEditLesson?: (lesson: LessonFromAPI) => void;
  onViewLesson?: (lesson: LessonFromAPI) => void;
  onAddQuiz?: (lesson: LessonFromAPI) => void;
  onDeleteLesson?: (lesson: LessonFromAPI) => void;
  canEdit?: boolean;
  className?: string;
}

// Sortable lesson card wrapper
function SortableLessonCard({
  lesson,
  quizCount,
  onEdit,
  onDelete,
  onView,
  onAddQuiz,
  canEdit,
  showDragHandle,
}: {
  lesson: any; // Use any for now to handle mixed types
  quizCount: number;
  onEdit?: (lesson: any) => void;
  onDelete?: (lesson: any) => void;
  onView?: (lesson: any) => void;
  onAddQuiz?: (lesson: any) => void;
  canEdit: boolean;
  showDragHandle: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative">
        {canEdit && showDragHandle && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-4 left-4 z-10 p-2 cursor-move hover:bg-gray-100 rounded-md transition-colors"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <LessonCard
          lesson={lesson}
          quizCount={quizCount}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onAddQuiz={onAddQuiz}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}

export function LessonList({
  curriculumId,
  lessons: providedLessons,
  onCreateLesson,
  onEditLesson,
  onViewLesson,
  onAddQuiz,
  onDeleteLesson,
  canEdit = false,
  className,
}: LessonListProps) {
  // Function to convert API lesson to LessonFromAPI format for callbacks
  const convertToApiFormat = (lesson: any): LessonFromAPI => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description || "",
    content: lesson.content || "",
    orderIndex: lesson.orderIndex || lesson.order_index || 0,
    videoUrl: lesson.videoUrl || "",
    quizzesCount: lesson.quizzesCount || 0,
  });

  // Convert API lessons to internal format
  const lessonsWithQuizCount =
    providedLessons?.map((lesson) => ({
      lesson: {
        ...lesson,
        // Convert API fields to database fields for compatibility
        order_index: lesson.orderIndex,
        is_published: true, // Default value
        difficulty_level: 1, // Default value
      } as any,
      quiz_count: lesson.quizzesCount || 0,
    })) || [];

  const [lessons, setLessons] =
    useState<LessonWithQuizCount[]>(lessonsWithQuizCount);
  const [filteredLessons, setFilteredLessons] =
    useState<LessonWithQuizCount[]>(lessonsWithQuizCount);
  const [isLoading, setIsLoading] = useState(!providedLessons);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const shouldFetch = !providedLessons;
  const { data: curriculumData, isLoading: curriculumLoading, refetch } =
    useGetCurriculum(shouldFetch ? curriculumId : undefined);
  const reorderMutation = usePatchReorderLessons(curriculumId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (providedLessons) {
      setLessons(lessonsWithQuizCount);
      setFilteredLessons(lessonsWithQuizCount);
      setIsLoading(false);
      return;
    }
    const apiLessons = (curriculumData?.data as { lessons?: LessonFromAPI[] } | undefined)
      ?.lessons;
    if (!apiLessons) {
      setIsLoading(curriculumLoading);
      return;
    }
    const mapped = apiLessons.map((lesson) => ({
      lesson: {
        ...lesson,
        order_index: lesson.orderIndex,
        is_published: true,
        difficulty_level: 1,
      } as unknown as LessonRow,
      quiz_count: lesson.quizzesCount || 0,
    }));
    setLessons(mapped);
    setFilteredLessons(mapped);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when curriculum/provided lessons change
  }, [curriculumId, providedLessons, curriculumData, curriculumLoading]);

  const loadLessons = async () => {
    if (providedLessons) return;
    await refetch();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && canEdit) {
      const oldIndex = filteredLessons.findIndex(
        (item) => item.lesson.id === active.id
      );
      const newIndex = filteredLessons.findIndex(
        (item) => item.lesson.id === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        // Update local state immediately for responsive UI
        const newFilteredLessons = arrayMove(
          filteredLessons,
          oldIndex,
          newIndex
        );
        setFilteredLessons(newFilteredLessons);

        try {
          await reorderMutation.mutateAsync({
            lessonIds: newFilteredLessons.map((item) => item.lesson.id),
          });
          toast({
            title: "Lessons reordered",
            description: "The lesson order has been updated successfully.",
          });
        } catch (error) {
          toast({
            title: "Error reordering lessons",
            description: getErrorMessage(error, "An unexpected error occurred"),
            variant: "destructive",
          });
          await loadLessons();
        }
      }
    }

    setActiveId(null);
  };

  const activeLesson = activeId
    ? filteredLessons.find((item) => item.lesson.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lessons ({lessons.length})</h2>

        {onCreateLesson && (
          <Button onClick={onCreateLesson}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {lessons.length === 0
              ? "No lessons yet"
              : "No lessons match your filters"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {lessons.length === 0
              ? "Create your first lesson to get started with this curriculum."
              : "Try adjusting your search or filter criteria."}
          </p>
          {lessons.length === 0 && onCreateLesson && (
            <Button onClick={onCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Lesson
            </Button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SortableContext
              items={filteredLessons.map((item) => item.lesson.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredLessons.map(({ lesson, quiz_count }) => (
                <SortableLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  quizCount={quiz_count}
                  onEdit={
                    onEditLesson
                      ? (lesson) => onEditLesson(convertToApiFormat(lesson))
                      : undefined
                  }
                  onDelete={
                    onDeleteLesson
                      ? (lesson) => onDeleteLesson(convertToApiFormat(lesson))
                      : undefined
                  }
                  onView={
                    onViewLesson
                      ? (lesson) => onViewLesson(convertToApiFormat(lesson))
                      : undefined
                  }
                  onAddQuiz={
                    onAddQuiz
                      ? (lesson) => onAddQuiz(convertToApiFormat(lesson))
                      : undefined
                  }
                  canEdit={canEdit}
                  showDragHandle={true}
                />
              ))}
            </SortableContext>
          </div>
          <DragOverlay>
            {activeLesson ? (
              <div className="opacity-90">
                <LessonCard
                  lesson={activeLesson.lesson}
                  quizCount={activeLesson.quiz_count}
                  onEdit={
                    onEditLesson
                      ? (lesson) => onEditLesson(convertToApiFormat(lesson))
                      : undefined
                  }
                  onDelete={
                    onDeleteLesson
                      ? (lesson) => onDeleteLesson(convertToApiFormat(lesson))
                      : undefined
                  }
                  onView={
                    onViewLesson
                      ? (lesson) => onViewLesson(convertToApiFormat(lesson))
                      : undefined
                  }
                  onAddQuiz={
                    onAddQuiz
                      ? (lesson) => onAddQuiz(convertToApiFormat(lesson))
                      : undefined
                  }
                  canEdit={canEdit}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <LessonListView
          lessons={filteredLessons}
          onEdit={
            onEditLesson
              ? (lesson) => onEditLesson(convertToApiFormat(lesson))
              : undefined
          }
          onDelete={
            onDeleteLesson
              ? (lesson) => onDeleteLesson(convertToApiFormat(lesson))
              : undefined
          }
          onView={
            onViewLesson
              ? (lesson) => onViewLesson(convertToApiFormat(lesson))
              : undefined
          }
          onAddQuiz={
            onAddQuiz
              ? (lesson) => onAddQuiz(convertToApiFormat(lesson))
              : undefined
          }
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
