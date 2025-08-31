"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Folder, FolderPlus, ChevronRight, Home } from "lucide-react";
import { useGetFolders } from "@/lib/api/queries";
import { usePostFolder } from "@/lib/api/mutations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (folderId: string | null) => void;
  currentFolderId?: string | null;
  questionCount: number;
}

export function MoveToFolderDialog({
  open,
  onOpenChange,
  onMove,
  currentFolderId,
  questionCount,
}: MoveToFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);

  // Use React Query hooks
  const { data: foldersResult, isLoading, refetch } = useGetFolders();
  const createFolderMutation = usePostFolder();

  const folders = foldersResult?.data || [];

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleMove = () => {
    onMove(selectedFolderId);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      const result = await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        description: "", // Add description if needed
        parentFolderId: newFolderParent,
      });

      if (result.status === 200 || result.status === 201) {
        toast.success("Folder created successfully");
        setNewFolderName("");
        setShowCreateFolder(false);
        setNewFolderParent(null);
        await refetch();
        // Auto-select the newly created folder
        setSelectedFolderId(result.data.id);
      } else {
        toast.error("Failed to create folder");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const renderFolderTree = (folders: QuestionFolder[], level = 0) => {
    return folders.map((folder) => {
      const isDisabled = folder.id === currentFolderId;
      const hasChildren = folders.some((f) => f.parent_id === folder.id);

      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
              "ml-" + level * 4,
              selectedFolderId === folder.id &&
                "bg-blue-100 border border-blue-200",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isDisabled && setSelectedFolderId(folder.id)}
          >
            <Folder className="h-4 w-4 text-blue-500 mr-2" />
            <span className="flex-1 text-sm font-medium">{folder.name}</span>
            {isDisabled && (
              <span className="text-xs text-gray-500">(current)</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParent(folder.id);
                setShowCreateFolder(true);
              }}
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
          {hasChildren &&
            renderFolderTree(
              folders.filter((f) => f.parent_id === folder.id),
              level + 1
            )}
        </div>
      );
    });
  };

  const rootFolders = folders.filter((f) => !f.parent_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move {questionCount} questions</DialogTitle>
          <DialogDescription>
            Select a destination folder or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Root folder option */}
          <div
            className={cn(
              "flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
              selectedFolderId === null && "bg-blue-100 border border-blue-200",
              currentFolderId === null && "opacity-50 cursor-not-allowed"
            )}
            onClick={() =>
              currentFolderId !== null && setSelectedFolderId(null)
            }
          >
            <Home className="h-4 w-4 text-gray-500 mr-2" />
            <span className="flex-1 text-sm font-medium">Root Level</span>
            {currentFolderId === null && (
              <span className="text-xs text-gray-500">(current)</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParent(null);
                setShowCreateFolder(true);
              }}
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>

          <Separator />

          {/* Folder tree */}
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading folders...</div>
              </div>
            ) : rootFolders.length > 0 ? (
              <div className="space-y-1">{renderFolderTree(rootFolders)}</div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Folder className="h-8 w-8 text-gray-400 mb-2" />
                <div className="text-sm text-gray-500">No folders found</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setNewFolderParent(null);
                    setShowCreateFolder(true);
                  }}
                >
                  <FolderPlus className="h-3 w-3 mr-1" />
                  Create first folder
                </Button>
              </div>
            )}
          </ScrollArea>

          {/* Create folder form */}
          {showCreateFolder && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="folder-name">New folder name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateFolder();
                      }
                    }}
                    autoFocus
                  />
                </div>
                {newFolderParent && (
                  <div className="text-xs text-gray-600">
                    Creating in:{" "}
                    {folders.find((f) => f.id === newFolderParent)?.name}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCreateFolder(false);
                      setNewFolderName("");
                      setNewFolderParent(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateFolder}
                    disabled={
                      createFolderMutation.isLoading || !newFolderName.trim()
                    }
                  >
                    {createFolderMutation.isLoading ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={selectedFolderId === currentFolderId}
          >
            Move Questions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
