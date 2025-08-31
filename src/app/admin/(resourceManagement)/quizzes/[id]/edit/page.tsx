"use client";

import { notFound } from "next/navigation";
import { getQuiz } from "@/app/actions/quizzes";
import { QuizBuilder } from "@/components/resourceManagemement/quiz/quiz-builder";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Prevent automatic revalidation
export const dynamic = "force-dynamic";
export const revalidate = false;

interface EditQuizPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditQuizPage({ params }: EditQuizPageProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoadQuiz = async () => {
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

          // Load quiz data
          const { id } = await params;
          const quizData = await getQuiz(id);

          if (!quizData) {
            notFound();
          }

          setQuiz(quizData);
        } catch (error) {
          console.error("Error:", error);
          router.push("/admin/sign-in");
          return;
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuthAndLoadQuiz();
  }, [params, router]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  if (!quiz) {
    return null; // Will redirect in useEffect
  }

  // Transform the data to match the QuizBuilder interface
  const transformedQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description || "",
    settings:
      typeof quiz.settings === "object" && quiz.settings !== null
        ? {
            timeLimit: (quiz.settings as any).timeLimit || undefined,
            randomizeQuestions:
              (quiz.settings as any).randomizeQuestions ?? false,
            showCorrectAnswers:
              (quiz.settings as any).showCorrectAnswers ?? true,
            maxAttempts: (quiz.settings as any).maxAttempts ?? 1,
            passingScore: (quiz.settings as any).passingScore ?? 70,
          }
        : {
            randomizeQuestions: false,
            showCorrectAnswers: true,
            maxAttempts: 1,
            passingScore: 70,
          },
    questions:
      quiz.quiz_questions
        ?.map((qq: any) => ({
          id: qq.id,
          questionId: qq.question?.id,
          order: qq.order_index,
          points: qq.points_override || qq.question?.points || 1,
          required: qq.required,
          question: qq.question
            ? {
                ...qq.question,
                // Transform question_answers to options format for multiple choice
                options:
                  qq.question.type === "multiple_choice"
                    ? qq.question.question_answers?.map((ans: any) => ({
                        id: ans.id,
                        text: ans.content,
                        isCorrect: ans.is_correct,
                        explanation: ans.explanation,
                        order: ans.order_index,
                      }))
                    : undefined,
                correctAnswer: qq.question.question_answers?.find(
                  (ans: any) => ans.is_correct
                )?.content,
              }
            : null,
        }))
        .filter((q: any) => q.question !== null) || [],
    quiz_transitions: quiz.quiz_transitions || [],
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Edit Quiz: {quiz.title}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <QuizBuilder quiz={transformedQuiz} />
      </div>
    </div>
  );
}
