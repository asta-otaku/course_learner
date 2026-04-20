"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/assets/svgs/arrowback";
import {
  useGetSectionById,
  useGetLessonById,
  useGetQuizzesForLesson,
  useGetQuizQuestions,
} from "@/lib/api/queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssignHomeworkForm from "@/components/tutor/homework/assignHomework";
import { Badge } from "@/components/ui/badge";
import { MathPreview } from "@/components/resourceManagemement/editor/math-preview";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const curriculumId = params.curriculumId as string;
  const lessonId = params.lessonId as string;
  const [quizForAssign, setQuizForAssign] = useState<{
    id: string;
    title?: string;
    description?: string;
    questionsCount?: number;
  } | null>(null);
  const [quizForPreview, setQuizForPreview] = useState<{
    id: string;
    title?: string;
  } | null>(null);

  const { data: sectionData } = useGetSectionById(curriculumId);
  const { data: lessonDetail, isLoading } = useGetLessonById(lessonId);
  const { data: quizzesResponse, isLoading: quizzesLoading } =
    useGetQuizzesForLesson(lessonId);
  const { data: quizQuestionsResponse, isLoading: quizQuestionsLoading } =
    useGetQuizQuestions(quizForPreview?.id || "");

  const section = sectionData?.data;

  // Get lessons and sort by orderIndex
  const curriculumLessons = useMemo(() => {
    const lessons = section?.lessons || [];
    return [...lessons].sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
  }, [section?.lessons]);

  // Get lesson data from useGetLessonById
  const lessonData = lessonDetail?.data;
  const lessonQuizzes = useMemo(() => {
    const quizzes = quizzesResponse?.data || [];
    return [...quizzes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [quizzesResponse?.data]);
  const previewQuestions = useMemo(() => {
    const raw = (quizQuestionsResponse?.data || []) as Array<{
      id: string;
      orderIndex?: number;
      question?: {
        content?: string;
        type?: string;
        answers?: Array<{
          id: string;
          content: string;
          isCorrect?: boolean;
          orderIndex?: number;
          matchingPairs?: Array<{ left: string; right: string }> | null;
        }>;
      };
    }>;
    return [...raw].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [quizQuestionsResponse?.data]);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!section || !lessonData) {
    return <div className="p-8">Lesson not found</div>;
  }

  // Extract properties from lesson detail
  const lessonTitle = lessonData.title;
  const lessonDescription = lessonData.description || "";
  const videos = ((lessonData as any)?.videos || []) as Array<{
    playbackUrl?: string;
    title?: string;
    fileName?: string;
  }>;
  // Note: Resume position may need to come from lesson data or a different endpoint
  const resumePositionSec = 0;

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-6">
      {/* header */}
      <div className="space-y-6">
        <Link
          href={`/tutor/learning-resources/${curriculumId}`}
          className="flex items-center gap-4"
        >
          <BackArrow />
          <h1 className="text-sm md:text-base font-bold text-textGray uppercase">
            {section.title}
          </h1>
        </Link>

        {/* lessons nav */}
        <nav className="flex items-baseline gap-8 overflow-x-auto border-b border-bgWhiteGray">
          <span className="font-bold text-xs md:text-sm uppercase text-textSubtitle">
            Lessons:
          </span>
          {curriculumLessons.map((l: any, i: number) => {
            const isActive = l.id === lessonId;
            return (
              <button
                key={l.id}
                onClick={() =>
                  router.push(
                    `/tutor/learning-resources/${curriculumId}/${l.id}`
                  )
                }
                className={`whitespace-nowrap uppercase ${isActive
                  ? "border-b-2 border-primaryBlue text-primaryBlue font-semibold pb-2"
                  : "text-textGray text-xs md:text-sm hover:text-gray-800"
                  }`}
              >
                Lesson {i + 1}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        {/* Lesson title and description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{lessonTitle}</h2>
          <p className="text-textSubtitle">
            {lessonDescription || ""}
          </p>
        </div>

        {/* Video Player(s) */}
        {videos.length > 0 ? (
          <div className="space-y-6">
            {videos.map((v, idx) => (
              <div
                key={idx}
                className="bg-gray-100 rounded-xl min-h-[70vh] select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              >
                <video
                  src={v?.playbackUrl || ""}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  className="w-full h-full min-h-[70vh] object-contain rounded-lg pointer-events-auto"
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    if (resumePositionSec > 0 && vid.duration > 0) {
                      const safe = Math.min(
                        resumePositionSec,
                        Math.floor(vid.duration - 1)
                      );
                      try {
                        vid.currentTime = safe > 0 ? safe : 0;
                      } catch { }
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 w-full bg-gray-200 rounded-lg px-8">
            <p className="text-textSubtitle">No video available</p>
          </div>
        )}

        {/* footer with lesson overview */}
        <div className="flex flex-col gap-3">
          <div className="max-w-xl">
            <h2 className="font-semibold uppercase mb-2">Lesson Overview:</h2>
            <p className="text-gray-700">
              {lessonDescription || "No description available"}
            </p>
          </div>
        </div>

        {/* quizzes */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-bold">Quizzes</h2>
          {quizzesLoading ? (
            <div className="text-sm text-textSubtitle">Loading quizzes...</div>
          ) : lessonQuizzes.length === 0 ? (
            <div className="text-sm text-textSubtitle">
              No quizzes available for this lesson.
            </div>
          ) : (
            <div className="space-y-3">
              {lessonQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="rounded-xl border bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-textGray">{quiz.title}</h3>
                    {quiz.description ? (
                      <p className="text-sm text-textSubtitle line-clamp-2">
                        {quiz.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-textSubtitle mt-1">
                      {quiz.questionsCount ?? 0} questions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setQuizForPreview({ id: quiz.id || "", title: quiz.title })
                      }
                    >
                      View Quiz
                    </Button>
                    <Button
                      className="bg-primaryBlue hover:bg-primaryBlue/90"
                      onClick={() =>
                        setQuizForAssign({
                          id: quiz.id || "",
                          title: quiz.title,
                          description: quiz.description,
                          questionsCount: quiz.questionsCount,
                        })
                      }
                    >
                      Assign Homework
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign homework modal */}
      <Dialog open={!!quizForAssign} onOpenChange={(open) => !open && setQuizForAssign(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className="border-b bg-white px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Assign Homework
              </DialogTitle>
              {quizForAssign?.title && (
                <p className="mt-1 text-xs text-textSubtitle">
                  Quiz:&nbsp;
                  <span className="font-medium text-textGray">
                    {quizForAssign.title}
                  </span>
                </p>
              )}
            </DialogHeader>
          </div>
          <div className="bg-white px-6 py-6">
            {quizForAssign ? (
              <AssignHomeworkForm
                embedded
                hideQuizPicker
                hideDueDate
                initialQuiz={quizForAssign}
                onBack={() => setQuizForAssign(null)}
                onAssign={() => setQuizForAssign(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* View quiz modal */}
      <Dialog
        open={!!quizForPreview}
        onOpenChange={(open) => !open && setQuizForPreview(null)}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {quizForPreview?.title || "Quiz"}
            </DialogTitle>
          </DialogHeader>
          {quizQuestionsLoading ? (
            <div className="py-6 text-sm text-textSubtitle">Loading questions...</div>
          ) : previewQuestions.length === 0 ? (
            <div className="py-6 text-sm text-textSubtitle">
              No questions found for this quiz.
            </div>
          ) : (
            <div className="space-y-4">
              {previewQuestions.map((q, index) => {
                const answers = [...(q.question?.answers || [])].sort(
                  (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                );
                const typeLabel =
                  q.question?.type === "multiple_choice"
                    ? "Multiple choice"
                    : q.question?.type === "true_false"
                    ? "True / False"
                    : q.question?.type === "matching_pairs"
                    ? "Matching pairs"
                    : "Free text";
                const correctCount = answers.filter((a) => a.isCorrect).length;
                return (
                  <div key={q.id} className="rounded-lg border bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-textGray">
                        Question {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel}
                        </Badge>
                        {correctCount > 0 && (
                          <span className="text-[11px] text-green-700 font-medium">
                            {correctCount} correct answer{correctCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <MathPreview
                      content={q.question?.content || ""}
                      renderMarkdown={true}
                      className="text-textGray whitespace-pre-wrap"
                    />

                    {q.question?.type === "matching_pairs" ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-700">
                          Correct Matches:
                        </p>
                        {(answers[0]?.matchingPairs || []).length > 0 ? (
                          <div className="space-y-2">
                            {(answers[0]?.matchingPairs || []).map((pair, i) => (
                              <div
                                key={`${q.id}-pair-${i}`}
                                className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm"
                              >
                                <span className="font-medium">{pair.left}</span> {"->"}{" "}
                                <span>{pair.right}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-textSubtitle">No matches provided.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-700">
                          Correct Answer
                          {correctCount > 1 ? "s" : ""}:
                        </p>
                        {answers.length > 0 ? (
                          <ul className="space-y-2">
                            {answers.map((ans) => (
                              <li
                                key={ans.id}
                                className={`rounded border px-3 py-2 text-sm ${
                                  ans.isCorrect
                                    ? "border-green-200 bg-green-50 text-green-900"
                                    : "border-gray-200 bg-gray-50 text-gray-500"
                                }`}
                              >
                                <MathPreview
                                  content={ans.content || ""}
                                  renderMarkdown={true}
                                  className="whitespace-pre-wrap"
                                />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-textSubtitle">No answers configured.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
