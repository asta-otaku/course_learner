"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuestionPreview } from "@/components/resourceManagemement/questions/question-preview";
import { useState, useEffect } from "react";
import { useGetQuestionById } from "@/lib/api/queries";

interface QuestionPreviewModalProps {
  question: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAnswers?: boolean;
}

export function QuestionPreviewModal({
  question,
  open,
  onOpenChange,
  showAnswers = true,
}: QuestionPreviewModalProps) {
  const [fullQuestionData, setFullQuestionData] = useState<any>(null);

  // Use the query hook to fetch question data only when modal is open
  const {
    data: questionData,
    isLoading,
    error,
  } = useGetQuestionById(question?.id || "", {
    enabled: open && !!question?.id,
  });

  // Handle data transformation when query data is available
  useEffect(() => {
    if (questionData?.data) {
      const questionDataFromAPI = questionData.data;
      const answers = questionDataFromAPI.answers || [];

      // Transform the data to match QuestionPreview expectations
      let transformedQuestion: any = {
        ...questionDataFromAPI,
        // Map API response fields to expected format
        image_url: questionDataFromAPI.image,
        time_limit: questionDataFromAPI.timeLimit,
        difficulty_level: questionDataFromAPI.difficultyLevel,
        correct_feedback: questionDataFromAPI.metadata?.correctFeedback,
        incorrect_feedback: questionDataFromAPI.metadata?.incorrectFeedback,
        folder_id: questionDataFromAPI.folderId,
        is_public: questionDataFromAPI.isPublic,
        created_by: questionDataFromAPI.createdBy,
        created_at: questionDataFromAPI.createdAt,
        updated_at: questionDataFromAPI.updatedAt,
      };

      // Handle different question types
      const questionType = questionDataFromAPI.type as string;

      if (questionType === "multiple_choice" || questionType === "true_false") {
        transformedQuestion.answers = answers.map((a: any) => ({
          id: a.id,
          content: a.content,
          isCorrect: a.isCorrect || a.is_correct,
          explanation: a.explanation,
          order_index: a.orderIndex,
        }));
      } else if (
        questionType === "free_text" ||
        questionType === "short_answer"
      ) {
        transformedQuestion.acceptedAnswers = answers.map((a: any) => ({
          id: a.id,
          content: a.content,
          grading_criteria: a.gradingCriteria,
        }));
      } else if (questionType === "long_answer") {
        // For long answer, we might have grading criteria in the answer
        if (answers.length > 0) {
          transformedQuestion.gradingCriteria = {
            grading_criteria: answers[0]?.gradingCriteria,
            sample_answer: answers[0]?.sampleAnswer,
          };
        }
      } else if (questionType === "matching_pairs") {
        // For matching_pairs, prioritize metadata.matchingPairs over answers[0].matchingPairs
        let matchingPairs = null;
        if (questionDataFromAPI.metadata?.matchingPairs) {
          matchingPairs = questionDataFromAPI.metadata.matchingPairs;
        } else if (answers.length > 0 && answers[0]?.matchingPairs) {
          matchingPairs = answers[0].matchingPairs;
        }

        if (matchingPairs) {
          // Transform to use the interactive MatchingQuestion component format
          transformedQuestion.type = "matching"; // Change type to "matching" for the interactive component
          transformedQuestion.matching_pairs = matchingPairs.map(
            (pair: any, index: number) => ({
              id: pair.left + index, // Create a unique ID for each pair
              left: pair.left,
              right: pair.right,
            })
          );
        }
      } else if (questionType === "matching") {
        // Legacy matching questions store pairs in metadata
        if (questionDataFromAPI.metadata) {
          const metadata = questionDataFromAPI.metadata as any;
          transformedQuestion.matching_pairs = metadata.matching_pairs || [];
        }
      } else if (questionType === "coding") {
        // For coding questions, handle test cases and starter code
        if (questionDataFromAPI.metadata) {
          const metadata = questionDataFromAPI.metadata as any;
          transformedQuestion.testCases = metadata.testCases || [];
          transformedQuestion.starterCode = metadata.starterCode;
          transformedQuestion.sampleSolution = metadata.sampleSolution;
          transformedQuestion.language = metadata.language;
        }
      }
      setFullQuestionData(transformedQuestion);
    }
  }, [questionData]);

  // Use provided question data directly if it has complete data
  useEffect(() => {
    if (open && question) {
      if (
        question.answers ||
        question.acceptedAnswers ||
        question.matching_pairs ||
        question.testCases
      ) {
        setFullQuestionData(question);
        return;
      }
    }
  }, [open, question]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setFullQuestionData(null);
    }
  }, [open]);

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{question.title || question.content}</span>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    question.type === "multiple_choice" &&
                      "border-blue-500 text-blue-600",
                    question.type === "true_false" &&
                      "border-green-500 text-green-600",
                    question.type === "free_text" &&
                      "border-purple-500 text-purple-600",
                    question.type === "matching" &&
                      "border-orange-500 text-orange-600"
                  )}
                >
                  {question.type}
                </Badge>
                {question.difficulty_level && (
                  <Badge variant="outline">
                    Difficulty: {question.difficulty_level}/5
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Loading question details...
              </span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Error loading question details: {error.message}</p>
            </div>
          ) : fullQuestionData ? (
            <QuestionPreview
              question={fullQuestionData}
              showAnswers={showAnswers}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>Unable to load question details</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
