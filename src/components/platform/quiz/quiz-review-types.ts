export type QuizReviewMode = "student" | "tutor";
export type QuizReviewSource = "quiz" | "homework" | "baseline";

export type QuizReviewPageProps = {
  mode: QuizReviewMode;
  source: QuizReviewSource;
  /** attempt id for quiz/baseline; homework id for homework */
  resourceId: string;
  /** unused for fetch today; kept for tutor student-scoped routes */
  studentId?: string;
  /** if omitted, use router.back() */
  backHref?: string;
  backLabel: string;
};

export interface QuizResult {
  id?: string;
  questionId: string;
  userAnswerContent?: string;
  userAnswerId?: string;
  correctAnswers: Array<{
    id: string;
    content: string | Record<string, string>;
  }>;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  /** @deprecated Prefer questionFeedback / tutorFeedback */
  feedback?: string;
  questionFeedback?: string;
  tutorFeedback?: string;
  questionAttemptId?: string;
}

export interface QuestionWithResults {
  id: string;
  // Question shape varies by type (MC, TF, matching, free text); mapped from quiz-questions API.
  question: any;
  result: QuizResult | undefined;
}
