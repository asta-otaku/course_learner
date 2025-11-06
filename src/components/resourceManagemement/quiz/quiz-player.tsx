"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import { usePostSubmitQuiz } from "@/lib/api/mutations";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  ChevronFirst,
  ChevronLast,
  XCircle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchingQuestion } from "./matching-question";
import { FreeTextInput } from "./free-text-input";

interface QuizQuestion {
  id: string;
  order: number;
  explanation?: string;
  correct_feedback?: string;
  incorrect_feedback?: string;
  question: {
    id: string;
    title: string;
    content: string;
    type: string;
    image_url?: string;
    options?: Array<{ id: string; text: string }>;
    pairs?: Array<{ id: string; left: string; right: string }>;
    correctAnswer?: string | Record<string, string>;
  };
}

interface QuizTransition {
  id: string;
  position: number;
  content: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  settings: {
    timeLimit?: number;
    randomizeQuestions: boolean;
    showCorrectAnswers: boolean;
    maxAttempts: number;
    passingScore: number;
    examMode?: boolean;
  };
  questions: QuizQuestion[];
  transitions: QuizTransition[];
}

interface QuizPlayerProps {
  quiz: Quiz;
  attemptNumber?: number;
  isTestMode?: boolean;
  attemptId?: string | null;
}

interface QuizResult {
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
}

interface SubmissionResults {
  attemptId: string;
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  results: QuizResult[];
  timeSpent: number;
}

type NavigationPosition = {
  type: "transition" | "question" | "explanation";
  questionIndex: number; // For question and explanation, this is the question index. For transition, it's the position.
};

export function QuizPlayer({
  quiz,
  isTestMode = false,
  attemptId,
}: QuizPlayerProps) {
  const router = useRouter();
  const [currentPosition, setCurrentPosition] = useState<NavigationPosition>({
    type: "question",
    questionIndex: 0,
  });
  const [answers, setAnswers] = useState<
    Record<string, string | Record<string, string>>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  );
  const [submissionResults, setSubmissionResults] =
    useState<SubmissionResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Submit quiz mutation
  const { mutate: submitQuiz, isPending: isSubmittingQuiz } = usePostSubmitQuiz(
    quiz.id,
    attemptId || ""
  );

  // Get transition for a specific position (0-based, so position 1 means before question 1, etc.)
  const getTransitionForPosition = (position: number) => {
    return quiz.transitions.find((t) => t.position === position);
  };

  // Get the actual question index being shown (for display purposes)
  const getCurrentQuestionIndex = () => {
    if (
      currentPosition.type === "question" ||
      currentPosition.type === "explanation"
    ) {
      return currentPosition.questionIndex;
    }
    // For transitions, show the next question index if it's before a question
    return currentPosition.questionIndex;
  };

  // Initialize questions (with randomization if enabled)
  useEffect(() => {
    let orderedQuestions = [...quiz.questions];

    if (quiz.settings.randomizeQuestions) {
      orderedQuestions = orderedQuestions.sort(() => Math.random() - 0.5);
    }

    setQuestions(orderedQuestions);

    // Check if there's a transition at the very beginning (position 0)
    const initialTransition = getTransitionForPosition(0);
    if (initialTransition) {
      setCurrentPosition({ type: "transition", questionIndex: 0 });
    }
  }, [quiz]);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`quiz-progress-${quiz.id}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setAnswers(progress.answers || {});
        if (progress.currentPosition) {
          setCurrentPosition(progress.currentPosition);
        } else if (progress.currentQuestion !== undefined) {
          // Legacy support
          setCurrentPosition({
            type: "question",
            questionIndex: progress.currentQuestion,
          });
        }
        if (progress.timeRemaining && quiz.settings.timeLimit) {
          setTimeRemaining(progress.timeRemaining);
        }
      } catch (error) {
        console.error("Error loading saved progress:", error);
      }
    } else if (quiz.settings.timeLimit) {
      setTimeRemaining(quiz.settings.timeLimit * 60); // Convert minutes to seconds
    }

    // In test mode or exam mode, always use time limit if specified
    if (
      (isTestMode || quiz.settings.examMode) &&
      quiz.settings.timeLimit &&
      !savedProgress
    ) {
      setTimeRemaining(quiz.settings.timeLimit * 60);
    }
  }, [quiz]);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    const progress = {
      answers,
      currentPosition,
      timeRemaining,
      lastSaved: Date.now(),
    };
    localStorage.setItem(`quiz-progress-${quiz.id}`, JSON.stringify(progress));
  }, [quiz.id, answers, currentPosition, timeRemaining]);

  // Auto-save progress
  useEffect(() => {
    saveProgress();
  }, [answers, currentPosition, saveProgress]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Prevent navigation with unsaved answers
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0 && !isSubmittingQuiz) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, isSubmittingQuiz]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "Home":
          e.preventDefault();
          handleFirst();
          break;
        case "End":
          e.preventDefault();
          handleLast();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPosition, answers, questions, isTestMode, quiz.settings.examMode]);

  const handleTimeUp = async () => {
    toast.error("Time's up! Your quiz has been automatically submitted.");
    setShowSubmitDialog(false);
    await handleSubmit();
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string | Record<string, string>
  ) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: answer,
      };
      return newAnswers;
    });
  };

  const handleNext = () => {
    const currentQuestionIndex = getCurrentQuestionIndex();

    // If we're on a transition, move to the question
    if (currentPosition.type === "transition") {
      setCurrentPosition({
        type: "question",
        questionIndex: currentPosition.questionIndex,
      });
      return;
    }

    // If we're on a question
    if (currentPosition.type === "question") {
      const currentQ = questions[currentQuestionIndex];

      // Check if this question has an explanation and user has answered it
      if (currentQ.explanation && answers[currentQ.question.id]) {
        setCurrentPosition({
          type: "explanation",
          questionIndex: currentQuestionIndex,
        });
        return;
      }

      // Check if we're at the last question
      if (currentQuestionIndex >= questions.length - 1) {
        return; // Can't go further
      }

      // Check if there's a transition before the next question
      const nextQuestionIndex = currentQuestionIndex + 1;
      const transition = getTransitionForPosition(nextQuestionIndex);
      if (transition) {
        setCurrentPosition({
          type: "transition",
          questionIndex: nextQuestionIndex,
        });
        return;
      }

      // Otherwise, go to the next question
      // In test mode, mark this question as answered (can't go back)
      if (isTestMode && answers[currentQ.question.id]) {
        setAnsweredQuestions((prev) => new Set(prev).add(currentQuestionIndex));
      }
      setCurrentPosition({
        type: "question",
        questionIndex: nextQuestionIndex,
      });
      return;
    }

    // If we're on an explanation
    if (currentPosition.type === "explanation") {
      // Check if we're at the last question
      if (currentQuestionIndex >= questions.length - 1) {
        setShowSubmitDialog(true);
        return;
      }

      // Check if there's a transition before the next question
      const nextQuestionIndex = currentQuestionIndex + 1;
      const transition = getTransitionForPosition(nextQuestionIndex);
      if (transition) {
        // In test mode, mark this question as answered (can't go back)
        if (
          isTestMode &&
          answers[questions[currentQuestionIndex].question.id]
        ) {
          setAnsweredQuestions((prev) =>
            new Set(prev).add(currentQuestionIndex)
          );
        }
        setCurrentPosition({
          type: "transition",
          questionIndex: nextQuestionIndex,
        });
        return;
      }

      // Otherwise, go to the next question
      // In test mode, mark this question as answered (can't go back)
      if (isTestMode && answers[questions[currentQuestionIndex].question.id]) {
        setAnsweredQuestions((prev) => new Set(prev).add(currentQuestionIndex));
      }
      setCurrentPosition({
        type: "question",
        questionIndex: nextQuestionIndex,
      });
    }
  };

  const handleFirst = () => {
    // In exam mode, don't allow going back
    if (quiz.settings.examMode && isTestMode) {
      return;
    }

    // Check if there's an initial transition
    const initialTransition = getTransitionForPosition(0);
    if (initialTransition) {
      setCurrentPosition({ type: "transition", questionIndex: 0 });
    } else {
      // Otherwise go to first question
      setCurrentPosition({ type: "question", questionIndex: 0 });
    }
  };

  const handleLast = () => {
    const lastQuestionIndex = questions.length - 1;
    const lastQuestion = questions[lastQuestionIndex];

    // If last question has an explanation and user has answered it, go to explanation
    if (lastQuestion.explanation && answers[lastQuestion.question.id]) {
      setCurrentPosition({
        type: "explanation",
        questionIndex: lastQuestionIndex,
      });
    } else {
      // Otherwise go to last question
      setCurrentPosition({
        type: "question",
        questionIndex: lastQuestionIndex,
      });
    }
  };

  const handlePrevious = () => {
    // In exam mode, don't allow going back
    if (quiz.settings.examMode && isTestMode) {
      return;
    }

    const currentQuestionIndex = getCurrentQuestionIndex();

    // If we're on an explanation, go back to the question
    if (currentPosition.type === "explanation") {
      setCurrentPosition({
        type: "question",
        questionIndex: currentQuestionIndex,
      });
      return;
    }

    // If we're on a question
    if (currentPosition.type === "question") {
      // Can't go back from the first question unless there's an initial transition
      if (currentQuestionIndex === 0) {
        const initialTransition = getTransitionForPosition(0);
        if (initialTransition) {
          setCurrentPosition({ type: "transition", questionIndex: 0 });
        }
        return;
      }

      // Check if previous question has an explanation
      const prevQuestionIndex = currentQuestionIndex - 1;
      const prevQuestion = questions[prevQuestionIndex];

      // In test mode, check if we can go back
      if (isTestMode && answeredQuestions.has(prevQuestionIndex)) {
        return;
      }

      if (prevQuestion.explanation && answers[prevQuestion.question.id]) {
        setCurrentPosition({
          type: "explanation",
          questionIndex: prevQuestionIndex,
        });
        return;
      }

      // Check if there's a transition before current question
      const transition = getTransitionForPosition(currentQuestionIndex);
      if (transition) {
        setCurrentPosition({
          type: "transition",
          questionIndex: currentQuestionIndex,
        });
        return;
      }

      // Otherwise, go to previous question
      setCurrentPosition({
        type: "question",
        questionIndex: prevQuestionIndex,
      });
      return;
    }

    // If we're on a transition
    if (currentPosition.type === "transition") {
      // If this is the initial transition (position 0), can't go back
      if (currentPosition.questionIndex === 0) {
        return;
      }

      // Go to the previous question
      const prevQuestionIndex = currentPosition.questionIndex - 1;
      const prevQuestion = questions[prevQuestionIndex];

      // In test mode, check if we can go back
      if (isTestMode && answeredQuestions.has(prevQuestionIndex)) {
        return;
      }

      // Check if previous question has an explanation
      if (prevQuestion.explanation && answers[prevQuestion.question.id]) {
        setCurrentPosition({
          type: "explanation",
          questionIndex: prevQuestionIndex,
        });
        return;
      }

      // Otherwise, go to previous question
      setCurrentPosition({
        type: "question",
        questionIndex: prevQuestionIndex,
      });
    }
  };

  const handleQuestionNavigation = (index: number) => {
    // In test mode, only allow navigation to unanswered questions or current/future questions
    if (
      isTestMode &&
      answeredQuestions.has(index) &&
      index < getCurrentQuestionIndex()
    ) {
      return;
    }

    // In exam mode, only allow forward navigation
    if (
      quiz.settings.examMode &&
      isTestMode &&
      index < getCurrentQuestionIndex()
    ) {
      return;
    }

    // Navigate directly to the question (not explanation or transition)
    setCurrentPosition({ type: "question", questionIndex: index });
  };

  const validateSubmission = () => {
    const unansweredQuestions = questions.filter(
      (q) => !answers[q.question.id]
    );
    const unansweredCount = unansweredQuestions.length;

    // Remove the validation that prevents submission with unanswered questions
    // Users should be able to submit even with unanswered questions
    return true;
  };

  const handleSubmit = async () => {
    if (!validateSubmission()) {
      return;
    }

    if (!attemptId) {
      toast.error("No attempt ID found. Please restart the quiz.");
      return;
    }

    // Prepare answers for submission
    // Convert true/false option IDs to "true" or "false" text
    const submissionAnswers: Record<string, string | Record<string, string>> =
      {};
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = questions.find((q) => q.question.id === questionId);

      // For true/false questions, convert option ID to lowercase text
      if (
        question?.question.type === "true_false" &&
        typeof answer === "string"
      ) {
        const option = question.question.options?.find(
          (opt) => opt.id === answer
        );
        if (option) {
          // Convert option text to lowercase ("True" -> "true", "False" -> "false")
          submissionAnswers[questionId] = option.text.toLowerCase();
        } else {
          submissionAnswers[questionId] = answer;
        }
      } else {
        // For other question types, keep the answer as is
        submissionAnswers[questionId] = answer;
      }
    }

    const submissionData: {
      answers: Record<string, string | Record<string, string>>;
    } = {
      answers: submissionAnswers,
    };

    // Clear saved progress before submission
    localStorage.removeItem(`quiz-progress-${quiz.id}`);

    submitQuiz(submissionData, {
      onSuccess: (response) => {
        // Store results and show results view
        const resultData = response.data?.data as any;
        if (resultData) {
          setSubmissionResults({
            attemptId: resultData.attemptId || attemptId || "",
            quizId: resultData.quizId || quiz.id,
            score: resultData.score || 0,
            totalPoints: resultData.totalPoints || 0,
            percentage: resultData.percentage || 0,
            results: resultData.results || [],
            timeSpent: resultData.timeSpent || 0,
          });
          setShowResults(true);
          setCurrentPosition({ type: "question", questionIndex: 0 });
          toast.success("Quiz submitted successfully!");
        } else {
          // Fallback: redirect if no results data
          const resultAttemptId =
            resultData?.id ||
            resultData?.attemptId ||
            resultData ||
            attemptId ||
            "";
          router.push(`/quiz-results/${resultAttemptId}`);
        }
      },
      onError: (error) => {
        console.error("Error submitting quiz:", error);
        toast.error("Failed to submit quiz. Please try again.");
      },
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getQuestionStatus = (questionId: string) => {
    const answer = answers[questionId];
    if (!answer) return "unanswered";

    // For matching questions, check if at least one match is made
    if (typeof answer === "object" && !Array.isArray(answer)) {
      return Object.keys(answer).length > 0 ? "answered" : "unanswered";
    }

    return "answered";
  };

  const answeredCount = Object.entries(answers).filter(([_, answer]) => {
    if (!answer) return false;
    if (typeof answer === "object" && !Array.isArray(answer)) {
      return Object.keys(answer).length > 0;
    }
    return true;
  }).length;
  const progress = (answeredCount / questions.length) * 100;

  // Get result for a specific question
  const getQuestionResult = (questionId: string): QuizResult | undefined => {
    if (!submissionResults) return undefined;
    return submissionResults.results.find((r) => r.questionId === questionId);
  };

  // Get correct answer text for display
  const getCorrectAnswerText = (
    question: QuizQuestion,
    result: QuizResult
  ): string => {
    if (result.correctAnswers.length === 0) return "No correct answer";

    // For matching questions, format the object
    if (
      question.question.type === "matching_pairs" &&
      typeof result.correctAnswers[0].content === "object"
    ) {
      const matches = result.correctAnswers[0].content as Record<
        string,
        string
      >;
      return Object.entries(matches)
        .map(([left, right]) => `${left} → ${right}`)
        .join("\n");
    }

    // For multiple choice/true-false, find the option text
    if (
      (question.question.type === "multiple_choice" ||
        question.question.type === "true_false") &&
      question.question.options
    ) {
      const correctAnswer = result.correctAnswers[0];
      const option = question.question.options.find(
        (opt) => opt.id === correctAnswer.id
      );
      return option?.text || correctAnswer.content.toString();
    }

    // For free text, return the content
    return result.correctAnswers
      .map((ans) => ans.content.toString())
      .join(" or ");
  };

  if (questions.length === 0) {
    return <div>Loading quiz...</div>;
  }

  const currentQuestionIndex = getCurrentQuestionIndex();
  const currentQ = questions[currentQuestionIndex] || questions[0]; // Fallback for edge cases
  const currentResult = showResults
    ? getQuestionResult(currentQ.question.id)
    : undefined;

  // Results Summary View
  if (showResults && submissionResults) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Main Results Area */}
          <div className="flex-1">
            {/* Results Summary Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>Quiz Results: {quiz.title}</CardTitle>
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {quiz.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/videos-quiz")}
                  >
                    Back to Quizzes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Trophy className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Score</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {submissionResults.score}/
                        {submissionResults.totalPoints}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Percentage
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {submissionResults.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">
                        Time Spent
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatTime(submissionResults.timeSpent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">
                        Correct Answers
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        {
                          submissionResults.results.filter((r) => r.isCorrect)
                            .length
                        }
                        /{submissionResults.results.length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Question with Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  {currentResult && (
                    <Badge
                      variant={
                        currentResult.isCorrect ? "default" : "destructive"
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
                      <span className="ml-2">
                        {currentResult.pointsEarned}/
                        {currentResult.pointsPossible} points
                      </span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Question Content */}
                  <div>
                    <p className="text-base font-medium mb-2">Question:</p>
                    <p className="text-base whitespace-pre-wrap">
                      {currentQ.question.content}
                    </p>
                    {currentQ.question.image_url && (
                      <div className="mt-4">
                        <img
                          src={currentQ.question.image_url}
                          alt="Question illustration"
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* User's Answer */}
                  {currentResult && (
                    <div>
                      <p className="text-base font-medium mb-2">Your Answer:</p>
                      {currentQ.question.type === "matching_pairs" &&
                      currentResult.userAnswerContent ? (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          {(() => {
                            try {
                              const userMatches = JSON.parse(
                                currentResult.userAnswerContent
                              ) as Record<string, string>;
                              const correctMatches =
                                typeof currentResult.correctAnswers[0]
                                  .content === "object"
                                  ? (currentResult.correctAnswers[0]
                                      .content as Record<string, string>)
                                  : {};

                              return (
                                <div className="space-y-2">
                                  {Object.entries(userMatches).map(
                                    ([leftText, rightText]) => {
                                      // Find the pair that matches the left text
                                      const leftPair =
                                        currentQ.question.pairs?.find(
                                          (p) => p.left === leftText
                                        );
                                      // Find the pair that matches the right text
                                      const rightPair =
                                        currentQ.question.pairs?.find(
                                          (p) => p.right === rightText
                                        );
                                      // Check if this match is correct
                                      const correctRightText =
                                        correctMatches[leftText];
                                      const isMatchCorrect =
                                        correctRightText === rightText;

                                      return (
                                        <div
                                          key={leftText}
                                          className={cn(
                                            "p-3 rounded-lg border-2",
                                            isMatchCorrect
                                              ? "bg-green-50 border-green-300"
                                              : "bg-red-50 border-red-300"
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                              {leftText} →
                                            </span>
                                            <span>{rightText}</span>
                                            {isMatchCorrect ? (
                                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              );
                            } catch {
                              return (
                                <p className="text-sm text-gray-600">
                                  {currentResult.userAnswerContent}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "p-4 rounded-lg border-2",
                            currentResult.isCorrect
                              ? "bg-green-50 border-green-300"
                              : "bg-red-50 border-red-300"
                          )}
                        >
                          <p className="text-base">
                            {currentQ.question.type === "multiple_choice" ||
                            currentQ.question.type === "true_false"
                              ? currentQ.question.options?.find(
                                  (opt) =>
                                    opt.id ===
                                    (currentResult.userAnswerId ||
                                      currentResult.userAnswerContent)
                                )?.text || currentResult.userAnswerContent
                              : currentResult.userAnswerContent || "No answer"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correct Answer */}
                  {currentResult && !currentResult.isCorrect && (
                    <div>
                      <p className="text-base font-medium mb-2 text-green-700">
                        Correct Answer:
                      </p>
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        {currentQ.question.type === "matching_pairs" &&
                        typeof currentResult.correctAnswers[0].content ===
                          "object" ? (
                          <div className="space-y-2">
                            {Object.entries(
                              currentResult.correctAnswers[0].content as Record<
                                string,
                                string
                              >
                            ).map(([left, right]) => (
                              <div
                                key={left}
                                className="p-2 bg-white rounded border border-green-200"
                              >
                                <span className="font-medium">{left}</span> →{" "}
                                <span>{right}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base text-green-900 whitespace-pre-wrap">
                            {getCorrectAnswerText(currentQ, currentResult)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Explanation if available */}
                  {currentQ.explanation && (
                    <div>
                      <p className="text-base font-medium mb-2">Explanation:</p>
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <p className="text-blue-800 whitespace-pre-wrap">
                            {currentQ.explanation}
                          </p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentQuestionIndex >= questions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Navigation Sidebar */}
          <Card className="w-64 h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Question Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((q, index) => {
                  const result = getQuestionResult(q.question.id);
                  const isCurrent = currentQuestionIndex === index;

                  return (
                    <button
                      key={q.question.id}
                      onClick={() =>
                        setCurrentPosition({
                          type: "question",
                          questionIndex: index,
                        })
                      }
                      className={cn(
                        "w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                        isCurrent
                          ? "bg-primaryBlue text-white hover:bg-primaryBlue/90"
                          : result?.isCorrect
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                            : result
                              ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          isCurrent
                            ? "bg-white text-primaryBlue"
                            : result?.isCorrect
                              ? "bg-green-600 text-white"
                              : result
                                ? "bg-red-600 text-white"
                                : "bg-gray-400 text-white"
                        )}
                      >
                        {index + 1}
                      </div>
                      <span className="truncate flex-1 text-left">
                        Question {index + 1}
                      </span>
                      {result?.isCorrect ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      ) : result ? (
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex gap-6">
        {/* Main Quiz Area */}
        <div className="flex-1">
          {/* Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle>{quiz.title}</CardTitle>
                    {isTestMode && (
                      <Badge variant="destructive">TEST MODE</Badge>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {quiz.description}
                    </p>
                  )}
                </div>
                {timeRemaining !== null && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">
                      Time remaining: {formatTime(timeRemaining)}
                    </span>
                    {timeRemaining <= 300 && (
                      <Badge variant="destructive">5 minutes remaining!</Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

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
            <CardHeader>
              <CardTitle className="text-lg">
                {currentPosition.type === "transition"
                  ? currentPosition.questionIndex === 0
                    ? "Quiz Introduction"
                    : "Information"
                  : currentPosition.type === "explanation"
                    ? `${currentQ.question.title} - Explanation`
                    : currentQ.question.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Show content based on current position */}
              {currentPosition.type === "transition" ? (
                (() => {
                  const transition = getTransitionForPosition(
                    currentPosition.questionIndex
                  );
                  if (!transition) return null;

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
                    <p className="text-base whitespace-pre-wrap">
                      {currentQ.question.content}
                    </p>
                    {currentQ.question.image_url && (
                      <div className="mt-4">
                        <img
                          src={currentQ.question.image_url}
                          alt="Question illustration"
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Test Mode Notice */}
                  {isTestMode && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Test Mode:</strong> You cannot change your
                        answers after submission.
                        {quiz.settings.examMode && (
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
                      disabled={showResults}
                    >
                      <div className="space-y-3">
                        {currentQ.question.options?.map((option) => {
                          const isSelected =
                            answers[currentQ.question.id] === option.id;
                          const isCorrect =
                            currentResult?.correctAnswers.some(
                              (ans) => ans.id === option.id
                            ) || false;
                          const showCorrectness = showResults && currentResult;

                          return (
                            <div
                              key={option.id}
                              className={cn(
                                "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                                !showResults && "hover:bg-muted/50",
                                showCorrectness &&
                                  isCorrect &&
                                  "bg-green-50 border-green-300",
                                showCorrectness &&
                                  isSelected &&
                                  !isCorrect &&
                                  "bg-red-50 border-red-300",
                                showCorrectness &&
                                  !isSelected &&
                                  !isCorrect &&
                                  "border-gray-200"
                              )}
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={option.id}
                                disabled={showResults}
                              />
                              <Label
                                htmlFor={option.id}
                                className={cn(
                                  "flex-1",
                                  !showResults && "cursor-pointer"
                                )}
                              >
                                {option.text}
                              </Label>
                              {showCorrectness && isCorrect && (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              )}
                              {showCorrectness && isSelected && !isCorrect && (
                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Matching Questions */}
                  {currentQ.question.type === "matching_pairs" &&
                    currentQ.question.pairs && (
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
                        disabled={showResults}
                      />
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
                          (isTestMode &&
                            answeredQuestions.has(currentQuestionIndex))
                        }
                        maxLength={
                          currentQ.question.type === "short_answer" ? 500 : 5000
                        }
                        minHeight={
                          currentQ.question.type === "short_answer"
                            ? "100px"
                            : "200px"
                        }
                        placeholder={
                          currentQ.question.type === "coding"
                            ? "Enter your code here..."
                            : currentQ.question.type === "short_answer"
                              ? "Enter a brief answer..."
                              : "Enter your answer here..."
                        }
                      />
                      {showResults && currentResult && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-700">
                            Correct Answer
                            {currentResult.correctAnswers.length > 1 ? "s" : ""}
                            :
                          </p>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-300">
                            {currentResult.correctAnswers.map((ans, idx) => (
                              <p
                                key={idx}
                                className="text-sm text-green-900 whitespace-pre-wrap"
                              >
                                {ans.content.toString()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleFirst}
                        disabled={
                          ((currentPosition as any).type === "transition" &&
                            (currentPosition as any).questionIndex === 0) ||
                          (currentPosition.type === "question" &&
                            currentQuestionIndex === 0 &&
                            !getTransitionForPosition(0)) ||
                          (quiz.settings.examMode && isTestMode)
                        }
                        title="Go to first (Home)"
                      >
                        <ChevronFirst className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={
                          ((currentPosition as any).type === "transition" &&
                            (currentPosition as any).questionIndex === 0) ||
                          (currentPosition.type === "question" &&
                            currentQuestionIndex === 0 &&
                            !getTransitionForPosition(0)) ||
                          (quiz.settings.examMode && isTestMode)
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
                            // Check if last question has an explanation and user has answered it
                            if (
                              currentQ.explanation &&
                              answers[currentQ.question.id] &&
                              currentPosition.type === "question"
                            ) {
                              handleNext();
                            } else {
                              setShowSubmitDialog(true);
                            }
                          }}
                          disabled={isSubmittingQuiz}
                        >
                          {currentQ.explanation &&
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
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLast}
                        disabled={
                          ((currentPosition as any).type === "explanation" &&
                            currentQuestionIndex === questions.length - 1) ||
                          (currentPosition.type === "question" &&
                            currentQuestionIndex === questions.length - 1 &&
                            !currentQ.explanation)
                        }
                        title="Go to last (End)"
                      >
                        <ChevronLast className="h-4 w-4" />
                      </Button>
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
            <div className="space-y-2">
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
                      : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
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
                  isTestMode &&
                  answeredQuestions.has(index) &&
                  index < currentQuestionIndex;
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
                          isDisabled && "opacity-50 cursor-not-allowed"
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
                        isDisabled && "opacity-50 cursor-not-allowed"
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
                                : "bg-muted-foreground/20 text-muted-foreground"
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

                    {/* Explanation (if exists and question is answered) */}
                    {hasExplanation && isAnswered && (
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
                          isDisabled && "opacity-50 cursor-not-allowed"
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

            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>
                  Answered: {answeredCount}/{questions.length}
                </span>
              </div>

              {/* Legend */}
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

              {/* Keyboard Shortcuts */}
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to submit?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isTestMode ? (
                <>
                  You have answered {answeredCount} of {questions.length}{" "}
                  questions.
                  {answeredCount < questions.length && (
                    <span className="block mt-2 font-medium">
                      Unanswered questions will be marked as incorrect.
                    </span>
                  )}
                  Once submitted, you cannot change your answers.
                </>
              ) : (
                <>
                  You have answered {answeredCount} of {questions.length}{" "}
                  questions. Once submitted, you cannot change your answers.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleSubmit();
              }}
              disabled={isSubmittingQuiz}
            >
              Yes, submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
