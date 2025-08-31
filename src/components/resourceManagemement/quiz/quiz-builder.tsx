"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { QuestionBankWithFolders } from "./question-bank-with-folders";
import { QuestionEditDialog } from "../questions/question-edit-dialog";
import { SortableItem } from "./sortable-item";
import { ExplanationEditor } from "./explanation-editor";
import { saveQuiz } from "@/app/actions/quizzes";
import { getQuestionById } from "@/app/actions/questions";
import { Loader2, Save, Check } from "lucide-react";

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
    difficulty: string;
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
  const [questionBankRefreshTrigger, setQuestionBankRefreshTrigger] =
    useState(0);
  const [explanations, setExplanations] = useState<Record<number, string>>(
    () => {
      // Initialize explanations from quiz transitions if available
      const transitions = (initialQuiz as any).quiz_transitions || [];
      const initialExplanations: Record<number, string> = {};
      transitions.forEach((t: any) => {
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

  // Save function - only called when Save button is clicked
  const handleSaveQuiz = async () => {
    setSaveStatus("saving");

    const saveData: any = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map((q) => ({
        questionId: q.questionId,
        order: q.order,
      })),
      settings: quiz.settings,
      explanations: explanations,
    };

    const result = await saveQuiz(saveData);

    if (result.success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("idle");
      toast({
        title: "Failed to save quiz",
        description: result.error || "Please try again",
        variant: "destructive",
      });
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

  const addQuestions = (questions: any[]) => {
    // Filter out questions that already exist in the quiz
    const existingQuestionIds = quiz.questions.map((q) => q.questionId);
    const newQuestions = questions.filter(
      (q) => !existingQuestionIds.includes(q.id)
    );

    if (newQuestions.length === 0) {
      toast({
        title: "No new questions to add",
        description: "All selected questions are already part of the quiz",
        variant: "destructive",
      });
      return;
    }

    const addedCount = newQuestions.length;
    const skippedCount = questions.length - addedCount;

    const quizQuestions: QuizQuestion[] = newQuestions.map(
      (question, index) => ({
        id: `q-${Date.now()}-${index}`,
        questionId: question.id,
        order: quiz.questions.length + index,
        question,
      })
    );

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, ...quizQuestions],
    }));

    toast({
      title: "Questions added",
      description: `Added ${addedCount} question${addedCount !== 1 ? "s" : ""} to the quiz${
        skippedCount > 0 ? ` (${skippedCount} already existed)` : ""
      }`,
    });
  };

  const removeQuestion = (id: string) => {
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
      toast({
        title: "Quiz must have at least one question",
        variant: "destructive",
      });
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
    // Refresh the specific question data
    const result = await getQuestionById(editingQuestionId);
    if (result.success && result.data) {
      const { question: updatedQuestion } = result.data;

      // Update the question in the quiz state
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.questionId === editingQuestionId
            ? {
                ...q,
                question: {
                  id: updatedQuestion.id,
                  title: updatedQuestion.title,
                  content: updatedQuestion.content,
                  type: updatedQuestion.type,
                  difficulty:
                    updatedQuestion.difficulty_level <= 3
                      ? "easy"
                      : updatedQuestion.difficulty_level >= 7
                        ? "hard"
                        : "medium",
                  tags: updatedQuestion.tags || [],
                },
              }
            : q
        ),
      }));
    }
    setEditingQuestionId(null);
    // Trigger refresh of question bank
    setQuestionBankRefreshTrigger((prev) => prev + 1);
    // Allow updates after a brief delay
    setTimeout(() => setIsUpdatingQuestion(false), 100);
  }, [editingQuestionId]);

  return (
    <div className="flex h-full">
      {/* Left Panel - Question Bank */}
      <div className="w-1/2 border-r overflow-hidden">
        <QuestionBankWithFolders
          onAddQuestions={addQuestions}
          onEditQuestion={(questionId) => setEditingQuestionId(questionId)}
          addedQuestionIds={quiz.questions.map((q) => q.questionId)}
          onQuestionsImported={() => {
            // Refresh question bank is handled inside the component
            // Just show a toast to guide the user
            toast({
              title: "Questions imported successfully",
              description:
                "Your imported questions are now available in the question bank. You can select them to add to your quiz.",
            });
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
