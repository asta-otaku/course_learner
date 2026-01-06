"use client";

import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePostAttemptQuiz, usePostStartHomework } from "@/lib/api/mutations";
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

  // State to track if quiz has been started
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // Handler for starting quiz
  const handleStartQuiz = () => {
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
              setQuizStarted(true);
              toast.success("Homework started successfully!");
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
              setQuizStarted(true);
              toast.success("Quiz started successfully!");
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
                        {typeof quiz.passingScore === "number"
                          ? `${quiz.passingScore}%`
                          : quiz.passingScore}
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
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Answer all questions carefully</li>
                    <li>Review your answers before submitting</li>
                    <li>Correct answers will be shown after completion</li>
                    <li>Your progress will be saved automatically</li>
                    <li>Take your time and read each question thoroughly</li>
                  </ul>
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
                  disabled={isStartingQuiz || isStartingHomework}
                  className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isStartingQuiz || isStartingHomework ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
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
  // For homework, use quizId from response; for regular quizzes, use id from params
  const finalQuizId = isHomework && quizId ? quizId : id;
  // For homework, we need to fetch the quiz data in QuizPlayer since we don't have it here yet
  // For regular quizzes, we can pass the timeLimit directly
  const finalTimeLimit = isHomework ? undefined : timeLimit;

  return (
    <QuizPlayer
      quizId={finalQuizId}
      isTestMode={isTestMode}
      attemptId={attemptId}
      isHomework={isHomework}
      homeworkId={isHomework ? id : undefined}
      timeLimit={finalTimeLimit}
    />
  );
}
