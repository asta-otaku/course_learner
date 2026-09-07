"use client";

import { useParams } from "next/navigation";
import { QuizReviewPage } from "@/components/platform/quiz/QuizReviewPage";

export default function HomeworkReviewPage() {
  const params = useParams();
  return (
    <QuizReviewPage
      mode="student"
      source="homework"
      resourceId={params.id as string}
      backHref="/homework"
      backLabel="Back to Homework"
    />
  );
}
