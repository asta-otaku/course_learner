"use client";

import { useState } from "react";
import { usePatchUpdateQuizStatus } from "@/lib/api/mutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
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
import { Rocket, FileX, Archive } from "lucide-react";

interface PublishQuizButtonProps {
  quizId: string;
  currentStatus: "draft" | "published" | "archived";
  canEdit: boolean;
}

export function PublishQuizButton({
  quizId,
  currentStatus,
  canEdit,
}: PublishQuizButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<
    "draft" | "published" | "archived"
  >("published");
  const { mutateAsync: updateQuizStatus } = usePatchUpdateQuizStatus();

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "published":
        return (
          <Badge variant="default" className="gap-1">
            <Rocket className="h-3 w-3" />
            Published
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="secondary" className="gap-1">
            <Archive className="h-3 w-3" />
            Archived
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <FileX className="h-3 w-3" />
            Draft
          </Badge>
        );
    }
  };

  const getButtonConfig = () => {
    switch (currentStatus) {
      case "published":
        return {
          label: "Unpublish",
          targetStatus: "draft" as const,
          description:
            "This will make the quiz unavailable to students. You can publish it again later.",
        };
      case "archived":
        return {
          label: "Restore",
          targetStatus: "draft" as const,
          description:
            "This will restore the quiz to draft status. You can then publish it again.",
        };
      default:
        return {
          label: "Publish",
          targetStatus: "published" as const,
          description:
            "This will make the quiz available to students in lessons.",
        };
    }
  };

  const handleStatusChange = async () => {
    setLoading(true);
    try {
      const result = await updateQuizStatus({
        quizIds: [quizId],
        status: targetStatus,
      });

      if (result.status === 200) {
        toast.success(result.data.message);
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      toast.error("Failed to update quiz status");
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  if (!canEdit) {
    return getStatusBadge();
  }

  const config = getButtonConfig();

  return (
    <>
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        <Button
          variant={currentStatus === "published" ? "outline" : "default"}
          size="sm"
          onClick={() => {
            setTargetStatus(config.targetStatus);
            setShowDialog(true);
          }}
          disabled={loading}
        >
          {config.label}
        </Button>
        {currentStatus !== "archived" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTargetStatus("archived");
              setShowDialog(true);
            }}
            disabled={loading}
          >
            <Archive className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetStatus === "published" && "Publish Quiz"}
              {targetStatus === "draft" &&
                currentStatus === "published" &&
                "Unpublish Quiz"}
              {targetStatus === "draft" &&
                currentStatus === "archived" &&
                "Restore Quiz"}
              {targetStatus === "archived" && "Archive Quiz"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetStatus === "published" && config.description}
              {targetStatus === "draft" &&
                currentStatus === "published" &&
                config.description}
              {targetStatus === "draft" &&
                currentStatus === "archived" &&
                config.description}
              {targetStatus === "archived" &&
                "This will archive the quiz. Archived quizzes are hidden from students and cannot be taken."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              {targetStatus === "published" && "Publish"}
              {targetStatus === "draft" && "Unpublish"}
              {targetStatus === "archived" && "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
