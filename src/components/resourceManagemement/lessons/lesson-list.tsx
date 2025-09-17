"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  SortAsc,
  SortDesc,
  BookOpen,
  Filter,
  Grid3X3,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LessonCard } from "./lesson-card";
import { LessonListView } from "./lesson-list-view";
import {
  getLessonsWithQuizCounts,
  deleteLesson,
  reorderLessons,
} from "@/app/actions/lessons";
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
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"order" | "title" | "difficulty">(
    "order"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [activeId, setActiveId] = useState<string | null>(null);

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
      // Use provided lessons
      setLessons(lessonsWithQuizCount);
      setFilteredLessons(lessonsWithQuizCount);
      setIsLoading(false);
    } else {
      // Fallback to loading lessons if not provided
    loadLessons();
    }
  }, [curriculumId, providedLessons]);

  useEffect(() => {
    filterAndSortLessons();
  }, [lessons, searchTerm, difficultyFilter, statusFilter, sortBy, sortOrder]);

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      const result = await getLessonsWithQuizCounts(curriculumId);

      if (!result.success) {
        toast({
          title: "Error loading lessons",
          description: (result as any).error,
          variant: "destructive",
        });
        return;
      }
      setLessons(result.data);
    } catch (error) {
      toast({
        title: "Error loading lessons",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortLessons = () => {
    let filtered = [...lessons];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        ({ lesson }) =>
          lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      const difficulty = parseInt(difficultyFilter);
      filtered = filtered.filter(
        ({ lesson }) => lesson.difficulty_level === difficulty
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isPublished = statusFilter === "published";
      filtered = filtered.filter(
        ({ lesson }) => lesson.is_published === isPublished
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "order":
          comparison =
            (a.lesson.order_index || 0) - (b.lesson.order_index || 0);
          break;
        case "title":
          comparison = a.lesson.title.localeCompare(b.lesson.title);
          break;
        case "difficulty":
          comparison =
            (a.lesson.difficulty_level || 0) - (b.lesson.difficulty_level || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredLessons(filtered);
  };


  const toggleSortOrder = () => {
    setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
  };


  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && canEdit && sortBy === "order") {
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

        // Update order indexes
        const lessonOrders = newFilteredLessons.map((item, index) => ({
          id: item.lesson.id,
          order_index: index,
        }));

        // Call the reorder API
        try {
          const result = await reorderLessons({
            curriculum_id: curriculumId,
            lesson_orders: lessonOrders,
          });

          if (!result.success) {
            toast({
              title: "Error reordering lessons",
              description: result.error,
              variant: "destructive",
            });
            // Reload lessons to restore original order
            await loadLessons();
          } else {
            toast({
              title: "Lessons reordered",
              description: "The lesson order has been updated successfully.",
            });
          }
        } catch (error) {
          toast({
            title: "Error reordering lessons",
            description: "An unexpected error occurred",
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

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Easy</SelectItem>
              <SelectItem value="2">Easy</SelectItem>
              <SelectItem value="3">Medium</SelectItem>
              <SelectItem value="4">Hard</SelectItem>
              <SelectItem value="5">Expert</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("order")}>
                Sort by Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title")}>
                Sort by Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("difficulty")}>
                Sort by Difficulty
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                {sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  onDelete={onDeleteLesson ? (lesson) => onDeleteLesson(convertToApiFormat(lesson)) : undefined}
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
                  showDragHandle={sortBy === "order"}
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
                  onDelete={onDeleteLesson ? (lesson) => onDeleteLesson(convertToApiFormat(lesson)) : undefined}
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
          onDelete={onDeleteLesson ? (lesson) => onDeleteLesson(convertToApiFormat(lesson)) : undefined}
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
