"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetQuizAttemptById, useGetQuizQuestions } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface QuestionWithResults {
  id: string;
  question: any;
  result: QuizResult;
}

interface QuizResult {
  id?: string; // Question attempt ID
  questionId: string;
  userAnswerContent?: string;
  userAnswerId?: string;
  correctAnswers: Array<{
    id: string;
    content: string | Record<string, string>;
  }>;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback?: string;
}

export default function QuizAttemptReviewPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data: reviewResponse, isLoading, error } = useGetQuizAttemptById(attemptId);
  const review = reviewResponse?.data;

  // Fetch questions for the quiz
  const { data: questionsResponse } = useGetQuizQuestions(review?.quizId || "");

  // Transform questions and map with results
  const questionsWithResults = useMemo(() => {
    if (!review?.results || !questionsResponse?.data) return [];

    const questions = questionsResponse.data.sort(
      (a: any, b: any) => a.orderIndex - b.orderIndex
    );

    return questions.map((qq: any) => {
      const result = review.results.find(
        (r: QuizResult) => r.questionId === qq.question.id
      );

      return {
        id: qq.id,
        question: {
          id: qq.question.id,
          title: qq.question.title,
          content: qq.question.content,
          type: qq.question.type,
          image_url: qq.question.image_url,
          explanation: qq.question.explanation,
          metadata: qq.question.metadata,
          options:
            qq.question.type === "multiple_choice" && qq.question.answers
              ? qq.question.answers
                  .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                  .map((answer: any) => ({
                    id: answer.id,
                    text: answer.content,
                    isCorrect: answer.isCorrect,
                  }))
              : [],
          ...(qq.question.type === "true_false" && {
            options: qq.question.answers
              ? qq.question.answers
                  .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                  .map((answer: any) => ({
                    id: answer.id,
                    text: answer.content,
                    isCorrect: answer.isCorrect,
                  }))
              : [
                  {
                    id: "true",
                    text: "True",
                    isCorrect: qq.question.metadata?.correct_answer === true,
                  },
                  {
                    id: "false",
                    text: "False",
                    isCorrect: qq.question.metadata?.correct_answer === false,
                  },
                ],
          }),
          ...(qq.question.type === "matching_pairs" && {
            pairs: (qq.question.answers?.[0]?.matchingPairs || []).map(
              (pair: any, index: number) => ({
                id: `pair-${index}`,
                left: pair.left,
                right: pair.right,
              })
            ),
          }),
        },
        result,
      };
    });
  }, [review, questionsResponse]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getCorrectAnswerText = (question: any, result: QuizResult): string => {
    if (result.correctAnswers.length === 0) return "No correct answer";

    if (
      question.type === "matching_pairs" &&
      typeof result.correctAnswers[0].content === "object"
    ) {
      const matches = result.correctAnswers[0].content as Record<
        string,
        string
      >;
      return Object.entries(matches)
        .map(([left, right]) => `${left} → ${right}`)
        .join("\n");
    }

    if (
      (question.type === "multiple_choice" || question.type === "true_false") &&
      question.options
    ) {
      const correctAnswer = result.correctAnswers[0];
      const option = question.options.find(
        (opt: any) => opt.id === correctAnswer.id
      );
      return option?.text || correctAnswer.content.toString();
    }

    return result.correctAnswers
      .map((ans) => ans.content.toString())
      .join(" or ");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primaryBlue mx-auto mb-4" />
          <p>Loading review...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load quiz attempt review. Please try again.
              </AlertDescription>
            </Alert>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questionsWithResults[currentQuestionIndex];
  const currentResult = currentQ?.result;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex gap-6">
        {/* Main Review Area */}
        <div className="flex-1">
          {/* Results Summary Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle>Quiz Review</CardTitle>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Trophy className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Score</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {review.score}/{review.totalPoints}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Percentage
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {review.percentage}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Time Spent
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatTime(review.timeSpent)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">
                      Correct Answers
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {
                        review.results.filter((r: QuizResult) => r.isCorrect)
                          .length
                      }
                      /{review.results.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Question with Results */}
          {currentQ && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1} of{" "}
                    {questionsWithResults.length}
                  </CardTitle>
                  {currentResult && (
                    <Badge
                      variant={
                        currentResult.isCorrect ? "default" : "destructive"
                      }
                      className="flex items-center gap-2"
                    >
                      {currentResult.isCorrect ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Incorrect
                        </>
                      )}
                      <span className="ml-2">
                        {currentResult.pointsEarned}/
                        {currentResult.pointsPossible} points
                      </span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Question Content */}
                  <div>
                    <p className="text-base font-medium mb-2">Question:</p>
                    <p className="text-base whitespace-pre-wrap">
                      {currentQ.question.content}
                    </p>
                    {currentQ.question.image_url && (
                      <div className="mt-4">
                        <img
                          src={currentQ.question.image_url}
                          alt="Question illustration"
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* User's Answer */}
                  {currentResult && (
                    <div>
                      <p className="text-base font-medium mb-2">Your Answer:</p>
                      {currentQ.question.type === "matching_pairs" &&
                      currentResult.userAnswerContent ? (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          {(() => {
                            try {
                              const userMatches = JSON.parse(
                                currentResult.userAnswerContent
                              ) as Record<string, string>;
                              const correctMatches =
                                typeof currentResult.correctAnswers[0]
                                  .content === "object"
                                  ? (currentResult.correctAnswers[0]
                                      .content as Record<string, string>)
                                  : {};

                              return (
                                <div className="space-y-2">
                                  {Object.entries(userMatches).map(
                                    ([leftText, rightText]) => {
                                      const correctRightText =
                                        correctMatches[leftText];
                                      const isMatchCorrect =
                                        correctRightText === rightText;

                                      return (
                                        <div
                                          key={leftText}
                                          className={cn(
                                            "p-3 rounded-lg border-2",
                                            isMatchCorrect
                                              ? "bg-green-50 border-green-300"
                                              : "bg-red-50 border-red-300"
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                              {leftText} →
                                            </span>
                                            <span>{rightText}</span>
                                            {isMatchCorrect ? (
                                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              );
                            } catch {
                              return (
                                <p className="text-sm text-gray-600">
                                  {currentResult.userAnswerContent}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "p-4 rounded-lg border-2",
                            currentResult.isCorrect
                              ? "bg-green-50 border-green-300"
                              : "bg-red-50 border-red-300"
                          )}
                        >
                          <p className="text-base">
                            {currentQ.question.type === "multiple_choice" ||
                            currentQ.question.type === "true_false"
                              ? currentQ.question.options?.find(
                                  (opt: any) =>
                                    opt.id ===
                                    (currentResult.userAnswerId ||
                                      currentResult.userAnswerContent)
                                )?.text || currentResult.userAnswerContent
                              : currentResult.userAnswerContent || "No answer"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correct Answer */}
                  {currentResult && !currentResult.isCorrect && (
                    <div>
                      <p className="text-base font-medium mb-2 text-green-700">
                        Correct Answer:
                      </p>
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        {currentQ.question.type === "matching_pairs" &&
                        typeof currentResult.correctAnswers[0].content ===
                          "object" ? (
                          <div className="space-y-2">
                            {Object.entries(
                              currentResult.correctAnswers[0].content as Record<
                                string,
                                string
                              >
                            ).map(([left, right]) => (
                              <div
                                key={left}
                                className="p-2 bg-white rounded border border-green-200"
                              >
                                <span className="font-medium">{left}</span> →{" "}
                                <span>{right}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base text-green-900 whitespace-pre-wrap">
                            {getCorrectAnswerText(
                              currentQ.question,
                              currentResult
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Question Metadata Feedback */}
                  {currentResult &&
                    currentQ.question.metadata &&
                    (currentResult.isCorrect
                      ? currentQ.question.metadata.correctFeedback
                      : currentQ.question.metadata.incorrectFeedback) && (
                      <div>
                        <p className="text-base font-medium mb-2">Feedback:</p>
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <p className="text-blue-800 whitespace-pre-wrap">
                              {currentResult.isCorrect
                                ? currentQ.question.metadata.correctFeedback
                                : currentQ.question.metadata.incorrectFeedback}
                            </p>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {/* Tutor Additional Feedback */}
                  {currentResult?.feedback && (
                    <div>
                      <p className="text-base font-medium mb-2">
                        Tutor Additional Feedback:
                      </p>
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                          <p className="text-yellow-800 whitespace-pre-wrap">
                            {(() => {
                              try {
                                const parsed = JSON.parse(
                                  currentResult.feedback
                                );
                                if (
                                  parsed &&
                                  typeof parsed === "object" &&
                                  parsed.feedback
                                ) {
                                  return parsed.feedback;
                                }
                              } catch {
                                // Not JSON, use as is
                              }
                              return currentResult.feedback;
                            })()}
                          </p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Explanation if available */}
                  {currentQ.question.explanation && (
                    <div>
                      <p className="text-base font-medium mb-2">Explanation:</p>
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <p className="text-blue-800 whitespace-pre-wrap">
                            {currentQ.question.explanation}
                          </p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentQuestionIndex((prev) =>
                          prev > 0 ? prev - 1 : prev
                        )
                      }
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1} of{" "}
                      {questionsWithResults.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentQuestionIndex((prev) =>
                          prev < questionsWithResults.length - 1
                            ? prev + 1
                            : prev
                        )
                      }
                      disabled={
                        currentQuestionIndex >= questionsWithResults.length - 1
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Navigation Sidebar */}
        <Card className="w-64 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questionsWithResults.map(
                (q: QuestionWithResults, index: number) => {
                  const result = q.result;
                  const isCurrent = currentQuestionIndex === index;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={cn(
                        "w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                        isCurrent
                          ? "bg-primaryBlue text-white hover:bg-primaryBlue/90"
                          : result?.isCorrect
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                            : result
                              ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          isCurrent
                            ? "bg-white text-primaryBlue"
                            : result?.isCorrect
                              ? "bg-green-600 text-white"
                              : result
                                ? "bg-red-600 text-white"
                                : "bg-gray-400 text-white"
                        )}
                      >
                        {index + 1}
                      </div>
                      <span className="truncate flex-1 text-left">
                        Question {index + 1}
                      </span>
                      {result?.isCorrect ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      ) : result ? (
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                      ) : null}
                    </button>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

