"use client";

import { useParams } from "next/navigation";
import { QuizReviewPage } from "@/components/platform/quiz/QuizReviewPage";

export default function TutorHomeworkReviewPage() {
  const params = useParams();
  return (
    <QuizReviewPage
      mode="tutor"
      source="homework"
      resourceId={params.id as string}
      backHref="/tutor/homework"
      backLabel="Back to Homework"
    />
  );
}
