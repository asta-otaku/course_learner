"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetHomeworkById,
  useGetManageSubscription,
  useGetQuiz,
  useGetQuizAttemptById,
  useGetQuizQuestions,
} from "@/lib/api/queries";
import {
  usePatchDismissHomeworkReview,
  usePatchMarkHomeworkAsReviewed,
} from "@/lib/api/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MathPreview } from "@/components/resourceManagement/editor/math-preview";
import { QuestionImage } from "@/components/ui/question-image";
import { WatchLessonVideoButton } from "@/components/platform/library/watchLessonVideoButton";
import {
  StudentOverallQuizFeedback,
  TutorOverallQuizFeedback,
} from "@/components/platform/quiz/overall-quiz-feedback";
import { QuizReviewAnswers } from "@/components/platform/quiz/QuizReviewAnswers";
import { QuizReviewFeedbackSection } from "@/components/platform/quiz/QuizReviewFeedbackSection";
import { useProfile } from "@/context/profileContext";
import { cn, parseQuizFeedbackText } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  isMcTfUserAnswered,
  mapQuizReviewQuestions,
} from "./map-quiz-review-questions";
import type {
  QuestionWithResults,
  QuizReviewPageProps,
  QuizResult,
} from "./quiz-review-types";

export type { QuizReviewPageProps } from "./quiz-review-types";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function parseLegacyFeedbackJson(feedback: string): string {
  try {
    const parsed = JSON.parse(feedback);
    if (parsed && typeof parsed === "object" && parsed.feedback) {
      return String(parsed.feedback);
    }
  } catch {
    // Not JSON, use as is
  }
  return String(feedback);
}

export function QuizReviewPage(props: QuizReviewPageProps) {
  if (props.mode === "student") {
    return <StudentQuizReviewPage {...props} />;
  }
  return <QuizReviewView {...props} isTuitionOfferType={false} />;
}

function StudentQuizReviewPage(props: QuizReviewPageProps) {
  const { activeProfile } = useProfile();
  const { data: manageData } = useGetManageSubscription();
  const activeProfileId = activeProfile?.id ? String(activeProfile.id) : "";
  const manageAccessLevel = useMemo(() => {
    const sub = manageData?.data;
    if (!sub?.childSubscription || !activeProfileId) return null;
    const row = sub.childSubscription.find(
      (r: { childProfileId?: string }) =>
        String(r.childProfileId) === String(activeProfileId),
    );
    return row?.accessLevel ?? null;
  }, [manageData?.data, activeProfileId]);

  return (
    <QuizReviewView
      {...props}
      isTuitionOfferType={manageAccessLevel === "tuition"}
    />
  );
}

function QuizReviewView({
  mode,
  source,
  resourceId,
  backHref,
  backLabel,
  isTuitionOfferType,
}: QuizReviewPageProps & { isTuitionOfferType: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>(
    {},
  );
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [showMarkReviewedDialog, setShowMarkReviewedDialog] = useState(false);
  const [showDismissFromListDialog, setShowDismissFromListDialog] =
    useState(false);

  const isHomework = source === "homework";
  const isQuiz = source === "quiz";
  const isBaseline = source === "baseline";
  const isStudent = mode === "student";
  const isTutor = mode === "tutor";
  const canEditFeedback = isTutor && (isHomework || isBaseline);
  const showHomeworkReviewActions = isTutor && isHomework;
  const showFeedbackSidebar =
    (isStudent && !isBaseline) || (isTutor && !isQuiz);
  const showSidebarTitle = !isQuiz;
  const requireResultToShowQuestion = isQuiz;
  const showHeaderBack = isHomework;
  const showWatchLesson = isStudent;
  const showStudentOverallFeedback = isStudent && !isBaseline;
  const showTutorOverallFeedback = isTutor && !isQuiz;
  const showQuizScoreStats = isQuiz;
  const showHomeworkTutorStats = isTutor && isHomework;
  const showCorrectAnswersOnlyStat =
    isBaseline || (isStudent && isHomework);
  const showLessonQuizMeta = isQuiz;
  const showPointsOnBadge = isBaseline;
  const showParsedStudentTutorComments = isStudent && !isBaseline;
  const showMetadataFeedback =
    (isStudent && isBaseline) || (isTutor && isQuiz);
  const showLegacyFeedbackAlert =
    (isStudent && isBaseline) || (isTutor && isQuiz);
  const showRawQuestionFeedback = isTutor && !isQuiz;
  const answerLabel =
    isTutor && isHomework ? "Student Answer:" : "Your Answer:";
  const unansweredMessage =
    isTutor && isHomework
      ? "Student did not answer this question."
      : "You did not answer this question.";

  const homeworkQuery = useGetHomeworkById(isHomework ? resourceId : "");
  const attemptQuery = useGetQuizAttemptById(isHomework ? "" : resourceId);
  const reviewResponse = isHomework ? homeworkQuery.data : attemptQuery.data;
  const isLoading = isHomework
    ? homeworkQuery.isLoading
    : attemptQuery.isLoading;
  const error = isHomework ? homeworkQuery.error : attemptQuery.error;
  const review = reviewResponse?.data;

  const { mutate: markAsReviewed, isPending: isMarkingAsReviewed } =
    usePatchMarkHomeworkAsReviewed(
      showHomeworkReviewActions ? resourceId : "",
    );
  const { mutate: dismissFromList, isPending: isDismissingFromList } =
    usePatchDismissHomeworkReview(
      showHomeworkReviewActions ? resourceId : "",
    );

  const { data: quizResponse } = useGetQuiz(
    isQuiz ? review?.quizId || "" : "",
  );
  const quizData = quizResponse?.data;
  const { data: questionsResponse } = useGetQuizQuestions(
    review?.quizId || "",
  );

  const questionsWithResults = useMemo(
    () => mapQuizReviewQuestions(review, questionsResponse?.data),
    [review, questionsResponse],
  );

  useEffect(() => {
    if (!canEditFeedback || questionsWithResults.length === 0) return;
    const initialFeedbacks: Record<string, string> = {};
    questionsWithResults.forEach((q: QuestionWithResults) => {
      if (q.result?.tutorFeedback) {
        initialFeedbacks[q.question.id] = parseQuizFeedbackText(
          q.result.tutorFeedback,
        );
      }
    });
    setFeedbackTexts(initialFeedbacks);
  }, [canEditFeedback, questionsWithResults]);

  const { totalEarned, totalPossible, computedPercentage } = useMemo(() => {
    const results = review?.results ?? [];
    const earned = results.reduce(
      (sum: number, r: QuizResult) => sum + Number(r.pointsEarned ?? 0),
      0,
    );
    const possible = results.reduce(
      (sum: number, r: QuizResult) => sum + Number(r.pointsPossible ?? 0),
      0,
    );
    const percentage = possible > 0 ? (earned / possible) * 100 : 0;
    return {
      totalEarned: earned,
      totalPossible: possible,
      computedPercentage: percentage,
    };
  }, [review?.results]);

  const goBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const errorMessage = isHomework
    ? "Failed to load homework review. Please try again."
    : isBaseline
      ? "Failed to load baseline test review. Please try again."
      : "Failed to load quiz attempt review. Please try again.";

  const pageTitle = isQuiz
    ? "Quiz Review"
    : isHomework
      ? isTutor
        ? "Homework Review - Tutor View"
        : "Homework Review"
      : "Baseline Test Review";

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
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button className="mt-4" variant="outline" onClick={goBack}>
              {backHref ? (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </>
              ) : (
                backLabel
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questionsWithResults[currentQuestionIndex];
  const currentResult = currentQ?.result;
  const currentHasTutorFeedback = showFeedbackSidebar
    ? Boolean(
        (canEditFeedback &&
          currentQ &&
          feedbackTexts[currentQ.question.id]) ||
          parseQuizFeedbackText(
            currentResult?.tutorFeedback || currentResult?.feedback,
          ),
      )
    : false;

  const mcTfUserAnswered = isMcTfUserAnswered(
    currentQ?.question,
    currentResult,
  );
  const curriculumLessonId = review.curriculumLessonId as
    | string
    | null
    | undefined;
  const lessonTitle = (quizData as { lessonName?: string } | undefined)
    ?.lessonName || "---";
  const quizName = quizData?.title || "Quiz";
  const quizDescription = quizData?.description || "---";
  const finalScore = `${Math.round(totalEarned)}/${Math.round(totalPossible)}`;
  const roundedPercentage = `${Math.round(computedPercentage)}%`;
  const passPercentageRaw = Number(quizData?.passingScore);
  const passingScore = (() => {
    const pct = Number(passPercentageRaw);
    const questions = Number(questionsWithResults.length);
    if (!Number.isFinite(pct) || !Number.isFinite(questions) || questions <= 0) {
      return "---";
    }
    const needed = Math.ceil((pct / 100) * questions);
    return `${needed}/${questions}`;
  })();
  const isTimedQuiz = Number(quizData?.timeLimit) > 0;
  const headerHasOverallFeedback =
    showStudentOverallFeedback || showTutorOverallFeedback
      ? Boolean(parseQuizFeedbackText(review.overallFeedback))
      : false;
  const showQuestionCard = requireResultToShowQuestion
    ? Boolean(currentQ && currentResult)
    : Boolean(currentQ);
  const watchLessonButton =
    showWatchLesson && isTuitionOfferType && curriculumLessonId?.trim() ? (
      <WatchLessonVideoButton
        curriculumLessonId={curriculumLessonId}
        lessonTitle={isQuiz ? lessonTitle : undefined}
        className="bg-primaryBlue hover:bg-primaryBlue/90"
      />
    ) : null;

  const headerBackButton = showHeaderBack ? (
    <Button
      variant="outline"
      onClick={() =>
        showHomeworkReviewActions
          ? setShowDismissFromListDialog(true)
          : goBack()
      }
      disabled={showHomeworkReviewActions ? isDismissingFromList : false}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {backLabel}
    </Button>
  ) : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex gap-6">
        <div className="flex-1">
          <Card
            className={cn(
              "mb-6",
              headerHasOverallFeedback && "border-2 border-amber-500",
            )}
          >
            <CardHeader className={showLessonQuizMeta ? "space-y-3" : undefined}>
              {isQuiz ? (
                isStudent ? (
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{pageTitle}</CardTitle>
                    {watchLessonButton}
                  </div>
                ) : (
                  <CardTitle>{pageTitle}</CardTitle>
                )
              ) : isHomework && isStudent ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{pageTitle}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {watchLessonButton}
                    {headerBackButton}
                  </div>
                </div>
              ) : isHomework && isTutor ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>{pageTitle}</CardTitle>
                      {review.isBuddyReviewed && (
                        <Badge variant="default" className="ml-2">
                          Reviewed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!review.isBuddyReviewed && (
                      <Button
                        onClick={() => setShowMarkReviewedDialog(true)}
                        disabled={isMarkingAsReviewed}
                      >
                        {isMarkingAsReviewed ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          "Mark as Reviewed"
                        )}
                      </Button>
                    )}
                    {headerBackButton}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{pageTitle}</CardTitle>
                  </div>
                  {watchLessonButton}
                </div>
              )}
              {showLessonQuizMeta && (
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
              )}
            </CardHeader>
            <CardContent>
              {showQuizScoreStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Trophy className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Final score
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {finalScore}
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
                        {roundedPercentage}
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
                        {isTimedQuiz && Number(review.timeSpent) > 0
                          ? formatTime(Number(review.timeSpent))
                          : "---"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">
                        Pass Mark
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        {passingScore}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {showHomeworkTutorStats && (
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
              )}
              {showCorrectAnswersOnlyStat && (
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
              )}
              {showStudentOverallFeedback && (
                <StudentOverallQuizFeedback feedback={review.overallFeedback} />
              )}
              {showTutorOverallFeedback &&
                (isHomework ? (
                  review.attemptId ? (
                    <TutorOverallQuizFeedback
                      attemptId={review.attemptId}
                      existingFeedback={review.overallFeedback}
                    />
                  ) : null
                ) : (
                  <TutorOverallQuizFeedback
                    attemptId={review.attemptId || resourceId}
                    existingFeedback={review.overallFeedback}
                  />
                ))}
            </CardContent>
          </Card>

          {showQuestionCard && currentQ && (
            <Card
              className={cn(
                currentHasTutorFeedback && "border-2 border-amber-500",
              )}
            >
              <CardHeader>
                <div
                  className={cn(
                    "flex items-center justify-between",
                    showFeedbackSidebar && "gap-3",
                  )}
                >
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1} of{" "}
                    {questionsWithResults.length}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {currentHasTutorFeedback && (
                      <Badge className="border-transparent bg-amber-500 text-white shadow hover:bg-amber-500 gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {canEditFeedback
                          ? "Feedback added"
                          : "Tutor feedback"}
                      </Badge>
                    )}
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
                        {showPointsOnBadge && (
                          <span className="ml-2">
                            {currentResult.pointsEarned}/
                            {currentResult.pointsPossible} points
                          </span>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-base font-medium mb-2">Question:</p>
                    <MathPreview
                      content={String(currentQ.question.content ?? "")}
                      className="text-base text-textGray whitespace-pre-wrap"
                      renderMarkdown={true}
                    />
                    {(currentQ.question.image ||
                      currentQ.question.image_url) && (
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
                                image_settings:
                                  currentQ.question.imageSettings,
                              }
                            : undefined
                        }
                      />
                    )}
                  </div>

                  {currentResult && (
                    <QuizReviewAnswers
                      question={currentQ.question}
                      result={currentResult}
                      answerLabel={answerLabel}
                      unansweredMessage={unansweredMessage}
                      mcTfUserAnswered={mcTfUserAnswered}
                    />
                  )}

                  {currentResult &&
                    showParsedStudentTutorComments &&
                    parseQuizFeedbackText(currentResult.questionFeedback) && (
                      <div>
                        <p className="text-base font-medium mb-2">Feedback:</p>
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <MathPreview
                              content={parseQuizFeedbackText(
                                currentResult.questionFeedback,
                              )}
                              renderMarkdown
                              className="text-blue-800 whitespace-pre-wrap"
                            />
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {currentResult &&
                    showRawQuestionFeedback &&
                    currentResult.questionFeedback && (
                      <div>
                        <p className="text-base font-medium mb-2">Feedback:</p>
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <MathPreview
                              content={String(currentResult.questionFeedback)}
                              renderMarkdown
                              className="text-blue-800 whitespace-pre-wrap"
                            />
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {currentResult &&
                    showMetadataFeedback &&
                    currentQ.question.metadata &&
                    (currentResult.isCorrect
                      ? currentQ.question.metadata.correctFeedback
                      : currentQ.question.metadata.incorrectFeedback) && (
                      <div>
                        <p className="text-base font-medium mb-2">Feedback:</p>
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <MathPreview
                              content={String(
                                currentResult.isCorrect
                                  ? currentQ.question.metadata.correctFeedback
                                  : currentQ.question.metadata
                                      .incorrectFeedback,
                              )}
                              renderMarkdown
                              className="text-blue-800 whitespace-pre-wrap"
                            />
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {currentResult &&
                    showParsedStudentTutorComments &&
                    parseQuizFeedbackText(
                      currentResult.tutorFeedback || currentResult.feedback,
                    ) && (
                      <div>
                        <p className="text-base font-medium mb-2">
                          Your tutor&apos;s feedback:
                        </p>
                        <Alert className="border-2 border-amber-400 bg-amber-50">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription>
                            <MathPreview
                              content={parseQuizFeedbackText(
                                currentResult.tutorFeedback ||
                                  currentResult.feedback,
                              )}
                              renderMarkdown
                              className="text-amber-900 whitespace-pre-wrap"
                            />
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {currentResult &&
                    showLegacyFeedbackAlert &&
                    currentResult.feedback && (
                      <div>
                        <p className="text-base font-medium mb-2">
                          {isStudent
                            ? "Additional Feedback:"
                            : "Feedback:"}
                        </p>
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription>
                            <MathPreview
                              content={
                                isStudent
                                  ? (() => {
                                      try {
                                        const parsed = JSON.parse(
                                          currentResult.feedback!,
                                        );
                                        return (
                                          parsed?.feedback ??
                                          currentResult.feedback
                                        );
                                      } catch {
                                        return currentResult.feedback;
                                      }
                                    })()
                                  : parseLegacyFeedbackJson(
                                      currentResult.feedback as string,
                                    )
                              }
                              renderMarkdown
                              className={
                                isStudent
                                  ? "text-yellow-800 whitespace-pre-wrap"
                                  : "text-yellow-800 whitespace-pre-wrap"
                              }
                            />
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {currentResult && canEditFeedback && (
                    <QuizReviewFeedbackSection
                      questionId={currentQ.question.id}
                      questionAttemptId={
                        currentResult.questionAttemptId ||
                        currentResult.id ||
                        ""
                      }
                      isCorrect={currentResult.isCorrect}
                      invalidateQueryKey={
                        isHomework
                          ? ["homework", resourceId]
                          : ["quiz-attempt", resourceId]
                      }
                      existingFeedback={
                        isHomework
                          ? currentResult.tutorFeedback || ""
                          : currentResult.tutorFeedback ||
                            currentResult.feedback ||
                            ""
                      }
                      feedbackText={
                        feedbackTexts[currentQ.question.id] || ""
                      }
                      onFeedbackChange={(text) => {
                        setFeedbackTexts((prev) => ({
                          ...prev,
                          [currentQ.question.id]: text,
                        }));
                      }}
                      editingFeedback={editingFeedback}
                      setEditingFeedback={setEditingFeedback}
                    />
                  )}

                  {currentQ.question.explanation && (
                    <div>
                      <p className="text-base font-medium mb-2">Explanation:</p>
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <MathPreview
                            content={String(
                              currentQ.question.explanation ?? "",
                            )}
                            className="text-blue-800 whitespace-pre-wrap"
                            renderMarkdown={true}
                          />
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentQuestionIndex((prev) =>
                          prev > 0 ? prev - 1 : prev,
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
                            : prev,
                        )
                      }
                      disabled={
                        currentQuestionIndex >=
                        questionsWithResults.length - 1
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

        <Card className="w-64 h-fit sticky top-6">
          {showSidebarTitle && (
            <CardHeader>
              <CardTitle className="text-base">Question Review</CardTitle>
            </CardHeader>
          )}
          <CardContent className={showSidebarTitle ? undefined : "pt-6"}>
            <div
              className={cn(
                "space-y-2 max-h-[80vh] overflow-y-auto",
                showFeedbackSidebar ? "p-1.5" : "pr-1",
              )}
            >
              {questionsWithResults.map(
                (q: QuestionWithResults, index: number) => {
                  const result = q.result;
                  const isCurrent = currentQuestionIndex === index;
                  const hasTutorFeedback = showFeedbackSidebar
                    ? canEditFeedback
                      ? !!feedbackTexts[q.question.id] ||
                        !!result?.tutorFeedback
                      : Boolean(
                          parseQuizFeedbackText(
                            result?.tutorFeedback || result?.feedback,
                          ),
                        )
                    : false;

                  if (showFeedbackSidebar) {
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={`Question ${index + 1}${
                          result?.isCorrect
                            ? ", correct"
                            : result
                              ? ", incorrect"
                              : ""
                        }${hasTutorFeedback ? ", has tutor feedback" : ""}`}
                        className={cn(
                          "w-full min-w-0 rounded-md text-sm font-medium transition-colors overflow-hidden border-2 text-left",
                          result?.isCorrect
                            ? "bg-green-100 text-green-800 border-green-400 hover:bg-green-200"
                            : result
                              ? "bg-red-100 text-red-800 border-red-400 hover:bg-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
                          isCurrent && "ring-2 ring-offset-1 ring-slate-800",
                          hasTutorFeedback && "border-amber-500",
                        )}
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          <div
                            className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                              result?.isCorrect
                                ? "bg-green-600 text-white"
                                : result
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-400 text-white",
                            )}
                          >
                            {index + 1}
                          </div>
                          <span className="truncate flex-1">
                            Question {index + 1}
                          </span>
                          {result?.isCorrect ? (
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          ) : result ? (
                            <XCircle className="h-4 w-4 flex-shrink-0" />
                          ) : null}
                        </div>
                        {hasTutorFeedback && (
                          <div className="flex items-center justify-center gap-1 bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wide py-1 px-2">
                            <MessageSquare className="h-3 w-3" />
                            Feedback
                          </div>
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
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
                },
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showHomeworkReviewActions && (
        <>
          <AlertDialog
            open={showDismissFromListDialog}
            onOpenChange={setShowDismissFromListDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from homework list?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cancel returns you to the homework page without removing this
                  item. Remove from List removes this quiz from your homework
                  list, then returns you to the list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isDismissingFromList}
                  onClick={() => {
                    setShowDismissFromListDialog(false);
                    goBack();
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    dismissFromList(undefined, {
                      onSuccess: () => {
                        setShowDismissFromListDialog(false);
                        toast.success("Removed from homework list");
                        goBack();
                      },
                      onError: () => {
                        toast.error(
                          "Failed to remove from homework list. Please try again.",
                        );
                      },
                    });
                  }}
                  disabled={isDismissingFromList}
                >
                  {isDismissingFromList ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    "Remove from List"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={showMarkReviewedDialog}
            onOpenChange={setShowMarkReviewedDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as Reviewed?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to mark this homework as reviewed? This
                  action will update the homework status and the student will be
                  notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isMarkingAsReviewed}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    markAsReviewed(undefined, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({
                          queryKey: ["homework", resourceId],
                        });
                        toast.success("Homework marked as reviewed!");
                        setTimeout(() => {
                          goBack();
                        }, 500);
                      },
                      onError: (err) => {
                        console.error("Error marking as reviewed:", err);
                        toast.error(
                          "Failed to mark as reviewed. Please try again.",
                        );
                      },
                    });
                  }}
                  disabled={isMarkingAsReviewed}
                >
                  {isMarkingAsReviewed ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    "Mark as Reviewed"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
