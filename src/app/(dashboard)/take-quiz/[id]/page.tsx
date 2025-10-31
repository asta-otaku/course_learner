"use client";

import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, ArrowLeft, FileQuestion, Award } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetQuizQuestions } from "@/lib/api/queries";
import { usePostAttemptQuiz } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "react-toastify";
import { useProfile } from "@/context/profileContext";

export default function TakeQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { activeProfile } = useProfile();
  const id = params.id as string;
  const isTestMode = searchParams.get("mode") === "test";

  const {
    data: questionsResponse,
    isLoading: questionsLoading,
    error: questionsError,
  } = useGetQuizQuestions(id);

  // Quiz attempt mutation
  const { mutate: startQuizAttempt, isPending: isStartingQuiz } =
    usePostAttemptQuiz(id);

  // State to track if quiz has been started
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Set attempt count to 5 as requested
  const attemptCount = 5;

  // Handler for starting quiz
  const handleStartQuiz = () => {
    startQuizAttempt(
      { childId: activeProfile?.id || "" },
      {
        onSuccess: (response) => {
          // The response structure is ApiResponse<QuizAttempt>
          // Extract attemptId from response.data.id
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
  };

  // Show loading state while fetching questions
  if (questionsLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (questionsError || !questionsResponse?.data) {
    notFound();
  }

  const questions = questionsResponse.data;

  // If quiz hasn't been started, show the pre-quiz UI
  if (!quizStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-3xl w-full mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Quiz
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Ready to test your knowledge?
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Quiz Information */}
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questions && questions.length > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <FileQuestion className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Questions</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {questions.length}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <Award className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Points Available</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {questions
                          ? questions.reduce(
                              (total: number, qq: any) =>
                                total +
                                (qq.pointsOverride || qq.question?.points || 1),
                              0
                            )
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>

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
                <Button variant="outline" asChild className="min-w-[120px]">
                  <Link href="/videos-quiz">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Link>
                </Button>
                <Button
                  onClick={handleStartQuiz}
                  disabled={isStartingQuiz}
                  className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isStartingQuiz ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
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

  // Check if quiz has questions (only show this after quiz is started)
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Not Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This quiz doesn't have any questions yet.
              </AlertDescription>
            </Alert>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform the quiz data for the player
  // Get quiz title from first question if available, otherwise use default
  const quizTitle =
    questions?.[0]?.question?.title ||
    questions?.[0]?.question?.content ||
    "Quiz";

  const playerQuiz = {
    id: id,
    title: quizTitle,
    description: "",
    settings: {
      timeLimit: undefined,
      randomizeQuestions: false,
      showCorrectAnswers: true,
      maxAttempts: 3,
      passingScore: 70,
      examMode: false,
    },
    transitions: [],
    questions: questions
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      .map((qq: any) => ({
        id: qq.id,
        order: qq.orderIndex,
        points: qq.pointsOverride || qq.question.points || 1,
        explanation: qq.question.explanation,
        question: {
          id: qq.question.id,
          title: qq.question.title,
          content: qq.question.content,
          type: qq.question.type,
          // Transform answers to options for multiple choice
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
          // For true/false questions
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
          // For matching questions
          ...(qq.question.type === "matching_pairs" && {
            pairs: (qq.question.answers?.[0]?.matchingPairs || []).map(
              (pair: any, index: number) => ({
                id: `pair-${index}`,
                left: pair.left,
                right: pair.right,
              })
            ),
            correctAnswer: qq.question.answers?.[0]?.matchingPairs || [],
          }),
          // For free text questions
          ...(qq.question.type === "free_text" && {
            correctAnswers:
              qq.question.answers?.map((answer: any) => answer.content) || [],
          }),
          // Pass metadata for other question types that might need it
          metadata: qq.question.metadata,
          // Pass correct answer for other types if available
          correctAnswer:
            qq.question.metadata?.correct_answer ||
            qq.question.answers?.find((a: any) => a.isCorrect)?.id,
        },
      })),
  };

  return (
    <QuizPlayer
      quiz={playerQuiz}
      isTestMode={isTestMode}
      attemptId={attemptId}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
        <p>Loading quiz...</p>
      </div>
    </div>
  );
}
