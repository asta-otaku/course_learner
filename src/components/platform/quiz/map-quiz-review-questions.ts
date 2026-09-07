import type { QuestionWithResults, QuizResult } from "./quiz-review-types";

export function mapQuizReviewQuestions(
  review: { results?: QuizResult[] } | null | undefined,
  questionsData: any[] | null | undefined,
): QuestionWithResults[] {
  if (!review?.results || !questionsData) return [];

  const questions = [...questionsData].sort(
    (a: { orderIndex: number }, b: { orderIndex: number }) =>
      a.orderIndex - b.orderIndex,
  );

  return questions.map((qq: any) => {
    const result = review.results!.find(
      (r: QuizResult) => r.questionId === qq.question.id,
    );

    return {
      id: qq.id,
      question: {
        id: qq.question.id,
        title: qq.question.title,
        content: qq.question.content,
        type: qq.question.type,
        image: qq.question.image || qq.question.image_url,
        image_url: qq.question.image_url || qq.question.image,
        imageSettings:
          qq.question.imageSettings || qq.question.image_settings,
        explanation: qq.question.explanation,
        metadata: qq.question.metadata,
        options:
          qq.question.type === "multiple_choice" && qq.question.answers
            ? qq.question.answers
                .sort(
                  (a: { orderIndex: number }, b: { orderIndex: number }) =>
                    a.orderIndex - b.orderIndex,
                )
                .map((answer: any) => ({
                  id: answer.id,
                  text: answer.content,
                  isCorrect: answer.isCorrect,
                }))
            : [],
        ...(qq.question.type === "true_false" && {
          options: qq.question.answers
            ? qq.question.answers
                .sort(
                  (a: { orderIndex: number }, b: { orderIndex: number }) =>
                    a.orderIndex - b.orderIndex,
                )
                .map((answer: any) => ({
                  id: answer.id,
                  text: answer.content,
                  isCorrect: answer.isCorrect,
                }))
            : [
                {
                  id: "true",
                  text: "True",
                  isCorrect: qq.question.metadata?.correct_answer === true,
                },
                {
                  id: "false",
                  text: "False",
                  isCorrect: qq.question.metadata?.correct_answer === false,
                },
              ],
        }),
        ...(qq.question.type === "matching_pairs" && {
          pairs: (qq.question.answers?.[0]?.matchingPairs || []).map(
            (pair: { left: string; right: string }, index: number) => ({
              id: `pair-${index}`,
              left: pair.left,
              right: pair.right,
            }),
          ),
        }),
      },
      result,
    };
  });
}

export function isMcTfUserAnswered(
  question: { type?: string } | undefined,
  result: QuizResult | undefined,
): boolean {
  if (
    !question ||
    !result ||
    (question.type !== "multiple_choice" && question.type !== "true_false")
  ) {
    return true;
  }
  if (result.userAnswerId != null && String(result.userAnswerId).trim() !== "") {
    return true;
  }
  const c = result.userAnswerContent;
  if (c == null) return false;
  return String(c).trim() !== "";
}
