"use client";

import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetQuiz, useGetQuizQuestions } from "@/lib/api/queries";
import { usePostAttemptQuiz } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "react-toastify";

export default function TakeQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const isTestMode = searchParams.get("mode") === "test";

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

  // Quiz attempt mutation
  const {
    mutate: startQuizAttempt,
    isPending: isStartingQuiz,
    data: attemptResponse,
  } = usePostAttemptQuiz(id);

  // State to track if quiz has been started
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Set attempt count to 5 as requested
  const attemptCount = 5;

  // Handler for starting quiz
  const handleStartQuiz = () => {
    startQuizAttempt(
      { questionId: "" }, // Empty questionId for starting attempt
      {
        onSuccess: (response) => {
          if (response.data?.data) {
            // The response might have different structure, let's handle both cases
            const attemptData = response.data.data as any;
            const attemptIdFromResponse =
              attemptData.id || attemptData.attemptId || attemptData;
            setAttemptId(attemptIdFromResponse);
            setQuizStarted(true);
            toast.success("Quiz started successfully!");
          }
        },
        onError: (error) => {
          console.error("Error starting quiz:", error);
          toast.error("Failed to start quiz. Please try again.");
        },
      }
    );
  };

  if (quizLoading || questionsLoading) {
    return <LoadingSkeleton />;
  }

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

  // Check if quiz has questions
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
              <Link href="/admin/quizzes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show start quiz screen if not started yet
  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {quiz.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Quiz Information:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {questions.length} questions</li>
                {quiz.timeLimit && (
                  <li>• Time limit: {quiz.timeLimit} minutes</li>
                )}
                <li>
                  • Attempt {attemptCount + 1} of {quiz.maxAttempts || 3}
                </li>
                <li>• Passing score: {quiz.passingScore || 70}%</li>
              </ul>
            </div>

            {isTestMode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Test Mode:</strong> You cannot change your answers
                  after submission. Correct answers will only be shown after
                  completing the entire quiz.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/quizzes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quizzes
                </Link>
              </Button>
              <Button
                onClick={handleStartQuiz}
                disabled={isStartingQuiz}
                className="flex-1"
              >
                {isStartingQuiz ? "Starting Quiz..." : "Start Quiz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform the quiz data for the player
  const playerQuiz = {
    id: quiz.id!,
    title: quiz.title,
    description: quiz.description ?? "",
    settings: {
      timeLimit: quiz.timeLimit || undefined,
      randomizeQuestions: quiz.randomizeQuestions ?? false,
      showCorrectAnswers: quiz.showCorrectAnswers ?? true,
      maxAttempts: quiz.maxAttempts ?? 3,
      passingScore:
        typeof quiz.passingScore === "string"
          ? parseInt(quiz.passingScore)
          : (quiz.passingScore ?? 70),
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
      attemptNumber={attemptCount + 1}
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
