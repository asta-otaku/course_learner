"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { QuestionImage } from "@/components/ui/question-image";
import { MathPreview } from "../editor/math-preview";
import { QuizPlayerResultsStats } from "./quiz-player-results-stats";
import { cn } from "@/lib/utils";
import {
  getCorrectAnswerText,
  getQuizUserAnswerDisplayText,
} from "@/lib/utils";
import type {
  Quiz,
  QuizNavigationPosition,
  QuizPlayerQuestion,
  QuizQuestionResult,
  QuizSubmissionResults,
} from "@/lib/types";

interface QuizPlayerResultsViewProps {
  isDeferredResultsFeedback: boolean;
  quiz: Quiz | undefined;
  isHomework: boolean;
  isBaselineTest: boolean;
  router: {
    push: (href: string) => void;
    back: () => void;
  };
  submissionResults: QuizSubmissionResults;
  currentResult: QuizQuestionResult | undefined;
  currentQ: QuizPlayerQuestion;
  actualTimeLimit: number | undefined;
  currentQuestionIndex: number;
  questions: QuizPlayerQuestion[];
  handlePrevious: () => void;
  handleNext: () => void;
  resultsNavContainerRef: RefObject<HTMLDivElement | null>;
  getQuestionResult: (questionId: string) => QuizQuestionResult | undefined;
  setCurrentPosition: Dispatch<SetStateAction<QuizNavigationPosition>>;
}

export function QuizPlayerResultsView({
  isDeferredResultsFeedback,
  quiz,
  isHomework,
  isBaselineTest,
  router,
  submissionResults,
  currentResult,
  currentQ,
  actualTimeLimit,
  currentQuestionIndex,
  questions,
  handlePrevious,
  handleNext,
  resultsNavContainerRef,
  getQuestionResult,
  setCurrentPosition,
}: QuizPlayerResultsViewProps) {
  // Delayed / tutor-review modes: students don't get a scored breakdown yet.
  if (isDeferredResultsFeedback) {
    const isTutorReview = quiz?.feedbackMode === "manual_tutor_review";
    const exitLabel = isHomework
      ? "Back to Homework"
      : isBaselineTest
        ? "Back"
        : "Back to Lessons";

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <CheckCircle className="h-8 w-8 text-primaryBlue" />
            </div>
            <CardTitle className="text-xl">
              {isHomework ? "Homework submitted" : "Quiz submitted"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Alert className="border-blue-200 bg-blue-50 text-left">
              <AlertCircle className="h-4 w-4 text-primaryBlue" />
              <AlertDescription className="text-blue-900">
                {isTutorReview ? (
                  <>
                    Your answers have been sent for tutor review. Results and
                    feedback will be shared with you once your Learning Buddy
                    has finished reviewing them.
                  </>
                ) : (
                  <>
                    Your answers have been submitted. Results and feedback will
                    be released a little later — we&apos;ll let you know when
                    they&apos;re ready.
                  </>
                )}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              You won&apos;t see a question-by-question breakdown on this
              screen. Check back later for your results.
            </p>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (isHomework) {
                  router.push("/homework");
                } else if (isBaselineTest) {
                  router.back();
                } else {
                  router.push("/dashboard");
                }
              }}
            >
              {exitLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const normalizeSubmissionQuestionResult = (
    r: QuizQuestionResult,
    fallbackPoints: number,
  ): QuizQuestionResult => ({
    ...r,
    correctAnswers: Array.isArray(r.correctAnswers) ? r.correctAnswers : [],
    pointsEarned: Number(r.pointsEarned) || 0,
    pointsPossible: Number(r.pointsPossible) || fallbackPoints,
  });

  const reviewQuestionResult = currentResult
    ? normalizeSubmissionQuestionResult(currentResult, currentQ.points || 1)
    : undefined;

  const mcTfUserAnswered =
    !reviewQuestionResult ||
    (currentQ.question.type !== "multiple_choice" &&
      currentQ.question.type !== "true_false")
      ? true
      : (() => {
          const id = reviewQuestionResult.userAnswerId;
          if (id != null && String(id).trim() !== "") return true;
          const c = reviewQuestionResult.userAnswerContent;
          if (c == null) return false;
          return String(c).trim() !== "";
        })();

  const lessonTitle = (quiz as any)?.lessonName || "---";
  const quizName = quiz?.title || "Quiz";
  const quizDescription = quiz?.description || "---";
  const passPercentage = Number(quiz?.passingScore);
  const isTimedQuiz = Boolean(actualTimeLimit && actualTimeLimit > 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex gap-6">
        {/* Main Results Area */}
        <div className="flex-1">
          {/* Results Summary Header */}
          <Card className="mb-6">
            <CardHeader className="space-y-3">
              <CardTitle>Quiz Review</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs mb-1">Lesson</p>
                  <p className="font-medium">{lessonTitle}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 md:col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">Quiz</p>
                  <p className="font-medium line-clamp-2">
                    {quizName}
                    {quizDescription && quizDescription !== "---"
                      ? ` - ${quizDescription}`
                      : ""}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <QuizPlayerResultsStats
                submissionResults={submissionResults}
                isTimed={isTimedQuiz}
                passPercentage={
                  Number.isFinite(passPercentage) ? passPercentage : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Current Question with Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                {reviewQuestionResult && (
                  <Badge
                    variant={
                      reviewQuestionResult.isCorrect ? "default" : "destructive"
                    }
                    className="flex items-center gap-2"
                  >
                    {reviewQuestionResult.isCorrect ? (
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
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Question Content */}
                <div>
                  <p className="text-base font-medium mb-2">Question:</p>
                  <MathPreview
                    content={String(currentQ.question.content ?? "")}
                    className="text-base text-textGray whitespace-pre-wrap"
                    renderMarkdown={true}
                  />
                  {(currentQ.question.image || currentQ.question.image_url) && (
                    <QuestionImage
                      src={
                        currentQ.question.image ||
                        currentQ.question.image_url ||
                        ""
                      }
                      alt="Question illustration"
                      metadata={
                        currentQ.question.imageSettings
                          ? {
                              image_settings: currentQ.question.imageSettings,
                            }
                          : undefined
                      }
                    />
                  )}
                </div>

                {/* User's Answer */}
                {reviewQuestionResult && (
                  <div>
                    <p className="text-base font-medium mb-2">Your Answer:</p>
                    {(currentQ.question.type === "multiple_choice" ||
                      currentQ.question.type === "true_false") &&
                    currentQ.question.options &&
                    currentQ.question.options.length > 0 ? (
                      <div className="space-y-3">
                        {!mcTfUserAnswered && (
                          <Alert className="border-muted bg-muted/40">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              You did not answer this question.
                            </AlertDescription>
                          </Alert>
                        )}
                        {currentQ.question.options.map((option) => {
                          const selectedId =
                            reviewQuestionResult.userAnswerId ||
                            reviewQuestionResult.userAnswerContent ||
                            "";
                          // Match by id first; fall back to text comparison so
                          // content-based answer values (e.g. true/false) still highlight.
                          const isSelected =
                            selectedId !== "" &&
                            (selectedId === option.id ||
                              String(option.text ?? "")
                                .trim()
                                .toLowerCase() ===
                                String(selectedId).trim().toLowerCase());
                          const isCorrectOption =
                            (reviewQuestionResult.correctAnswers?.some(
                              (ans) => ans.id === option.id,
                            ) ??
                              false) ||
                            (option as unknown as { isCorrect?: boolean })
                              .isCorrect === true;

                          return (
                            <div
                              key={option.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border-2",
                                // Only colour the option the child actually selected.
                                // The correct answer is surfaced separately below.
                                isSelected && isCorrectOption
                                  ? "bg-green-50 border-green-300"
                                  : isSelected
                                    ? "bg-red-50 border-red-300"
                                    : "border-gray-200",
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <MathPreview
                                  content={String(option.text ?? "")}
                                  className="text-base text-textGray whitespace-pre-wrap"
                                  renderMarkdown={true}
                                />
                              </div>
                              {isSelected && isCorrectOption ? (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : isSelected ? (
                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : currentQ.question.type === "matching_pairs" ? (
                      reviewQuestionResult.userAnswerContent ? (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          {(() => {
                            try {
                              const userMatches = JSON.parse(
                                reviewQuestionResult.userAnswerContent,
                              ) as Record<string, string>;
                              const ca0 =
                                reviewQuestionResult.correctAnswers[0];
                              const correctMatches =
                                ca0 && typeof ca0.content === "object"
                                  ? (ca0.content as Record<string, string>)
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
                                              : "bg-red-50 border-red-300",
                                          )}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="flex-1 min-w-0 flex items-center gap-1 flex-wrap">
                                              <MathPreview
                                                content={String(leftText)}
                                                renderMarkdown
                                                className="font-medium"
                                              />
                                              <span>→</span>
                                              <MathPreview
                                                content={String(rightText)}
                                                renderMarkdown
                                              />
                                            </div>
                                            {isMatchCorrect ? (
                                              <CheckCircle className="h-4 w-4 text-green-600 shrink-0 ml-auto" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-red-600 shrink-0 ml-auto" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              );
                            } catch {
                              return (
                                <MathPreview
                                  content={String(
                                    reviewQuestionResult.userAnswerContent ??
                                      "",
                                  )}
                                  renderMarkdown={true}
                                  className="text-base text-textGray whitespace-pre-wrap"
                                />
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <Alert className="border-muted bg-muted/40">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            You did not answer this question.
                          </AlertDescription>
                        </Alert>
                      )
                    ) : (
                      <div
                        className={cn(
                          "p-4 rounded-lg border-2",
                          reviewQuestionResult.userAnswerContent != null &&
                            String(
                              reviewQuestionResult.userAnswerContent,
                            ).trim() !== ""
                            ? reviewQuestionResult.isCorrect
                              ? "bg-green-50 border-green-300"
                              : "bg-red-50 border-red-300"
                            : "bg-muted/30 border-muted",
                        )}
                      >
                        {reviewQuestionResult.userAnswerContent != null &&
                        String(
                          reviewQuestionResult.userAnswerContent,
                        ).trim() !== "" ? (
                          <MathPreview
                            content={getQuizUserAnswerDisplayText(
                              currentQ,
                              reviewQuestionResult,
                            )}
                            className="text-base text-textGray whitespace-pre-wrap"
                            renderMarkdown={true}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            You did not answer this question.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Correct Answer */}
                {reviewQuestionResult &&
                  (!reviewQuestionResult.isCorrect ||
                    currentQ.question.type === "free_text" ||
                    currentQ.question.type === "short_answer" ||
                    currentQ.question.type === "long_answer" ||
                    currentQ.question.type === "coding") && (
                    <div>
                      <p className="text-base font-medium mb-2 text-green-700">
                        Correct Answer:
                      </p>
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        {currentQ.question.type === "matching_pairs" &&
                        reviewQuestionResult.correctAnswers[0] &&
                        typeof reviewQuestionResult.correctAnswers[0]
                          .content === "object" ? (
                          <div className="space-y-2">
                            {Object.entries(
                              reviewQuestionResult.correctAnswers[0]
                                .content as Record<string, string>,
                            ).map(([left, right]) => (
                              <div
                                key={left}
                                className="p-2 bg-white rounded border border-green-200 flex items-center gap-1 flex-wrap"
                              >
                                <MathPreview
                                  content={String(left)}
                                  renderMarkdown
                                  className="font-medium"
                                />
                                <span>→</span>
                                <MathPreview
                                  content={String(right)}
                                  renderMarkdown
                                />
                              </div>
                            ))}
                          </div>
                        ) : (currentQ.question.type === "free_text" ||
                            currentQ.question.type === "short_answer" ||
                            currentQ.question.type === "long_answer" ||
                            currentQ.question.type === "coding") &&
                          Array.isArray(reviewQuestionResult.correctAnswers) &&
                          reviewQuestionResult.correctAnswers.length > 0 ? (
                          <div className="space-y-2">
                            {reviewQuestionResult.correctAnswers.map(
                              (ans, index) => (
                                <MathPreview
                                  key={ans.id ?? index}
                                  content={String(
                                    typeof ans.content === "object" &&
                                      ans.content !== null
                                      ? ""
                                      : (ans.content ?? ""),
                                  )}
                                  renderMarkdown={true}
                                  className="text-base text-green-900 whitespace-pre-wrap"
                                />
                              ),
                            )}
                          </div>
                        ) : (
                          <MathPreview
                            content={getCorrectAnswerText(
                              currentQ,
                              reviewQuestionResult,
                            )}
                            renderMarkdown={true}
                            className="text-base text-green-900 whitespace-pre-wrap"
                          />
                        )}
                      </div>
                    </div>
                  )}

                {/* Feedback */}
                {reviewQuestionResult?.feedback && (
                  <div>
                    <p className="text-base font-medium mb-2">Feedback:</p>
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <MathPreview
                          content={reviewQuestionResult.feedback}
                          className="text-yellow-800"
                          renderMarkdown={true}
                        />
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Explanation if available */}
                {currentQ.explanation && (
                  <div>
                    <p className="text-base font-medium mb-2">Explanation:</p>
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <MathPreview
                          content={currentQ.explanation}
                          className="text-blue-800"
                          renderMarkdown={true}
                        />
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentQuestionIndex >= questions.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Navigation Sidebar */}
        <Card className="w-64 h-fit sticky top-6">
          <CardContent className="pt-6">
            <div
              ref={resultsNavContainerRef}
              className="space-y-2 max-h-[80vh] overflow-y-auto pr-1"
            >
              {questions.map((q, index) => {
                const raw = getQuestionResult(q.question.id);
                const result = raw
                  ? normalizeSubmissionQuestionResult(raw, q.points || 1)
                  : undefined;
                const isCurrent = currentQuestionIndex === index;

                return (
                  <button
                    key={q.question.id}
                    onClick={() =>
                      setCurrentPosition({
                        type: "question",
                        questionIndex: index,
                      })
                    }
                    data-testid={`results-question-nav-${index + 1}`}
                    className={cn(
                      "w-full min-w-0 px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                      isCurrent
                        ? "bg-primaryBlue text-white hover:bg-primaryBlue/90"
                        : result?.isCorrect
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                          : result
                            ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
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
                              : "bg-gray-400 text-white",
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
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
