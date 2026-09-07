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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  useDeleteCurriculum,
  usePutCurriculum,
  usePostDuplicateCurriculum,
} from "@/lib/api/mutations";
import { useGetSubscriptionPlansWithIds } from "@/lib/api/queries";
import { Trash, MoreVertical, Eye, EyeOff, Copy } from "lucide-react";
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
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const { mutateAsync: deleteCurriculum, isPending: isDeleting } =
    useDeleteCurriculum(curriculumId);
  const {
    mutateAsync: toggleCurriculumVisibility,
    isPending: isTogglingVisibility,
  } = usePutCurriculum(curriculumId);
  const { mutateAsync: duplicateCurriculum, isPending: isDuplicating } =
    usePostDuplicateCurriculum(curriculumId);
  const { data: subscriptionPlansData } = useGetSubscriptionPlansWithIds();

  const handleDelete = async () => {
    try {
      const result = await deleteCurriculum();
      if (result.status === 200) {
        toast.success(result.data.message);
        router.push("/admin/curricula");
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

  const handleDuplicate = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a subscription plan");
      return;
    }
    try {
      const result = await duplicateCurriculum({
        subscriptionPlanId: selectedPlanId,
      });
      if (result.status === 200) {
        toast.success(result.data.message);
        setShowDuplicateDialog(false);
        setSelectedPlanId("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const availablePlans =
    subscriptionPlansData?.data?.filter(
      (plan) => plan.id !== curriculum.subscriptionPlanId && plan.isActive
    ) || [];

  if (!canEdit) return null;

  return (
    <>
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility();
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setShowDuplicateDialog(true);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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

      <AlertDialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          setShowDuplicateDialog(open);
          if (!open) {
            setSelectedPlanId("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Curriculum</AlertDialogTitle>
            <AlertDialogDescription>
              Select a subscription plan to duplicate this curriculum into.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subscription-plan">Subscription Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger id="subscription-plan">
                  <SelectValue placeholder="Select a subscription plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.length === 0 ? (
                    <SelectItem value="no-plans" disabled>
                      No other plans available
                    </SelectItem>
                  ) : (
                    availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.offerType}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedPlanId("");
                setShowDuplicateDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDuplicate}
              disabled={
                isDuplicating || !selectedPlanId || availablePlans.length === 0
              }
            >
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
