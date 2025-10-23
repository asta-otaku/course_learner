"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LessonDetailCard } from "../lessons/lesson-detail-card";
import { Plus, BookOpen, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { usePatchReorderLessons } from "@/lib/api/mutations";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Database } from "@/lib/database.types";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

interface LessonWithQuizzes {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  durationMinutes: number;
  objectives: string[];
  tags: string[];
  orderIndex: number;
  activities: any;
  resources: any;
  videoFileName: string | null;
  videoFileSize: number | null;
  videoDuration: number | null;
  videoMimeType: string | null;
  isActive: boolean;
  videoUrl: string | null;
  quizzesCount: number;
  quizzes?: Array<{
    id: string;
    title: string;
    description: string | null;
    question_count: number;
    time_limit: number | null;
    passing_score: number | null;
    max_attempts: number | null;
    is_published: boolean | null;
  }>;
}

interface ExpandableLessonListProps {
  lessons: LessonWithQuizzes[];
  curriculumId: string;
  canEdit?: boolean;
  onCreateLesson?: () => void;
}

// Sortable lesson card wrapper
function SortableLessonCard({
  lesson,
  canEdit,
  curriculumId,
  isExpanded,
  onToggle,
}: {
  lesson: LessonWithQuizzes;
  canEdit: boolean;
  curriculumId: string;
  isExpanded: boolean;
  onToggle: () => void;
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
  };

  // Convert lesson data to component lesson format
  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    durationMinutes: lesson.durationMinutes,
    objectives: lesson.objectives || [],
    prerequisites: [], // Not in the current data structure
    tags: lesson.tags || [],
    orderIndex: lesson.orderIndex,
    activities: lesson.activities,
    resources: lesson.resources,
    videoFileName: lesson.videoFileName,
    videoFileSize: lesson.videoFileSize,
    videoDuration: lesson.videoDuration,
    videoMimeType: lesson.videoMimeType,
    isActive: lesson.isActive,
    videoUrl: lesson.videoUrl,
    quizzesCount: lesson.quizzesCount,
    difficultyLevel: undefined, // Not in the current data structure
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative">
        {canEdit && (
          <div
            {...listeners}
            className="absolute left-2 top-2 z-10 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className={cn(isDragging && "opacity-50")}>
          <LessonDetailCard
            lesson={lessonData}
            canEdit={canEdit}
            curriculumId={curriculumId}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        </div>
      </div>
    </div>
  );
}

export function ExpandableLessonList({
  lessons,
  curriculumId,
  canEdit = false,
  onCreateLesson,
}: ExpandableLessonListProps) {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [localLessons, setLocalLessons] = useState(lessons);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Initialize mutation
  const reorderMutation = usePatchReorderLessons(curriculumId);

  // Update local state when lessons prop changes
  React.useEffect(() => {
    setLocalLessons(lessons);
  }, [lessons]);

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

  const handleToggleExpand = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  // Drag-drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localLessons.findIndex(
      (lesson) => lesson.id === active.id
    );
    const newIndex = localLessons.findIndex((lesson) => lesson.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for responsive UI
    const newLessons = arrayMove(localLessons, oldIndex, newIndex);
    setLocalLessons(newLessons);

    // Update on server
    setIsReordering(true);
    try {
      const lessonIds = newLessons.map((lesson) => lesson.id);

      const res = await reorderMutation.mutateAsync({
        lessonIds: lessonIds,
      });

      toast.success(res.data.message);
    } catch (error) {
      // Revert on error
      setLocalLessons(lessons);
      toast.error("Failed to reorder lessons");
    } finally {
      setIsReordering(false);
    }
  };

  if (lessons.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first lesson to get started with this curriculum.
          </p>
          {canEdit && onCreateLesson && (
            <Button onClick={onCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Lesson
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lessons & Quizzes</CardTitle>
            <CardDescription>
              Click on any lesson to view its details and associated quizzes
            </CardDescription>
          </div>
          {canEdit && onCreateLesson && (
            <Button onClick={onCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localLessons.map((lesson) => lesson.id)}
              strategy={verticalListSortingStrategy}
            >
              {localLessons.map((lessonData) => (
                <SortableLessonCard
                  key={lessonData.id}
                  lesson={lessonData}
                  canEdit={canEdit}
                  curriculumId={curriculumId}
                  isExpanded={expandedLessons.has(lessonData.id)}
                  onToggle={() => handleToggleExpand(lessonData.id)}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="opacity-50">
                  <SortableLessonCard
                    lesson={localLessons.find((l) => l.id === activeId)!}
                    canEdit={false}
                    curriculumId={curriculumId}
                    isExpanded={false}
                    onToggle={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          localLessons.map((lessonData) => (
            <SortableLessonCard
              key={lessonData.id}
              lesson={lessonData}
              canEdit={canEdit}
              curriculumId={curriculumId}
              isExpanded={expandedLessons.has(lessonData.id)}
              onToggle={() => handleToggleExpand(lessonData.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
