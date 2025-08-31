import { notFound, redirect } from "next/navigation";
import { getLessonById } from "@/app/actions/lessons";
// import { createServerClient } from "@/lib/supabase/server"; // Removed Supabase
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
import { ArrowLeft } from "lucide-react";
// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

interface EditLessonPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id } = await params;
  const lessonResult = await getLessonById(id);

  if (!lessonResult.success || !lessonResult.data) {
    notFound();
  }

  const { lesson } = lessonResult.data;

  // TODO: Replace with proper authentication check
  const user = null; // Placeholder for now

  // Temporarily disable auth check
  // if (!user || user.id !== lesson.created_by) {
  //   redirect(`/lessons/${id}`);
  // }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/lessons/${id}`}
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
            lesson={lesson}
            curriculumId={lesson.curriculum_id}
            redirectPath={`/lessons/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
