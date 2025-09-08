"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnpublishedBanner } from "@/components/ui/unpublished-banner";
import { ArrowLeft, Edit, Play } from "lucide-react";
import { useParams } from "next/navigation";
import { useGetQuiz } from "@/lib/api/queries";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function PreviewQuizPage() {
  const params = useParams();
  const id = params.id as string;

  // Use React Query hook instead of server action
  const {
    data: quizResponse,
    isLoading: quizLoading,
    error: quizError,
  } = useGetQuiz(id);

  // Show loading state
  if (quizLoading) {
    return <LoadingSkeleton />;
  }

  // Handle errors
  if (quizError || !quizResponse?.data) {
    notFound();
  }

  const quiz = quizResponse.data;

  // Calculate total points
  const totalPoints =
    quiz.questions?.reduce((sum: number, qq: any) => {
      return sum + (qq.pointsOverride || qq.question?.points || 1);
    }, 0) || 0;

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Unpublished Banner */}
      {quiz.status !== "published" && (
        <UnpublishedBanner
          status={quiz.status as "draft" | "archived"}
          type="quiz"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/quizzes/${quiz.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Preview Mode</h1>
          <p className="text-sm text-muted-foreground">
            This is how students will see your quiz
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/quizzes/${quiz.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/take-quiz/${quiz.id}`}>
            <Play className="h-4 w-4 mr-2" />
            Take Quiz
          </Link>
        </Button>
      </div>

      {/* Quiz Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Questions</p>
              <p className="font-medium">{quiz.questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Points</p>
              <p className="font-medium">{totalPoints}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time Limit</p>
              <p className="font-medium">
                {quiz.timeLimit ? `${quiz.timeLimit} minutes` : "None"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Passing Score</p>
              <p className="font-medium">
                {typeof quiz.passingScore === "string"
                  ? parseFloat(quiz.passingScore)
                  : quiz.passingScore || 70}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Preview */}
      <div className="space-y-4">
        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((qq: any, index: number) => (
            <Card key={qq.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                  </CardTitle>
                  <Badge variant="secondary">{qq.question.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{qq.question.title}</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {qq.question.content}
                  </p>
                  {qq.question.image_url && (
                    <div className="mt-4">
                      <img
                        src={qq.question.image_url}
                        alt="Question illustration"
                        className="max-w-full h-auto rounded-lg border shadow-sm"
                        style={{ maxHeight: "400px", objectFit: "contain" }}
                      />
                    </div>
                  )}
                </div>

                {/* Multiple Choice Questions */}
                {qq.question.type === "multiple_choice" &&
                  qq.question.question_answers && (
                    <div className="space-y-2 pl-4">
                      {qq.question.question_answers
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((answer: any, optIndex: number) => (
                          <div
                            key={answer.id}
                            className="flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            <span>{answer.content}</span>
                          </div>
                        ))}
                    </div>
                  )}

                {/* True/False Questions */}
                {qq.question.type === "true_false" &&
                  qq.question.question_answers && (
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      {qq.question.question_answers
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((answer: any) => (
                          <div
                            key={answer.id}
                            className="flex items-center justify-center p-4 border rounded-lg"
                          >
                            <span className="font-medium">
                              {answer.content}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                {/* Matching Questions */}
                {qq.question.type === "matching" &&
                  qq.question.matching_pairs && (
                    <div className="space-y-2 pl-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Match the items from left to right:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Items</p>
                          {qq.question.matching_pairs.map(
                            (pair: any, index: number) => (
                              <div
                                key={`left-${pair.id}`}
                                className="p-3 border rounded-lg bg-muted/50"
                              >
                                <span>{pair.left}</span>
                              </div>
                            )
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Matches</p>
                          {qq.question.matching_pairs.map(
                            (pair: any, index: number) => (
                              <div
                                key={`right-${pair.id}`}
                                className="p-3 border rounded-lg bg-muted/50"
                              >
                                <span>{pair.right}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Free Text Questions (Short Answer, Long Answer, Free Text) */}
                {(qq.question.type === "free_text" ||
                  qq.question.type === "short_answer" ||
                  qq.question.type === "long_answer") && (
                  <div className="pl-4">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        {qq.question.type === "long_answer"
                          ? "Students will provide a detailed written response"
                          : "Students will provide a text response"}
                      </p>
                      {qq.question.type === "long_answer" && (
                        <div className="mt-2 h-24 border rounded bg-background" />
                      )}
                      {(qq.question.type === "short_answer" ||
                        qq.question.type === "free_text") && (
                        <div className="mt-2 h-12 border rounded bg-background" />
                      )}
                    </div>
                  </div>
                )}

                {/* Coding Questions */}
                {qq.question.type === "coding" && (
                  <div className="pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Language: {qq.question.language || "Any"}
                      </Badge>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">
                        Students will write code to solve this problem
                      </p>
                      {qq.question.starterCode && (
                        <pre className="text-sm bg-background p-3 rounded border font-mono">
                          {qq.question.starterCode}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Ordering Questions */}
                {qq.question.type === "ordering" &&
                  qq.question.ordering_items && (
                    <div className="pl-4 space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Arrange in the correct order:
                      </p>
                      {qq.question.ordering_items
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((item: any, index: number) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
                          >
                            <span className="text-sm font-medium">
                              {index + 1}.
                            </span>
                            <span>{item.content}</span>
                          </div>
                        ))}
                    </div>
                  )}

                {qq.explanation && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm italic">{qq.explanation}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {qq.pointsOverride || qq.question?.points || 1} point
                    {(qq.pointsOverride || qq.question?.points || 1) !== 1
                      ? "s"
                      : ""}
                  </Badge>
                  {qq.question.difficultyLevel && (
                    <Badge variant="outline" className="text-xs">
                      Difficulty: {qq.question.difficultyLevel}
                    </Badge>
                  )}
                  {qq.question.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No questions in this quiz yet.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                  Add Questions
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Quiz Info Card Skeleton */}
      <div className="border rounded-lg p-6 mb-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Preview Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Question Options Skeleton */}
              <div className="pl-4 space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Question Meta Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
