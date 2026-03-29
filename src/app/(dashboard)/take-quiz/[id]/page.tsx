"use client";

import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePostAttemptQuiz, usePostStartHomework, usePostStartBaselineTest } from "@/lib/api/mutations";
import { useGetQuiz, useGetResumeQuizAttempt } from "@/lib/api/queries";
import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useProfile } from "@/context/profileContext";

export default function TakeQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { activeProfile } = useProfile();
  const id = params.id as string;
  const isTestMode = searchParams.get("mode") === "test";
  const isHomework = searchParams.get("isHomework") === "true";
  const isBaselineTest = searchParams.get("isBaselineTest") === "true";
  const baselineTestId = searchParams.get("baselineTestId") ?? "";
  const resumeAttemptId = searchParams.get("attemptId") ?? null;
  // isResuming via URL param (direct resume link for regular quizzes)
  const isResuming = Boolean(resumeAttemptId && !isHomework && !isBaselineTest);
  const router = useRouter();

  const finalQuizIdForFetch = isHomework ? null : id;
  const { data: quizResponse } = useGetQuiz(finalQuizIdForFetch || "");
  const quiz = quizResponse?.data;
  const timeLimit = quiz?.timeLimit;
  const feedbackMode = quiz?.feedbackMode;

  // Quiz attempt mutations
  const { mutate: startQuizAttempt, isPending: isStartingQuiz } = usePostAttemptQuiz(id);
  const { mutate: startHomework, isPending: isStartingHomework } = usePostStartHomework();
  const { mutate: startBaselineTest, isPending: isStartingBaselineTest } = usePostStartBaselineTest(baselineTestId);

  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [isResumingFromStart, setIsResumingFromStart] = useState(false);

  // Fetch resume data to show answered count in the notice.
  // - URL-param case: use resumeAttemptId
  // - After-start case: use attemptId once the server tells us it's resuming
  const resumeQueryId = isResuming
    ? resumeAttemptId || ""
    : isResumingFromStart && attemptId
    ? attemptId
    : "";
  const { data: resumeResponse, isLoading: isLoadingResumeData } =
    useGetResumeQuizAttempt(resumeQueryId);

  const resumedAnsweredCount = useMemo(() => {
    const questions = resumeResponse?.data?.questions;
    if (!Array.isArray(questions)) return 0;
    return questions.filter((q: any) => q.isLocked || !!q.result).length;
  }, [resumeResponse]);

  // Whether we are in any kind of resume flow (before the quiz starts)
  const isResumingDetected = isResuming || isResumingFromStart;

  // Handler for the main CTA button
  const handleStartOrResumeClick = () => {
    // Resume via URL param — we already have the attempt ID
    if (isResuming && resumeAttemptId) {
      setAttemptId(resumeAttemptId);
      setQuizId(id);
      setQuizStarted(true);
      return;
    }

    // Resume confirmed after the server told us it's a resume
    if (isResumingFromStart && attemptId) {
      setQuizStarted(true);
      return;
    }

    // ── Fresh start flows ──────────────────────────────────────────────────
    if (isBaselineTest && baselineTestId) {
      startBaselineTest(
        { childProfileId: activeProfile?.id || "" },
        {
          onSuccess: (response) => {
            const data = response.data?.data as any;
            const resolvedAttemptId =
              data?.baselineAttemptId ?? data?.attemptId ?? data?.id ?? data?.attempt?.id;
            if (resolvedAttemptId) {
              setAttemptId(resolvedAttemptId);
              setQuizAttemptId(data.quizAttemptId);
              setQuizId(id);
              if (data.isResuming) {
                setIsResumingFromStart(true);
                toast.info("Baseline test already started — review the details and resume.");
              } else {
                setQuizStarted(true);
                toast.success("Baseline test started!");
              }
            } else {
              console.error("Attempt ID not found in baseline test response");
              toast.error("Failed to start baseline test. Please try again.");
            }
          },
          onError: (error) => {
            console.error("Error starting baseline test:", error);
            toast.error("Failed to start baseline test. Please try again.");
          },
        }
      );
      return;
    }

    if (isHomework) {
      startHomework(
        { homeworkId: id, studentId: activeProfile?.id || "" },
        {
          onSuccess: (response) => {
            const homeworkData = response.data?.data as any;
            if (homeworkData?.id && homeworkData?.quizId) {
              setAttemptId(homeworkData.id);
              setQuizId(homeworkData.quizId);
              if (homeworkData.isResuming) {
                setIsResumingFromStart(true);
                toast.info("Homework already started — review the details and resume.");
              } else {
                setQuizStarted(true);
                toast.success("Homework started successfully!");
              }
            } else {
              console.error("Homework ID or Quiz ID not found in response");
              toast.error("Failed to start homework. Please try again.");
            }
          },
          onError: (error) => {
            console.error("Error starting homework:", error);
            toast.error("Failed to start homework. Please try again.");
          },
        }
      );
    } else {
      startQuizAttempt(
        { childId: activeProfile?.id || "" },
        {
          onSuccess: (response) => {
            const attemptData = response.data?.data;
            if (attemptData?.id) {
              setAttemptId(attemptData.id);
              if (attemptData.isResuming) {
                setIsResumingFromStart(true);
                toast.info("Quiz already started — review the details and resume.");
              } else {
                setQuizStarted(true);
                toast.success("Quiz started successfully!");
              }
            } else {
              console.error("Attempt ID not found in response");
              toast.error("Failed to start quiz. Please try again.");
            }
          },
          onError: (error) => {
            console.error("Error starting quiz:", error);
            toast.error("Failed to start quiz. Please try again.");
          },
        }
      );
    }
  };

  // ── Quiz player ─────────────────────────────────────────────────────────
  if (quizStarted) {
    const finalQuizId = isHomework && quizId ? quizId : id;
    const finalTimeLimit = isHomework ? undefined : timeLimit;
    const finalAttemptId = isResuming && resumeAttemptId ? resumeAttemptId : attemptId;

    return (
      <QuizPlayer
        quizId={finalQuizId}
        isTestMode={isTestMode}
        attemptId={finalAttemptId}
        quizAttemptId={quizAttemptId}
        isHomework={isHomework}
        homeworkId={isHomework ? id : undefined}
        isBaselineTest={isBaselineTest}
        baselineTestId={isBaselineTest ? baselineTestId : undefined}
        timeLimit={finalTimeLimit}
        isResuming={isResumingFromStart || isResuming}
      />
    );
  }

  // ── Pre-quiz screen ──────────────────────────────────────────────────────
  const timeLimitDisplay =
    timeLimit === 0 || !timeLimit
      ? "Untimed (No time restriction)"
      : `${timeLimit} minute${timeLimit !== 1 ? "s" : ""}`;

  // Button label changes to "Resume …" when we detect a previous attempt
  const buttonLabel = isResumingDetected
    ? isBaselineTest
      ? "Resume Baseline Test"
      : isHomework
      ? "Resume Homework"
      : "Resume Quiz"
    : isBaselineTest
    ? "Start Baseline Test"
    : isHomework
    ? "Start Homework"
    : "Start Quiz";

  const isPending = isStartingQuiz || isStartingHomework || isStartingBaselineTest;

  // Resume notice — shown just above the CTA button
  // immediate feedback: locked-answers warning; other modes: simple continuation message
  const resumeNotice = isResumingDetected ? (
    isLoadingResumeData && !resumedAnsweredCount ? (
      "Loading your previous progress…"
    ) : feedbackMode === "immediate" ? (
      `You have already answered ${resumedAnsweredCount} question${resumedAnsweredCount !== 1 ? "s" : ""}. Those answers are locked and cannot be changed. Continue from where you left off.`
    ) : (
      `You have already answered ${resumedAnsweredCount} question${resumedAnsweredCount !== 1 ? "s" : ""}. Continue from where you left off.`
    )
  ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-3xl w-full mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
              {quiz?.title || "Quiz"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Quiz Details */}
            <div className="space-y-4 mb-8">
              {/* Quiz Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {timeLimit !== undefined && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Time Limit</h4>
                    <p className="text-gray-700">{timeLimitDisplay}</p>
                  </div>
                )}
                {quiz?.passingScore !== undefined && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Pass Mark</h4>
                    <p className="text-gray-700">
                      {Math.round(Number(quiz.passingScore)).toLocaleString()}%
                    </p>
                  </div>
                )}
                {quiz?.questionsCount !== undefined && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Questions</h4>
                    <p className="text-gray-700">
                      {quiz.questionsCount} question{quiz.questionsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz Description */}
              {quiz?.description && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Quiz Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{quiz.description}</p>
                </div>
              )}

              {/* General Information */}
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">What to Expect</h3>
                {quiz?.feedbackMode === "immediate" ? (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Answer all questions carefully</li>
                    <li>You must do each question in order</li>
                    <li>You will get feedback after each question</li>
                    <li>Your progress will be saved automatically</li>
                    <li>Take your time and read each question thoroughly</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Answer all questions carefully</li>
                    <li>Review your answers before submitting</li>
                    <li>
                      <span className="font-bold text-gray-900">
                        Correct answers will be shown after the whole quiz is completed
                      </span>
                    </li>
                    <li>Your progress will be saved automatically</li>
                    <li>Take your time and read each question thoroughly</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Resume Notice — just above the action buttons */}
            {resumeNotice && (
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Resuming:</strong> {resumeNotice}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="min-w-[120px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={handleStartOrResumeClick}
                disabled={isPending || (isBaselineTest && !baselineTestId)}
                className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isResumingDetected ? "Resuming..." : "Starting..."}
                  </>
                ) : (
                  buttonLabel
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
