"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LessonDetailCard } from "../lessons/lesson-detail-card";
import { Plus, BookOpen } from "lucide-react";
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

interface ExpandableLessonListProps {
  lessons: LessonWithQuizzes[];
  curriculumId: string;
  canEdit?: boolean;
  onCreateLesson?: () => void;
}

export function ExpandableLessonList({
  lessons,
  curriculumId,
  canEdit = false,
  onCreateLesson,
}: ExpandableLessonListProps) {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );

  const handleToggleExpand = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  if (lessons.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first lesson to get started with this curriculum.
          </p>
          {canEdit && onCreateLesson && (
            <Button onClick={onCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Lesson
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lessons & Quizzes</CardTitle>
            <CardDescription>
              Click on any lesson to view its details and associated quizzes
            </CardDescription>
          </div>
          {canEdit && onCreateLesson && (
            <Button onClick={onCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons.map((lessonData) => {
          // Convert lesson data to component lesson format
          const lesson = {
            id: lessonData.id,
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            durationMinutes: lessonData.durationMinutes,
            objectives: lessonData.objectives || [],
            prerequisites: [], // Not in the current data structure
            tags: lessonData.tags || [],
            orderIndex: lessonData.orderIndex,
            activities: lessonData.activities,
            resources: lessonData.resources,
            videoFileName: lessonData.videoFileName,
            videoFileSize: lessonData.videoFileSize,
            videoDuration: lessonData.videoDuration,
            videoMimeType: lessonData.videoMimeType,
            isActive: lessonData.isActive,
            videoUrl: lessonData.videoUrl,
            quizzesCount: lessonData.quizzesCount,
            difficultyLevel: undefined, // Not in the current data structure
          };

          return (
            <LessonDetailCard
              key={lessonData.id}
              lesson={lesson}
              canEdit={canEdit}
              curriculumId={curriculumId}
              isExpanded={expandedLessons.has(lessonData.id)}
              onToggle={() => handleToggleExpand(lessonData.id)}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
