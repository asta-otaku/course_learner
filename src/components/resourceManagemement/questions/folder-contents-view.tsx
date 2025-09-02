"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  MoreVertical,
  GripVertical,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];

interface FolderContentsViewProps {
  subfolders: QuestionFolder[];
  questions: Question[];
  questionCounts: Record<string, number>;
  onFolderSelect: (folderId: string) => void;
  onFolderCreate: (parentId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
  columns: any[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
  enableRowSelection?: boolean;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

// Sortable folder card component
function SortableFolderCard({
  folder,
  questionCount,
  onFolderAction,
}: {
  folder: QuestionFolder;
  questionCount: number;
  onFolderAction: (
    action: string,
    folderId: string,
    folderName: string
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={cn(
          "group relative p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer",
          isDragging && "opacity-50"
        )}
        onClick={() => onFolderAction("open", folder.id, folder.name)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Drag handle */}
            <div
              {...listeners}
              className="flex-shrink-0 p-1 hover:bg-blue-100 rounded-md transition-colors cursor-move opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex-shrink-0">
              <Folder className="h-8 w-8 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-slate-900 truncate">
                {folder.name}
              </h4>
              {questionCount > 0 && (
                <p className="text-sm text-slate-500">
                  {questionCount} question{questionCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderAction("new-folder", folder.id, folder.name);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Subfolder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderAction("rename", folder.id, folder.name);
                  }}
                >
                  Rename
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{folder.name}"?
              {questionCount > 0 && (
                <span className="block mt-2 font-semibold">
                  This folder contains {questionCount} question
                  {questionCount !== 1 ? "s" : ""}. All questions will be moved
                  to the parent folder.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onFolderAction("delete", folder.id, folder.name)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function FolderContentsView({
  subfolders,
  questions,
  questionCounts,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  columns,
  totalPages,
  currentPage,
  pageSize,
  totalItems,
  className,
  enableRowSelection,
  rowSelection,
  onRowSelectionChange,
  onPageChange,
  onPageSizeChange,
}: FolderContentsViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localSubfolders, setLocalSubfolders] = useState(subfolders);

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

  // Update local state when subfolders prop changes
  useEffect(() => {
    setLocalSubfolders(subfolders);
  }, [subfolders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localSubfolders.findIndex(
      (folder) => folder.id === active.id
    );
    const newIndex = localSubfolders.findIndex(
      (folder) => folder.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for responsive UI
    const newSubfolders = arrayMove(localSubfolders, oldIndex, newIndex);
    setLocalSubfolders(newSubfolders);

    // Create order updates
    const folderOrders = newSubfolders.map((folder, index) => ({
      id: folder.id,
      order_index: index,
    }));

    // Import reorderFolders directly here
    try {
      const { reorderFolders } = await import("@/app/actions/question-folders");
      const result = await reorderFolders(folderOrders);

      if (!result || !result.success) {
        // Revert on error
        setLocalSubfolders(subfolders);
        console.error("Failed to reorder folders:", result?.error);
      }
    } catch (error) {
      // Revert on error
      setLocalSubfolders(subfolders);
      console.error("Error reordering folders:", error);
    }
  };

  const activeFolder = activeId
    ? localSubfolders.find((f) => f.id === activeId)
    : null;
  const handleFolderAction = (
    action: string,
    folderId: string,
    folderName: string
  ) => {
    switch (action) {
      case "open":
        onFolderSelect(folderId);
        break;
      case "new-folder":
        onFolderCreate(folderId);
        break;
      case "rename":
        const newName = prompt("Enter new folder name:", folderName);
        if (newName && newName !== folderName) {
          onFolderRename(folderId, newName);
        }
        break;
      case "delete":
        onFolderDelete(folderId);
        break;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Subfolders Section */}
      {localSubfolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Folder className="h-4 w-4" />
            Folders ({localSubfolders.length})
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localSubfolders.map((f) => f.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {localSubfolders.map((folder) => {
                  const questionCount = questionCounts[folder.id] || 0;
                  return (
                    <SortableFolderCard
                      key={folder.id}
                      folder={folder}
                      questionCount={questionCount}
                      onFolderAction={handleFolderAction}
                    />
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeFolder ? (
                <div className="opacity-50">
                  <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {activeFolder.name}
                        </h4>
                        {questionCounts[activeFolder.id] > 0 && (
                          <p className="text-sm text-slate-500">
                            {questionCounts[activeFolder.id]} question
                            {questionCounts[activeFolder.id] !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Questions Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText className="h-4 w-4" />
          Questions ({questions.length})
        </div>

        {questions.length > 0 ? (
          <DataTable
            columns={columns}
            data={questions}
            pageCount={totalPages}
            page={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            searchKey="content"
            searchPlaceholder="Search questions..."
            enableRowSelection={enableRowSelection}
            rowSelection={rowSelection}
            onRowSelectionChange={onRowSelectionChange}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            hidePagination={true}
          />
        ) : (
          <div className="text-center py-12 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">No questions in this folder</p>
            <p className="text-sm mt-1">
              {subfolders.length > 0
                ? "Questions may be in the subfolders above."
                : "Create your first question or import questions via bulk upload."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
