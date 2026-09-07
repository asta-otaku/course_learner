"use client";

import { useParams } from "next/navigation";
import { QuizReviewPage } from "@/components/platform/quiz/QuizReviewPage";

export default function BaselineReviewPage() {
  const params = useParams();
  return (
    <QuizReviewPage
      mode="student"
      source="baseline"
      resourceId={params.id as string}
      backHref="/baseline-results"
      backLabel="Back to Results"
    />
  );
}
