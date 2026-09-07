"use client";

import { useParams } from "next/navigation";
import { QuizReviewPage } from "@/components/platform/quiz/QuizReviewPage";

export default function BaselineReviewPage() {
  const params = useParams();
  return (
    <QuizReviewPage
      mode="tutor"
      source="baseline"
      resourceId={params.attemptId as string}
      studentId={params.id as string}
      backHref="/baseline-results"
      backLabel="Back to Results"
    />
  );
}
