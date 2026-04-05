/**
 * Whether a lesson counts as fully passed for sidebar / nav checkmarks.
 * Uses API `lessonCompleted`, nested `quizAttempts[].passed`, or aggregate quizzesPassed/total.
 */
export function isLessonFullyPassed(lesson: {
  lessonCompleted?: boolean;
  quizAttempts?: Array<{ passed?: boolean }> | null;
  quizzesPassed?: number;
  totalQuizzes?: number;
  quizzesCount?: number;
}): boolean {
  if (lesson.lessonCompleted) return true;
  const quizzes = lesson.quizAttempts;
  if (Array.isArray(quizzes) && quizzes.length > 0) {
    return quizzes.every((q) => q.passed === true);
  }
  const total =
    typeof lesson.totalQuizzes === "number" && lesson.totalQuizzes > 0
      ? lesson.totalQuizzes
      : typeof lesson.quizzesCount === "number" && lesson.quizzesCount > 0
        ? lesson.quizzesCount
        : 0;
  if (total > 0 && typeof lesson.quizzesPassed === "number") {
    return lesson.quizzesPassed >= total;
  }
  return false;
}
