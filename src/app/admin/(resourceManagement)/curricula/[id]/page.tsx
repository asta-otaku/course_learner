import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurriculum } from "@/app/actions/curricula";
import { getLessonsWithQuizCounts } from "@/app/actions/lessons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurriculumActions } from "@/components/resourceManagemement/curriculum/curriculum-actions";
import { LessonManager } from "@/components/resourceManagemement/curriculum/lesson-manager";

import {
  Edit,
  BookOpen,
  User,
  ChevronRight,
  Target,
  AlertCircle,
} from "lucide-react";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

interface CurriculumPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CurriculumPage({ params }: CurriculumPageProps) {
  const { id } = await params;
  const curriculum = await getCurriculum(id);

  if (!curriculum) {
    notFound();
  }

  // TODO: Replace with user context or API call to get user
  const user = null; // Placeholder for now

  // Get lessons for this curriculum
  const lessonsResult = await getLessonsWithQuizCounts(id);
  const lessons = lessonsResult.success ? lessonsResult.data : [];
  // @ts-ignore
  const canEdit = user?.id === curriculum.created_by || false;

  return (
    <div className="mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-poppins">
            {curriculum.title}
          </h1>
          {curriculum.description && (
            <p className="text-muted-foreground">{curriculum.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {curriculum.category && (
              <Badge variant="secondary">
                <BookOpen className="h-3 w-3 mr-1" />
                {curriculum.category.name}
              </Badge>
            )}
            {!curriculum.is_public && <Badge variant="outline">Private</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button asChild>
                <Link href={`/curricula/${curriculum.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Curriculum
                </Link>
              </Button>
              <CurriculumActions
                curriculumId={curriculum.id}
                canEdit={canEdit}
                isPublic={curriculum.is_public ?? false}
              />
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <div className="text-lg font-semibold">
                  {curriculum.is_public ? "Public" : "Private"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lessons.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lessons.reduce((acc, { quiz_count }) => acc + quiz_count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Created By</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {curriculum.created_by_profile?.full_name ||
                    curriculum.created_by_profile?.username ||
                    "Unknown"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives */}
        {curriculum.objectives && curriculum.objectives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Objectives
              </CardTitle>
              <CardDescription>
                What students will learn from this curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {curriculum.objectives.map(
                  (objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Prerequisites */}
        {curriculum.prerequisites && curriculum.prerequisites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Prerequisites
              </CardTitle>
              <CardDescription>
                What students should know before starting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {curriculum.prerequisites.map(
                  (prerequisite: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span>{prerequisite}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Lessons and Quizzes */}
        <LessonManager curriculumId={curriculum.id} canEdit={canEdit} />
      </div>
    </div>
  );
}
