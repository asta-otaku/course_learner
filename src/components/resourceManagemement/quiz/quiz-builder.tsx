"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { QuestionBankWithFolders } from "./question-bank-with-folders";
import { QuestionEditDialog } from "../questions/question-edit-dialog";
import { SortableItem } from "./sortable-item";
import { ExplanationEditor } from "./explanation-editor";
import { Loader2, Save, Check } from "lucide-react";
import { usePutQuiz } from "@/lib/api/mutations";
import { useGetQuizQuestions } from "@/lib/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/lib/database.types";

type DBQuestion = Database["public"]["Tables"]["questions"]["Row"];

interface QuizQuestion {
  id: string;
  questionId: string;
  order: number;
  explanation?: string;
  question?: {
    id: string;
    title: string;
    content: string;
    type: string;
    difficultyLevel: number;
    tags: string[];
  };
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  settings?: {
    timeLimit?: number;
    randomizeQuestions: boolean;
    showCorrectAnswers: boolean;
    maxAttempts: number;
    passingScore: number;
  };
}

interface QuizBuilderProps {
  quiz: Quiz;
}

export function QuizBuilder({ quiz: initialQuiz }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);
  const [removedQuestionIds, setRemovedQuestionIds] = useState<string[]>([]);
  const [questionBankRefreshTrigger, setQuestionBankRefreshTrigger] =
    useState(0);

  // Use the mutation hook and query client
  const putQuizMutation = usePutQuiz(initialQuiz.id);
  const queryClient = useQueryClient();

  // Get real-time quiz questions data
  const { data: quizQuestionsResponse, refetch: refetchQuizQuestions } =
    useGetQuizQuestions(initialQuiz.id);
  const [explanations, setExplanations] = useState<Record<number, string>>(
    () => {
      // Initialize explanations from quiz transitions if available
      const transitions = (initialQuiz as any).quiz_transitions || [];
      const initialExplanations: Record<number, string> = {};
      transitions.forEach((t: { position: number; content: string }) => {
        initialExplanations[t.position] = t.content;
      });
      return initialExplanations;
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local quiz state when fresh data arrives
  useEffect(() => {
    if (quizQuestionsResponse?.data) {
      const freshQuestions = quizQuestionsResponse.data
        .map((qq: any, index: number) => ({
          id: qq.id,
          questionId: qq.question?.id,
          order: qq.orderIndex || index,
          points: qq.pointsOverride || qq.question?.points || 1,
          required: qq.required,
          explanation: qq.question?.hint || "",
          question: qq.question
            ? {
                id: qq.question.id,
                title: qq.question.title || "Untitled Question",
                content: qq.question.content,
                type: qq.question.type,
                difficultyLevel: qq.question.difficultyLevel || 5,
                tags: qq.question.tags || [],
              }
            : null,
        }))
        .filter((q: any) => q.question !== null)
        .sort((a: any, b: any) => a.order - b.order);

      setQuiz((prev) => ({
        ...prev,
        questions: freshQuestions,
      }));
    }
  }, [quizQuestionsResponse]);

  // Save function - only called when Save button is clicked
  const handleSaveQuiz = async () => {
    setSaveStatus("saving");

    try {
      const quizUpdateData = {
        title: quiz.title,
        questions: quiz.questions.map((q, index) => ({
          questionId: q.questionId,
          orderIndex: index + 1,
        })),
      };

      const result = await putQuizMutation.mutateAsync(quizUpdateData);

      // Refetch fresh data directly
      await refetchQuizQuestions();

      // Invalidate questions cache for question bank
      await queryClient.invalidateQueries({
        queryKey: ["questions"],
      });

      setSaveStatus("saved");
      toast.success(result.data.message);

      // Trigger question bank refresh
      setQuestionBankRefreshTrigger((prev) => prev + 1);

      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("idle");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = quiz.questions.findIndex((q) => q.id === active.id);
      const newIndex = quiz.questions.findIndex((q) => q.id === over?.id);

      // Update questions
      setQuiz((prev) => {
        const newQuestions = arrayMove(prev.questions, oldIndex, newIndex);
        // Update order values
        return {
          ...prev,
          questions: newQuestions.map((q, index) => ({ ...q, order: index })),
        };
      });

      // Reorder explanations to match new question order
      setExplanations((prev) => {
        const newExplanations: Record<number, string> = {};

        // Create a mapping of old position to new position
        const positionMap: Record<number, number> = {};
        if (oldIndex < newIndex) {
          // Moving down
          for (let i = 0; i < quiz.questions.length - 1; i++) {
            if (i < oldIndex) {
              positionMap[i] = i;
            } else if (i === oldIndex) {
              positionMap[i] = newIndex - 1;
            } else if (i < newIndex) {
              positionMap[i] = i - 1;
            } else {
              positionMap[i] = i;
            }
          }
        } else {
          // Moving up
          for (let i = 0; i < quiz.questions.length - 1; i++) {
            if (i < newIndex) {
              positionMap[i] = i;
            } else if (i < oldIndex) {
              positionMap[i] = i + 1;
            } else if (i === oldIndex) {
              positionMap[i] = newIndex;
            } else {
              positionMap[i] = i;
            }
          }
        }

        // Apply the position mapping to explanations
        Object.entries(prev).forEach(([pos, content]) => {
          const oldPos = parseInt(pos);
          const newPos = positionMap[oldPos];
          if (newPos !== undefined) {
            newExplanations[newPos] = content;
          }
        });

        return newExplanations;
      });
    }
  };

  const addQuestions = (questions: DBQuestion[]) => {
    // Filter out questions that already exist in the quiz
    const existingQuestionIds = quiz.questions.map((q) => q.questionId);
    const newQuestions = questions.filter(
      (q) => !existingQuestionIds.includes(q.id)
    );

    // Remove questions from removedQuestionIds if they're being re-added
    const questionIdsBeingAdded = newQuestions.map((q) => q.id);
    setRemovedQuestionIds((prev) =>
      prev.filter((id) => !questionIdsBeingAdded.includes(id))
    );

    if (newQuestions.length === 0) {
      toast.error("No new questions to add");
      return;
    }

    const addedCount = newQuestions.length;
    const skippedCount = questions.length - addedCount;

    const quizQuestions: QuizQuestion[] = newQuestions.map(
      (question, index) => ({
        id: `q-${Date.now()}-${index}`,
        questionId: question.id,
        order: quiz.questions.length + index,
        explanation: question.hint || "",
        question: {
          id: question.id,
          title: (question as any).title || "Untitled Question",
          content: question.content,
          type: question.type,
          difficultyLevel: (question as any).difficulty_level
            ? (question as any).difficulty_level <= 3
              ? 1
              : (question as any).difficulty_level >= 7
                ? 11
                : 2
            : 2,
          tags: (question as any).tags || [],
        },
      })
    );

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, ...quizQuestions],
    }));

    toast.success(
      `Added ${addedCount} question${addedCount !== 1 ? "s" : ""} to the quiz${
        skippedCount > 0 ? ` (${skippedCount} already existed)` : ""
      }`
    );
  };

  const removeQuestion = (id: string) => {
    // Find the question being removed to track its questionId
    const removedQuestion = quiz.questions.find((q) => q.id === id);
    if (removedQuestion) {
      setRemovedQuestionIds((prev) => [...prev, removedQuestion.questionId]);
    }

    // Find the index of the question being removed
    const removedIndex = quiz.questions.findIndex((q) => q.id === id);

    // Update questions
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.id !== id)
        .map((q, index) => ({ ...q, order: index })),
    }));

    // Shift explanations after the removed question
    setExplanations((prev) => {
      const newExplanations: Record<number, string> = {};
      Object.entries(prev).forEach(([pos, content]) => {
        const position = parseInt(pos);
        if (position < removedIndex) {
          // Keep explanations before the removed question
          newExplanations[position] = content;
        } else if (position > removedIndex) {
          // Shift explanations after the removed question down by 1
          newExplanations[position - 1] = content;
        }
        // Skip the explanation at removedIndex as it should be removed
      });
      return newExplanations;
    });
  };

  const updateExplanation = (index: number, explanation: string) => {
    setExplanations((prev) => ({
      ...prev,
      [index]: explanation,
    }));
  };

  const handleSave = async () => {
    if (quiz.questions.length === 0) {
      toast.error("Quiz must have at least one question");
      return;
    }

    await handleSaveQuiz();
  };

  // Create stable callback for QuestionEditDialog
  const handleEditDialogChange = useCallback((open: boolean) => {
    if (!open) setEditingQuestionId(null);
  }, []);

  const handleQuestionEditSuccess = useCallback(async () => {
    if (!editingQuestionId) return;

    setIsUpdatingQuestion(true);

    try {
      // Refetch fresh data directly
      await refetchQuizQuestions();

      // Invalidate questions cache for question bank
      await queryClient.invalidateQueries({
        queryKey: ["questions"],
      });

      // Trigger question bank refresh
      setQuestionBankRefreshTrigger((prev) => prev + 1);

      toast.success("Question updated");
      toast.success("Question has been updated successfully.");
    } catch (error) {
      console.error("Failed to update question:", error);
      toast.error("Failed to refresh question data.");
      toast.error("Failed to refresh question data.");
    }

    setEditingQuestionId(null);
    // Allow updates after a brief delay
    setTimeout(() => setIsUpdatingQuestion(false), 100);
  }, [editingQuestionId, queryClient, initialQuiz.id]);

  return (
    <div className="flex h-full">
      {/* Left Panel - Question Bank */}
      <div className="w-1/2 border-r overflow-hidden">
        <QuestionBankWithFolders
          onAddQuestions={addQuestions}
          addedQuestionIds={quiz.questions
            .map((q) => q.questionId)
            .filter((id) => !removedQuestionIds.includes(id))}
          refreshTrigger={questionBankRefreshTrigger}
          onQuestionsImported={() => {
            // Refresh question bank is handled inside the component
            // Just show a toast to guide the user
            toast.success("Questions imported successfully");
            toast.success(
              "Your imported questions are now available in the question bank. You can select them to add to your quiz."
            );
          }}
        />
      </div>

      {/* Right Panel - Quiz Builder */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Quiz Builder</h2>
            <div className="flex items-center gap-2">
              {saveStatus === "saving" && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
              <Button onClick={handleSave} size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Quiz
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quiz Title</label>
              <Input
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                placeholder="Enter quiz title"
              />
            </div>

            <div className="text-sm">
              <span>Selected Questions ({quiz.questions.length})</span>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={quiz.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <SortableItem
                    id={question.id}
                    question={question}
                    onRemove={removeQuestion}
                    onEdit={(questionId) => setEditingQuestionId(questionId)}
                  />

                  {/* Explanation between questions */}
                  {index < quiz.questions.length - 1 && (
                    <ExplanationEditor
                      value={explanations[index] || ""}
                      onChange={(value) => updateExplanation(index, value)}
                      placeholder="Add explanation or transition text between questions..."
                    />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {quiz.questions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No questions added yet.</p>
            <p className="text-sm mt-2">
              Search and add questions from the question bank.
            </p>
          </div>
        )}
      </div>

      {editingQuestionId && (
        <QuestionEditDialog
          questionId={editingQuestionId}
          open={!!editingQuestionId}
          onOpenChange={handleEditDialogChange}
          onSuccess={handleQuestionEditSuccess}
        />
      )}
    </div>
  );
}
