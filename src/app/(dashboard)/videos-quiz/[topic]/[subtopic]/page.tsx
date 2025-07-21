"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { dummyVideoTopics, slugify } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { dummyQuizzes } from "@/lib/utils";
import QuizHeader from "@/components/platform/videos-quiz/quizHeader";

export default function VideoTopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicSlug = params.topic;
  const subtopicSlug = (params as { subtopic?: string }).subtopic;
  const topic = dummyVideoTopics.find((t) => slugify(t.title) === topicSlug);
  if (!topic) return <div>Topic not found</div>;

  const [activeTab, setActiveTab] = useState<"overview" | "quiz">("overview");

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-6">
      {/* header */}
      <QuizHeader
        topic={topic}
        topicSlug={topicSlug}
        subtopicSlug={subtopicSlug}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* content panel */}
      {activeTab === "overview" ? (
        <div className="bg-gray-100 rounded-xl min-h-[70vh] p-8">
          <div className="prose max-w-none">
            <p>{topic.description}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-[70vh] p-4 max-w-4xl w-full mx-auto">
          <div
            onClick={() => setActiveTab("overview")}
            className="flex items-center gap-4 cursor-pointer"
          >
            <ArrowLeft className="text-textSubtitle" />
            <h1 className="text-xs mdLtext-sm text-textSubtitle">
              Back to tutorials
            </h1>
          </div>
          <div className="my-6 flex flex-col w-full gap-4">
            {dummyQuizzes.map((quiz, index) => (
              <div
                key={index}
                className="bg-bgOffwhite p-5 w-full rounded-2xl flex items-center justify-between gap-4 relative"
              >
                <div className="space-y-4 z-10">
                  <h2 className="text-sm md:text-base font-medium">
                    {quiz.title}
                  </h2>

                  {quiz.attempts.length ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-textSubtitle font-inter">
                        {quiz.attempts.length} Previous Attempts
                      </p>
                      <span className="p-1 rounded-full bg-borderGray" />
                      <p className="text-xs font-medium text-textSubtitle font-inter">
                        Last Score:{" "}
                        {quiz.attempts[quiz.attempts.length - 1].score}%
                      </p>
                      <Link
                        href="#"
                        className="text-primaryBlue underline underline-offset-2 text-xs font-medium font-inter"
                      >
                        View History
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-textSubtitle font-inter">
                      {quiz.questions.length
                        ? `${quiz.questions.length} Questions`
                        : "No attempts yet"}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/videos-quiz/${topicSlug}/${subtopicSlug}/${slugify(
                        quiz.title
                      )}`
                    )
                  }
                  className="py-2.5 bg-demo-gradient rounded-full text-white shadow-demoShadow max-w-[180px] w-full flex justify-center font-medium text-xs md:text-sm z-10"
                >
                  {quiz.attempts.length ? "Attempt" : "Start Quiz"}
                </button>
                <img
                  src="/quiz-bulb.png"
                  alt=""
                  className="absolute bottom-0 left-[30%] z-0"
                />
                <img
                  src="/quiz-tablet.png"
                  alt=""
                  className="absolute top-0 left-[42%] z-0"
                />
                <img
                  src="/quiz-bulb-small.png"
                  alt=""
                  className="absolute bottom-0 left-[45%] z-0"
                />
                <img
                  src="/quiz-bulb-top.png"
                  alt=""
                  className="absolute top-0 left-[58%] z-0"
                />
                <img
                  src="/quiz-tablet-down.png"
                  alt=""
                  className="absolute bottom-0 left-[70%] z-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* footer with details and proceed button */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-3">
          <div className="max-w-xl">
            <h2 className="font-semibold uppercase mb-2">Topic Overview:</h2>
            <p className="text-gray-700">{topic.description}</p>
          </div>

          <button
            onClick={() => setActiveTab("quiz")}
            className="py-2.5 bg-demo-gradient rounded-full text-white shadow-demoShadow max-w-xs w-full flex justify-center mx-auto font-medium text-xs md:text-sm"
          >
            Proceed to Quiz
          </button>
        </div>
      )}
    </div>
  );
}
