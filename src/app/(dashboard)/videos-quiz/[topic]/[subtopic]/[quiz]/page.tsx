"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import QuizHeader from "@/components/platform/videos-quiz/quizHeader";
import { dummyVideoTopics, dummyQuizzes, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle as XIcon } from "lucide-react";
import BackArrow from "@/assets/svgs/arrowback";
import CircleCheckmark from "@/assets/svgs/checkmark-circle";
import quizSuccess from "@/assets/quiz-success.svg";

export default function Page() {
  const params = useParams() as {
    topic: string;
    subtopic: string;
    quiz: string;
  };
  const { topic: topicSlug, subtopic: subtopicSlug, quiz: quizSlug } = params;
  const router = useRouter();

  // find topic & quiz
  const topic = dummyVideoTopics.find((t) => slugify(t.title) === topicSlug);
  if (!topic) return <div>Topic not found</div>;

  const quiz = useMemo(
    () => dummyQuizzes.find((q) => slugify(q.title) === quizSlug) ?? null,
    [quizSlug]
  );
  if (!quiz) return <div>Quiz "{quizSlug}" not found</div>;

  const total = quiz.questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  // userAnswers: number for MCQs, string for fill-in, or null if not answered
  const [userAnswers, setUserAnswers] = useState<(number | string | null)[]>(
    Array(total).fill(null)
  );

  // when true, show full-screen quiz success image; after 3s, set submitted=true
  const [showSuccess, setShowSuccess] = useState(false);

  // once true, correct/incorrect styling appears
  const [submitted, setSubmitted] = useState(false);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  const question = quiz.questions[currentIndex];
  const correctAnswer = quiz.correctAnswers[currentIndex];

  // record MCQ selection or text input
  const selectMCQ = (optIdx: number) => {
    if (submitted) return;
    setUserAnswers((ua) => {
      const copy = [...ua];
      copy[currentIndex] = optIdx;
      return copy;
    });
  };

  const selectText = (text: string) => {
    if (submitted) return;
    setUserAnswers((ua) => {
      const copy = [...ua];
      copy[currentIndex] = text;
      return copy;
    });
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSubmitted(true);
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <img
          src={quizSuccess.src || quizSuccess}
          alt="Quiz Success"
          className="object-cover w-screen h-screen"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-6">
      <QuizHeader
        topic={topic}
        topicSlug={topicSlug}
        subtopicSlug={subtopicSlug}
        activeTab="quiz"
        setActiveTab={() =>
          router.push(`/videos-quiz/${topicSlug}/${subtopicSlug}`)
        }
      />
      <Link
        href={`/videos-quiz/${topicSlug}/${subtopicSlug}`}
        className="flex items-center gap-2 p-4 text-sm text-primaryBlue hover:underline"
      >
        <BackArrow color="#286cff" /> Back to tutorials
      </Link>
      <div className="flex gap-6 h-full max-w-screen-2xl">
        {/* Sidebar (hidden on small screens) */}
        <aside className="max-w-xs w-full bg-bgOffwhite border rounded-3xl overflow-auto py-2 px-1.5 max-h-[80vh] h-full scrollbar-hide hidden md:block space-y-1.5">
          {Array.from({ length: total }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`
                w-full text-left p-4 rounded-2xl font-medium text-sm flex justify-between items-center group
                ${
                  idx === currentIndex
                    ? "bg-primaryBlue text-white"
                    : "hover:bg-primaryBlue hover:text-white bg-bgWhiteGray text-textSubtitle"
                }
              `}
            >
              <span>Question {idx + 1}</span>
              <div
                className={`transition-transform duration-200 ease-in-out ${
                  idx === currentIndex
                    ? "opacity-100 scale-100"
                    : "opacity-0 group-hover:opacity-100 group-hover:scale-110"
                }`}
              >
                <CircleCheckmark />
              </div>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white rounded-2xl p-6 -mt-24">
          <div className="mt-4 mb-6 flex justify-between items-center">
            <span className="text-sm font-semibold text-primaryBlue">
              QUESTION {currentIndex + 1}/{total}
            </span>
          </div>

          <p className="mb-4 font-medium text-sm text-textSubtitle">
            {question.question}
          </p>

          {/* If this question is a fill-in-the-blank, render a text input: */}
          {question.isFillInBlank ? (
            <div className="mb-6">
              <input
                type="text"
                value={(userAnswers[currentIndex] as string) || ""}
                onChange={(e) => selectText(e.target.value)}
                disabled={submitted}
                className={`
                  w-full p-4 rounded-xl border text-sm font-medium
                  ${
                    submitted
                      ? // after submit: green border if correct, red if wrong
                        (userAnswers[currentIndex] as string) ===
                        (correctAnswer as string)
                        ? "border-[#34C759] bg-[#34C759] text-white placeholder:text-white"
                        : "border-[#FF0000] bg-[#FF0000] text-white placeholder:text-white"
                      : "border-gray-200 bg-transparent outline-none"
                  }
                `}
                placeholder="Type Answer Here"
              />
              {submitted && (
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                  {(userAnswers[currentIndex] as string) ===
                  (correctAnswer as string) ? (
                    <span className="text-[#34C759] flex items-center gap-1">
                      Correct Answer
                      <CircleCheckmark />
                    </span>
                  ) : (
                    <span className="text-[#34C759] flex items-center gap-1">
                      Correct Answer: {correctAnswer}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Otherwise, render MCQ options as before
            <div className="space-y-3 overflow-auto mb-6">
              {question.options!.map((opt, optIdx) => {
                const selectedIdx = userAnswers[currentIndex] as number | null;
                const isSelected = selectedIdx === optIdx;
                const isCorrect = opt === correctAnswer;

                // Build base classes; once submitted===true, we reveal green/red styling:
                let baseClasses =
                  "flex items-center justify-between gap-4 px-6 py-3 rounded-[40px] font-medium text-sm ";

                if (submitted) {
                  if (isCorrect) {
                    // Correct answer → solid green
                    baseClasses +=
                      "bg-[#34C759] border border-[#34C759] text-white";
                  } else if (isSelected && !isCorrect) {
                    // Wrong choice → solid red
                    baseClasses +=
                      "bg-[#FF0000] border border-[#FF0000] text-white";
                  } else {
                    // Unselected options → light gray
                    baseClasses += "bg-[#EDEDED80] text-textSubtitle";
                  }
                } else {
                  // Before submit → blue if selected, otherwise neutral gray
                  if (isSelected) {
                    baseClasses += "bg-[#E3ECFF] text-primaryBlue";
                  } else {
                    baseClasses +=
                      "bg-[#EDEDED80] hover:bg-gray-100 text-textSubtitle";
                  }
                }

                return (
                  <label key={optIdx} className={baseClasses}>
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name={`q${currentIndex}`}
                        checked={isSelected}
                        onChange={() => selectMCQ(optIdx)}
                        className={`min-w-6 min-h-6 ${
                          isSelected && !submitted
                            ? "accent-primaryBlue border-gray-300"
                            : submitted && isCorrect
                            ? "accent-white bg-[#34C759] appearance-none border-gray-100"
                            : submitted && !isCorrect && isSelected
                            ? "accent-white bg-[#FF0000] appearance-none border-gray-100"
                            : "accent-white bg-white appearance-none border-gray-100"
                        } border-2 rounded-full`}
                        disabled={submitted}
                      />
                      <span>{opt}</span>
                    </div>

                    {/* AFTER submit: show feedback icon/text */}
                    {submitted && (
                      <div className="hidden lg:flex items-center text-white">
                        {isCorrect ? (
                          <span className="flex items-center gap-2 whitespace-nowrap font-semibold">
                            <span>Correct Answer</span>
                            <CircleCheckmark />
                          </span>
                        ) : isSelected && !isCorrect ? (
                          <XIcon className="w-5 h-5" />
                        ) : null}
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <Link
            href="#"
            className="my-6 inline-flex gap-1 items-baseline text-sm font-medium text-textSubtitle"
          >
            Having issues with this question?{" "}
            <div className="flex items-center gap-1 text-primaryBlue">
              Report{" "}
              <span className="rotate-180">
                <BackArrow color="#286cff" />
              </span>
            </div>
          </Link>

          {/* Footer Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {!submitted && currentIndex === total - 1 && (
              <Button
                onClick={handleSubmit}
                className="bg-demo-gradient shadow-demoShadow md:w-[180px] text-white rounded-full px-6 py-4"
              >
                Submit
              </Button>
            )}
            <div className="flex gap-4 w-full justify-end">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="rounded-full p-2 bg-demo-gradient shadow-demoShadow w-8 h-8 flex items-center justify-center"
              >
                <BackArrow color="#ffffff" />
              </Button>
              <Button
                variant="outline"
                onClick={goNext}
                disabled={currentIndex === total - 1}
                className="rounded-full p-2 bg-demo-gradient shadow-demoShadow w-8 h-8 flex items-center justify-center"
              >
                <BackArrow color="#ffffff" flipped />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
