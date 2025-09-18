"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { LessonList, LessonForm } from "../lessons";
import { AddQuizDialog } from "../lessons/add-quiz-dialog";
import { useGetLessonById } from "@/lib/api/queries";
import { useDeleteLesson } from "@/lib/api/mutations";
import { toast } from "react-toastify";
// Define the lesson type from the API response
interface LessonFromAPI {
  id: string;
  title: string;
  description: string;
  content: string;
  orderIndex: number;
  videoUrl: string;
  quizzesCount: number;
}

interface LessonManagerProps {
  curriculumId: string;
  canEdit?: boolean;
  lessons: LessonFromAPI[];
}

export function LessonManager({
  curriculumId,
  canEdit = false,
  lessons,
}: LessonManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonFromAPI | null>(
    null
  );
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Get full lesson data for editing
  const { data: fullLessonData, isLoading: isLoadingLesson } = useGetLessonById(
    editingLessonId || ""
  );

  // Delete lesson mutation
  const { mutate: deleteLesson, isPending: isDeleting } = useDeleteLesson(
    selectedLesson?.id || ""
  );

  const handleCreateLesson = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditLesson = (lesson: LessonFromAPI) => {
    setEditingLessonId(lesson.id);
    setIsEditDialogOpen(true);
  };

  const handleViewLesson = (lesson: LessonFromAPI) => {
    router.push(`/admin/lessons/${lesson.id}`);
  };

  const handleDeleteLesson = (lesson: LessonFromAPI) => {
    setSelectedLesson(lesson);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLesson = () => {
    if (selectedLesson) {
      deleteLesson(undefined, {
        onSuccess: () => {
          toast.success("Lesson deleted successfully");
          setSelectedLesson(null);
          setIsDeleteDialogOpen(false);
          // The parent component should refresh the curriculum data
        },
        onError: (error) => {
          toast.error("Failed to delete lesson");
          console.error("Delete error:", error);
        },
      });
    }
  };

  // Convert full lesson data to the format expected by LessonForm
  const convertToLessonFormFormat = (lesson: any) => {
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      durationMinutes: lesson.durationMinutes || 30,
      objectives: lesson.objectives || [],
      tags: lesson.tags || [],
      quizIds: lesson.quiz_ids || [],
      isActive: lesson.isActive ?? true,
      videoUrl: lesson.videoUrl || "",
      orderIndex: lesson.orderIndex || 0,
      quizzesCount: lesson.quizzesCount || 0,
    };
  };

  const handleLessonSuccess = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedLesson(null);
    // The parent component should refresh the curriculum data
  };

  const handleQuizSuccess = () => {
    setIsQuizDialogOpen(false);
    setSelectedLesson(null);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsQuizDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedLesson(null);
    setEditingLessonId(null);
  };

  return (
    <div className="space-y-6">
      {/* Lesson List */}
      <LessonList
        curriculumId={curriculumId}
        lessons={lessons}
        onCreateLesson={canEdit ? handleCreateLesson : undefined}
        onEditLesson={canEdit ? handleEditLesson : undefined}
        onViewLesson={handleViewLesson}
        onAddQuiz={
          canEdit
            ? (lesson) => {
                setSelectedLesson(lesson);
                setIsQuizDialogOpen(true);
              }
            : undefined
        }
        onDeleteLesson={canEdit ? handleDeleteLesson : undefined}
        canEdit={canEdit}
      />

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>Update the lesson details</DialogDescription>
          </DialogHeader>
          {fullLessonData?.data && (
            <LessonForm
              lesson={convertToLessonFormFormat(fullLessonData.data)}
              curriculumId={curriculumId}
              onSuccess={handleLessonSuccess}
              onCancel={handleDialogClose}
            />
          )}
          {isLoadingLesson && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading lesson data...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
      {canEdit && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
              <DialogDescription>
                Add a new lesson to this curriculum
              </DialogDescription>
            </DialogHeader>
            <LessonForm
              curriculumId={curriculumId}
              onSuccess={handleLessonSuccess}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Add Quiz Dialog */}
      {selectedLesson && (
        <AddQuizDialog
          lessonId={selectedLesson.id}
          open={isQuizDialogOpen}
          onOpenChange={setIsQuizDialogOpen}
          onSuccess={handleQuizSuccess}
        />
      )}

      {/* Delete Lesson Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lesson "{selectedLesson?.title}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLesson}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
