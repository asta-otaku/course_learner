"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/app/admin/(resourceManagement)/curricula/columns";
import {
  Plus,
  BookOpen,
  User,
  ChevronRight,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { reorderCurricula } from "@/app/actions/curricula";
import { toast } from "@/components/ui/use-toast";

interface Curriculum {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean | null;
  category_id?: string | null;
  created_at: string;
  updated_at: string;
  order_index?: number | null;
  created_by_profile?: {
    full_name?: string | null;
    username?: string | null;
  } | null;
  lessons?: any[];
}

interface CurriculumListProps {
  curricula: Curriculum[];
  canCreate: boolean;
}

// Sortable curriculum card wrapper
function SortableCurriculumCard({
  curriculum,
  canEdit,
}: {
  curriculum: Curriculum;
  canEdit: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: curriculum.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const lessonCount = curriculum.lessons?.length || 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          "hover:shadow-lg transition-shadow",
          isDragging && "opacity-50"
        )}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                {canEdit && (
                  <div
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <CardTitle className="font-poppins">
                  {curriculum.title}
                </CardTitle>
              </div>
              <CardDescription>{curriculum.description}</CardDescription>
            </div>
            {!curriculum.is_public && (
              <Badge variant="secondary">Private</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>
                {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
              </span>
            </div>
            {curriculum.created_by_profile && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>
                  {curriculum.created_by_profile.full_name ||
                    curriculum.created_by_profile.username}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/curricula/${curriculum.id}`}>
              View Curriculum
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function CurriculumList({ curricula, canCreate }: CurriculumListProps) {
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<
    Record<string, boolean>
  >({});
  const [localCurricula, setLocalCurricula] = useState(curricula);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local state when curricula prop changes
  useEffect(() => {
    setLocalCurricula(curricula);
  }, [curricula]);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("curriculum-view-mode");
    if (savedView === "list" || savedView === "cards") {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: "cards" | "list") => {
    setViewMode(mode);
    localStorage.setItem("curriculum-view-mode", mode);
    // Clear selection when switching views
    setSelectedCurriculumIds({});
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

    const oldIndex = localCurricula.findIndex(
      (curriculum) => curriculum.id === active.id
    );
    const newIndex = localCurricula.findIndex(
      (curriculum) => curriculum.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for responsive UI
    const newCurricula = arrayMove(localCurricula, oldIndex, newIndex);
    setLocalCurricula(newCurricula);

    // Update on server
    setIsReordering(true);
    try {
      const curriculumIds = newCurricula.map((curriculum) => curriculum.id);
      const result = await reorderCurricula(curriculumIds);

      if (!result.success) {
        // Revert on error
        setLocalCurricula(curricula);
        toast({
          title: "Error",
          description: result.error || "Failed to reorder curricula",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Curricula order updated successfully",
        });
      }
    } catch (error) {
      // Revert on error
      setLocalCurricula(curricula);
      toast({
        title: "Error",
        description: "Failed to reorder curricula",
        variant: "destructive",
      });
    } finally {
      setIsReordering(false);
    }
  };

  if (curricula.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No curricula yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            {canCreate
              ? "Create your first curriculum to organize lessons and quizzes."
              : "No curricula are available at the moment."}
          </p>
          {canCreate && (
            <Button asChild>
              <Link href="/curricula/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Curriculum
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {curricula.length} curricul{curricula.length !== 1 ? "a" : "um"} found
        </p>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("cards")}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "cards" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localCurricula.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {localCurricula.map((curriculum) => (
                <SortableCurriculumCard
                  key={curriculum.id}
                  curriculum={curriculum}
                  canEdit={canCreate}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="opacity-50">
                <SortableCurriculumCard
                  curriculum={localCurricula.find((c) => c.id === activeId)!}
                  canEdit={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <DataTable
          columns={columns}
          data={localCurricula}
          pageCount={1}
          page={1}
          pageSize={localCurricula.length}
          totalItems={localCurricula.length}
          enableRowSelection={true}
          rowSelection={selectedCurriculumIds}
          onRowSelectionChange={setSelectedCurriculumIds}
        />
      )}
    </div>
  );
}
