"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { MatchingQuestion } from "./matching-question";
import { FreeTextInput } from "./free-text-input";
import { QuestionImage } from "@/components/ui/question-image";
import { QuizPlayerTimer } from "./quiz-player-timer";
import { QuizPlayerSubmitDialog } from "./quiz-player-submit-dialog";
import { MathPreview } from "../editor/math-preview";
import { cn } from "@/lib/utils";
import {
  getCorrectAnswerText,
  parseQuizFeedbackText,
  parseQuizQuestionSubmitResponse,
  serializeQuizAnswerForApi,
} from "@/lib/utils";
import type {
  ApiResponse,
  Quiz,
  QuizNavigationPosition,
  QuizPlayerQuestion,
  QuizQuestionResult,
  QuizTransition,
} from "@/lib/types";

type QuizAnswers = Record<string, string | Record<string, string>>;
type SubmitQuestion = (
  variables: { questionId: string; answer: string; timeSpent?: number },
  options: {
    onSuccess: (response: ApiResponse<Quiz>) => void;
    onError: () => void;
  },
) => void;

interface QuizPlayerTakingViewProps {
  timeRemaining: number | null;
  currentQuestionIndex: number;
  questions: QuizPlayerQuestion[];
  answeredCount: number;
  progress: number;
  showDistinctQuestionTitleInHeader: boolean;
  questionTitleTrim: string;
  currentPosition: QuizNavigationPosition;
  getTransitionForPosition: (position: number) => QuizTransition | undefined;
  setCurrentPosition: Dispatch<SetStateAction<QuizNavigationPosition>>;
  handleNext: () => void;
  currentQ: QuizPlayerQuestion;
  isTestMode: boolean;
  isImmediateFeedback: boolean;
  quizSettings: { examMode: boolean };
  answers: QuizAnswers;
  handleAnswerChange: (
    questionId: string,
    answer: string | Record<string, string>,
  ) => void;
  showResults: boolean;
  isCurrentQuestionSubmitted: boolean;
  isCurrentQuestionLocked: boolean;
  currentResult: QuizQuestionResult | undefined;
  showCorrectnessForCurrent: boolean;
  answeredQuestions: Set<number>;
  submitQuestion: SubmitQuestion;
  questionStartTimeRef: RefObject<number>;
  setAnsweredOnServer: Dispatch<SetStateAction<Set<string>>>;
  setImmediateQuestionResults: Dispatch<
    SetStateAction<Record<string, QuizQuestionResult>>
  >;
  isSubmittingQuestion: boolean;
  feedbackRef: RefObject<HTMLDivElement | null>;
  handlePrevious: () => void;
  allQuestionsSubmittedInImmediateMode: boolean;
  setShowSubmitDialog: Dispatch<SetStateAction<boolean>>;
  isSubmittingQuiz: boolean;
  isSubmittingHomework: boolean;
  isSubmittingBaselineTest: boolean;
  maxReachedQuestionIndex: number;
  getQuestionResult: (questionId: string) => QuizQuestionResult | undefined;
  handleQuestionNavigation: (index: number) => void;
  questionNavContainerRef: RefObject<HTMLDivElement | null>;
  showSubmitDialog: boolean;
  handleSubmit: () => Promise<void>;
}

export function QuizPlayerTakingView({
  timeRemaining,
  currentQuestionIndex,
  questions,
  answeredCount,
  progress,
  showDistinctQuestionTitleInHeader,
  questionTitleTrim,
  currentPosition,
  getTransitionForPosition,
  setCurrentPosition,
  handleNext,
  currentQ,
  isTestMode,
  isImmediateFeedback,
  quizSettings,
  answers,
  handleAnswerChange,
  showResults,
  isCurrentQuestionSubmitted,
  isCurrentQuestionLocked,
  currentResult,
  showCorrectnessForCurrent,
  answeredQuestions,
  submitQuestion,
  questionStartTimeRef,
  setAnsweredOnServer,
  setImmediateQuestionResults,
  isSubmittingQuestion,
  feedbackRef,
  handlePrevious,
  allQuestionsSubmittedInImmediateMode,
  setShowSubmitDialog,
  isSubmittingQuiz,
  isSubmittingHomework,
  isSubmittingBaselineTest,
  maxReachedQuestionIndex,
  getQuestionResult,
  handleQuestionNavigation,
  questionNavContainerRef,
  showSubmitDialog,
  handleSubmit,
}: QuizPlayerTakingViewProps) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex gap-6">
        {/* Main Quiz Area */}
        <div className="flex-1">
          {/* Header */}
          {timeRemaining !== null && (
            <div className="flex justify-end mb-6">
              <QuizPlayerTimer timeRemaining={timeRemaining} />
            </div>
          )}
          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span>{answeredCount} answered</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>

          {/* Question */}
          <Card>
            {showDistinctQuestionTitleInHeader ? (
              <CardHeader>
                <CardTitle className="text-lg">
                  <MathPreview
                    content={questionTitleTrim}
                    className="text-lg font-medium text-textGray whitespace-pre-wrap"
                    renderMarkdown={true}
                  />
                </CardTitle>
              </CardHeader>
            ) : null}
            <CardContent
              className={showDistinctQuestionTitleInHeader ? undefined : "pt-6"}
            >
              {/* Show content based on current position */}
              {currentPosition.type === "transition" ? (
                (() => {
                  const transition = getTransitionForPosition(
                    currentPosition.questionIndex,
                  );
                  if (!transition) {
                    // If no transition, go to first question
                    setCurrentPosition({ type: "question", questionIndex: 0 });
                    return null;
                  }

                  return (
                    <div className="space-y-4">
                      <Alert className="border-green-200 bg-green-50">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <p className="font-medium text-green-900 mb-2">
                            Information
                          </p>
                          <p className="text-green-800 whitespace-pre-wrap">
                            {transition.content}
                          </p>
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-end">
                        <Button onClick={handleNext}>
                          Continue to Question{" "}
                          {currentPosition.questionIndex + 1}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : currentPosition.type === "explanation" ? (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <p className="font-medium text-blue-900 mb-2">
                        Explanation
                      </p>
                      <p className="text-blue-800 whitespace-pre-wrap">
                        {currentQ.explanation}
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button onClick={() => setShowSubmitDialog(true)}>
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button onClick={handleNext}>
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <MathPreview
                      content={String(currentQ.question.content ?? "")}
                      className="text-base text-textGray whitespace-pre-wrap"
                      renderMarkdown={true}
                    />
                    {(currentQ.question.image ||
                      currentQ.question.image_url) && (
                      <QuestionImage
                        src={
                          currentQ.question.image ||
                          currentQ.question.image_url ||
                          ""
                        }
                        alt="Question illustration"
                        metadata={
                          currentQ.question.imageSettings
                            ? {
                                image_settings: currentQ.question.imageSettings,
                              }
                            : undefined
                        }
                      />
                    )}
                  </div>

                  {/* Test Mode Notice */}
                  {isTestMode && !isImmediateFeedback && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Test Mode:</strong> You cannot change your
                        answers after submission.
                        {quizSettings.examMode && (
                          <>
                            <br />
                            <strong>Exam Mode Active:</strong> Time limits are
                            enforced and you cannot go back to previous
                            questions.
                          </>
                        )}
                        Correct answers will only be shown after completing the
                        entire quiz.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Answer Options */}
                  {(currentQ.question.type === "multiple_choice" ||
                    currentQ.question.type === "true_false") && (
                    <RadioGroup
                      value={
                        typeof answers[currentQ.question.id] === "string"
                          ? (answers[currentQ.question.id] as string)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleAnswerChange(currentQ.question.id, value)
                      }
                      disabled={
                        showResults ||
                        isCurrentQuestionSubmitted ||
                        isCurrentQuestionLocked
                      }
                    >
                      <div className="space-y-3">
                        {currentQ.question.options?.map((option) => {
                          const isSelected =
                            answers[currentQ.question.id] === option.id;
                          const isCorrectOption =
                            currentResult?.correctAnswers?.some(
                              (ans) => ans.id === option.id,
                            ) ?? false;
                          const showCorrectness = showCorrectnessForCurrent;

                          return (
                            <Label
                              key={option.id}
                              htmlFor={option.id}
                              className={cn(
                                "flex items-center space-x-2 p-3 rounded-lg border transition-colors w-full cursor-pointer",
                                !showResults && "hover:bg-muted/50",
                                // Only colour the option the child actually selected.
                                showCorrectness && isSelected && isCorrectOption
                                  ? "bg-green-50 border-green-300"
                                  : showCorrectness && isSelected
                                    ? "bg-red-50 border-red-300"
                                    : showCorrectness
                                      ? "border-gray-200"
                                      : undefined,
                                (showResults || isCurrentQuestionSubmitted) &&
                                  "cursor-default",
                              )}
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={option.id}
                                disabled={
                                  showResults ||
                                  isCurrentQuestionSubmitted ||
                                  isCurrentQuestionLocked
                                }
                              />
                              <span className="flex-1">
                                <MathPreview
                                  content={option.text}
                                  renderMarkdown={true}
                                  className="text-textGray whitespace-pre-wrap"
                                />
                              </span>
                              {showCorrectness &&
                                isSelected &&
                                isCorrectOption && (
                                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                )}
                              {showCorrectness &&
                                isSelected &&
                                !isCorrectOption && (
                                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                )}
                            </Label>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Matching Questions */}
                  {currentQ.question.type === "matching_pairs" &&
                    currentQ.question.pairs && (
                      <>
                        <MatchingQuestion
                          questionId={currentQ.question.id}
                          pairs={currentQ.question.pairs}
                          value={
                            (answers[currentQ.question.id] as Record<
                              string,
                              string
                            >) || {}
                          }
                          onChange={(matches) =>
                            handleAnswerChange(currentQ.question.id, matches)
                          }
                          disabled={
                            showResults ||
                            isCurrentQuestionSubmitted ||
                            isCurrentQuestionLocked
                          }
                        />
                        {isImmediateFeedback &&
                          !isCurrentQuestionSubmitted &&
                          !isCurrentQuestionLocked &&
                          Object.keys(
                            (answers[currentQ.question.id] as Record<
                              string,
                              string
                            >) || {},
                          ).length > 0 && (
                            <Button
                              onClick={() => {
                                const ans = answers[currentQ.question.id];
                                if (ans == null) return;
                                const payload = serializeQuizAnswerForApi(
                                  currentQ,
                                  ans,
                                );
                                const timeSpentSecs = Math.round(
                                  (Date.now() - questionStartTimeRef.current) /
                                    1000,
                                );
                                submitQuestion(
                                  {
                                    questionId: currentQ.question.id,
                                    answer: payload,
                                    timeSpent: timeSpentSecs,
                                  },
                                  {
                                    onSuccess: (res) => {
                                      setAnsweredOnServer((prev) =>
                                        new Set(prev).add(currentQ.question.id),
                                      );
                                      const result =
                                        parseQuizQuestionSubmitResponse(
                                          currentQ.question.id,
                                          res,
                                        );
                                      if (result) {
                                        setImmediateQuestionResults((prev) => ({
                                          ...prev,
                                          [currentQ.question.id]: result,
                                        }));
                                      }
                                    },
                                    onError: () => {
                                      toast.error(
                                        "Failed to submit answer. Please try again.",
                                      );
                                    },
                                  },
                                );
                              }}
                              disabled={isSubmittingQuestion}
                            >
                              {isSubmittingQuestion
                                ? "Submitting..."
                                : "Submit answer"}
                            </Button>
                          )}
                      </>
                    )}

                  {/* Free Text, Short Answer, Long Answer, and Coding Questions */}
                  {(currentQ.question.type === "free_text" ||
                    currentQ.question.type === "short_answer" ||
                    currentQ.question.type === "long_answer" ||
                    currentQ.question.type === "coding") && (
                    <div className="space-y-4">
                      <FreeTextInput
                        questionId={currentQ.question.id}
                        value={(answers[currentQ.question.id] as string) || ""}
                        onChange={(value) =>
                          handleAnswerChange(currentQ.question.id, value)
                        }
                        disabled={
                          showResults ||
                          isCurrentQuestionSubmitted ||
                          isCurrentQuestionLocked ||
                          (isTestMode &&
                            answeredQuestions.has(currentQuestionIndex))
                        }
                        className={
                          showCorrectnessForCurrent && currentResult
                            ? currentResult.isCorrect
                              ? "border-2 border-green-300 bg-green-50"
                              : "border-2 border-red-300 bg-red-50"
                            : undefined
                        }
                        maxLength={
                          currentQ.question.type === "short_answer" ? 500 : 5000
                        }
                        minHeight={
                          currentQ.question.type === "short_answer"
                            ? "50px"
                            : "100px"
                        }
                        placeholder={
                          currentQ.question.type === "coding"
                            ? "Enter your code here..."
                            : currentQ.question.type === "short_answer"
                              ? "Enter a brief answer..."
                              : "Enter your answer here..."
                        }
                      />
                      {isImmediateFeedback &&
                        !isCurrentQuestionSubmitted &&
                        !isCurrentQuestionLocked &&
                        (answers[currentQ.question.id] as string)?.trim() && (
                          <Button
                            onClick={() => {
                              const ans = answers[currentQ.question.id];
                              if (ans == null || typeof ans !== "string")
                                return;
                              const timeSpentSecs = Math.round(
                                (Date.now() - questionStartTimeRef.current) /
                                  1000,
                              );
                              submitQuestion(
                                {
                                  questionId: currentQ.question.id,
                                  answer: ans,
                                  timeSpent: timeSpentSecs,
                                },
                                {
                                  onSuccess: (res) => {
                                    setAnsweredOnServer((prev) =>
                                      new Set(prev).add(currentQ.question.id),
                                    );
                                    const result =
                                      parseQuizQuestionSubmitResponse(
                                        currentQ.question.id,
                                        res,
                                      );
                                    if (result) {
                                      setImmediateQuestionResults((prev) => ({
                                        ...prev,
                                        [currentQ.question.id]: result,
                                      }));
                                    }
                                  },
                                  onError: () => {
                                    toast.error(
                                      "Failed to submit answer. Please try again.",
                                    );
                                  },
                                },
                              );
                            }}
                            disabled={isSubmittingQuestion}
                          >
                            {isSubmittingQuestion
                              ? "Submitting..."
                              : "Submit answer"}
                          </Button>
                        )}
                    </div>
                  )}

                  {/* Immediate feedback: show result, correct answer (if wrong), and feedback for all question types */}
                  {(showResults || showCorrectnessForCurrent) &&
                    currentResult && (
                      <div
                        ref={feedbackRef}
                        className="space-y-4 mt-6 pt-6 border-t"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              currentResult.isCorrect
                                ? "default"
                                : "destructive"
                            }
                            className="flex items-center gap-2"
                          >
                            {currentResult.isCorrect ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Incorrect
                              </>
                            )}
                          </Badge>
                        </div>
                        {!currentResult.isCorrect &&
                          currentResult.correctAnswers?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-2">
                                Correct Answer
                                {currentResult.correctAnswers.length > 1
                                  ? "s"
                                  : ""}
                                :
                              </p>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-300">
                                {currentQ.question.type === "matching_pairs" &&
                                typeof currentResult.correctAnswers[0]
                                  ?.content === "object" ? (
                                  <div className="space-y-2">
                                    {Object.entries(
                                      currentResult.correctAnswers[0]
                                        .content as Record<string, string>,
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
                                        <MathPreview
                                          content={String(right)}
                                          renderMarkdown
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (currentQ.question.type === "free_text" ||
                                    currentQ.question.type === "short_answer" ||
                                    currentQ.question.type === "long_answer" ||
                                    currentQ.question.type === "coding") &&
                                  Array.isArray(currentResult.correctAnswers) &&
                                  currentResult.correctAnswers.length > 0 ? (
                                  <div className="space-y-2">
                                    {currentResult.correctAnswers.map(
                                      (ans: any, index: number) => (
                                        <MathPreview
                                          key={ans.id ?? index}
                                          content={String(
                                            typeof ans.content === "object" &&
                                              ans.content !== null
                                              ? ""
                                              : (ans.content ?? ""),
                                          )}
                                          renderMarkdown={true}
                                          className="text-sm text-green-900 whitespace-pre-wrap"
                                        />
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <MathPreview
                                    content={getCorrectAnswerText(
                                      currentQ,
                                      currentResult,
                                    )}
                                    renderMarkdown={true}
                                    className="text-sm text-green-900 whitespace-pre-wrap"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        {currentResult.feedback && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Feedback:
                            </p>
                            <Alert className="border-amber-200 bg-amber-50">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <AlertDescription>
                                <MathPreview
                                  content={parseQuizFeedbackText(
                                    currentResult.feedback,
                                  )}
                                  className="text-amber-800 whitespace-pre-wrap"
                                  renderMarkdown={true}
                                />
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={
                          ((currentPosition as any).type === "transition" &&
                            (currentPosition as any).questionIndex === 0) ||
                          (currentPosition.type === "question" &&
                            currentQuestionIndex === 0 &&
                            !getTransitionForPosition(0)) ||
                          (quizSettings.examMode && isTestMode)
                        }
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentQuestionIndex === questions.length - 1 ? (
                        <Button
                          onClick={() => {
                            if (
                              isImmediateFeedback &&
                              allQuestionsSubmittedInImmediateMode
                            ) {
                              setShowSubmitDialog(true);
                              return;
                            }
                            // Check if last question has an explanation and user has answered it
                            if (
                              !isImmediateFeedback &&
                              currentQ.explanation &&
                              answers[currentQ.question.id] &&
                              currentPosition.type === "question"
                            ) {
                              handleNext();
                            } else {
                              setShowSubmitDialog(true);
                            }
                          }}
                          disabled={
                            isSubmittingQuiz ||
                            isSubmittingHomework ||
                            isSubmittingBaselineTest
                          }
                        >
                          {isImmediateFeedback &&
                          allQuestionsSubmittedInImmediateMode
                            ? "Finish quiz"
                            : currentQ.explanation &&
                                answers[currentQ.question.id] &&
                                currentPosition.type === "question"
                              ? "Next"
                              : "Submit Quiz"}
                        </Button>
                      ) : (
                        <Button onClick={handleNext}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Navigation Sidebar */}
        <Card className="w-64 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Question Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={questionNavContainerRef}
              className="space-y-2 max-h-[80vh] overflow-y-auto pr-1"
            >
              {/* Initial transition if exists */}
              {getTransitionForPosition(0) && (
                <button
                  onClick={() =>
                    setCurrentPosition({ type: "transition", questionIndex: 0 })
                  }
                  className={cn(
                    "w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                    currentPosition.type === "transition" &&
                      currentPosition.questionIndex === 0
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300",
                  )}
                  data-testid="transition-nav-0"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Introduction</span>
                </button>
              )}

              {questions.map((q, index) => {
                const hasExplanation = !!q.explanation;
                const hasTransitionBefore =
                  index > 0 && !!getTransitionForPosition(index);
                const isAnswered = !!answers[q.question.id];
                const isCurrent =
                  currentPosition.type === "question" &&
                  currentQuestionIndex === index;
                const isCurrentExplanation =
                  currentPosition.type === "explanation" &&
                  currentPosition.questionIndex === index;
                const isDisabled =
                  (isTestMode &&
                    answeredQuestions.has(index) &&
                    index < currentQuestionIndex) ||
                  (isImmediateFeedback && index > maxReachedQuestionIndex);
                const result = showResults
                  ? getQuestionResult(q.question.id)
                  : undefined;

                return (
                  <div key={q.question.id} className="space-y-2">
                    {/* Transition before question (if exists and not first question) */}
                    {hasTransitionBefore && (
                      <button
                        onClick={() =>
                          setCurrentPosition({
                            type: "transition",
                            questionIndex: index,
                          })
                        }
                        className={cn(
                          "w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                          currentPosition.type === "transition" &&
                            currentPosition.questionIndex === index
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300",
                          isDisabled && "opacity-50 cursor-not-allowed",
                        )}
                        disabled={isDisabled}
                        data-testid={`transition-nav-${index}`}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>Information</span>
                      </button>
                    )}

                    {/* Question */}
                    <button
                      onClick={() => handleQuestionNavigation(index)}
                      className={cn(
                        "w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                        isCurrent
                          ? "bg-primaryBlue text-white hover:bg-primaryBlue/90"
                          : showResults && result
                            ? result.isCorrect
                              ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                              : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                            : isAnswered
                              ? "bg-primaryBlue/20 text-primaryBlue hover:bg-primaryBlue/30 border border-primaryBlue/30"
                              : "bg-muted hover:bg-muted/80 border border-muted-foreground/20",
                        isDisabled && "opacity-50 cursor-not-allowed",
                      )}
                      disabled={isDisabled}
                      data-testid={`question-nav-${index + 1}`}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          isCurrent
                            ? "bg-white text-primaryBlue"
                            : showResults && result
                              ? result.isCorrect
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                              : isAnswered
                                ? "bg-primaryBlue text-white"
                                : "bg-muted-foreground/20 text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </div>
                      <span className="truncate flex-1 text-left">
                        Question {index + 1}
                      </span>
                      {showResults && result ? (
                        result.isCorrect ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                        )
                      ) : isAnswered ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      ) : null}
                    </button>

                    {/* Explanation (if exists and question is answered; hidden in immediate feedback mode) */}
                    {!isImmediateFeedback && hasExplanation && isAnswered && (
                      <button
                        onClick={() =>
                          setCurrentPosition({
                            type: "explanation",
                            questionIndex: index,
                          })
                        }
                        className={cn(
                          "w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ml-4",
                          isCurrentExplanation
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300",
                          isDisabled && "opacity-50 cursor-not-allowed",
                        )}
                        disabled={isDisabled}
                        data-testid={`explanation-nav-${index}`}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>Explanation</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>
                  Answered: {answeredCount}/{questions.length}
                </span>
              </div>

              <div className="pt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Navigation Guide:
                </p>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                    <span>Information sections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
                    <span>Explanations (after answering)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary/20 border border-primary/30 rounded" />
                    <span>Answered questions</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 space-y-1 border-t mt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Keyboard Shortcuts:
                </p>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Home
                    </kbd>
                    <span>Go to first</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      End
                    </kbd>
                    <span>Go to last</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      ←
                    </kbd>
                    <span>Previous</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      →
                    </kbd>
                    <span>Next</span>
                  </div>
                </div>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>

      <QuizPlayerSubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onConfirm={handleSubmit}
        isSubmitting={
          isSubmittingQuiz || isSubmittingHomework || isSubmittingBaselineTest
        }
        answeredCount={answeredCount}
        questionsLength={questions.length}
        isTestMode={isTestMode}
      />
    </div>
  );
}
