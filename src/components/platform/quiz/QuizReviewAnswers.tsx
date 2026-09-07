"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { MathPreview } from "@/components/resourceManagement/editor/math-preview";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import {
  cn,
  getCorrectAnswerText,
  getQuizUserAnswerDisplayText,
} from "@/lib/utils";
import type { QuizResult } from "./quiz-review-types";

export function QuizReviewAnswers({
  question,
  result,
  answerLabel,
  unansweredMessage,
  mcTfUserAnswered,
}: {
  question: any;
  result: QuizResult;
  answerLabel: string;
  unansweredMessage: string;
  mcTfUserAnswered: boolean;
}) {
  return (
    <>
      <div>
        <p className="text-base font-medium mb-2">{answerLabel}</p>
        {(question.type === "multiple_choice" ||
          question.type === "true_false") &&
        question.options &&
        question.options.length > 0 ? (
          <div className="space-y-3">
            {!mcTfUserAnswered && (
              <Alert className="border-muted bg-muted/40">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{unansweredMessage}</AlertDescription>
              </Alert>
            )}
            {question.options.map((option: { id: string; text?: string; isCorrect?: boolean }) => {
              const selectedId =
                result.userAnswerId || result.userAnswerContent || "";
              const isSelected =
                selectedId !== "" &&
                (selectedId === option.id ||
                  String(option.text ?? "")
                    .trim()
                    .toLowerCase() === String(selectedId).trim().toLowerCase());
              const isCorrectOption =
                (result.correctAnswers?.some((ans) => ans.id === option.id) ??
                  false) ||
                option.isCorrect === true;

              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2",
                    isSelected && isCorrectOption
                      ? "bg-green-50 border-green-300"
                      : isSelected
                        ? "bg-red-50 border-red-300"
                        : "border-gray-200",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <MathPreview
                      content={String(option.text ?? "")}
                      className="text-base text-textGray whitespace-pre-wrap"
                      renderMarkdown={true}
                    />
                  </div>
                  {isSelected && isCorrectOption ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : isSelected ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : question.type === "matching_pairs" ? (
          result.userAnswerContent ? (
            <div className="p-4 bg-gray-50 rounded-lg border">
              {(() => {
                try {
                  const userMatches = JSON.parse(
                    result.userAnswerContent as string,
                  ) as Record<string, string>;
                  const ca0 = result.correctAnswers[0];
                  const correctMatches =
                    ca0 && typeof ca0.content === "object"
                      ? (ca0.content as Record<string, string>)
                      : {};

                  return (
                    <div className="space-y-2">
                      {Object.entries(userMatches).map(
                        ([leftText, rightText]) => {
                          const correctRightText = correctMatches[leftText];
                          const isMatchCorrect = correctRightText === rightText;

                          return (
                            <div
                              key={leftText}
                              className={cn(
                                "p-3 rounded-lg border-2",
                                isMatchCorrect
                                  ? "bg-green-50 border-green-300"
                                  : "bg-red-50 border-red-300",
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex-1 min-w-0 flex items-center gap-1 flex-wrap">
                                  <MathPreview
                                    content={String(leftText)}
                                    renderMarkdown
                                    className="font-medium"
                                  />
                                  <span>→</span>
                                  <MathPreview
                                    content={String(rightText)}
                                    renderMarkdown
                                  />
                                </div>
                                {isMatchCorrect ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  );
                } catch {
                  return (
                    <MathPreview
                      content={String(result.userAnswerContent ?? "")}
                      renderMarkdown={true}
                      className="text-base text-textGray whitespace-pre-wrap"
                    />
                  );
                }
              })()}
            </div>
          ) : (
            <Alert className="border-muted bg-muted/40">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{unansweredMessage}</AlertDescription>
            </Alert>
          )
        ) : (
          <div
            className={cn(
              "p-4 rounded-lg border-2",
              result.userAnswerContent != null &&
                String(result.userAnswerContent).trim() !== ""
                ? result.isCorrect
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
                : "bg-muted/30 border-muted",
            )}
          >
            {result.userAnswerContent != null &&
            String(result.userAnswerContent).trim() !== "" ? (
              <MathPreview
                content={String(
                  getQuizUserAnswerDisplayText(question, result) ||
                    result.userAnswerContent ||
                    "",
                )}
                className="text-base text-textGray whitespace-pre-wrap"
                renderMarkdown={true}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{unansweredMessage}</p>
            )}
          </div>
        )}
      </div>

      {(!result.isCorrect ||
        question.type === "free_text" ||
        question.type === "short_answer" ||
        question.type === "long_answer" ||
        question.type === "coding") && (
        <div>
          <p className="text-base font-medium mb-2 text-green-700">
            Correct Answer:
          </p>
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
            {question.type === "matching_pairs" &&
            result.correctAnswers[0] &&
            typeof result.correctAnswers[0].content === "object" ? (
              <div className="space-y-2">
                {Object.entries(
                  result.correctAnswers[0].content as Record<string, string>,
                ).map(([left, right]) => (
                  <div
                    key={left}
                    className="p-2 bg-white rounded border border-green-200 flex items-center gap-1 flex-wrap"
                  >
                    <MathPreview
                      content={String(left)}
                      renderMarkdown
                      className="font-medium"
                    />
                    <span>→</span>
                    <MathPreview content={String(right)} renderMarkdown />
                  </div>
                ))}
              </div>
            ) : (
              question.type === "free_text" ||
              question.type === "short_answer" ||
              question.type === "long_answer" ||
              question.type === "coding"
            ) &&
            Array.isArray(result.correctAnswers) &&
            result.correctAnswers.length > 0 ? (
              <div className="space-y-2">
                {result.correctAnswers.map((ans, index) => (
                  <MathPreview
                    key={ans.id ?? index}
                    content={String(
                      typeof ans.content === "object" && ans.content !== null
                        ? ""
                        : (ans.content ?? ""),
                    )}
                    renderMarkdown={true}
                    className="text-base text-green-900 whitespace-pre-wrap"
                  />
                ))}
              </div>
            ) : (
              <MathPreview
                content={getCorrectAnswerText(question, result as never)}
                renderMarkdown={true}
                className="text-base text-green-900 whitespace-pre-wrap"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
