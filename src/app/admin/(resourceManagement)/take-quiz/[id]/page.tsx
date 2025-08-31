"use client";

import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/resourceManagemement/quiz/quiz-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useGetQuiz, useGetQuizAttempts } from "@/lib/api/queries";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function TakeQuizPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const isTestMode = searchParams.get("mode") === "test";

  // Use React Query hooks instead of server actions
  const {
    data: quizResponse,
    isLoading: quizLoading,
    error: quizError,
  } = useGetQuiz(id);

  const { data: attemptsResponse, isLoading: attemptsLoading } =
    useGetQuizAttempts(id);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        try {
          const userData = JSON.parse(localStorage.getItem("admin") || "{}");
          if (!userData || !userData.data) {
            router.push("/admin/sign-in");
            return;
          }

          const userRole = userData.data.userRole;
          if (userRole !== "teacher" && userRole !== "admin") {
            router.push("/admin/sign-in");
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error("Error:", error);
          router.push("/admin/sign-in");
          return;
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  if (quizError || !quizResponse?.data) {
    notFound();
  }

  const quiz = quizResponse.data;
  const user = { id: "user-id", role: "teacher" }; // Placeholder for now

  // Check if quiz has questions
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
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

  // Check availability - simplified for now
  const now = new Date();
  const isAvailable = true; // Assume always available for now

  // Get user's attempts
  const attempts = attemptsResponse?.data || [];
  const attemptCount = attempts.length;

  // Check max attempts
  const quizSettings = quiz.settings as { maxAttempts?: number } | null;
  if (quizSettings?.maxAttempts && attemptCount >= quizSettings.maxAttempts) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Maximum Attempts Reached</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have used all {quizSettings.maxAttempts} attempts for this
                quiz.
              </AlertDescription>
            </Alert>

            {attempts.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Your Attempts:</h3>
                <div className="space-y-2">
                  {attempts.map((attempt: any, index: number) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Attempt {index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(attempt.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{attempt.score}%</p>
                        <p className="text-sm text-muted-foreground">
                          {attempt.passed ? "Passed" : "Failed"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

  // Parse settings if it's a JSON type
  const settings =
    typeof quiz.settings === "object" && quiz.settings !== null
      ? (quiz.settings as any)
      : {};

  // Transform the quiz data for the player
  const playerQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? "",
    settings: {
      timeLimit: settings.timeLimit || quiz.time_limit || undefined,
      randomizeQuestions:
        settings.randomizeQuestions ?? quiz.randomize_questions ?? false,
      showCorrectAnswers:
        settings.showCorrectAnswers ?? quiz.show_correct_answers ?? true,
      maxAttempts: settings.maxAttempts ?? quiz.max_attempts ?? 3,
      passingScore: settings.passingScore ?? quiz.passing_score ?? 70,
      examMode: settings.examMode ?? false,
    },
    transitions: quiz.quiz_transitions || [],
    questions: quiz.questions.map((qq: any) => ({
      id: qq.id,
      order: qq.order_index,
      points: qq.points_override || qq.question.points || 1,
      explanation: qq.explanation,
      question: {
        id: qq.question.id,
        title: qq.question.title,
        content: qq.question.content,
        type: qq.question.type,
        // Transform question_answers to options for multiple choice
        options:
          qq.question.type === "multiple_choice" && qq.question.question_answers
            ? qq.question.question_answers
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((answer: any) => ({
                  id: answer.id,
                  text: answer.content,
                  isCorrect: answer.is_correct,
                }))
            : [],
        // For true/false questions
        ...(qq.question.type === "true_false" && {
          options: [
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
        ...(qq.question.type === "matching" && {
          pairs: qq.question.metadata?.matching_pairs || [],
          correctAnswer: qq.question.metadata?.correct_matches || {},
        }),
        // For ordering questions
        ...(qq.question.type === "ordering" && {
          items: qq.question.metadata?.items || [],
          correctOrder: qq.question.metadata?.correct_order || [],
        }),
        // Pass metadata for other question types that might need it
        metadata: qq.question.metadata,
        // Pass correct answer for other types if available
        correctAnswer:
          qq.question.metadata?.correct_answer ||
          qq.question.question_answers?.find((a: any) => a.is_correct)?.id,
      },
    })),
  };

  return (
    <QuizPlayer
      quiz={playerQuiz}
      attemptNumber={attemptCount + 1}
      isTestMode={isTestMode}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
        <p>Checking authorization...</p>
      </div>
    </div>
  );
}
