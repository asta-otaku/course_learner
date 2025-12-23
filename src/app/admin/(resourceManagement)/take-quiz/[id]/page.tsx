"use client";

import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetQuiz } from "@/lib/api/queries";
import { usePostAttemptQuiz } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "react-toastify";

export default function TakeQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const isTestMode = searchParams.get("mode") === "test";

  // Use React Query hook to get quiz metadata (for pre-quiz screen)
  const {
    data: quizResponse,
    isLoading: quizLoading,
    error: quizError,
  } = useGetQuiz(id);

  // Quiz attempt mutation
  const { mutate: startQuizAttempt, isPending: isStartingQuiz } =
    usePostAttemptQuiz(id);

  // State to track if quiz has been started
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Handler for starting quiz
  const handleStartQuiz = () => {
    startQuizAttempt(
      {}, // Empty object for admin (no childId needed)
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

  // Show loading state while fetching quiz metadata
  if (quizLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (quizError || !quizResponse?.data) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Failed to load quiz. Please try again.
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

  const quiz = quizResponse.data;

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
                {quiz.timeLimit && (
                  <li>• Time limit: {quiz.timeLimit} minutes</li>
                )}
                <li>• Max attempts: {quiz.maxAttempts || 3}</li>
                <li>• Passing score: {quiz.passingScore || 70}%</li>
              </ul>
            </div>

            {isTestMode && (
              <Alert>
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

  // Once quiz is started, pass control to QuizPlayer
  return (
    <QuizPlayer quizId={id} isTestMode={isTestMode} attemptId={attemptId} />
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
