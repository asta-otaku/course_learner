"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "react-toastify";
import { useDeleteCurriculum, usePutCurriculum } from "@/lib/api/mutations";
import { Trash, MoreVertical, Eye, EyeOff } from "lucide-react";
import { Curriculum } from "@/lib/types";

interface CurriculumActionsProps {
  curriculumId: string;
  canEdit: boolean;
  isPublic?: boolean;
  curriculum: Curriculum;
}

export function CurriculumActions({
  curriculumId,
  canEdit,
  isPublic = false,
  curriculum,
}: CurriculumActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { mutateAsync: deleteCurriculum, isPending: isDeleting } =
    useDeleteCurriculum(curriculumId);
  const {
    mutateAsync: toggleCurriculumVisibility,
    isPending: isTogglingVisibility,
  } = usePutCurriculum(curriculumId);

  const handleDelete = async () => {
    try {
      const result = await deleteCurriculum();
      if (result.status === 200) {
        toast.success(result.data.message);
        router.push("/curricula");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const result = await toggleCurriculumVisibility({
        title: curriculum.title,
        description: curriculum.description,
        subscriptionPlanId: curriculum.subscriptionPlanId,
        durationWeeks: curriculum.durationWeeks,
        learningObjectives: curriculum.learningObjectives,
        prerequisites: curriculum.prerequisites,
        tags: curriculum.tags,
        visibility: isPublic ? "PRIVATE" : "PUBLIC",
      });
      if (result.status === 200) {
        toast.success(result.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!canEdit) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleToggleVisibility}
            disabled={isTogglingVisibility}
          >
            {isPublic ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Make Public
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              curriculum and all associated sections and lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
