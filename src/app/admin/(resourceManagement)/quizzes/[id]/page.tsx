"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizActions } from "@/components/resourceManagemement/quiz/quiz-actions";
import { QuizSettingsEditor } from "@/components/resourceManagemement/quiz/quiz-settings-editor";
import { PublishQuizButton } from "@/components/resourceManagemement/quiz/publish-quiz-button";
import { UnpublishedBanner } from "@/components/ui/unpublished-banner";
import {
  Edit,
  Play,
  Clock,
  Users,
  BarChart,
  Calendar,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetQuiz } from "@/lib/api/queries";
import { formatDistanceToNow } from "date-fns";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function QuizPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Use React Query hook instead of server action
  const {
    data: quizResponse,
    isLoading: quizLoading,
    error: quizError,
  } = useGetQuiz(id);

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

  if (quizError || !quizResponse?.data) {
    notFound();
  }

  const quiz = quizResponse.data;
  const userRole = "teacher"; // For now, assume teacher role
  const isStudent = false; // Teachers are not students

  // Teachers and admins can edit, students cannot
  const canEdit = true; // Teachers can always edit

  // Parse settings if it's a JSON type
  const settings =
    typeof quiz.settings === "object" && quiz.settings !== null
      ? (quiz.settings as any)
      : {};

  return (
    <div className="container mx-auto py-6">
      {/* Unpublished Banner */}
      {quiz.status !== "published" && (
        <UnpublishedBanner
          status={quiz.status as "draft" | "archived"}
          type="quiz"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground mt-2">{quiz.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline">
              {quiz.quiz_questions?.length || 0} questions
            </Badge>
            {quiz.time_limit && (
              <Badge variant="outline">
                {Math.floor(quiz.time_limit / 60)} mins
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {canEdit && (
            <PublishQuizButton
              quizId={quiz.id}
              currentStatus={quiz.status}
              canEdit={canEdit}
            />
          )}
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button asChild>
                  <Link href={`/quizzes/${quiz.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Quiz
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/quizzes/${quiz.id}/preview`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Link>
                </Button>
              </>
            )}
            <Button variant="secondary" asChild>
              <Link href={`/take-quiz/${quiz.id}`}>
                <Play className="h-4 w-4 mr-2" />
                Take Quiz
              </Link>
            </Button>
            {canEdit && <QuizActions quizId={quiz.id} canEdit={canEdit} />}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="attempts">Attempts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Questions
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quiz.quiz_questions?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Questions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Limit
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.timeLimit || "No"} {settings.timeLimit && "min"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.timeLimit ? "Timed quiz" : "Untimed quiz"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Max Attempts
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.maxAttempts || "Unlimited"}
                </div>
                <p className="text-xs text-muted-foreground">Per student</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Passing Score
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.passingScore || 70}%
                </div>
                <p className="text-xs text-muted-foreground">Minimum to pass</p>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(quiz.created_at))} ago
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(quiz.updated_at))} ago
                  </p>
                </div>
              </div>

              {(quiz.available_from || quiz.available_to) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Availability
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {quiz.available_from && (
                        <>
                          From {new Date(quiz.available_from).toLocaleString()}
                        </>
                      )}
                      {quiz.available_to && (
                        <> To {new Date(quiz.available_to).toLocaleString()}</>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Settings
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    • Questions{" "}
                    {settings.randomizeQuestions ? "are" : "are not"} randomized
                  </p>
                  <p className="text-sm">
                    • Correct answers{" "}
                    {settings.showCorrectAnswers ? "shown" : "hidden"} after
                    submission
                  </p>
                  <p className="text-sm">
                    • Students {settings.allowReview ? "can" : "cannot"} review
                    their attempts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Questions ({quiz.quiz_questions?.length || 0})
                </CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/quizzes/${quiz.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Questions
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quiz.quiz_questions && quiz.quiz_questions.length > 0 ? (
                <div className="space-y-4">
                  {quiz.quiz_questions.map((qq: any, index: number) => (
                    <div
                      key={qq.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {index + 1}. {qq.question.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {qq.question.content}
                          </p>
                        </div>
                        <Badge variant="secondary">{qq.question.type}</Badge>
                      </div>
                      {qq.explanation && (
                        <div className="text-sm text-muted-foreground pl-6">
                          <p className="italic">{qq.explanation}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pl-6">
                        <Badge variant="outline" className="text-xs">
                          {qq.question.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {qq.question.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions added yet</p>
                  {canEdit && (
                    <Button className="mt-4" asChild>
                      <Link href={`/quizzes/${quiz.id}/edit`}>
                        Add Questions
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No attempts yet. Share this quiz with students to get started.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          {canEdit ? (
            <QuizSettingsEditor
              quizId={quiz.id}
              settings={
                settings || {
                  timeLimit: quiz.time_limit,
                  randomizeQuestions: quiz.randomize_questions || false,
                  showCorrectAnswers: quiz.show_correct_answers !== false,
                  maxAttempts: quiz.max_attempts || 3,
                  passingScore: quiz.passing_score || 70,
                }
              }
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  You don't have permission to edit quiz settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
        <p>Checking authorization...</p>
      </div>
    </div>
  );
}
