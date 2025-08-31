"use client";

import { notFound } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonContent } from "@/components/resourceManagemement/lessons/lesson-content";
import { LessonQuizzes } from "@/components/resourceManagemement/lessons/lesson-quizzes";
import { UnpublishedBanner } from "@/components/ui/unpublished-banner";
import {
  ArrowLeft,
  Clock,
  Target,
  AlertCircle,
  Edit,
  Plus,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useGetLessonById,
  useGetQuizzesForLesson,
  useGetCurriculum,
} from "@/lib/api/queries";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function LessonPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Use React Query hooks instead of server actions
  const {
    data: lessonResponse,
    isLoading: lessonLoading,
    error: lessonError,
  } = useGetLessonById(id);

  const {
    data: quizzesResponse,
    isLoading: quizzesLoading,
    error: quizzesError,
  } = useGetQuizzesForLesson(id);

  const { data: curriculumResponse, isLoading: curriculumLoading } =
    useGetCurriculum(lessonResponse?.data?.lesson?.curriculum_id);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        try {
          const userData = JSON.parse(localStorage.getItem("admin") || "{}");
          if (!userData || !userData.data) {
            router.push("/admin/sign-in");
            return;
          }

          const userRole = userData.data.userRole;
          if (userRole !== "teacher" && userRole !== "admin") {
            router.push("/admin/sign-in");
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error("Error:", error);
          router.push("/admin/sign-in");
          return;
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  if (lessonError || !lessonResponse?.data) {
    notFound();
  }

  const { lesson, quiz_count } = lessonResponse.data;
  const curriculum = curriculumResponse?.data?.curriculum;
  const quizzes = quizzesResponse?.data?.quizzes || [];

  // TODO: Replace with proper authentication check
  const user = null; // Placeholder for now
  const canEdit = false; // Placeholder for now

  const getDifficultyLabel = (level: number | null) => {
    if (!level) return "Not Set";
    if (level <= 2) return "Easy";
    if (level <= 3) return "Medium";
    if (level <= 4) return "Hard";
    return "Expert";
  };

  const getDifficultyColor = (level: number | null) => {
    if (!level) return "bg-gray-100 text-gray-800";
    if (level <= 2) return "bg-green-100 text-green-800";
    if (level <= 3) return "bg-yellow-100 text-yellow-800";
    if (level <= 4) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Unpublished Banner */}
      {!lesson.is_published && (
        <UnpublishedBanner status="unpublished" type="lesson" />
      )}

      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={curriculum ? `/curricula/${curriculum.id}` : "/curricula"}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {curriculum ? curriculum.title : "Back to Curricula"}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground">{lesson.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {lesson.duration_minutes && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{lesson.duration_minutes} minutes</span>
              </div>
            )}
            <Badge className={getDifficultyColor(lesson.difficulty_level)}>
              {getDifficultyLabel(lesson.difficulty_level)}
            </Badge>
            <Badge variant={lesson.is_published ? "default" : "secondary"}>
              {lesson.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/lessons/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Lesson
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
          <TabsTrigger value="content">Lesson Content</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Learning Objectives */}
            {lesson.learning_objectives &&
              lesson.learning_objectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Learning Objectives
                    </CardTitle>
                    <CardDescription>
                      What students will learn from this lesson
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {lesson.learning_objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primaryBlue mt-1">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {/* Prerequisites */}
            {lesson.prerequisites && lesson.prerequisites.length > 0 && (
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
                    {lesson.prerequisites.map((prerequisite, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Lesson Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Duration:
                  </span>
                  <p className="font-medium">
                    {lesson.duration_minutes
                      ? `${lesson.duration_minutes} minutes`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Difficulty:
                  </span>
                  <p className="font-medium">
                    {getDifficultyLabel(lesson.difficulty_level)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {lesson.is_published ? "Published" : "Draft"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Order in curriculum:
                  </span>
                  <p className="font-medium">Lesson {lesson.order_index + 1}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Total Quizzes:
                    </span>
                    <p className="text-2xl font-bold">{quizzes.length}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Quiz Types:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {quizzes.filter((q) => q.status === "published").length >
                        0 && (
                        <Badge variant="default">
                          {
                            quizzes.filter((q) => q.status === "published")
                              .length
                          }{" "}
                          Published
                        </Badge>
                      )}
                      {quizzes.filter((q) => q.status === "draft").length >
                        0 && (
                        <Badge variant="secondary">
                          {quizzes.filter((q) => q.status === "draft").length}{" "}
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <LessonQuizzes lessonId={id} quizzes={quizzes} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <LessonContent content={lesson.content || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
