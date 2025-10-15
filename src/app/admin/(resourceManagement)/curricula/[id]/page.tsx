"use client";

import Link from "next/link";
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
import { useGetCurriculum } from "@/lib/api/queries";
import { useEffect, useState } from "react";
import { LoadingSkeleton } from "../../questions/page";

interface CurriculumPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CurriculumPage({ params }: CurriculumPageProps) {
  const [id, setId] = useState<string>("");

  const {
    data: curriculumData,
    isLoading: curriculumLoading,
    error,
  } = useGetCurriculum(id);
  const curriculum = curriculumData?.data;
  const lessons = curriculum?.lessons || [];

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  if (curriculumLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !curriculum) {
    return <div>Curriculum not found</div>;
  }

  // @ts-ignore
  const canEdit = true;

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
            <Badge variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              {curriculum.offerType}
            </Badge>
            {curriculum.visibility === "PRIVATE" && (
              <Badge variant="outline">Private</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button asChild>
                <Link href={`/admin/curricula/${curriculum.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Curriculum
                </Link>
              </Button>
              <CurriculumActions
                curriculumId={curriculum.id}
                canEdit={canEdit}
                isPublic={curriculum.visibility === "PUBLIC"}
                curriculum={curriculum}
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
                  {curriculum.visibility === "PUBLIC" ? "Public" : "Private"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {curriculum.lessonsCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lessons.reduce(
                  (acc: number, lesson: any) =>
                    acc + (lesson.quizzesCount || 0),
                  0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offer Type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{curriculum.offerType}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives */}
        {curriculum.learningObjectives &&
          curriculum.learningObjectives.length > 0 && (
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
                  {curriculum.learningObjectives.map(
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

        {/* Tags */}
        {curriculum.tags && curriculum.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tags
              </CardTitle>
              <CardDescription>
                Keywords associated with this curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {curriculum.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons and Quizzes */}
        <LessonManager
          curriculumId={curriculum.id}
          canEdit={canEdit}
          lessons={lessons}
        />
      </div>
    </div>
  );
}
