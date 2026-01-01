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
import { LessonForm } from "../lessons/lesson-form";
import { AddQuizDialog } from "../lessons/add-quiz-dialog";
import { ExpandableLessonList } from "./expandable-lesson-list";
import { useGetQuizzesForLesson } from "@/lib/api/queries";
import type { Database } from "@/lib/database.types";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

interface LessonWithQuizzes {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  durationMinutes: number;
  objectives: string[];
  tags: string[];
  orderIndex: number;
  activities: any;
  resources: any;
  videoFileName: string | null;
  videoFileSize: number | null;
  videoDuration: number | null;
  videoMimeType: string | null;
  isActive: boolean;
  videoUrl: string | null;
  quizzesCount: number;
  quizzes?: Array<{
    id: string;
    title: string;
    description: string | null;
    question_count: number;
    time_limit: number | null;
    passing_score: number | null;
    max_attempts: number | null;
    is_published: boolean | null;
  }>;
}

interface LessonManagerProps {
  curriculumId: string;
  canEdit?: boolean;
  lessons?: LessonWithQuizzes[];
}

export function LessonManager({
  curriculumId,
  canEdit = false,
  lessons = [],
}: LessonManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] =
    useState<LessonWithQuizzes | null>(null);

  // Fetch quizzes for the selected lesson to get existing quiz IDs
  const { data: quizzesResponse } = useGetQuizzesForLesson(
    selectedLesson?.id || ""
  );
  const existingQuizIds =
    quizzesResponse?.data
      ?.map((quiz) => quiz.id)
      .filter((id): id is string => id !== undefined) || [];

  const handleCreateLesson = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditLesson = (lesson: LessonWithQuizzes) => {
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

  const handleAddQuiz = (lesson: LessonWithQuizzes) => {
    setSelectedLesson(lesson);
    setIsQuizDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsQuizDialogOpen(false);
    setSelectedLesson(null);
  };

  return (
    <div className="space-y-6">
      {/* Expandable Lesson List */}
      <ExpandableLessonList
        lessons={lessons}
        curriculumId={curriculumId}
        canEdit={canEdit}
        onCreateLesson={canEdit ? handleCreateLesson : undefined}
        onAddQuiz={canEdit ? handleAddQuiz : undefined}
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
              lesson={
                {
                  id: selectedLesson.id,
                  title: selectedLesson.title,
                  description: selectedLesson.description || "",
                  content: selectedLesson.content || "",
                  durationMinutes: selectedLesson.durationMinutes || 30,
                  objectives: selectedLesson.objectives || [],
                  tags: selectedLesson.tags || [],
                  orderIndex: selectedLesson.orderIndex,
                  isActive: selectedLesson.isActive ?? true,
                  videoUrl: selectedLesson.videoUrl || "",
                  quizzesCount: selectedLesson.quizzesCount || 0,
                  quizIds: [],
                } as any
              }
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
          existingQuizIds={existingQuizIds}
        />
      )}
    </div>
  );
}
