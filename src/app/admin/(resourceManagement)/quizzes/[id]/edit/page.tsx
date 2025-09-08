"use client";

import { notFound } from "next/navigation";
import { QuizBuilder } from "@/components/resourceManagemement/quiz/quiz-builder";
import { useParams } from "next/navigation";
import { useGetQuiz, useGetQuizQuestions } from "@/lib/api/queries";

// Prevent automatic revalidation
export const dynamic = "force-dynamic";

export default function EditQuizPage() {
  const params = useParams();
  const id = params.id as string;

  // Use separate hooks for quiz data and questions
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

  // Show loading state
  if (quizLoading || questionsLoading) {
    return <LoadingSkeleton />;
  }

  // Handle errors
  if (quizError || questionsError || !quizResponse?.data) {
    notFound();
  }

  const quiz = quizResponse.data;
  const questions = questionsResponse?.data || [];

  // Transform the data to match the QuizBuilder interface
  const transformedQuiz = {
    id: quiz.id || "",
    title: quiz.title,
    description: quiz.description || "",
    instructions: quiz.instructions || "",
    gradeId: quiz.gradeId || "",
    tags: quiz.tags || [],
    settings: {
      timeLimit: quiz.timeLimit || undefined,
      randomizeQuestions: quiz.randomizeQuestions ?? false,
      showCorrectAnswers: quiz.showCorrectAnswers ?? true,
      maxAttempts: quiz.maxAttempts ?? 1,
      passingScore:
        typeof quiz.passingScore === "string"
          ? parseFloat(quiz.passingScore)
          : (quiz.passingScore ?? 70),
      showFeedback: quiz.showFeedback ?? true,
      allowRetakes: quiz.allowRetakes ?? true,
      allowReview: quiz.allowReview ?? true,
      availableFrom: quiz.availableFrom || "",
      availableUntil: quiz.availableUntil || "",
    },
    status: quiz.status || "draft",
    questions:
      questions
        ?.map((qq: any) => ({
          id: qq.id,
          questionId: qq.question?.id,
          order: qq.orderIndex,
          points: qq.pointsOverride || qq.question?.points || 1,
          required: qq.required,
          question: qq.question
            ? {
                ...qq.question,
                // Transform answers to options format for multiple choice
                options:
                  qq.question.type === "multiple_choice"
                    ? qq.question.answers?.map((ans: any) => ({
                        id: ans.id,
                        text: ans.content,
                        isCorrect: ans.isCorrect,
                        explanation: ans.explanation,
                        order: ans.orderIndex,
                      }))
                    : undefined,
                correctAnswer: qq.question.answers?.find(
                  (ans: any) => ans.isCorrect
                )?.content,
                // Handle matching pairs
                matchingPairs:
                  qq.question.type === "matching_pairs"
                    ? qq.question.answers?.[0]?.matchingPairs
                    : undefined,
              }
            : null,
        }))
        .filter((q: any) => q.question !== null) || [],
    quiz_transitions: (quiz as any).quiz_transitions || [],
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Edit Quiz: {quiz.title}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <QuizBuilder quiz={transformedQuiz} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Skeleton */}
      <div className="border-b px-6 py-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Quiz Builder Skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Panel Skeleton */}
          <div className="w-1/3 border-r bg-gray-50 p-4">
            <div className="space-y-4">
              {/* Quiz Info Section */}
              <div className="space-y-3">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Settings Section */}
              <div className="space-y-3">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-3">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 border rounded-lg bg-white">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel Skeleton */}
          <div className="flex-1 p-4">
            <div className="space-y-4">
              {/* Question Editor Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Question Content */}
              <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>

                {/* Question Options */}
                <div className="space-y-2 pl-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
