"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import { createColumns } from "@/app/admin/(resourceManagement)/curricula/columns";
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
import { toast } from "react-toastify";
import { usePatchReorderCurriculum } from "@/lib/api/mutations";
import { CurriculumActions } from "@/components/resourceManagemement/curriculum/curriculum-actions";
import { axiosInstance } from "@/lib/services/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";

interface Curriculum {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  learningObjectives: string[];
  tags: string[];
  prerequisites: string[];
  lessonsCount: number;
  orderIndex: number;
  visibility: "PUBLIC" | "PRIVATE";
  offerType: string;
  createdAt: string;
  created_by?: string;
  created_by_profile?: {
    full_name?: string | null;
    username?: string | null;
  } | null;
  lessons?: any[];
  subscriptionPlanId: string;
}

interface CurriculumListProps {
  curricula: Curriculum[];
  canCreate: boolean;
  currentUserId?: string;
  userRole?: string;
}

// Sortable curriculum card wrapper
function SortableCurriculumCard({
  curriculum,
  canEdit,
  currentUserId,
  userRole,
}: {
  curriculum: Curriculum;
  canEdit: boolean;
  currentUserId?: string;
  userRole?: string;
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

  const lessonCount =
    curriculum.lessons?.length || curriculum.lessonsCount || 0;

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
            <div className="flex items-center gap-2">
              {curriculum.visibility === "PRIVATE" && (
                <Badge variant="secondary">Private</Badge>
              )}
              {currentUserId &&
                (userRole === "admin" ||
                  curriculum.created_by === currentUserId) && (
                  <CurriculumActions
                    curriculumId={curriculum.id}
                    canEdit={true}
                    isPublic={curriculum.visibility === "PUBLIC"}
                    curriculum={curriculum}
                  />
                )}
            </div>
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
            <Link href={`/admin/curricula/${curriculum.id}`}>
              View Curriculum
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function CurriculumList({
  curricula,
  canCreate,
  currentUserId,
  userRole,
}: CurriculumListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<
    Record<string, boolean>
  >({});
  const [localCurricula, setLocalCurricula] = useState(curricula);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Get subscriptionPlanId from the first curriculum
  const subscriptionPlanId = localCurricula[0]?.subscriptionPlanId;
  const reorderMutation = usePatchReorderCurriculum(subscriptionPlanId || "");
  const queryClient = useQueryClient();

  // Group curricula by offer type and sort by orderIndex
  const groupedCurricula = React.useMemo(() => {
    const groups: Record<string, Curriculum[]> = {};

    localCurricula.forEach((curriculum) => {
      const offerType = curriculum.offerType || "No Plan";
      if (!groups[offerType]) {
        groups[offerType] = [];
      }
      groups[offerType].push(curriculum);
    });

    // Sort each group by orderIndex
    Object.keys(groups).forEach((offerType) => {
      groups[offerType].sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
      );
    });

    return groups;
  }, [localCurricula]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
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

      // Get subscriptionPlanId from the first curriculum in the new order
      const firstCurriculum = newCurricula[0];
      if (!firstCurriculum?.subscriptionPlanId) {
        throw new Error("No subscription plan ID found");
      }

      // Use axiosInstance directly with the correct subscriptionPlanId
      await axiosInstance.patch(
        `/curriculum/${firstCurriculum.subscriptionPlanId}/curricula`,
        {
          curriculumIds: curriculumIds,
        }
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });

      toast.success("Curriculum order updated successfully");
    } catch (error) {
      // Revert on error
      setLocalCurricula(curricula);
      toast.error("Failed to reorder curriculum");
    } finally {
      setIsReordering(false);
    }
  };

  if (curricula.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 w-full">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No curricula yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            {canCreate
              ? "Create your first curriculum to organize lessons and quizzes."
              : "No curricula are available at the moment."}
          </p>
          {canCreate && (
            <Button asChild className="w-fit">
              <Link href="/admin/curricula/new">
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
    <div className="space-y-4 w-full">
      {/* View Toggle */}
      <div className="flex justify-between items-center w-full">
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
        <div className="space-y-8">
          {Object.entries(groupedCurricula).map(([offerType, curricula]) => (
            <div key={offerType} className="space-y-4">
              {/* Plan Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold font-poppins">
                    {offerType}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {curricula.length} curricul
                    {curricula.length !== 1 ? "a" : "um"}
                  </p>
                </div>
                <Badge
                  variant={offerType === "No Plan" ? "outline" : "default"}
                  className="text-sm"
                >
                  {offerType}
                </Badge>
              </div>

              {/* Plan Cards */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={curricula.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {curricula.map((curriculum) => (
                      <SortableCurriculumCard
                        key={curriculum.id}
                        curriculum={curriculum}
                        canEdit={canCreate}
                        currentUserId={currentUserId}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="opacity-50">
                      <SortableCurriculumCard
                        curriculum={
                          localCurricula.find((c) => c.id === activeId)!
                        }
                        canEdit={false}
                        currentUserId={currentUserId}
                        userRole={userRole}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCurricula)
            .slice()
            .reverse()
            .map(([offerType, curricula]) => (
              <div key={offerType} className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold font-poppins">
                      {offerType}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {curricula.length} curricul
                      {curricula.length !== 1 ? "a" : "um"}
                    </p>
                  </div>
                  <Badge
                    variant={offerType === "No Plan" ? "outline" : "default"}
                    className="text-sm"
                  >
                    {offerType}
                  </Badge>
                </div>

                {/* Plan Table */}
                <SortableDataTable
                  columns={createColumns(true)}
                  data={curricula}
                  enableSorting={canCreate}
                  searchPlaceholder={`Search ${offerType} curricula...`}
                  onRowClick={(row) => {
                    router.push(`/admin/curricula/${row.original.id}`);
                  }}
                  onReorder={async (newCurricula) => {
                    setIsReordering(true);
                    try {
                      // Update local state for this plan
                      const updatedGroups = { ...groupedCurricula };
                      updatedGroups[offerType] = newCurricula;

                      // Flatten back to a single array
                      const allUpdatedCurricula =
                        Object.values(updatedGroups).flat();
                      setLocalCurricula(allUpdatedCurricula);

                      const curriculumIds = newCurricula.map(
                        (curriculum) => curriculum.id
                      );

                      // Get subscriptionPlanId from the first curriculum in the new order
                      const firstCurriculum = newCurricula[0];
                      if (!firstCurriculum?.subscriptionPlanId) {
                        throw new Error("No subscription plan ID found");
                      }

                      // Use axiosInstance directly with the correct subscriptionPlanId
                      await axiosInstance.patch(
                        `/curriculum/${firstCurriculum.subscriptionPlanId}/curricula`,
                        {
                          curriculumIds: curriculumIds,
                        }
                      );

                      // Invalidate queries to refresh data
                      queryClient.invalidateQueries({
                        queryKey: ["curricula"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["curriculum"],
                      });

                      toast.success("Curriculum order updated successfully");
                    } catch (error) {
                      // Revert on error
                      setLocalCurricula(curricula);
                      toast.error("Failed to reorder curriculum");
                    } finally {
                      setIsReordering(false);
                    }
                  }}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
