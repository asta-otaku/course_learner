"use client";

import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePostAttemptQuiz, usePostStartHomework, usePostStartBaselineTest } from "@/lib/api/mutations";
import { useGetQuiz } from "@/lib/api/queries";
import { useState } from "react";
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
  const isResuming = Boolean(resumeAttemptId && !isHomework && !isBaselineTest);
  const router = useRouter();
  const finalQuizIdForFetch = isHomework ? null : id;
  const { data: quizResponse } = useGetQuiz(finalQuizIdForFetch || "");
  const quiz = quizResponse?.data;
  const timeLimit = quiz?.timeLimit;

  // Quiz attempt mutation (for regular quizzes)
  const { mutate: startQuizAttempt, isPending: isStartingQuiz } =
    usePostAttemptQuiz(id);

  // Homework start mutation (for homework quizzes)
  const { mutate: startHomework, isPending: isStartingHomework } =
    usePostStartHomework();

  // Baseline test start mutation (for baseline tests)
  const { mutate: startBaselineTest, isPending: isStartingBaselineTest } =
    usePostStartBaselineTest(baselineTestId);

  // State to track if quiz has been started
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [isResumingFromStart, setIsResumingFromStart] = useState(false);

  // Handler for starting quiz
  const handleStartQuiz = () => {
    if (isBaselineTest && baselineTestId) {
      startBaselineTest(
        { childProfileId: activeProfile?.id || "" },
        {
          onSuccess: (response) => {
            const data = response.data?.data as any;
            const attemptIdFromResponse =
              data?.baselineAttemptId ??
              data?.attemptId ??
              data?.id ??
              data?.attempt?.id;
            if (attemptIdFromResponse) {
              setAttemptId(attemptIdFromResponse);
              setQuizAttemptId(data.quizAttemptId);
              setQuizId(id);
              setQuizStarted(true);
              toast.success("Baseline test started!");
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
      // Use homework start endpoint
      startHomework(
        {
          homeworkId: id,
          studentId: activeProfile?.id || "",
        },
        {
          onSuccess: (response) => {
            const homeworkData = response.data?.data as any;
            if (homeworkData?.id && homeworkData?.quizId) {
              setAttemptId(homeworkData.id);
              setQuizId(homeworkData.quizId);
              setIsResumingFromStart(Boolean(homeworkData.isResuming));
              setQuizStarted(true);
              toast.success(homeworkData.isResuming ? "Resuming homework..." : "Homework started successfully!");
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
      // Use regular quiz attempt endpoint
      startQuizAttempt(
        { childId: activeProfile?.id || "" },
        {
          onSuccess: (response) => {
            const attemptData = response.data?.data;
            if (attemptData?.id) {
              setAttemptId(attemptData.id);
              setIsResumingFromStart(Boolean(attemptData.isResuming));
              setQuizStarted(true);
              toast.success(attemptData.isResuming ? "Resuming quiz..." : "Quiz started successfully!");
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

  // If resuming an existing attempt, skip the start flow
  if (isResuming && resumeAttemptId) {
    return (
      <QuizPlayer
        quizId={id}
        isTestMode={isTestMode}
        attemptId={resumeAttemptId}
        quizAttemptId={null}
        isHomework={false}
        isBaselineTest={false}
        timeLimit={timeLimit}
        isResuming={true}
      />
    );
  }

  // If quiz hasn't been started, show the pre-quiz UI
  if (!quizStarted) {
    // Format time limit: if 0, show as "Untimed"
    const timeLimitDisplay =
      timeLimit === 0 || !timeLimit
        ? "Untimed (No time restriction)"
        : `${timeLimit} minute${timeLimit !== 1 ? "s" : ""}`;

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
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Time Limit
                      </h4>
                      <p className="text-gray-700">{timeLimitDisplay}</p>
                    </div>
                  )}
                  {quiz?.passingScore !== undefined && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Passing Score
                      </h4>
                      <p className="text-gray-700">
                        {Math.round(Number(quiz.passingScore)).toLocaleString()}%
                      </p>
                    </div>
                  )}
                  {quiz?.questionsCount !== undefined && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Questions
                      </h4>
                      <p className="text-gray-700">
                        {quiz.questionsCount} question
                        {quiz.questionsCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quiz Description */}
                {quiz?.description && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Quiz Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {quiz.description}
                    </p>
                  </div>
                )}

                {/* General Information */}
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    What to Expect
                  </h3>
                  {quiz?.feedbackMode === "immediate" ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Answer all questions carefully</li>
                      <li>
                        You must do each question in order
                      </li>
                      <li>
                        You will get feedback after each question
                      </li>
                      <li>Your progress will be saved automatically</li>
                      <li>Take your time and read each question thoroughly</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Answer all questions carefully</li>
                      <li>Review your answers before submitting</li>
                      <li>
                        <span className="font-bold text-gray-900">
                          Correct answers will be shown after the whole quiz is
                          completed
                        </span>
                      </li>
                      <li>Your progress will be saved automatically</li>
                      <li>Take your time and read each question thoroughly</li>
                    </ul>
                  )}
                </div>
              </div>

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
                  onClick={handleStartQuiz}
                  disabled={
                    isStartingQuiz ||
                    isStartingHomework ||
                    isStartingBaselineTest ||
                    (isBaselineTest && !baselineTestId)
                  }
                  className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isStartingQuiz ||
                    isStartingHomework ||
                    isStartingBaselineTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : isBaselineTest ? (
                    "Start Baseline Test"
                  ) : isHomework ? (
                    "Start Homework"
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Once quiz is started, pass control to QuizPlayer
  // For homework, use quizId from response; for baseline/regular, use id from params (quizId)
  const finalQuizId = isHomework && quizId ? quizId : id;
  const finalTimeLimit = isHomework ? undefined : timeLimit;

  return (
    <QuizPlayer
      quizId={finalQuizId}
      isTestMode={isTestMode}
      attemptId={attemptId}
      quizAttemptId={quizAttemptId}
      isHomework={isHomework}
      homeworkId={isHomework ? id : undefined}
      isBaselineTest={isBaselineTest}
      baselineTestId={isBaselineTest ? baselineTestId : undefined}
      timeLimit={finalTimeLimit}
      isResuming={isResumingFromStart}
    />
  );
}
