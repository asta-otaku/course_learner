"use client";

import { QuizDataTable } from "@/components/resourceManagemement/quiz/quiz-data-table";

interface QuizPageClientProps {
  quizzes: any[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  canEdit?: boolean;
  onRefresh?: () => void;
}

export function QuizPageClient({
  quizzes,
  onPageChange,
  onPageSizeChange,
  canEdit = true,
  onRefresh,
}: QuizPageClientProps) {
  return (
    <QuizDataTable
      quizzes={quizzes}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      hidePagination={true}
      canEdit={canEdit}
      onRefresh={onRefresh}
    />
  );
}
