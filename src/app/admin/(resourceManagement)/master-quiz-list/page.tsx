"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  CheckSquare,
  Square,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useGeQuizMasterList,
  useGetYearGroups,
  useGetQuizzes,
  useGetCurricula,
  useGetCurriculum,
} from "@/lib/api/queries";
import {
  usePostAddQuizzesToMasterList,
  usePostBulkAddQuizzesToMasterList,
  useDeleteQuizFromMasterList,
  useDeleteQuizzesFromMasterList,
  usePostReorderMasterList,
  usePatchRefreshMasterList,
} from "@/lib/api/mutations";
import { toast } from "react-toastify";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableRowProps {
  item: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRowClick: (quizId: string) => void;
}

function SortableRow({ item, isSelected, onSelect, onRowClick }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.quizId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="group">
      <TableCell className="w-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(item.quizId)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell
        className="font-medium cursor-pointer hover:text-blue-600"
        onClick={() => onRowClick(item.quizId)}
      >
        {item.quizTitle}
      </TableCell>
      <TableCell onClick={() => onRowClick(item.quizId)} className="cursor-pointer">
        {item.sectionName}
      </TableCell>
      <TableCell onClick={() => onRowClick(item.quizId)} className="cursor-pointer">
        {item.lessonName}
      </TableCell>
    </TableRow>
  );
}

export default function MasterQuizListPage() {
  const router = useRouter();
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>("");
  const [isCumulative, setIsCumulative] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [addQuizDialogOpen, setAddQuizDialogOpen] = useState(false);
  const [addQuizPage, setAddQuizPage] = useState(1);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);

  // Fetch year groups
  const { data: yearGroupsResponse, isLoading: yearGroupsLoading } =
    useGetYearGroups();
  const yearGroups = yearGroupsResponse?.data || [];

  // Set first year group as default
  useEffect(() => {
    if (yearGroups.length > 0 && !selectedYearGroup) {
      setSelectedYearGroup(yearGroups[0].id);
    }
  }, [yearGroups, selectedYearGroup]);

  // Fetch master list
  const {
    data: masterListResponse,
    isLoading: masterListLoading,
    refetch: refetchMasterList,
  } = useGeQuizMasterList(selectedYearGroup, isCumulative);
  const masterList = masterListResponse?.data;

  // Update ordered items when master list changes (backend returns correct order)
  useEffect(() => {
    if (masterList?.items) {
      setOrderedItems(masterList.items);
    }
  }, [masterList]);

  // Fetch available quizzes with pagination (for Add Quizzes dialog)
  const { data: quizzesResponse } = useGetQuizzes({
    status: "published",
    page: addQuizPage,
    limit: 10,
  });
  const availableQuizzes = quizzesResponse?.quizzes || [];
  const quizzesPagination = quizzesResponse?.pagination;

  // Fetch curricula list for bulk add
  const { data: curriculaResponse, isLoading: curriculaLoading } = useGetCurricula();
  const curricula = curriculaResponse?.curricula || [];

  // State to hold selected curriculum for fetching its details
  const [selectedCurriculumForDetails, setSelectedCurriculumForDetails] = useState<string>("");

  // Mutations
  const { mutate: addQuizzes, isPending: isAddingQuizzes } =
    usePostAddQuizzesToMasterList(selectedYearGroup);
  const { mutate: bulkAddQuizzes, isPending: isBulkAdding } =
    usePostBulkAddQuizzesToMasterList();
  const { mutate: deleteQuiz, isPending: isDeleting } =
    useDeleteQuizFromMasterList(selectedYearGroup);
  const { mutate: deleteQuizzes, isPending: isBulkDeleting } =
    useDeleteQuizzesFromMasterList(selectedYearGroup);
  const { mutate: reorderList, isPending: isReordering } =
    usePostReorderMasterList(selectedYearGroup);
  const { mutate: refreshList, isPending: isRefreshing } =
    usePatchRefreshMasterList(selectedYearGroup);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.quizId === active.id);
        const newIndex = items.findIndex((item) => item.quizId === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Save new order
        const quizIdsInOrder = newItems.map((item) => item.quizId);
        reorderList(
          { quizIdsInOrder },
          {
            onSuccess: () => {
              toast.success("Quiz order updated successfully");
              refetchMasterList();
            },
            onError: () => {
              toast.error("Failed to update quiz order");
              // Revert on error
              setOrderedItems(items);
            },
          }
        );

        return newItems;
      });
    }
  };

  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuizIds((prev) =>
      prev.includes(quizId)
        ? prev.filter((id) => id !== quizId)
        : [...prev, quizId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuizIds.length === orderedItems.length) {
      setSelectedQuizIds([]);
    } else {
      setSelectedQuizIds(orderedItems.map((item) => item.quizId));
    }
  };

  const handleAddQuizzes = (quizIds: string[]) => {
    addQuizzes(
      { quizIds },
      {
        onSuccess: () => {
          toast.success("Quizzes added successfully");
          setAddQuizDialogOpen(false);
          setAddQuizPage(1);
          refetchMasterList();
        },
        onError: () => {
          toast.error("Failed to add quizzes");
        },
      }
    );
  };

  const handleBulkAdd = (curriculumLessonId: string) => {
    bulkAddQuizzes(
      { curriculumLessonId, yearGroupId: selectedYearGroup },
      {
        onSuccess: () => {
          toast.success("Quizzes added from curriculum lesson");
          setBulkAddDialogOpen(false);
          refetchMasterList();
        },
        onError: () => {
          toast.error("Failed to bulk add quizzes");
        },
      }
    );
  };

  const handleDeleteSelected = () => {
    if (selectedQuizIds.length === 0) return;

    deleteQuizzes(
      { quizIds: selectedQuizIds },
      {
        onSuccess: () => {
          toast.success("Quizzes removed successfully");
          setSelectedQuizIds([]);
          setDeleteDialogOpen(false);
          refetchMasterList();
        },
        onError: () => {
          toast.error("Failed to remove quizzes");
        },
      }
    );
  };

  const handleRefresh = () => {
    refreshList(undefined, {
      onSuccess: () => {
        toast.success("Master list refreshed successfully");
        refetchMasterList();
      },
      onError: () => {
        toast.error("Failed to refresh master list");
      },
    });
  };

  const handleRowClick = (quizId: string) => {
    router.push(`/admin/quizzes/${quizId}`);
  };

  if (yearGroupsLoading) {
    return (
      <div className="w-full p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Master Quiz List</h1>
          <p className="text-muted-foreground">
            Manage master quiz list by year group
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Quiz Master List</CardTitle>
              <CardDescription>
                {masterList
                  ? `${masterList.totalItems} quizzes in ${masterList.yearGroupName}`
                  : "Select a year group to view quizzes"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedYearGroup} onValueChange={setSelectedYearGroup}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select year group" />
                </SelectTrigger>
                <SelectContent>
                  {yearGroups.map((yg) => (
                    <SelectItem key={yg.id} value={yg.id}>
                      {yg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isCumulative ? "default" : "outline"}
                onClick={() => setIsCumulative(!isCumulative)}
                size="sm"
              >
                {isCumulative ? "Cumulative" : "Non-Cumulative"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={!selectedYearGroup || isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh List
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedQuizIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedQuizIds.length})
                </Button>
              )}
              <Dialog
                open={addQuizDialogOpen}
                onOpenChange={(open) => {
                  setAddQuizDialogOpen(open);
                  if (!open) setAddQuizPage(1);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!selectedYearGroup}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Quizzes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Quizzes to Master List</DialogTitle>
                    <DialogDescription>
                      Select quizzes to add to the master list
                    </DialogDescription>
                  </DialogHeader>
                  <AddQuizzesDialog
                    availableQuizzes={availableQuizzes}
                    existingQuizIds={orderedItems.map((item) => item.quizId)}
                    onAdd={handleAddQuizzes}
                    isAdding={isAddingQuizzes}
                    pagination={quizzesPagination}
                    page={addQuizPage}
                    onPageChange={setAddQuizPage}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!selectedYearGroup}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Bulk Add from Lesson
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Bulk Add Quizzes from Curriculum Lesson</DialogTitle>
                    <DialogDescription>
                      Select a curriculum lesson to add all its quizzes
                    </DialogDescription>
                  </DialogHeader>
                  <BulkAddDialog
                    curricula={curricula}
                    onBulkAdd={handleBulkAdd}
                    isBulkAdding={isBulkAdding}
                    isLoading={curriculaLoading}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          {masterListLoading ? (
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : !masterList || orderedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quizzes in this master list</p>
              <p className="text-sm mt-1">Add quizzes using the buttons above</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          selectedQuizIds.length === orderedItems.length &&
                          orderedItems.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Lesson</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={orderedItems.map((item) => item.quizId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedItems.map((item) => (
                      <SortableRow
                        key={item.quizId}
                        item={item}
                        isSelected={selectedQuizIds.includes(item.quizId)}
                        onSelect={handleSelectQuiz}
                        onRowClick={handleRowClick}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedQuizIds.length} quiz(es) from the master
              list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add Quizzes Dialog Component
function AddQuizzesDialog({
  availableQuizzes,
  existingQuizIds,
  onAdd,
  isAdding,
  pagination,
  page,
  onPageChange,
}: {
  availableQuizzes: any[];
  existingQuizIds: string[];
  onAdd: (quizIds: string[]) => void;
  isAdding: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  page: number;
  onPageChange: (page: number) => void;
}) {
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);

  const filteredQuizzes = availableQuizzes.filter(
    (quiz) => !existingQuizIds.includes(quiz.id)
  );

  const handleToggle = (quizId: string) => {
    setSelectedQuizzes((prev) =>
      prev.includes(quizId) ? prev.filter((id) => id !== quizId) : [...prev, quizId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredQuizzes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No available quizzes to add
          </p>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => handleToggle(quiz.id)}
            >
              <Checkbox
                checked={selectedQuizzes.includes(quiz.id)}
                onCheckedChange={() => handleToggle(quiz.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{quiz.title}</p>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {quiz.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          onClick={() => onAdd(selectedQuizzes)}
          disabled={selectedQuizzes.length === 0 || isAdding}
        >
          {isAdding ? "Adding..." : `Add ${selectedQuizzes.length} Quiz(es)`}
        </Button>
      </div>
    </div>
  );
}

// Bulk Add Dialog Component
function BulkAddDialog({
  curricula,
  onBulkAdd,
  isBulkAdding,
  isLoading,
}: {
  curricula: any[];
  onBulkAdd: (curriculumLessonId: string) => void;
  isBulkAdding: boolean;
  isLoading: boolean;
}) {
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");
  const [selectedCurriculumLessonId, setSelectedCurriculumLessonId] = useState<string>("");

  // Fetch selected curriculum details with sections and lessons
  const { data: curriculumDetailsResponse, isLoading: detailsLoading } =
    useGetCurriculum(selectedCurriculumId);
  const curriculumDetails = curriculumDetailsResponse?.data;

  const handleCurriculumSelect = (curriculumId: string) => {
    setSelectedCurriculumId(curriculumId);
    setSelectedCurriculumLessonId(""); // Reset lesson selection
  };

  const handleLessonClick = (curriculumLessonId: string) => {
    setSelectedCurriculumLessonId(curriculumLessonId);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading curricula...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Select Curriculum */}
      <div className="space-y-2">
        <Label>Select Curriculum</Label>
        <Select value={selectedCurriculumId} onValueChange={handleCurriculumSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a curriculum..." />
          </SelectTrigger>
          <SelectContent>
            {curricula.length === 0 ? (
              <SelectItem value="no-curricula" disabled>
                No curricula available
              </SelectItem>
            ) : (
              curricula.map((curriculum: any) => (
                <SelectItem key={curriculum.id} value={curriculum.id}>
                  {curriculum.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Select Lesson from chosen curriculum */}
      {selectedCurriculumId && (
        <div className="space-y-2">
          <Label>Select Lesson</Label>
          {detailsLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading lessons...</p>
            </div>
          ) : !curriculumDetails?.lessons || curriculumDetails.lessons.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm border rounded-md">
              No lessons available in this curriculum
            </p>
          ) : (
            <div className="max-h-[40vh] overflow-y-auto space-y-1 border rounded-md p-2">
              {curriculumDetails.lessons.map((lesson: any) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`w-full text-left flex items-center space-x-2 p-2.5 border rounded-md hover:bg-muted/50 transition-colors ${selectedCurriculumLessonId === lesson.id
                    ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                    : "border-border"
                    }`}
                  onClick={() => handleLessonClick(lesson.id)}
                >
                  <div className="flex-shrink-0">
                    {selectedCurriculumLessonId === lesson.id ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {lesson.title || "Untitled Lesson"}
                    </p>
                    {lesson.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          onClick={() => selectedCurriculumLessonId && onBulkAdd(selectedCurriculumLessonId)}
          disabled={!selectedCurriculumLessonId || isBulkAdding || detailsLoading}
        >
          {isBulkAdding ? "Adding..." : "Add All Quizzes from Lesson"}
        </Button>
      </div>
    </div>
  );
}
