"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { useGetLessonById } from "@/lib/api/queries";
import { LessonFormWrapper } from "@/components/resourceManagemement/lessons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
// Loading component
function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading lesson...</span>
      </div>
    </div>
  );
}

export default function EditLessonPage() {
  const params = useParams();
  const id = params.id as string;

  // Use React Query hook to fetch lesson data
  const {
    data: lessonResponse,
    isLoading: lessonLoading,
    error: lessonError,
  } = useGetLessonById(id);

  if (lessonLoading) {
    return <LoadingSkeleton />;
  }

  if (lessonError || !lessonResponse?.data) {
    notFound();
  }

  const lesson = lessonResponse.data;

  return (
    <div className="mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/lessons/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lesson
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Lesson</CardTitle>
          <CardDescription>
            Update the lesson details and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LessonFormWrapper
            lesson={lesson as any}
            curriculumId={(lesson as any).curriculum_id || ""}
            redirectPath={`/admin/lessons/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
