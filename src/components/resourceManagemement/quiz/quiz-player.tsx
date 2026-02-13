"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-toastify";
import {
  usePostSubmitQuiz,
  usePostSubmitHomework,
  usePostSubmitQuizQuestionDynamic,
  usePostSubmitBaselineTest,
} from "@/lib/api/mutations";
import { useGetQuizQuestions, useGetQuiz } from "@/lib/api/queries";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ChevronFirst,
  ChevronLast,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchingQuestion } from "./matching-question";
import { FreeTextInput } from "./free-text-input";
import { QuestionImage } from "@/components/ui/question-image";
import { QuizPlayerTimer } from "./quiz-player-timer";
import { QuizPlayerResultsStats } from "./quiz-player-results-stats";
import { QuizPlayerSubmitDialog } from "./quiz-player-submit-dialog";
import { MathPreview } from "../editor/math-preview";
import type {
  QuizPlayerProps,
  QuizPlayerQuestion,
  QuizTransition,
  QuizQuestionResult,
  QuizSubmissionResults,
  QuizNavigationPosition,
} from "@/lib/types";
import {
  DEFAULT_QUIZ_PLAYER_SETTINGS,
  shuffleArray,
  buildQuizSubmissionResults,
  parseQuizFeedbackText,
  serializeQuizAnswerForApi,
  parseQuizQuestionSubmitResponse,
  getCorrectAnswerText,
} from "@/lib/utils";

export function QuizPlayer({
  quizId,
  isTestMode = false,
  attemptId,
  isHomework = false,
  homeworkId,
  isBaselineTest = false,
  baselineTestId,
  timeLimit: propTimeLimit,
  quizAttemptId,
}: QuizPlayerProps) {
  const router = useRouter();
  const [currentPosition, setCurrentPosition] = useState<QuizNavigationPosition>({
    type: "question",
    questionIndex: 0,
  });
  const [answers, setAnswers] = useState<
    Record<string, string | Record<string, string>>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0); // Time spent in minutes
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [questions, setQuestions] = useState<QuizPlayerQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  );
  const [submissionResults, setSubmissionResults] =
    useState<QuizSubmissionResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [immediateQuestionResults, setImmediateQuestionResults] = useState<
    Record<string, QuizQuestionResult>
  >({});

  // Fetch quiz data for timeLimit and feedbackMode (needed for both regular and homework)
  const { data: quizResponse } = useGetQuiz(quizId || "");
  const quiz = quizResponse?.data;
  const quizTimeLimit = propTimeLimit ?? quiz?.timeLimit;
  const isImmediateFeedback = quiz?.feedbackMode === "immediate";

  // Determine the actual time limit to use (only if > 0)
  const actualTimeLimit =
    quizTimeLimit && quizTimeLimit > 0 ? quizTimeLimit : undefined;

  const quizSettings = {
    ...DEFAULT_QUIZ_PLAYER_SETTINGS,
    timeLimit: actualTimeLimit,
  };

  // Fetch questions only when attemptId is available (quiz has started)
  // Note: The hook will only fetch when quizId is truthy, but we also need attemptId
  // So we'll check for attemptId in the component logic
  const {
    data: questionsResponse,
    isLoading: questionsLoading,
    error: questionsError,
  } = useGetQuizQuestions(attemptId ? quizId : "");

  // Submit quiz mutation (for regular quizzes)
  const { mutate: submitQuiz, isPending: isSubmittingQuiz } = usePostSubmitQuiz(
    quizId,
    attemptId || ""
  );

  // Submit homework mutation (for homework quizzes)
  const { mutate: submitHomework, isPending: isSubmittingHomework } =
    usePostSubmitHomework(homeworkId || "", attemptId || "");

  const { mutate: submitBaselineTest, isPending: isSubmittingBaselineTest } =
    usePostSubmitBaselineTest(baselineTestId || "", attemptId || "");

  // For baseline (immediate feedback), per-question submit uses quizAttemptId; final submit uses attemptId (baselineAttemptId)
  const attemptIdForQuestionSubmit =
    isBaselineTest && quizAttemptId ? quizAttemptId : (attemptId || "");

  // Submit single question (for immediate feedback mode only)
  const {
    mutate: submitQuestion,
    isPending: isSubmittingQuestion,
  } = usePostSubmitQuizQuestionDynamic(quizId, attemptIdForQuestionSubmit);

  const getTransitionForPosition = (
    position: number
  ): QuizTransition | undefined => {
    return undefined;
  };

  const getCurrentQuestionIndex = () => {
    if (
      currentPosition.type === "question" ||
      currentPosition.type === "explanation"
    ) {
      return currentPosition.questionIndex;
    }
    return currentPosition.questionIndex;
  };

  // Transform and initialize questions when fetched
  useEffect(() => {
    if (!questionsResponse?.data || !attemptId) return;

    const rawQuestions = questionsResponse.data;

    // Transform questions to QuizPlayerQuestion format
    const transformedQuestions: QuizPlayerQuestion[] = rawQuestions
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      .map((qq: any) => ({
        id: qq.id,
        order: qq.orderIndex,
        points: qq.pointsOverride || qq.question.points || 1,
        explanation: qq.question.explanation,
        question: {
          id: qq.question.id,
          title: qq.question.title,
          content: qq.question.content,
          type: qq.question.type,
          // Support both new (image) and legacy (image_url) formats
          image: qq.question.image || qq.question.image_url,
          image_url: qq.question.image_url || qq.question.image, // Legacy support
          imageSettings: qq.question.imageSettings,
          // Transform answers to options for multiple choice
          options:
            qq.question.type === "multiple_choice" && qq.question.answers
              ? qq.question.answers
                .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                .map((answer: any) => ({
                  id: answer.id,
                  text: answer.content,
                  isCorrect: answer.isCorrect,
                }))
              : [],
          // For true/false questions
          ...(qq.question.type === "true_false" && {
            options: qq.question.answers
              ? qq.question.answers
                .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
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
          // For matching questions
          ...(qq.question.type === "matching_pairs" && {
            pairs: (qq.question.answers?.[0]?.matchingPairs || []).map(
              (pair: any, index: number) => ({
                id: `pair-${index}`,
                left: pair.left,
                right: pair.right,
              })
            ),
            correctAnswer: qq.question.answers?.[0]?.matchingPairs || [],
          }),
          // For free text questions
          ...(qq.question.type === "free_text" && {
            correctAnswers:
              qq.question.answers?.map((answer: any) => answer.content) || [],
          }),
          // Pass metadata for other question types that might need it
          metadata: qq.question.metadata,
          // Pass correct answer for other types if available
          correctAnswer:
            qq.question.metadata?.correct_answer ||
            qq.question.answers?.find((a: any) => a.isCorrect)?.id,
        },
      }));

    // Always shuffle multiple choice / true-false options so correct answer isn't always in same position
    const withShuffledOptions = transformedQuestions.map((q) => ({
      ...q,
      question: {
        ...q.question,
        options:
          q.question.options && q.question.options.length > 0
            ? shuffleArray(q.question.options)
            : q.question.options,
      },
    }));

    // Apply randomization if enabled
    let orderedQuestions = [...withShuffledOptions];
    if (quizSettings.randomizeQuestions) {
      orderedQuestions = orderedQuestions.sort(() => Math.random() - 0.5);
    }

    setQuestions(orderedQuestions);

    // Check if there's a transition at the very beginning (position 0)
    const initialTransition = getTransitionForPosition(0);
    if (initialTransition) {
      setCurrentPosition({ type: "transition", questionIndex: 0 });
    }
  }, [questionsResponse, attemptId]);

  // Initialize timer when quiz starts
  useEffect(() => {
    if (!attemptId || !actualTimeLimit) return;

    // Always start fresh with a new attempt
    const initialTimeRemaining = actualTimeLimit * 60; // Convert minutes to seconds
    const startTime = Date.now();

    setTimeRemaining(initialTimeRemaining);
    setQuizStartTime(startTime);
    setTimeSpent(0);
  }, [quizId, attemptId, actualTimeLimit]);

  // Timer countdown and time tracking
  useEffect(() => {
    if (!quizStartTime || !actualTimeLimit || showResults) return;

    let hasSubmitted = false; // Flag to prevent multiple submissions

    const timer = setInterval(() => {
      // Calculate elapsed time in seconds
      const elapsed = (Date.now() - quizStartTime) / 1000;

      // Update time spent in minutes (rounded down)
      setTimeSpent(Math.floor(elapsed / 60));

      // Calculate remaining time
      const totalTimeInSeconds = actualTimeLimit * 60;
      const remaining = Math.max(0, totalTimeInSeconds - elapsed);

      setTimeRemaining(remaining);

      // Auto-submit when time runs out
      if (remaining <= 0 && !hasSubmitted && !showResults) {
        hasSubmitted = true;
        clearInterval(timer);
        setTimeRemaining(0);
        toast.error("Time's up! Your quiz has been automatically submitted.");
        setShowSubmitDialog(false);
        setShouldAutoSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStartTime, actualTimeLimit, showResults]);

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
  }, [currentPosition, answers, questions, isTestMode, quizSettings.examMode]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (shouldAutoSubmit && attemptId && !showResults) {
      setShouldAutoSubmit(false);
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoSubmit, attemptId, showResults]);

  const handleAnswerChange = (
    questionId: string,
    answer: string | Record<string, string>
  ) => {
    if (isImmediateFeedback && immediateQuestionResults[questionId]) {
      return; // Already submitted, no editing
    }
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: answer,
      };
      return newAnswers;
    });

    // Immediate feedback: submit MC/true_false as soon as user selects
    if (
      isImmediateFeedback &&
      attemptId &&
      !immediateQuestionResults[questionId]
    ) {
      const q = questions.find((qu) => qu.question.id === questionId);
      if (
        q &&
        (q.question.type === "multiple_choice" || q.question.type === "true_false")
      ) {
        const payload = serializeQuizAnswerForApi(q, answer);
        submitQuestion(
          { questionId, answer: payload },
          {
            onSuccess: (res) => {
              const result = parseQuizQuestionSubmitResponse(questionId, res);
              if (result) {
                setImmediateQuestionResults((prev) => ({
                  ...prev,
                  [questionId]: result,
                }));
                toast.success(
                  result.isCorrect ? "Correct!" : "Submitted. Check feedback below."
                );
              }
            },
            onError: () => {
              toast.error("Failed to submit answer. Please try again.");
            },
          }
        );
      }
    }
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

      // Immediate feedback mode: must have submitted current question before next
      if (
        isImmediateFeedback &&
        !immediateQuestionResults[currentQ.question.id]
      ) {
        return;
      }

      // In immediate mode we skip the explanation step (feedback already shown)
      if (
        !isImmediateFeedback &&
        currentQ.explanation &&
        answers[currentQ.question.id]
      ) {
        setCurrentPosition({
          type: "explanation",
          questionIndex: currentQuestionIndex,
        });
        return;
      }

      // Check if we're at the last question
      if (currentQuestionIndex >= questions.length - 1) {
        if (isImmediateFeedback && allQuestionsSubmittedInImmediateMode) {
          setShowSubmitDialog(true);
        }
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
    if (quizSettings.examMode && isTestMode) {
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

    // In immediate feedback we skip explanation step; otherwise go to explanation if available
    if (
      !isImmediateFeedback &&
      lastQuestion.explanation &&
      answers[lastQuestion.question.id]
    ) {
      setCurrentPosition({
        type: "explanation",
        questionIndex: lastQuestionIndex,
      });
    } else {
      setCurrentPosition({
        type: "question",
        questionIndex: lastQuestionIndex,
      });
    }
  };

  const handlePrevious = () => {
    // In exam mode, don't allow going back
    if (quizSettings.examMode && isTestMode) {
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
    // Immediate feedback: no skipping — only allow up to current question
    if (isImmediateFeedback && index > getCurrentQuestionIndex()) {
      return;
    }

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
      quizSettings.examMode &&
      isTestMode &&
      index < getCurrentQuestionIndex()
    ) {
      return;
    }

    // Navigate directly to the question (not explanation or transition)
    setCurrentPosition({ type: "question", questionIndex: index });
  };
  const handleSubmit = async () => {
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
      timeSpent?: number; // Time spent in minutes
    } = {
      answers: submissionAnswers,
      timeSpent: timeSpent, // Include time spent in minutes
    };

    const handleSubmissionSuccess = (resultData: any) => {
      if (resultData) {
        setSubmissionResults(
          buildQuizSubmissionResults(resultData, attemptId || "", quizId)
        );
        setShowResults(true);
        setCurrentPosition({ type: "question", questionIndex: 0 });
        toast.success(successMessage);
      } else {
        router.push(
          `/quiz-results/${resultData?.id || resultData?.attemptId || attemptId || ""}`
        );
      }
    };

    const successMessage =
      isBaselineTest && baselineTestId
        ? "Baseline test submitted successfully!"
        : isHomework && homeworkId
          ? "Homework submitted successfully!"
          : "Quiz submitted successfully!";

    if (isBaselineTest && baselineTestId) {
      submitBaselineTest(submissionData, {
        onSuccess: (response) =>
          handleSubmissionSuccess(response.data?.data as any),
        onError: (error) => {
          console.error("Error submitting baseline test:", error);
          toast.error("Failed to submit baseline test. Please try again.");
        },
      });
    } else if (isHomework && homeworkId) {
      submitHomework(submissionData, {
        onSuccess: (response) =>
          handleSubmissionSuccess(response.data?.data as any),
        onError: (error) => {
          console.error("Error submitting homework:", error);
          toast.error("Failed to submit homework. Please try again.");
        },
      });
    } else {
      submitQuiz(submissionData, {
        onSuccess: (response) =>
          handleSubmissionSuccess(response.data?.data as any),
        onError: (error) => {
          console.error("Error submitting quiz:", error);
          toast.error("Failed to submit quiz. Please try again.");
        },
      });
    }
  };

  const answeredCount = Object.entries(answers).filter(([_, answer]) => {
    if (!answer) return false;
    if (typeof answer === "object" && !Array.isArray(answer)) {
      return Object.keys(answer).length > 0;
    }
    return true;
  }).length;
  const progress = (answeredCount / questions.length) * 100;

  const getQuestionResult = (questionId: string): QuizQuestionResult | undefined => {
    if (isImmediateFeedback && immediateQuestionResults[questionId]) {
      return immediateQuestionResults[questionId];
    }
    if (!submissionResults) return undefined;
    return submissionResults.results.find((r) => r.questionId === questionId);
  };

  const quizTitle =
    questions.length > 0
      ? questions[0]?.question?.title ||
      questions[0]?.question?.content ||
      "Quiz"
      : "Quiz";

  // Show loading state while fetching questions
  if (questionsLoading || !attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (
    questionsError ||
    !questionsResponse?.data ||
    questionsResponse.data.length === 0
  ) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Not Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {questionsError
                  ? "Failed to load quiz questions. Please try again."
                  : "This quiz doesn't have any questions yet."}
              </AlertDescription>
            </Alert>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.back()}
            >
              Back to Lessons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
          <p>Preparing quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestionIndex = getCurrentQuestionIndex();
  const currentQ = questions[currentQuestionIndex] || questions[0]; // Fallback for edge cases
  const currentResult = getQuestionResult(currentQ.question.id);
  const isCurrentQuestionSubmitted =
    isImmediateFeedback && Boolean(immediateQuestionResults[currentQ.question.id]);
  const showCorrectnessForCurrent =
    Boolean(currentResult) && (showResults || isCurrentQuestionSubmitted);
  const allQuestionsSubmittedInImmediateMode =
    isImmediateFeedback &&
    questions.length > 0 &&
    questions.every((q) => immediateQuestionResults[q.question.id]);

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
                      <CardTitle>Quiz Results: {quizTitle}</CardTitle>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => router.back()}>
                    Back to Lessons
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <QuizPlayerResultsStats submissionResults={submissionResults} />
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

                  {/* Feedback */}
                  {currentResult?.feedback && (
                    <div>
                      <p className="text-base font-medium mb-2">Feedback:</p>
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                          <MathPreview
                            content={currentResult.feedback}
                            className="text-yellow-800"
                            renderMarkdown={true}
                          />
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Explanation if available */}
                  {currentQ.explanation && (
                    <div>
                      <p className="text-base font-medium mb-2">Explanation:</p>
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <MathPreview
                            content={currentQ.explanation}
                            className="text-blue-800"
                            renderMarkdown={true}
                          />
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
                    <p className="text-base whitespace-pre-wrap">
                      {currentQ.question.content}
                    </p>
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
                          showResults || isCurrentQuestionSubmitted
                        }
                      >
                        <div className="space-y-3">
                          {currentQ.question.options?.map((option) => {
                            const isSelected =
                              answers[currentQ.question.id] === option.id;
                            const isCorrect =
                              currentResult?.correctAnswers?.some(
                                (ans) => ans.id === option.id
                              ) || false;
                            const showCorrectness = showCorrectnessForCurrent;

                            return (
                              <Label
                                key={option.id}
                                htmlFor={option.id}
                                className={cn(
                                  "flex items-center space-x-2 p-3 rounded-lg border transition-colors w-full cursor-pointer",
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
                                    "border-gray-200",
                                  (showResults || isCurrentQuestionSubmitted) &&
                                    "cursor-default"
                                )}
                              >
                                <RadioGroupItem
                                  value={option.id}
                                  id={option.id}
                                  disabled={showResults || isCurrentQuestionSubmitted}
                                />
                                <span className="flex-1">{option.text}</span>
                                {showCorrectness && isCorrect && (
                                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                )}
                                {showCorrectness && isSelected && !isCorrect && (
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
                            showResults || isCurrentQuestionSubmitted
                          }
                        />
                        {isImmediateFeedback &&
                          !isCurrentQuestionSubmitted &&
                          Object.keys(
                            (answers[currentQ.question.id] as Record<
                              string,
                              string
                            >) || {}
                          ).length > 0 && (
                            <Button
                              onClick={() => {
                                const ans = answers[currentQ.question.id];
                                if (ans == null) return;
                                const payload = serializeQuizAnswerForApi(
                                  currentQ,
                                  ans
                                );
                                submitQuestion(
                                  {
                                    questionId: currentQ.question.id,
                                    answer: payload,
                                  },
                                  {
                                    onSuccess: (res) => {
                                      const result = parseQuizQuestionSubmitResponse(
                                        currentQ.question.id,
                                        res
                                      );
                                      if (result) {
                                        setImmediateQuestionResults((prev) => ({
                                          ...prev,
                                          [currentQ.question.id]: result,
                                        }));
                                        toast.success(
                                          result.isCorrect
                                            ? "Correct!"
                                            : "Submitted. Check feedback below."
                                        );
                                      }
                                    },
                                    onError: () => {
                                      toast.error(
                                        "Failed to submit answer. Please try again."
                                      );
                                    },
                                  }
                                );
                              }}
                              disabled={isSubmittingQuestion}
                            >
                              {isSubmittingQuestion ? "Submitting..." : "Submit answer"}
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
                            (isTestMode &&
                              answeredQuestions.has(currentQuestionIndex))
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
                          (answers[currentQ.question.id] as string)?.trim() && (
                            <Button
                              onClick={() => {
                                const ans = answers[currentQ.question.id];
                                if (ans == null || typeof ans !== "string") return;
                                submitQuestion(
                                  {
                                    questionId: currentQ.question.id,
                                    answer: ans,
                                  },
                                  {
                                    onSuccess: (res) => {
                                      const result = parseQuizQuestionSubmitResponse(
                                        currentQ.question.id,
                                        res
                                      );
                                      if (result) {
                                        setImmediateQuestionResults((prev) => ({
                                          ...prev,
                                          [currentQ.question.id]: result,
                                        }));
                                        toast.success(
                                          result.isCorrect
                                            ? "Correct!"
                                            : "Submitted. Check feedback below."
                                        );
                                      }
                                    },
                                    onError: () => {
                                      toast.error(
                                        "Failed to submit answer. Please try again."
                                      );
                                    },
                                  }
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
                      <div className="space-y-4 mt-6 pt-6 border-t">
                        <div className="flex items-center gap-2">
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
                            <span className="ml-1">
                              {currentResult.pointsEarned}/
                              {currentResult.pointsPossible} points
                            </span>
                          </Badge>
                        </div>
                        {!currentResult.isCorrect &&
                          currentResult.correctAnswers?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-2">
                                Correct Answer
                                {currentResult.correctAnswers.length > 1 ? "s" : ""}
                                :
                              </p>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-300">
                                {currentQ.question.type === "matching_pairs" &&
                                  typeof currentResult.correctAnswers[0]?.content ===
                                  "object" ? (
                                  <div className="space-y-2">
                                    {Object.entries(
                                      currentResult.correctAnswers[0]
                                        .content as Record<string, string>
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
                                  <p className="text-sm text-green-900 whitespace-pre-wrap">
                                    {getCorrectAnswerText(currentQ, currentResult)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        {currentResult.feedback && (
                          <div>
                            <p className="text-sm font-medium mb-2">Feedback:</p>
                            <Alert className="border-amber-200 bg-amber-50">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <AlertDescription>
                                <p className="text-amber-800 whitespace-pre-wrap">
                                  {parseQuizFeedbackText(currentResult.feedback)}
                                </p>
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
                        size="icon"
                        onClick={handleFirst}
                        disabled={
                          ((currentPosition as any).type === "transition" &&
                            (currentPosition as any).questionIndex === 0) ||
                          (currentPosition.type === "question" &&
                            currentQuestionIndex === 0 &&
                            !getTransitionForPosition(0)) ||
                          (quizSettings.examMode && isTestMode)
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
                            if (isImmediateFeedback && allQuestionsSubmittedInImmediateMode) {
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
                          disabled={isSubmittingQuiz || isSubmittingHomework || isSubmittingBaselineTest}
                        >
                          {isImmediateFeedback && allQuestionsSubmittedInImmediateMode
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
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLast}
                        disabled={
                          (isImmediateFeedback &&
                            !allQuestionsSubmittedInImmediateMode) ||
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
                  (isTestMode &&
                    answeredQuestions.has(index) &&
                    index < currentQuestionIndex) ||
                  (isImmediateFeedback && index > currentQuestionIndex);
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
