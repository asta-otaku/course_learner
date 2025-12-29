"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  FileText,
  Trash2,
  Edit2,
  Move,
  FolderX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Tree line component for visual hierarchy
function TreeLine({ isLast, level }: { isLast: boolean; level: number }) {
  if (level === 0) return null;

  return (
    <div className="absolute left-0 top-0 h-full flex">
      {Array.from({ length: level }).map((_, i) => (
        <div key={i} className="relative w-6 h-full">
          {i === level - 1 ? (
            // Connection for this item
            <>
              <div className="absolute h-1/2 w-px bg-gray-300 dark:bg-gray-600 left-3 top-0" />
              <div
                className={cn(
                  "absolute h-px w-3 bg-gray-300 dark:bg-gray-600 left-3 top-1/2",
                  !isLast && "h-full"
                )}
              />
              {!isLast && (
                <div className="absolute h-1/2 w-px bg-gray-300 dark:bg-gray-600 left-3 top-1/2" />
              )}
            </>
          ) : (
            // Vertical line for parent levels
            <div className="absolute h-full w-px bg-gray-300 dark:bg-gray-600 left-3" />
          )}
        </div>
      ))}
    </div>
  );
}

// Enhanced folder icon
function EnhancedFolderIcon({
  isExpanded,
  hasChildren,
  questionCount = 0,
}: {
  isExpanded: boolean;
  hasChildren: boolean;
  questionCount?: number;
}) {
  const isEmpty = !hasChildren && questionCount === 0;

  const Icon = isEmpty ? FolderX : isExpanded ? FolderOpen : Folder;

  const color = isEmpty
    ? "#9CA3AF" // gray-400
    : isExpanded
      ? "#3B82F6" // blue
      : "#6B7280"; // gray-500

  return (
    <Icon className="h-4 w-4 transition-all duration-200" style={{ color }} />
  );
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create patch mutations for this folder
  const patchFolderMutation = usePatchFolder(folder.id);

  // Calculate indentation
  const indentWidth = level * 24; // 24px per level

  // Check if this is the last child
  const parentId = getParentId(folder);
  const siblings = folders.filter((f) => getParentId(f) === parentId);
  const isLast = siblings[siblings.length - 1]?.id === folder.id;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggleExpand(folder.id);
      }
    },
    [hasChildren, folder.id, onToggleExpand]
  );

  const handleSelect = useCallback(() => {
    if (!isRenaming) {
      onFolderSelect(folder.id);
    }
  }, [isRenaming, folder.id, onFolderSelect]);

  const handleRenameStart = useCallback(() => {
    setIsRenaming(true);
    setRenameValue(folder.name);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [folder.name]);

  const handleRenameCancel = useCallback(() => {
    setIsRenaming(false);
    setRenameValue(folder.name);
  }, [folder.name]);

  const handleRenameSubmit = useCallback(async () => {
    const trimmedName = renameValue.trim();
    if (trimmedName && trimmedName !== folder.name) {
      try {
        const result = await patchFolderMutation.mutateAsync({
          name: trimmedName,
          description: "",
        });

        if (result.status === 200) {
          onFolderRename?.(folder.id, trimmedName);
        }
      } catch (error) {
        console.error("Error renaming folder:", error);
      }
    }
    setIsRenaming(false);
  }, [
    renameValue,
    folder.name,
    folder.id,
    patchFolderMutation,
    onFolderRename,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRenameSubmit();
      } else if (e.key === "Escape") {
        handleRenameCancel();
      }
    },
    [handleRenameSubmit, handleRenameCancel]
  );

  const handleDelete = async () => {
    try {
      // Import axiosInstance for direct API call
      const { axiosInstance } = await import("@/lib/services/axiosInstance");

      const result = await axiosInstance.delete(`/folder/${folder.id}`);

      if (result.status === 200) {
        // Call the delete handler to refresh the UI
        onFolderDelete?.(folder.id);
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
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
          onFolderMove(folder.id, targetFolderId);
          setShowMoveDialog(false);
          setTargetFolderId(null);
        }
      } catch (error) {
        console.error("Error moving folder:", error);
      }
    }
  };

  return (
    <div className="relative group">
      {/* Tree Lines */}
      <TreeLine isLast={isLast} level={level} />

      {/* Main Content */}
      <div
        className={cn(
          "relative flex items-center h-9 px-1.5 py-0.5 cursor-pointer select-none transition-all duration-150",
          "hover:bg-gray-50 dark:hover:bg-gray-800/50",
          isSelected &&
            "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500",
          isDragging && "opacity-50"
        )}
        style={{ paddingLeft: `${indentWidth + 6}px` }}
        onClick={handleSelect}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          // Don't hide actions if dropdown is open
          if (!isDropdownOpen) {
            setIsHovered(false);
          }
        }}
        {...dragAttributes}
        {...dragListeners}
      >
        {/* Expand/Collapse Button */}
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              onClick={handleToggle}
              title={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-600" />
              )}
            </Button>
          ) : (
            <div className="w-5 h-5" />
          )}
        </div>

        {/* Folder Icon */}
        <div className="flex-shrink-0 ml-1 mr-2">
          <EnhancedFolderIcon
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            questionCount={questionCount}
          />
        </div>

        {/* Folder Name */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              className="h-6 px-2 py-0 text-sm border-gray-300 shadow-none focus:ring-1 focus:ring-blue-500"
              maxLength={255}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                "text-sm font-medium truncate block",
                isSelected
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-gray-100"
              )}
              title={folder.name}
            >
              {folder.name}
            </span>
          )}
        </div>

        {/* Question Count */}
        {questionCount > 0 && (
          <div className="flex-shrink-0 ml-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-medium">
              {questionCount}
            </span>
          </div>
        )}

        {/* Actions - NOT draggable */}
        {(isHovered || isSelected || isDropdownOpen) && !isRenaming && (
          <div
            className={cn(
              "flex-shrink-0 ml-2 flex items-center space-x-1 transition-opacity",
              (isHovered || isSelected) && !isDropdownOpen
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            {/* Quick Add Subfolder */}
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onFolderCreate?.(folder.id);
              }}
              title="Add subfolder"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </Button>

            {/* Context Menu */}
            <DropdownMenu
              onOpenChange={(open) => {
                setIsDropdownOpen(open);
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameStart();
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveDialog(true);
                  }}
                >
                  <Move className="w-4 h-4 mr-2" />
                  Move to...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderCreate?.(folder.id);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New subfolder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="transition-all duration-200">
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
                <span className="block mt-2 font-semibold text-orange-600">
                  This folder contains {questionCount} question
                  {questionCount !== 1 ? "s" : ""}. All questions will be moved
                  to the parent folder.
                </span>
              )}
              {hasChildren && (
                <span className="block mt-2 font-semibold text-red-600">
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

          <ScrollArea className="h-[300px] pr-1 [&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden [&>[data-radix-scroll-area-scrollbar]]:w-0.5 [&>[data-radix-scroll-area-scrollbar]]:bg-transparent [&>[data-radix-scroll-area-scrollbar-thumb]]:bg-gray-300 [&>[data-radix-scroll-area-scrollbar-thumb]]:rounded-full [&>[data-radix-scroll-area-scrollbar-thumb]]:opacity-30 [&>[data-radix-scroll-area-scrollbar-thumb]]:hover:opacity-70">
            <RadioGroup
              value={targetFolderId || "root"}
              onValueChange={(value) =>
                setTargetFolderId(value === "root" ? null : value)
              }
            >
              {/* Root level option */}
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
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
                  if (f.id === folder.id) return false;
                  if (f.path && f.path.includes(folder.id)) return false;
                  return true;
                })
                .map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
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

  // Build parent path by traversing up the tree
  const buildParentPath = useCallback((folderId: string): string[] => {
    const parentIds: string[] = [];
    let currentFolder = folders.find((f) => f.id === folderId);
    
    // If folder has a path property, use it
    if (currentFolder?.path) {
      return currentFolder.path.split("/").filter(Boolean).slice(0, -1);
    }
    
    // Otherwise, build path by traversing parents
    while (currentFolder) {
      const parentId = getParentId(currentFolder);
      if (parentId) {
        parentIds.unshift(parentId);
        currentFolder = folders.find((f) => f.id === parentId);
      } else {
        break;
      }
    }
    
    return parentIds;
  }, [folders]);

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

  // Auto-expand parent folders when a folder is selected (but not the folder itself)
  useEffect(() => {
    if (selectedFolderId && folders.length > 0) {
      const parentIds = buildParentPath(selectedFolderId);
      if (parentIds.length > 0) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          parentIds.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }, [selectedFolderId, folders, buildParentPath]);

  // Don't auto-expand folders on load - start collapsed
  // Removed the auto-expand effect for folders with children

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

        // Check if we're moving into a different folder (changing parent)
        const currentParentId = getParentId(activeFolder);
        const targetParentId = overFolder.id;

        // Prevent moving a folder into itself or its descendants
        if (activeFolder.id === targetParentId) {
          setActiveId(null);
          return;
        }

        // Check if target folder is a descendant of the active folder
        const isDescendant = (
          folderId: string,
          ancestorId: string
        ): boolean => {
          const folder = folders.find((f) => f.id === folderId);
          if (!folder || !folder.path) return false;
          return folder.path.includes(ancestorId);
        };

        if (isDescendant(overFolder.id, activeFolder.id)) {
          setActiveId(null);
          return;
        }

        // If moving to a different parent, use direct API call
        if (currentParentId !== targetParentId) {
          try {
            // Import axiosInstance for direct API call
            const { axiosInstance } = await import(
              "@/lib/services/axiosInstance"
            );

            const result = await axiosInstance.patch(
              `/folder/${activeFolder.id}`,
              {
                name: activeFolder.name,
                description: "",
                parentFolderId: targetParentId,
              }
            );

            if (result.status === 200) {
              // Call the move handler to refresh the UI
              onFolderMove(active.id as string, targetParentId);
            }
          } catch (error) {
            console.error("Error moving folder:", error);
          }
        } else {
          // Same parent - handle reordering
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
      <div className={cn("folder-tree", className)}>
        {/* Root level (All Questions) */}
        <div
          className={cn(
            "group flex items-center h-9 px-2 py-0.5 rounded-md cursor-pointer select-none transition-all duration-150 mb-0.5",
            "hover:bg-gray-50 dark:hover:bg-gray-800/50",
            selectedFolderId === null &&
              "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
          )}
          onClick={() => onFolderSelect(null)}
        >
          <div className="flex-shrink-0 w-6 h-6" />
          <FileText
            className={cn(
              "h-4 w-4 mr-2 flex-shrink-0",
              selectedFolderId === null ? "text-blue-600" : "text-gray-600"
            )}
          />
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "text-sm font-medium block truncate",
                selectedFolderId === null
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-gray-100"
              )}
            >
              All Questions
            </span>
          </div>
          {totalQuestions !== undefined && totalQuestions > 0 && (
            <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
              {totalQuestions}
            </span>
          )}
          {onFolderCreate && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onFolderCreate(null);
              }}
              title="Add folder"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </Button>
          )}
        </div>

        {/* Root folders */}
        <div className="space-y-0">
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
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 border border-blue-300 opacity-90">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{activeFolder.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
