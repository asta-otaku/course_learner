"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-toastify";
import {
  usePostSubmitQuiz,
  usePostSubmitHomework,
  usePostSubmitQuizQuestionDynamic,
  usePatchUpdateQuizQuestionDynamic,
  usePostSubmitBaselineTest,
} from "@/lib/api/mutations";
import {
  useGetQuizQuestions,
  useGetQuiz,
  useGetResumeQuizAttempt,
} from "@/lib/api/queries";
import { AlertCircle } from "lucide-react";
import { QuizPlayerResultsView } from "./quiz-player-results-view";
import { QuizPlayerTakingView } from "./quiz-player-taking-view";
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
  serializeQuizAnswerForApi,
  parseQuizQuestionSubmitResponse,
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
  isResuming = false,
}: QuizPlayerProps) {
  const router = useRouter();
  const [currentPosition, setCurrentPosition] =
    useState<QuizNavigationPosition>({
      type: "question",
      questionIndex: 0,
    });
  const [answers, setAnswers] = useState<
    Record<string, string | Record<string, string>>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  /** Whole-quiz elapsed time (seconds), aligned with the countdown clock. */
  const [quizElapsedSeconds, setQuizElapsedSeconds] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [questions, setQuestions] = useState<QuizPlayerQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [submissionResults, setSubmissionResults] =
    useState<QuizSubmissionResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [immediateQuestionResults, setImmediateQuestionResults] = useState<
    Record<string, QuizQuestionResult>
  >({});
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(
    new Set(),
  );
  // Questions whose answers already exist on the server — updates go through PATCH
  const [answeredOnServer, setAnsweredOnServer] = useState<Set<string>>(
    new Set(),
  );
  // Remaining seconds from the server when resuming a timed quiz
  const [resumeTimeLeft, setResumeTimeLeft] = useState<number | null>(null);
  // Whether the resume API response has been processed (gates timer initialisation)
  const [resumeDataLoaded, setResumeDataLoaded] = useState(false);

  // Refs for scroll behaviour
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionNavContainerRef = useRef<HTMLDivElement>(null);
  const resultsNavContainerRef = useRef<HTMLDivElement>(null);
  const prevImmediateResultsCountRef = useRef(0);
  // Dedupes per-question timer resets (see effect below)
  const lastPerQuestionTimingKeyRef = useRef<string | null>(null);
  // Tracks when the current question / step was first shown — used for per-question timeSpent
  const questionStartTimeRef = useRef<number>(Date.now());

  // Fetch quiz data for timeLimit and feedbackMode (needed for both regular and homework)
  const { data: quizResponse } = useGetQuiz(quizId || "");
  const quiz = quizResponse?.data;
  const quizTimeLimit = propTimeLimit ?? quiz?.timeLimit;
  const isImmediateFeedback = quiz?.feedbackMode === "immediate";
  /** Results / scores are withheld until later (delayed delivery or tutor review). */
  const isDeferredResultsFeedback =
    quiz?.feedbackMode === "delayed_random" ||
    quiz?.feedbackMode === "manual_tutor_review";

  // Determine the actual time limit to use (only if > 0)
  const actualTimeLimit =
    quizTimeLimit && quizTimeLimit > 0 ? quizTimeLimit : undefined;

  const quizSettings = {
    ...DEFAULT_QUIZ_PLAYER_SETTINGS,
    timeLimit: actualTimeLimit,
  };

  // Fetch resume data if resuming.
  // Baseline tests store answers against quizAttemptId (not baselineAttemptId),
  // so we must use quizAttemptId for the resume fetch when available.
  const resumeAttemptIdToUse =
    isBaselineTest && quizAttemptId ? quizAttemptId : attemptId || "";
  const {
    data: resumeResponse,
    isLoading: resumeLoading,
    error: resumeError,
  } = useGetResumeQuizAttempt(
    isResuming && resumeAttemptIdToUse ? resumeAttemptIdToUse : "",
  );

  // Fetch questions only when attemptId is available and NOT resuming
  // Note: The hook will only fetch when quizId is truthy, but we also need attemptId
  // So we'll check for attemptId in the component logic
  const {
    data: questionsResponse,
    isLoading: questionsLoading,
    error: questionsError,
  } = useGetQuizQuestions(!isResuming && attemptId ? quizId : "");

  // Submit quiz mutation (for regular quizzes)
  const { mutate: submitQuiz, isPending: isSubmittingQuiz } = usePostSubmitQuiz(
    quizId,
    attemptId || "",
  );

  // Submit homework mutation (for homework quizzes)
  const { mutate: submitHomework, isPending: isSubmittingHomework } =
    usePostSubmitHomework(homeworkId || "", attemptId || "");

  const { mutate: submitBaselineTest, isPending: isSubmittingBaselineTest } =
    usePostSubmitBaselineTest(baselineTestId || "", attemptId || "");

  // For baseline (immediate feedback), per-question submit uses quizAttemptId; final submit uses attemptId (baselineAttemptId)
  const attemptIdForQuestionSubmit =
    isBaselineTest && quizAttemptId ? quizAttemptId : attemptId || "";

  // Submit a new single-question answer (POST)
  const {
    mutate: submitQuestion,
    mutateAsync: submitQuestionAsync,
    isPending: isSubmittingQuestion,
  } = usePostSubmitQuizQuestionDynamic(quizId, attemptIdForQuestionSubmit);
  // Update a previously submitted single-question answer (PATCH — used on resume)
  const { mutate: updateQuestion, mutateAsync: updateQuestionAsync } =
    usePatchUpdateQuizQuestionDynamic(quizId, attemptIdForQuestionSubmit);

  const getTransitionForPosition = (
    _position: number,
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

  // In immediate feedback mode, don't allow jumping ahead of the furthest
  // question the learner has already reached/submitted.
  const maxReachedQuestionIndex = useMemo(() => {
    if (!isImmediateFeedback) return questions.length - 1;

    let maxSubmittedIndex = -1;
    questions.forEach((q, index) => {
      if (
        immediateQuestionResults[q.question.id] ||
        lockedQuestions.has(q.question.id)
      ) {
        maxSubmittedIndex = Math.max(maxSubmittedIndex, index);
      }
    });

    return Math.max(getCurrentQuestionIndex(), maxSubmittedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- index helper is derived from the listed deps
  }, [
    isImmediateFeedback,
    questions,
    immediateQuestionResults,
    lockedQuestions,
    currentPosition,
  ]);

  // Transform and initialize questions from resume data
  useEffect(() => {
    if (!isResuming || !resumeResponse?.data || !attemptId) return;

    const resumeData = resumeResponse.data;
    const rawQuestions = resumeData.questions;

    // Transform questions to QuizPlayerQuestion format
    const transformedQuestions: QuizPlayerQuestion[] = rawQuestions.map(
      (rq: any, index: number) => {
        // Determine the question data structure - handle different possible formats
        const questionData = rq.question || rq;

        // Build options array
        let options: any[] = [];

        // First try to use the answers array if available
        if (
          (rq.type === "multiple_choice" || rq.type === "true_false") &&
          rq.answers
        ) {
          options = rq.answers
            .sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
            .map((answer: any) => ({
              id: answer.id,
              text: answer.content,
              isCorrect: answer.isCorrect,
            }));
        }
        // For locked questions without answers array, reconstruct from result
        else if (rq.isLocked && rq.result && rq.result.correctAnswers) {
          // Add the correct answer(s)
          options = rq.result.correctAnswers.map((ans: any) => ({
            id: ans.id,
            text: ans.content,
            isCorrect: true,
          }));

          // Add the user's selected answer if it's different from the correct answer
          if (
            rq.result.userAnswerId &&
            !options.some((opt: any) => opt.id === rq.result.userAnswerId)
          ) {
            options.push({
              id: rq.result.userAnswerId,
              text: rq.result.userAnswerContent,
              isCorrect: false,
            });
          }
        }

        return {
          id: rq.questionId || rq.id,
          order: index,
          points: rq.points || questionData.points || 1,
          explanation: questionData.explanation || rq.explanation,
          question: {
            id: rq.questionId || questionData.id,
            title:
              rq.title ||
              questionData.title ||
              questionData.content?.substring(0, 50) ||
              "Question",
            content: rq.content || questionData.content || "",
            type:
              rq.type ||
              questionData.type ||
              rq.question_format?.type ||
              "multiple_choice",
            image: rq.image || questionData.image,
            image_url: rq.image_url || questionData.image_url,
            imageSettings:
              rq.imageSettings ||
              questionData.imageSettings ||
              rq.image_settings,
            // Use the constructed options array
            options: options,
            // For matching questions
            ...(questionData.type === "matching_pairs" && {
              pairs: (
                questionData.pairs ||
                questionData.matchingPairs ||
                []
              ).map((pair: any, idx: number) => ({
                id: `pair-${idx}`,
                left: pair.left,
                right: pair.right,
              })),
              correctAnswer:
                questionData.pairs || questionData.matchingPairs || [],
            }),
            // For free text questions
            ...(questionData.type === "free_text" && {
              correctAnswers: questionData.correctAnswers || [],
            }),
            metadata: questionData.metadata,
            correctAnswer: questionData.correctAnswer,
          },
        };
      },
    );

    // Shuffle options for multiple choice questions (but not for locked questions)
    const withShuffledOptions = transformedQuestions.map((q, idx) => {
      const isQuestionLocked = rawQuestions[idx]?.isLocked;

      return {
        ...q,
        question: {
          ...q.question,
          options:
            !isQuestionLocked &&
            q.question.options &&
            q.question.options.length > 0
              ? shuffleArray(q.question.options)
              : q.question.options,
        },
      };
    });

    setQuestions(withShuffledOptions);

    // Populate answers and results from resume data
    const populatedAnswers: Record<string, string | Record<string, string>> =
      {};
    const populatedResults: Record<string, QuizQuestionResult> = {};
    const locked = new Set<string>();
    const serverAnsweredIds = new Set<string>();
    let firstUnansweredIndex = -1;

    rawQuestions.forEach((rq: any, index: number) => {
      const questionId = rq.questionId || rq.id;

      // If this question has a result, it was already answered
      if (rq.result || rq.isLocked) {
        const result = rq.result;

        // Populate the answer based on question type
        if (rq.type === "multiple_choice" || rq.type === "true_false") {
          // For MC/TF, use the userAnswerId (the selected option ID)
          if (result.userAnswerId) {
            populatedAnswers[questionId] = result.userAnswerId;
          }
        } else if (rq.type === "matching_pairs") {
          // For matching, parse the userAnswerContent as JSON if it's a string
          try {
            if (typeof result.userAnswerContent === "string") {
              populatedAnswers[questionId] = JSON.parse(
                result.userAnswerContent,
              );
            } else {
              populatedAnswers[questionId] = result.userAnswerContent;
            }
          } catch {
            populatedAnswers[questionId] = result.userAnswerContent;
          }
        } else {
          // For free text and other types, use userAnswerContent
          populatedAnswers[questionId] = result.userAnswerContent || "";
        }

        // Populate the result
        populatedResults[questionId] = {
          questionId: questionId,
          isCorrect: result.isCorrect || false,
          pointsEarned: parseFloat(result.pointsEarned) || 0,
          pointsPossible: result.pointsPossible || rq.points || 1,
          userAnswerId: result.userAnswerId,
          userAnswerContent: result.userAnswerContent || "",
          correctAnswers: result.correctAnswers || [],
          feedback: result.feedback,
        };

        // Trust isLocked from the API — the server sets it for questions that
        // can no longer be re-answered (e.g. immediate feedback after submission).
        // Non-immediate modes leave questions unlocked so the user can revise.
        if (rq.isLocked) {
          locked.add(questionId);
        }
        // Mark as existing on the server so updates go through PATCH
        serverAnsweredIds.add(questionId);
      } else {
        // This is the first unanswered question
        if (firstUnansweredIndex === -1) {
          firstUnansweredIndex = index;
        }
      }
    });

    // If all questions are answered, set to first question
    if (firstUnansweredIndex === -1) {
      firstUnansweredIndex = 0;
    }

    setAnswers(populatedAnswers);
    setImmediateQuestionResults(populatedResults);
    setLockedQuestions(locked);
    setAnsweredOnServer(serverAnsweredIds);
    setAnsweredQuestions(
      new Set(Array.from({ length: firstUnansweredIndex }, (_, i) => i)),
    );

    // Set position to first unanswered question
    setCurrentPosition({
      type: "question",
      questionIndex: firstUnansweredIndex,
    });

    const initialTransition = getTransitionForPosition(0);
    if (initialTransition && firstUnansweredIndex === 0) {
      setCurrentPosition({ type: "transition", questionIndex: 0 });
    }

    // Resume API always sends timeLeft in seconds (remaining wall time for the quiz).
    const resumeRaw =
      resumeData.timeLeft ??
      (resumeData as { progress?: { timeLeft?: unknown } }).progress?.timeLeft;
    if (resumeRaw !== undefined && resumeRaw !== null) {
      const secs = Math.max(0, Math.floor(Number(resumeRaw)));
      if (!Number.isNaN(secs)) {
        setResumeTimeLeft(secs);
      }
    }
    setResumeDataLoaded(true);
  }, [resumeResponse, attemptId, isResuming]);

  // Transform and initialize questions when fetched (non-resume flow)
  useEffect(() => {
    if (isResuming || !questionsResponse?.data || !attemptId) return;

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
              }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init from loaded questions/attempt only
  }, [questionsResponse, attemptId]);

  // Initialize (or restore) the quiz timer
  useEffect(() => {
    if (!attemptId || !actualTimeLimit) return;
    // For resuming quizzes, wait until resume data is processed so we can use
    // the server-provided remaining time instead of restarting from scratch.
    if (isResuming && !resumeDataLoaded) return;

    const totalTimeInSeconds = actualTimeLimit * 60;

    if (isResuming && resumeTimeLeft !== null && resumeTimeLeft > 0) {
      // resumeTimeLeft is seconds from the backend; keep countdown + elapsed in sync.
      setTimeRemaining(resumeTimeLeft);
      setQuizStartTime(
        Date.now() - (totalTimeInSeconds - resumeTimeLeft) * 1000,
      );
    } else {
      // Fresh start
      setTimeRemaining(totalTimeInSeconds);
      setQuizStartTime(Date.now());
    }
    setQuizElapsedSeconds(0);
  }, [
    quizId,
    attemptId,
    actualTimeLimit,
    isResuming,
    resumeDataLoaded,
    resumeTimeLeft,
  ]);

  // Timer countdown and time tracking
  useEffect(() => {
    if (!quizStartTime || !actualTimeLimit || showResults) return;

    let hasSubmitted = false; // Flag to prevent multiple submissions

    const timer = setInterval(() => {
      // Calculate elapsed time in seconds
      const elapsed = (Date.now() - quizStartTime) / 1000;

      // Same elapsed basis as remaining time (avoids mismatch with the countdown)
      setQuizElapsedSeconds(Math.max(0, Math.floor(elapsed)));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyboard nav uses latest handlers for this position
  }, [currentPosition, answers, questions, isTestMode, quizSettings.examMode]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (shouldAutoSubmit && attemptId && !showResults) {
      setShouldAutoSubmit(false);
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoSubmit, attemptId, showResults]);

  // Reset per-question time when the learner enters a new step (question, explanation,
  // or transition). Also re-arms when questions first load so time on Q1 does not
  // include loading, and idle time on Q2 counts from navigation even if the learner
  // waits before answering.
  useEffect(() => {
    if (questions.length === 0) return;

    const posKey =
      currentPosition.type === "transition"
        ? `transition-${currentPosition.questionIndex}`
        : `${currentPosition.type}-${currentPosition.questionIndex}`;
    const dedupeKey = `${attemptId ?? ""}:${posKey}`;

    if (lastPerQuestionTimingKeyRef.current === dedupeKey) return;

    const hadPrevious = lastPerQuestionTimingKeyRef.current !== null;
    lastPerQuestionTimingKeyRef.current = dedupeKey;
    questionStartTimeRef.current = Date.now();

    if (hadPrevious) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [attemptId, currentPosition, questions.length]);

  // Keep the current question visible inside the navigation sidebar(s)
  useEffect(() => {
    const idx = getCurrentQuestionIndex();
    const questionBtnSelector = `[data-testid="question-nav-${idx + 1}"]`;
    const resultsBtnSelector = `[data-testid="results-question-nav-${idx + 1}"]`;

    const scrollNearest = (container: HTMLElement | null, selector: string) => {
      if (!container) return;
      const el = container.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      // nearest prevents jumping to top/bottom unnecessarily
      el.scrollIntoView({ block: "nearest" });
    };

    // Wait a tick for DOM updates (e.g. after submit sets results)
    const raf = requestAnimationFrame(() => {
      scrollNearest(questionNavContainerRef.current, questionBtnSelector);
      scrollNearest(resultsNavContainerRef.current, resultsBtnSelector);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, showResults]);

  // Scroll to the feedback section after each immediate-feedback answer submission
  useEffect(() => {
    const count = Object.keys(immediateQuestionResults).length;
    if (count <= prevImmediateResultsCountRef.current) {
      prevImmediateResultsCountRef.current = count;
      return;
    }
    prevImmediateResultsCountRef.current = count;
    if (!isImmediateFeedback) return;
    const timer = setTimeout(() => {
      feedbackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediateQuestionResults]);

  const handleAnswerChange = (
    questionId: string,
    answer: string | Record<string, string>,
  ) => {
    // Prevent changes once results are showing, questions are locked (resume),
    // or the question was already submitted in immediate-feedback mode.
    if (
      showResults ||
      lockedQuestions.has(questionId) ||
      (isImmediateFeedback && immediateQuestionResults[questionId])
    ) {
      return;
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
        (q.question.type === "multiple_choice" ||
          q.question.type === "true_false")
      ) {
        const payload = serializeQuizAnswerForApi(q, answer);
        const timeSpentSecs = Math.round(
          (Date.now() - questionStartTimeRef.current) / 1000,
        );
        submitQuestion(
          { questionId, answer: payload, timeSpent: timeSpentSecs },
          {
            onSuccess: (res) => {
              setAnsweredOnServer((prev) => new Set(prev).add(questionId));
              const result = parseQuizQuestionSubmitResponse(questionId, res);
              if (result) {
                setImmediateQuestionResults((prev) => ({
                  ...prev,
                  [questionId]: result,
                }));
              }
            },
            onError: () => {
              toast.error("Failed to submit answer. Please try again.");
            },
          },
        );
      }
    }

    // Non-immediate modes: silently save MC/TF selection so resume works.
    // Results are NOT displayed — the server just stores the answer.
    // Use PATCH if the answer already exists on the server, POST otherwise.
    if (!isImmediateFeedback && attemptId && !lockedQuestions.has(questionId)) {
      const q = questions.find((qu) => qu.question.id === questionId);
      if (
        q &&
        (q.question.type === "multiple_choice" ||
          q.question.type === "true_false")
      ) {
        const payload = serializeQuizAnswerForApi(q, answer);
        const timeSpentSecs = Math.round(
          (Date.now() - questionStartTimeRef.current) / 1000,
        );
        if (answeredOnServer.has(questionId)) {
          updateQuestion(
            { questionId, answer: payload, timeSpent: timeSpentSecs },
            { onSuccess: () => {}, onError: () => {} },
          );
        } else {
          submitQuestion(
            { questionId, answer: payload, timeSpent: timeSpentSecs },
            {
              onSuccess: () => {
                setAnsweredOnServer((prev) => new Set(prev).add(questionId));
              },
              onError: () => {},
            },
          );
        }
      }
    }
  };

  // Silently saves free-text / matching answers in non-immediate modes so that
  // the server can restore them on resume. Called before any navigation.
  // Uses PATCH if the answer already exists on the server, POST otherwise.
  const saveCurrentAnswerForResume = () => {
    if (showResults || isImmediateFeedback || !attemptId) return;
    if (currentPosition.type !== "question") return;
    const q = questions[getCurrentQuestionIndex()];
    if (!q || lockedQuestions.has(q.question.id)) return;
    const ans = answers[q.question.id];
    if (ans == null) return;
    const qType = q.question.type;
    if (
      qType === "free_text" ||
      qType === "short_answer" ||
      qType === "long_answer" ||
      qType === "coding" ||
      qType === "matching_pairs"
    ) {
      const payload = serializeQuizAnswerForApi(q, ans);
      const timeSpentSecs = Math.round(
        (Date.now() - questionStartTimeRef.current) / 1000,
      );
      const questionId = q.question.id;
      if (answeredOnServer.has(questionId)) {
        updateQuestion(
          { questionId, answer: payload, timeSpent: timeSpentSecs },
          { onSuccess: () => {}, onError: () => {} },
        );
      } else {
        submitQuestion(
          { questionId, answer: payload, timeSpent: timeSpentSecs },
          {
            onSuccess: () => {
              setAnsweredOnServer((prev) => new Set(prev).add(questionId));
            },
            onError: () => {},
          },
        );
      }
    }
  };

  /**
   * In `after_completion` mode every question is saved to the server as the
   * student navigates away (via saveCurrentAnswerForResume / handleAnswerChange).
   * The LAST question is never navigated away from — the student goes straight
   * from answering to "Submit Quiz".  This function ensures that answer is
   * persisted per-question on the server BEFORE the bulk submit fires, covering
   * ALL question types (MC/TF included, in case handleAnswerChange's fire-and-
   * forget hasn't completed yet).
   */
  const flushCurrentQuestionAnswerAsync = async (): Promise<void> => {
    if (showResults || isImmediateFeedback || !attemptId) return;
    if (currentPosition.type !== "question") return;
    const q = questions[getCurrentQuestionIndex()];
    if (!q || lockedQuestions.has(q.question.id)) return;
    const ans = answers[q.question.id];
    if (ans == null) return;

    // MC/TF are already saved by handleAnswerChange — skip them to avoid a
    // redundant POST/PATCH that would double-submit the last question.
    const qType = q.question.type;
    if (
      qType !== "free_text" &&
      qType !== "short_answer" &&
      qType !== "long_answer" &&
      qType !== "coding" &&
      qType !== "matching_pairs"
    ) {
      return;
    }

    const payload = serializeQuizAnswerForApi(q, ans);
    const timeSpentSecs = Math.round(
      (Date.now() - questionStartTimeRef.current) / 1000,
    );
    const questionId = q.question.id;

    try {
      if (answeredOnServer.has(questionId)) {
        await updateQuestionAsync({
          questionId,
          answer: payload,
          timeSpent: timeSpentSecs,
        });
      } else {
        await submitQuestionAsync({
          questionId,
          answer: payload,
          timeSpent: timeSpentSecs,
        });
        setAnsweredOnServer((prev) => new Set(prev).add(questionId));
      }
    } catch {
      // Non-fatal: the bulk submit still includes the answer in its payload.
    }
  };

  const handleNext = () => {
    saveCurrentAnswerForResume();
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
            new Set(prev).add(currentQuestionIndex),
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
    saveCurrentAnswerForResume();

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
    saveCurrentAnswerForResume();
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
    saveCurrentAnswerForResume();

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
    if (isImmediateFeedback && index > maxReachedQuestionIndex) {
      return;
    }
    saveCurrentAnswerForResume();

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

    // In after_completion mode the last question is never navigated away from,
    // so its answer hasn't been flushed to the server via the per-question API.
    // Await that save before sending the bulk submit so the server has it.
    await flushCurrentQuestionAnswerAsync();

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
          (opt) => opt.id === answer,
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

    // Match the countdown (and avoid being up to ~1s short if submit lands between ticks)
    const elapsedSecondsForSubmit =
      quizStartTime != null && actualTimeLimit
        ? Math.max(
            0,
            Math.min(
              actualTimeLimit * 60,
              Math.round((Date.now() - quizStartTime) / 1000),
            ),
          )
        : quizElapsedSeconds;

    const submissionData: {
      answers: Record<string, string | Record<string, string>>;
      /** Whole-quiz time in seconds (matches API response `timeSpent`) */
      timeSpent?: number;
    } = {
      answers: submissionAnswers,
      timeSpent: elapsedSecondsForSubmit,
    };

    const handleSubmissionSuccess = (resultData: any) => {
      // Offer 2 / Learning Buddy review: leave the quiz immediately and show
      // the confirmation message on the homework page.
      if (quiz?.feedbackMode === "manual_tutor_review") {
        router.replace("/homework?buddyReviewSubmitted=1");
        return;
      }

      // In immediate-feedback mode we already have per-question results collected
      // during the quiz. The homework submit endpoint returns a Homework object (not
      // scored quiz results), so we build the review from the local data instead of
      // relying on the API response having a `results` array.
      const immediateResultsArray = Object.values(immediateQuestionResults);
      const hasImmediateResults =
        isImmediateFeedback && immediateResultsArray.length > 0;

      if (resultData || hasImmediateResults) {
        let builtResults: QuizSubmissionResults;

        // When API response lacks a `results` array (e.g. homework submit returns
        // the Homework object), compute scores from per-question immediate results.
        const apiHasResults =
          Array.isArray(resultData?.results) && resultData.results.length > 0;

        if (hasImmediateResults && !apiHasResults) {
          const scoreEarned = immediateResultsArray.reduce(
            (sum, r) => sum + (r.pointsEarned || 0),
            0,
          );
          const totalPts = immediateResultsArray.reduce(
            (sum, r) => sum + (r.pointsPossible || 1),
            0,
          );
          const pct =
            totalPts > 0 ? Math.round((scoreEarned / totalPts) * 100) : 0;

          builtResults = {
            attemptId:
              resultData?.attemptId || resultData?.id || attemptId || "",
            quizId: resultData?.quizId || quizId,
            score: resultData?.score ?? scoreEarned,
            totalPoints: resultData?.totalPoints ?? totalPts,
            percentage: resultData?.percentage ?? pct,
            results: immediateResultsArray,
            timeSpent: Number(resultData?.timeSpent) || quizElapsedSeconds,
          };
        } else {
          builtResults = buildQuizSubmissionResults(
            resultData,
            attemptId || "",
            quizId,
          );
        }

        setSubmissionResults(builtResults);
        setShowResults(true);
        setCurrentPosition({ type: "question", questionIndex: 0 });
        toast.success(successMessage);
      } else {
        router.push(
          `/quiz-results/${resultData?.id || resultData?.attemptId || attemptId || ""}`,
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

  const getQuestionResult = (
    questionId: string,
  ): QuizQuestionResult | undefined => {
    // After the quiz is submitted and the review screen is showing, prefer the
    // authoritative API result (which includes full feedback text) over the
    // per-question immediate results that were collected during the quiz.
    if (showResults && submissionResults) {
      const apiResult = submissionResults.results.find(
        (r) => r.questionId === questionId,
      );
      if (apiResult) return apiResult;
    }
    // During the quiz (before submission) in immediate-feedback mode, use the
    // per-question results so feedback is shown right after each answer.
    if (isImmediateFeedback && immediateQuestionResults[questionId]) {
      return immediateQuestionResults[questionId];
    }
    if (!submissionResults) return undefined;
    return submissionResults.results.find((r) => r.questionId === questionId);
  };

  // Show loading state while fetching questions or resume data
  if ((isResuming ? resumeLoading : questionsLoading) || !attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
          <p>{isResuming ? "Resuming quiz..." : "Loading quiz..."}</p>
        </div>
      </div>
    );
  }

  // Show error state
  const hasError = isResuming
    ? resumeError ||
      !resumeResponse?.data ||
      resumeResponse.data.questions.length === 0
    : questionsError ||
      !questionsResponse?.data ||
      questionsResponse.data.length === 0;

  if (hasError) {
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
                {(isResuming ? resumeError : questionsError)
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
    isImmediateFeedback &&
    Boolean(immediateQuestionResults[currentQ.question.id]);
  const isCurrentQuestionLocked = lockedQuestions.has(currentQ.question.id);
  const showCorrectnessForCurrent =
    Boolean(currentResult) &&
    (showResults || isCurrentQuestionSubmitted || isCurrentQuestionLocked);
  const allQuestionsSubmittedInImmediateMode =
    isImmediateFeedback &&
    questions.length > 0 &&
    questions.every((q) => immediateQuestionResults[q.question.id]);

  const questionTitleTrim = String(currentQ.question.title ?? "").trim();
  const questionContentTrim = String(currentQ.question.content ?? "").trim();
  const showDistinctQuestionTitleInHeader =
    questionTitleTrim.length > 0 &&
    questionTitleTrim !== questionContentTrim &&
    !questionContentTrim.startsWith(questionTitleTrim);

  // Results Summary View
  if (showResults && submissionResults) {
    return (
      <QuizPlayerResultsView
        isDeferredResultsFeedback={isDeferredResultsFeedback}
        quiz={quiz}
        isHomework={isHomework}
        isBaselineTest={isBaselineTest}
        router={router}
        submissionResults={submissionResults}
        currentResult={currentResult}
        currentQ={currentQ}
        actualTimeLimit={actualTimeLimit}
        currentQuestionIndex={currentQuestionIndex}
        questions={questions}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
        resultsNavContainerRef={resultsNavContainerRef}
        getQuestionResult={getQuestionResult}
        setCurrentPosition={setCurrentPosition}
      />
    );
  }

  return (
    <QuizPlayerTakingView
      timeRemaining={timeRemaining}
      currentQuestionIndex={currentQuestionIndex}
      questions={questions}
      answeredCount={answeredCount}
      progress={progress}
      showDistinctQuestionTitleInHeader={showDistinctQuestionTitleInHeader}
      questionTitleTrim={questionTitleTrim}
      currentPosition={currentPosition}
      getTransitionForPosition={getTransitionForPosition}
      setCurrentPosition={setCurrentPosition}
      handleNext={handleNext}
      currentQ={currentQ}
      isTestMode={isTestMode}
      isImmediateFeedback={isImmediateFeedback}
      quizSettings={quizSettings}
      answers={answers}
      handleAnswerChange={handleAnswerChange}
      showResults={showResults}
      isCurrentQuestionSubmitted={isCurrentQuestionSubmitted}
      isCurrentQuestionLocked={isCurrentQuestionLocked}
      currentResult={currentResult}
      showCorrectnessForCurrent={showCorrectnessForCurrent}
      answeredQuestions={answeredQuestions}
      submitQuestion={submitQuestion}
      questionStartTimeRef={questionStartTimeRef}
      setAnsweredOnServer={setAnsweredOnServer}
      setImmediateQuestionResults={setImmediateQuestionResults}
      isSubmittingQuestion={isSubmittingQuestion}
      feedbackRef={feedbackRef}
      handlePrevious={handlePrevious}
      allQuestionsSubmittedInImmediateMode={
        allQuestionsSubmittedInImmediateMode
      }
      setShowSubmitDialog={setShowSubmitDialog}
      isSubmittingQuiz={isSubmittingQuiz}
      isSubmittingHomework={isSubmittingHomework}
      isSubmittingBaselineTest={isSubmittingBaselineTest}
      maxReachedQuestionIndex={maxReachedQuestionIndex}
      getQuestionResult={getQuestionResult}
      handleQuestionNavigation={handleQuestionNavigation}
      questionNavContainerRef={questionNavContainerRef}
      showSubmitDialog={showSubmitDialog}
      handleSubmit={handleSubmit}
    />
  );
}
