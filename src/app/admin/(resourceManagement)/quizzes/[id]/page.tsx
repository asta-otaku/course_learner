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
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useGetQuiz, useGetQuizQuestions } from "@/lib/api/queries";
import { formatDistanceToNow } from "date-fns";
import { useMemo, useState, useEffect } from "react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  // Get the tab from URL query parameter, default to "overview"
  const currentTab = useMemo(() => {
    const tab = searchParams.get("tab");
    // Validate tab value - only allow valid tab names
    const validTabs = ["overview", "questions", "attempts", "settings"];
    return tab && validTabs.includes(tab) ? tab : "overview";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState(currentTab);

  // Sync activeTab with URL when it changes
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(
      `/admin/quizzes/${id}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  // Use React Query hooks to get quiz and questions
  const {
    data: quizResponse,
    isLoading: quizLoading,
    error: quizError,
  } = useGetQuiz(id);

  const {
    data: questionsResponse,
    isLoading: questionsLoading,
    error: questionsError,
  } = useGetQuizQuestions(id);

  // Show loading state
  if (quizLoading || questionsLoading) {
    return <LoadingSkeleton />;
  }

  // Handle errors
  if (
    quizError ||
    !quizResponse?.data ||
    questionsError ||
    !questionsResponse?.data
  ) {
    notFound();
  }

  const quiz = quizResponse.data;
  const questions = questionsResponse.data;
  const canEdit = true;

  return (
    <div className="mx-auto py-6">
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
            <Badge variant="outline">{questions?.length || 0} questions</Badge>
            {quiz.timeLimit && (
              <Badge variant="outline">{quiz.timeLimit} mins</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {canEdit && (
            <PublishQuizButton
              quizId={quiz.id || ""}
              currentStatus={
                (quiz.status as "draft" | "published" | "archived") || "draft"
              }
              canEdit={canEdit}
            />
          )}
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button asChild>
                  <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Quiz
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/admin/quizzes/${quiz.id}/preview`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Link>
                </Button>
              </>
            )}
            <Button variant="secondary" asChild>
              <Link href={`/admin/take-quiz/${quiz.id}`}>
                <Play className="h-4 w-4 mr-2" />
                Take Quiz
              </Link>
            </Button>
            {canEdit && (
              <QuizActions quizId={quiz.id || ""} canEdit={canEdit} />
            )}
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          {/* <TabsTrigger value="attempts">Attempts</TabsTrigger> */}
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
                  {questions?.length || 0}
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
                  {quiz.timeLimit || "No"} {quiz.timeLimit && "min"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {quiz.timeLimit ? "Timed quiz" : "Untimed quiz"}
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
                  {quiz.maxAttempts || "Unlimited"}
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
                  {typeof quiz.passingScore === "string"
                    ? parseFloat(quiz.passingScore)
                    : quiz.passingScore || 70}
                  %
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
                    {quiz.createdAt
                      ? formatDistanceToNow(new Date(quiz.createdAt))
                      : "Unknown"}{" "}
                    ago
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm">
                    {quiz.updatedAt
                      ? formatDistanceToNow(new Date(quiz.updatedAt))
                      : "Unknown"}{" "}
                    ago
                  </p>
                </div>
              </div>

              {(quiz.availableFrom || quiz.availableUntil) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Availability
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {quiz.availableFrom && (
                        <>
                          From {new Date(quiz.availableFrom).toLocaleString()}
                        </>
                      )}
                      {quiz.availableUntil && (
                        <>
                          {" "}
                          To {new Date(quiz.availableUntil).toLocaleString()}
                        </>
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
                    • Questions {quiz.randomizeQuestions ? "are" : "are not"}{" "}
                    randomized
                  </p>
                  <p className="text-sm">
                    • Correct answers{" "}
                    {quiz.showCorrectAnswers ? "shown" : "hidden"} after
                    submission
                  </p>
                  <p className="text-sm">
                    • Students {quiz.allowReview ? "can" : "cannot"} review
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
                <CardTitle>Questions ({questions?.length || 0})</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Questions
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions && questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((qq: any, index: number) => (
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
                      {qq.question.explanation && (
                        <div className="text-sm text-muted-foreground pl-6">
                          <p className="italic">{qq.question.explanation}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pl-6">
                        <Badge variant="outline" className="text-xs">
                          {qq.question.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {qq.question.difficultyLevel || "Unknown"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {qq.pointsOverride || qq.question.points || 1} pts
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
                      <Link href={`/admin/quizzes/${quiz.id}/edit`}>
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
              quizId={quiz.id || ""}
              settings={{
                title: quiz.title,
                description: quiz.description,
                timeLimit: quiz.timeLimit,
                randomizeQuestions: quiz.randomizeQuestions || false,
                showCorrectAnswers: quiz.showCorrectAnswers !== false,
                maxAttempts: quiz.maxAttempts || 3,
                passingScore:
                  typeof quiz.passingScore === "string"
                    ? parseFloat(quiz.passingScore)
                    : quiz.passingScore || 70,
                showFeedback: quiz.showFeedback !== false,
                allowRetakes: quiz.allowRetakes !== false,
                allowReview: quiz.allowReview !== false,
                availableFrom: quiz.availableFrom,
                availableUntil: quiz.availableUntil,
                feedbackMode: quiz.feedbackMode || "immediate",
              }}
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
    <div className="mx-auto py-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex space-x-1 mb-4">
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Quiz Details Card Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="space-y-1">
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
