"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LessonList, LessonForm } from "../lessons";
import { AddQuizDialog } from "../lessons/add-quiz-dialog";
import type { Database } from "@/lib/database.types";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

interface LessonManagerProps {
  curriculumId: string;
  canEdit?: boolean;
}

export function LessonManager({
  curriculumId,
  canEdit = false,
}: LessonManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonRow | null>(null);

  const handleCreateLesson = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditLesson = (lesson: LessonRow) => {
    setSelectedLesson(lesson);
    setIsEditDialogOpen(true);
  };

  const handleLessonSuccess = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedLesson(null);
    // The LessonList component will automatically refresh
  };

  const handleQuizSuccess = () => {
    setIsQuizDialogOpen(false);
    setSelectedLesson(null);
    router.refresh();
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsQuizDialogOpen(false);
    setSelectedLesson(null);
  };

  return (
    <div className="space-y-6">
      {/* Lesson List */}
      <LessonList
        curriculumId={curriculumId}
        onCreateLesson={canEdit ? handleCreateLesson : undefined}
        onEditLesson={canEdit ? handleEditLesson : undefined}
        onViewLesson={(lesson) => {
          router.push(`/lessons/${lesson.id}`);
        }}
        onAddQuiz={
          canEdit
            ? (lesson) => {
                setSelectedLesson(lesson);
                setIsQuizDialogOpen(true);
              }
            : undefined
        }
        canEdit={canEdit}
      />

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>Update the lesson details</DialogDescription>
          </DialogHeader>
          {selectedLesson && (
            <LessonForm
              lesson={selectedLesson}
              curriculumId={curriculumId}
              onSuccess={handleLessonSuccess}
              onCancel={handleDialogClose}
            />
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
    </div>
  );
}
