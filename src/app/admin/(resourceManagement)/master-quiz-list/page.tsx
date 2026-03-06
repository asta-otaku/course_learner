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
  Settings,
  AlertTriangle,
  Edit,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  useGeQuizMasterList,
  useGetYearGroups,
  useGetQuizzes,
  useGetCurricula,
  useGetCurriculum,
  useGetBaselineTests,
  useGetBaselineTestEntry,
} from "@/lib/api/queries";
import {
  usePostAddQuizzesToMasterList,
  usePostBulkAddQuizzesToMasterList,
  useDeleteQuizFromMasterList,
  useDeleteQuizzesFromMasterList,
  usePostReorderMasterList,
  usePatchRefreshMasterList,
  usePostBaselineTestEntry,
  usePatchBaselineTestEntry,
  useDeleteBaselineTestEntry,
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
import { BaselineTestEntry } from "@/lib/types";

// ─── Entry Dialog ────────────────────────────────────────────────────────────

interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  entry: BaselineTestEntry | null;
  allItems: any[];
  baselineTestId: string;
  allEntries: BaselineTestEntry[];
  baselineTestQuestions: number;
  onSuccess: () => void;
}

function EntryDialog({
  open,
  onOpenChange,
  item,
  entry,
  allItems,
  baselineTestId,
  allEntries,
  baselineTestQuestions,
  onSuccess,
}: EntryDialogProps) {
  const [testQuestionCount, setTestQuestionCount] = useState(
    entry?.testQuestionCount ?? 1
  );
  const firstRule = entry?.masteryRules?.[0];
  const [allCorrect, setAllCorrect] = useState(
    !entry || firstRule?.condition === "all_correct"
  );
  const [threshold, setThreshold] = useState(firstRule?.threshold ?? 1);
  const [selectedTargetQuizIds, setSelectedTargetQuizIds] = useState<string[]>(
    firstRule?.targetQuizIds ?? []
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Reset form when entry changes
  useEffect(() => {
    setTestQuestionCount(entry?.testQuestionCount ?? 1);
    const rule = entry?.masteryRules?.[0];
    setAllCorrect(!entry || rule?.condition === "all_correct");
    setThreshold(rule?.threshold ?? 1);
    setSelectedTargetQuizIds(rule?.targetQuizIds ?? []);
  }, [entry, open]);

  const { mutate: createEntry, isPending: isCreating } =
    usePostBaselineTestEntry(baselineTestId);
  const { mutate: updateEntry, isPending: isUpdating } =
    usePatchBaselineTestEntry(baselineTestId, entry?.id ?? "");
  const { mutate: deleteEntry, isPending: isDeleting } =
    useDeleteBaselineTestEntry(baselineTestId, entry?.id ?? "");

  // Quota calculation: total of all other entries
  const otherEntriesTotal = allEntries
    .filter((e) => e.quizId !== item?.quizId)
    .reduce((sum, e) => sum + (e.testQuestionCount ?? 0), 0);
  const maxForThisEntry =
    baselineTestQuestions > 0
      ? baselineTestQuestions - otherEntriesTotal
      : Infinity;

  const otherItems = allItems.filter((i) => i.quizId !== item?.quizId);

  const handleToggleTargetQuiz = (quizId: string) => {
    setSelectedTargetQuizIds((prev) =>
      prev.includes(quizId) ? prev.filter((id) => id !== quizId) : [...prev, quizId]
    );
  };

  const handleSave = () => {
    if (!item) return;

    const masteryRules = [
      {
        condition: allCorrect ? "all_correct" : "min_correct",
        threshold: allCorrect ? testQuestionCount : Math.max(1, threshold),
        action: "mark_mastered",
        targetQuizIds: selectedTargetQuizIds,
      },
    ];

    if (entry?.id) {
      updateEntry(
        {
          orderIndex: allItems.findIndex((i) => i.quizId === item.quizId),
          testQuestionCount,
          masteryRules,
        },
        {
          onSuccess: () => {
            toast.success("Entry updated successfully");
            onSuccess();
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update entry"),
        }
      );
    } else {
      createEntry(
        {
          quizId: item.quizId,
          orderIndex: allItems.findIndex((i) => i.quizId === item.quizId),
          testQuestionCount,
          masteryRules,
        },
        {
          onSuccess: () => {
            toast.success("Entry created successfully");
            onSuccess();
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to create entry"),
        }
      );
    }
  };

  const handleDelete = () => {
    deleteEntry(undefined, {
      onSuccess: () => {
        toast.success("Entry deleted");
        onSuccess();
        setDeleteConfirmOpen(false);
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to delete entry"),
    });
  };

  const isSaving = isCreating || isUpdating;
  const isOverQuota =
    baselineTestQuestions > 0 && testQuestionCount > maxForThisEntry;

  if (!item) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {entry ? "Edit Baseline Entry" : "Add Baseline Entry"}
            </DialogTitle>
            <DialogDescription className="line-clamp-2">
              {item.quizTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Quota info */}
            {baselineTestQuestions > 0 && (
              <div className="flex items-center justify-between text-sm rounded-md bg-muted px-3 py-2">
                <span className="text-muted-foreground">Remaining quota</span>
                <Badge
                  variant={
                    maxForThisEntry <= 0 ? "destructive" : "secondary"
                  }
                >
                  {maxForThisEntry <= 0 ? 0 : maxForThisEntry} /{" "}
                  {baselineTestQuestions}
                </Badge>
              </div>
            )}

            {/* Test Question Count */}
            <div className="space-y-1.5">
              <Label htmlFor="testQuestionCount">Test Question Count</Label>
              <Input
                id="testQuestionCount"
                type="number"
                min={1}
                max={baselineTestQuestions > 0 ? maxForThisEntry : undefined}
                value={testQuestionCount}
                onChange={(e) =>
                  setTestQuestionCount(parseInt(e.target.value) || 1)
                }
                className={isOverQuota ? "border-destructive" : ""}
              />
              {isOverQuota && (
                <p className="text-xs text-destructive">
                  Exceeds remaining quota of {maxForThisEntry}
                </p>
              )}
            </div>

            {/* Mastery Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mastery Rule</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allCorrect
                      ? "All answers must be correct"
                      : "Pass if above threshold"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    All Correct
                  </span>
                  <Switch
                    checked={allCorrect}
                    onCheckedChange={setAllCorrect}
                  />
                </div>
              </div>

              {!allCorrect && (
                <div className="space-y-1.5 pl-1">
                  <Label htmlFor="threshold">
                    Threshold (max {testQuestionCount})
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={testQuestionCount}
                    value={threshold}
                    onChange={(e) =>
                      setThreshold(
                        Math.min(
                          testQuestionCount,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* Target Quiz IDs (optional) */}
            {otherItems.length > 0 && (
              <div className="space-y-2">
                <Label>Target Quizzes (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Quizzes to target based on mastery result
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2">
                  {otherItems.map((otherItem: any) => (
                    <div
                      key={otherItem.quizId}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleTargetQuiz(otherItem.quizId)}
                    >
                      <Checkbox
                        checked={selectedTargetQuizIds.includes(otherItem.quizId)}
                        onCheckedChange={() =>
                          handleToggleTargetQuiz(otherItem.quizId)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm line-clamp-1">
                        {otherItem.quizTitle}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t gap-2">
              {entry?.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || isOverQuota}>
                  {isSaving ? "Saving..." : entry ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the baseline test entry for{" "}
              <strong>{item.quizTitle}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Sortable Row ─────────────────────────────────────────────────────────────

interface SortableRowProps {
  item: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRowClick: (quizId: string) => void;
  entry: BaselineTestEntry | null;
  onManageEntry: (item: any) => void;
}

function SortableRow({
  item,
  isSelected,
  onSelect,
  onRowClick,
  entry,
  onManageEntry,
}: SortableRowProps) {
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
      <TableCell className="w-8 px-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="w-8 px-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(item.quizId)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell
        className="font-medium cursor-pointer hover:text-blue-600 max-w-[200px]"
        onClick={() => onRowClick(item.quizId)}
      >
        <span className="line-clamp-2">{item.quizTitle}</span>
      </TableCell>
      <TableCell
        className="hidden sm:table-cell cursor-pointer text-sm text-muted-foreground"
        onClick={() => onRowClick(item.quizId)}
      >
        {item.sectionName}
      </TableCell>
      <TableCell
        className="hidden md:table-cell cursor-pointer text-sm text-muted-foreground"
        onClick={() => onRowClick(item.quizId)}
      >
        {item.lessonName}
      </TableCell>
      <TableCell className="text-center">
        {entry ? (
          <Badge variant="secondary" className="font-mono">
            {entry.testQuestionCount}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant={entry ? "outline" : "ghost"}
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onManageEntry(item);
          }}
        >
          {entry ? (
            <>
              <Edit className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedItemForEntry, setSelectedItemForEntry] = useState<any | null>(null);

  // Year groups
  const { data: yearGroupsResponse, isLoading: yearGroupsLoading } =
    useGetYearGroups();
  const yearGroups = yearGroupsResponse?.data || [];

  useEffect(() => {
    if (yearGroups.length > 0 && !selectedYearGroup) {
      setSelectedYearGroup(yearGroups[0].id);
    }
  }, [yearGroups, selectedYearGroup]);

  // Master list
  const {
    data: masterListResponse,
    isLoading: masterListLoading,
    refetch: refetchMasterList,
  } = useGeQuizMasterList(selectedYearGroup, isCumulative);
  const masterList = masterListResponse?.data;
  const baselineTestQuestions = masterList?.baselineTestQuestions ?? 0;

  useEffect(() => {
    if (masterList?.items) {
      setOrderedItems(masterList.items);
    }
  }, [masterList]);

  // Find baseline test for the selected year group
  const { data: baselineTestsResponse } = useGetBaselineTests();
  const baselineTests = baselineTestsResponse?.data || [];
  const currentYearGroup = yearGroups.find((yg) => yg.id === selectedYearGroup);
  const baselineTest = baselineTests.find(
    (bt) => bt.yearGroup === currentYearGroup?.name
  );
  const baselineTestId = baselineTest?.id ?? "";

  // Baseline test entries
  const { data: entriesResponse, refetch: refetchEntries } =
    useGetBaselineTestEntry(baselineTestId);
  const entries: BaselineTestEntry[] = (entriesResponse?.data as any) ?? [];

  // Cumulative question count validation
  const totalQuestions = entries.reduce(
    (sum, e) => sum + (e.testQuestionCount ?? 0),
    0
  );
  const isOverLimit =
    baselineTestQuestions > 0 && totalQuestions > baselineTestQuestions;

  // Available quizzes for add dialog
  const { data: quizzesResponse } = useGetQuizzes({
    status: "published",
    page: addQuizPage,
    limit: 10,
  });
  const availableQuizzes = quizzesResponse?.quizzes || [];
  const quizzesPagination = quizzesResponse?.pagination;

  // Curricula for bulk add
  const { data: curriculaResponse, isLoading: curriculaLoading } =
    useGetCurricula();
  const curricula = curriculaResponse?.curricula || [];

  // Mutations
  const { mutate: addQuizzes, isPending: isAddingQuizzes } =
    usePostAddQuizzesToMasterList(selectedYearGroup);
  const { mutate: bulkAddQuizzes, isPending: isBulkAdding } =
    usePostBulkAddQuizzesToMasterList();
  const { mutate: deleteQuizzes, isPending: isBulkDeleting } =
    useDeleteQuizzesFromMasterList(selectedYearGroup);
  const { mutate: reorderList, isPending: isReordering } =
    usePostReorderMasterList(selectedYearGroup);
  const { mutate: refreshList, isPending: isRefreshing } =
    usePatchRefreshMasterList(selectedYearGroup);

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
        reorderList(
          { quizIdsInOrder: newItems.map((item) => item.quizId) },
          {
            onSuccess: () => {
              toast.success("Quiz order updated");
              refetchMasterList();
            },
            onError: () => {
              toast.error("Failed to update quiz order");
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
      prev.includes(quizId) ? prev.filter((id) => id !== quizId) : [...prev, quizId]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuizIds(
      selectedQuizIds.length === orderedItems.length
        ? []
        : orderedItems.map((item) => item.quizId)
    );
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
        onError: () => toast.error("Failed to add quizzes"),
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
        onError: () => toast.error("Failed to bulk add quizzes"),
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
        onError: () => toast.error("Failed to remove quizzes"),
      }
    );
  };

  const handleRefresh = () => {
    refreshList(undefined, {
      onSuccess: () => {
        toast.success("Master list refreshed");
        refetchMasterList();
      },
      onError: () => toast.error("Failed to refresh master list"),
    });
  };

  const handleManageEntry = (item: any) => {
    setSelectedItemForEntry(item);
    setEntryDialogOpen(true);
  };

  const handleEntrySuccess = () => {
    refetchEntries();
  };

  const selectedEntry = selectedItemForEntry
    ? entries.find((e) => e.quizId === selectedItemForEntry.quizId) ?? null
    : null;

  if (yearGroupsLoading) {
    return (
      <div className="w-full p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-poppins">
          Master Quiz List
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage master quiz list by year group
        </p>
      </div>

      {/* Over-limit warning */}
      {isOverLimit && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Total test questions ({totalQuestions}) exceeds the limit of{" "}
            <strong>{baselineTestQuestions}</strong>. Please adjust baseline
            entries.
          </p>
        </div>
      )}

      {/* Baseline quota summary */}
      {baselineTestQuestions > 0 && !isOverLimit && entries.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted text-sm">
          <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            Baseline questions used:{" "}
            <strong className="text-foreground">
              {totalQuestions} / {baselineTestQuestions}
            </strong>
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Quiz Master List</CardTitle>
              <CardDescription>
                {masterList
                  ? `${masterList.totalItems} quizzes in ${masterList.yearGroupName}`
                  : "Select a year group to view quizzes"}
              </CardDescription>
            </div>
            <Select
              value={selectedYearGroup}
              onValueChange={setSelectedYearGroup}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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
                Refresh
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedQuizIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedQuizIds.length})
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

              <Dialog
                open={bulkAddDialogOpen}
                onOpenChange={setBulkAddDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!selectedYearGroup}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Bulk Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Bulk Add from Curriculum Lesson</DialogTitle>
                    <DialogDescription>
                      Select a lesson to add all its quizzes
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
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          ) : !masterList || orderedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quizzes in this master list</p>
              <p className="text-sm mt-1">Add quizzes using the buttons above</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 px-2" />
                      <TableHead className="w-8 px-2">
                        <Checkbox
                          checked={
                            selectedQuizIds.length === orderedItems.length &&
                            orderedItems.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Quiz Title</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Section
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Lesson
                      </TableHead>
                      <TableHead className="text-center">
                        Test Questions
                      </TableHead>
                      <TableHead>Actions</TableHead>
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
                          onRowClick={(id) =>
                            router.push(`/admin/quizzes/${id}`)
                          }
                          entry={
                            entries.find((e) => e.quizId === item.quizId) ??
                            null
                          }
                          onManageEntry={handleManageEntry}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete selected confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedQuizIds.length} quiz(es) from the
              master list. This cannot be undone.
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

      {/* Entry dialog */}
      {selectedItemForEntry && (
        <EntryDialog
          open={entryDialogOpen}
          onOpenChange={setEntryDialogOpen}
          item={selectedItemForEntry}
          entry={selectedEntry}
          allItems={orderedItems}
          baselineTestId={baselineTestId}
          allEntries={entries}
          baselineTestQuestions={baselineTestQuestions}
          onSuccess={handleEntrySuccess}
        />
      )}
    </div>
  );
}

// ─── Add Quizzes Dialog ───────────────────────────────────────────────────────

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
      prev.includes(quizId)
        ? prev.filter((id) => id !== quizId)
        : [...prev, quizId]
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
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-1">{quiz.title}</p>
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} (
            {pagination.totalCount} total)
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
              Prev
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

      <div className="flex justify-end">
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

// ─── Bulk Add Dialog ──────────────────────────────────────────────────────────

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
  const [selectedCurriculumLessonId, setSelectedCurriculumLessonId] =
    useState<string>("");

  const { data: curriculumDetailsResponse, isLoading: detailsLoading } =
    useGetCurriculum(selectedCurriculumId);
  const curriculumDetails = curriculumDetailsResponse?.data;

  const handleCurriculumSelect = (curriculumId: string) => {
    setSelectedCurriculumId(curriculumId);
    setSelectedCurriculumLessonId("");
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading curricula...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {selectedCurriculumId && (
        <div className="space-y-2">
          <Label>Select Lesson</Label>
          {detailsLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading lessons...</p>
            </div>
          ) : !curriculumDetails?.lessons ||
            curriculumDetails.lessons.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm border rounded-md">
              No lessons available in this curriculum
            </p>
          ) : (
            <div className="max-h-[40vh] overflow-y-auto space-y-1 border rounded-md p-2">
              {curriculumDetails.lessons.map((lesson: any) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`w-full text-left flex items-center space-x-2 p-2.5 border rounded-md hover:bg-muted/50 transition-colors ${
                    selectedCurriculumLessonId === lesson.id
                      ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedCurriculumLessonId(lesson.id)}
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
          onClick={() =>
            selectedCurriculumLessonId && onBulkAdd(selectedCurriculumLessonId)
          }
          disabled={!selectedCurriculumLessonId || isBulkAdding || detailsLoading}
        >
          {isBulkAdding ? "Adding..." : "Add All Quizzes from Lesson"}
        </Button>
      </div>
    </div>
  );
}
