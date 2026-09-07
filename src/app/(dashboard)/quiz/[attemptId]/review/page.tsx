"use client";

import { useParams } from "next/navigation";
import { QuizReviewPage } from "@/components/platform/quiz/QuizReviewPage";

export default function QuizAttemptReviewPage() {
  const params = useParams();
  return (
    <QuizReviewPage
      mode="student"
      source="quiz"
      resourceId={params.attemptId as string}
      backLabel="Go Back"
    />
  );
}
