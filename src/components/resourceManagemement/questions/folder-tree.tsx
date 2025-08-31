"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  FileText,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import { usePatchFolder } from "@/lib/api/mutations";
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
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];

interface FolderTreeProps {
  folders: QuestionFolder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate?: (parentId: string | null) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
  onFolderMove?: (folderId: string, newParentId: string | null) => void;
  questionCounts?: Record<string, number>; // folder_id -> question count
  totalQuestions?: number; // total questions at root level
  className?: string;
}

interface FolderNodeProps {
  folder: QuestionFolder;
  folders: QuestionFolder[];
  level: number;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate?: (parentId: string | null) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
  onFolderMove?: (folderId: string, newParentId: string | null) => void;
  questionCounts?: Record<string, number>;
}

function SortableFolderNode(props: FolderNodeProps & { isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: props.folder.id,
    disabled: false, // Allow dragging folders at all levels
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FolderNode
        {...props}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isSortableDragging}
      />
    </div>
  );
}

function FolderNode({
  folder,
  folders,
  level,
  selectedFolderId,
  expandedFolders,
  onToggleExpand,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFolderMove,
  questionCounts,
  dragAttributes,
  dragListeners,
  isDragging,
}: FolderNodeProps & {
  dragAttributes?: any;
  dragListeners?: any;
  isDragging?: boolean;
}) {
  // Helper function to get parent ID that handles both field names
  const getParentId = (f: any): string | null => {
    return f.parentFolderId || f.parent_id || null;
  };

  const childFolders = folders.filter((f) => getParentId(f) === folder.id);
  const hasChildren = childFolders.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const questionCount = questionCounts?.[folder.id] || 0;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Create patch mutations for this folder
  const patchFolderMutation = usePatchFolder(folder.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(folder.id);
    }
  };

  const handleSelect = () => {
    onFolderSelect(folder.id);
  };

  const handleContextMenu = async (action: string) => {
    switch (action) {
      case "new-folder":
        onFolderCreate?.(folder.id);
        break;
      case "rename":
        // Open rename dialog instead of using prompt
        setNewFolderName(folder.name);
        setShowRenameDialog(true);
        break;
      case "delete":
        setShowDeleteDialog(true);
        break;
      case "move":
        setShowMoveDialog(true);
        break;
    }
  };

  const handleDelete = () => {
    onFolderDelete?.(folder.id);
    setShowDeleteDialog(false);
  };

  const handleMove = async () => {
    if (targetFolderId !== undefined && onFolderMove) {
      try {
        const result = await patchFolderMutation.mutateAsync({
          name: folder.name,
          description: "",
          parentFolderId: targetFolderId || undefined,
        });

        if (result.status === 200) {
          // Call the move handler to refresh the UI
          onFolderMove(folder.id, targetFolderId);
          setShowMoveDialog(false);
          setTargetFolderId(null);
        }
      } catch (error) {
        console.error("Error moving folder:", error);
      }
    }
  };

  const handleRename = async () => {
    if (newFolderName.trim() && newFolderName !== folder.name) {
      try {
        const result = await patchFolderMutation.mutateAsync({
          name: newFolderName.trim(),
          description: "", // Keep existing description
        });

        if (result.status === 200) {
          // Call the rename handler to refresh the UI
          onFolderRename?.(folder.id, newFolderName.trim());
          setShowRenameDialog(false);
          setNewFolderName("");
        }
      } catch (error) {
        console.error("Error renaming folder:", error);
      }
    }
  };

  return (
    <div className="select-none group">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
              "hover:bg-blue-50 hover:border-blue-200 border border-transparent",
              isSelected && "bg-blue-100 border-blue-300 shadow-sm",
              isDragging && "opacity-50"
            )}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={handleSelect}
          >
            {/* Drag Handle - Show for all folders */}
            <div
              {...dragAttributes}
              {...dragListeners}
              className="p-1 hover:bg-blue-100 rounded-md transition-colors cursor-move opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-slate-400" />
            </div>

            <button
              onClick={handleToggle}
              className="p-1 hover:bg-blue-100 rounded-md transition-colors"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
            </button>

            {isExpanded ? (
              <FolderOpen className="h-5 w-5 text-blue-600" />
            ) : (
              <Folder className="h-5 w-5 text-slate-500" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {folder.name}
                </span>
                {questionCount > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                    {questionCount}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
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

              {/* More options menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleContextMenu("new-folder")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Subfolder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleContextMenu("rename")}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleContextMenu("move")}>
                    Move to...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleContextMenu("new-folder")}>
            New Subfolder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenu("rename")}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenu("move")}>
            Move to...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleContextMenu("delete")}
            className="text-red-600"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && hasChildren && (
        <div className="space-y-1">
          <SortableContext
            items={childFolders.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {childFolders.map((childFolder) => (
              <SortableFolderNode
                key={childFolder.id}
                folder={childFolder}
                folders={folders}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                expandedFolders={expandedFolders}
                onToggleExpand={onToggleExpand}
                onFolderSelect={onFolderSelect}
                onFolderCreate={onFolderCreate}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
                onFolderMove={onFolderMove}
                questionCounts={questionCounts}
              />
            ))}
          </SortableContext>
        </div>
      )}

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
              {hasChildren && (
                <span className="block mt-2 font-semibold">
                  This folder has subfolders. They will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move Folder</DialogTitle>
            <DialogDescription>
              Select where you want to move "{folder.name}" to:
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[300px] pr-4">
            <RadioGroup
              value={targetFolderId || "root"}
              onValueChange={(value) =>
                setTargetFolderId(value === "root" ? null : value)
              }
            >
              {/* Root level option */}
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <RadioGroupItem value="root" id="folder-root" />
                <Label htmlFor="folder-root" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Root Level</span>
                  </div>
                </Label>
              </div>

              {/* Render all folders except current folder and its descendants */}
              {folders
                .filter((f) => {
                  // Don't show current folder
                  if (f.id === folder.id) return false;
                  // Don't show descendants of current folder
                  if (f.path && f.path.includes(folder.id)) return false;
                  return true;
                })
                .map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                  >
                    <RadioGroupItem value={f.id} id={`folder-${f.id}`} />
                    <Label
                      htmlFor={`folder-${f.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div
                        className="flex items-center gap-2"
                        style={{
                          paddingLeft: `${(f.path?.split("/").filter(Boolean).length || 0) * 20}px`,
                        }}
                      >
                        <Folder className="h-4 w-4" />
                        <span>{f.name}</span>
                      </div>
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for "{folder.name}":
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFolderMove,
  questionCounts,
  totalQuestions,
  className,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Helper function to get parent ID that handles both field names
  const getParentId = (folder: any): string | null => {
    return folder.parentFolderId || folder.parent_id || null;
  };

  // Build folder hierarchy - handle both parent_id and parentFolderId
  // Use the flattened structure from the API response
  const rootFolders = folders.filter((f) => !getParentId(f));

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

  const handleToggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Auto-expand parent folders when a folder is selected
  useEffect(() => {
    if (selectedFolderId) {
      const folder = folders.find((f) => f.id === selectedFolderId);
      if (folder && folder.path) {
        const parentIds = folder.path.split("/").filter(Boolean).slice(0, -1);
        setExpandedFolders((prev) => new Set([...prev, ...parentIds]));
      }
    }
  }, [selectedFolderId, folders]);

  // Auto-expand folders that have children when they're first loaded
  useEffect(() => {
    const foldersWithChildren = folders.filter((f) => {
      const childFolders = folders.filter(
        (child) => getParentId(child) === f.id
      );
      return childFolders.length > 0;
    });

    if (foldersWithChildren.length > 0) {
      setExpandedFolders(
        (prev) => new Set([...prev, ...foldersWithChildren.map((f) => f.id)])
      );
    }
  }, [folders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && onFolderMove) {
      const activeFolder = folders.find((f) => f.id === active.id);
      const overFolder = folders.find((f) => f.id === over?.id);

      if (activeFolder && overFolder) {
        // Helper function to get parent ID
        const getParentId = (f: any): string | null => {
          return f.parentFolderId || f.parent_id || null;
        };

        // Check if they have the same parent
        if (getParentId(activeFolder) === getParentId(overFolder)) {
          // Get all siblings at this level
          const siblings = folders
            .filter((f) => getParentId(f) === getParentId(activeFolder))
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

          const oldIndex = siblings.findIndex((f) => f.id === active.id);
          const newIndex = siblings.findIndex((f) => f.id === over?.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            // Calculate new order
            const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);

            // Create order updates
            const folderOrders = reorderedSiblings.map((folder, index) => ({
              id: folder.id,
              order_index: index,
            }));

            // Import reorderFolders directly here
            const { reorderFolders } = await import(
              "@/app/actions/question-folders"
            );
            const result = await reorderFolders(folderOrders);

            if (result && result.success) {
              // Call the move handler to refresh
              onFolderMove(active.id as string, getParentId(activeFolder));
            } else {
              console.error("Failed to reorder folders:", result?.error);
            }
          }
        }
      }
    }

    setActiveId(null);
  };

  const activeFolder = activeId ? folders.find((f) => f.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("space-y-2", className)}>
        {/* Root level (All Questions) */}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-slate-100 border border-transparent",
            selectedFolderId === null &&
              "bg-slate-200 border-slate-300 shadow-sm"
          )}
          onClick={() => onFolderSelect(null)}
        >
          <div className="h-4 w-4" />
          <FileText className="h-5 w-5 text-slate-600" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                All Questions
              </span>
              {totalQuestions !== undefined && totalQuestions > 0 && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                  {totalQuestions}
                </span>
              )}
            </div>
          </div>
          {onFolderCreate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-70 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onFolderCreate(null);
              }}
            >
              <Plus className="h-4 w-4 text-slate-500" />
            </Button>
          )}
        </div>

        {/* Root folders */}
        <div className="space-y-1">
          <SortableContext
            items={rootFolders.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {rootFolders.map((folder) => (
              <SortableFolderNode
                key={folder.id}
                folder={folder}
                folders={folders}
                level={0}
                selectedFolderId={selectedFolderId}
                expandedFolders={expandedFolders}
                onToggleExpand={handleToggleExpand}
                onFolderSelect={onFolderSelect}
                onFolderCreate={onFolderCreate}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
                onFolderMove={onFolderMove}
                questionCounts={questionCounts}
              />
            ))}
          </SortableContext>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeFolder ? (
          <div className="bg-white shadow-lg rounded-lg p-3 border border-blue-300 opacity-90">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{activeFolder.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
