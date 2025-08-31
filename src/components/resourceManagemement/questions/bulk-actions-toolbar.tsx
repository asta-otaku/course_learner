"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash, FolderOpen, X } from "lucide-react";
import { toast } from "sonner";
import { bulkMoveQuestions } from "@/app/actions/questions";
import { MoveToFolderDialog } from "./move-to-folder-dialog";
import { useDeleteQuestions } from "@/lib/api/mutations";

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onComplete: () => void;
  currentFolderId?: string | null;
}

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onComplete,
  currentFolderId,
}: BulkActionsToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: deleteQuestions } = useDeleteQuestions();
  if (selectedIds.length === 0) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuestions({ ids: selectedIds });
      if (result.status !== 200) {
        toast.error(result.data.message);
        return;
      }
      toast.success(result.data.message);
      onClearSelection();
      onComplete();
    } catch (error) {
      toast.error("Failed to delete questions");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleMove = async (targetFolderId: string | null) => {
    try {
      const result = await bulkMoveQuestions(selectedIds, targetFolderId);
      if (!result.success) {
        toast.error((result as any).error);
        return;
      }
      toast.success(`Moved ${result.data.movedCount} questions`);
      onClearSelection();
      onComplete();
      setShowMoveDialog(false);
    } catch (error) {
      toast.error("Failed to move questions");
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-lg border p-4 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedIds.length} question{selectedIds.length > 1 ? "s" : ""}{" "}
          selected
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMoveDialog(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Move to Folder
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>

          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} questions?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected questions. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveToFolderDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        onMove={handleMove}
        currentFolderId={currentFolderId}
        questionCount={selectedIds.length}
      />
    </>
  );
}
