"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface QuestionPreviewModalProps {
  question: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionPreviewModal({
  question,
  open,
  onOpenChange,
}: QuestionPreviewModalProps) {
  if (!question) return null;

  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple_choice":
      case "true_false":
        return (
          <div className="space-y-3">
            {question.answers?.map((answer: any, index: number) => (
              <Card
                key={index}
                className={cn(
                  "border p-3",
                  answer.is_correct && "border-green-500 bg-green-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                      answer.is_correct
                        ? "border-green-500 text-green-600"
                        : "border-gray-300"
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{answer.content}</p>
                    {answer.explanation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {answer.explanation}
                      </p>
                    )}
                  </div>
                  {answer.is_correct && (
                    <Badge variant="default" className="bg-green-500">
                      Correct
                    </Badge>
                  )}
                </div>
              </Card>
            )) || <p className="text-muted-foreground">No answers defined</p>}
          </div>
        );

      case "free_text":
        return (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Accepted Answers:</h4>
              <div className="flex flex-wrap gap-2">
                {question.acceptedAnswers?.map((answer: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {answer.content}
                  </Badge>
                )) || (
                  <p className="text-muted-foreground">
                    No accepted answers defined
                  </p>
                )}
              </div>
            </div>
            {question.acceptedAnswers?.[0]?.grading_criteria && (
              <div>
                <h4 className="text-sm font-medium mb-1">Grading Criteria:</h4>
                <p className="text-sm text-muted-foreground">
                  {question.acceptedAnswers[0].grading_criteria}
                </p>
              </div>
            )}
          </div>
        );

      case "matching":
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium mb-2">Matching Pairs:</h4>
            {question.matching_pairs?.map((pair: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <Card className="flex-1 p-2">
                  <p className="text-sm">{pair.left}</p>
                </Card>
                <span className="text-muted-foreground">↔</span>
                <Card className="flex-1 p-2">
                  <p className="text-sm">{pair.right}</p>
                </Card>
              </div>
            )) || (
              <p className="text-muted-foreground">No matching pairs defined</p>
            )}
          </div>
        );

      case "matching_pairs":
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-medium mb-2">Matching Pairs:</h4>
            {(
              question.metadata?.matchingPairs ||
              question.answers?.[0]?.matchingPairs
            )?.map((pair: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <Card className="flex-1 p-2 bg-blue-50 border-blue-200">
                  <p className="text-sm font-medium">{pair.left}</p>
                </Card>
                <span className="text-muted-foreground">↔</span>
                <Card className="flex-1 p-2 bg-green-50 border-green-200">
                  <p className="text-sm">{pair.right}</p>
                </Card>
              </div>
            )) || (
              <p className="text-muted-foreground">No matching pairs defined</p>
            )}
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unknown question type</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{question.title}</span>
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

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Question Content */}
            <div>
              <h3 className="text-sm font-medium mb-2">Question:</h3>
              <Card className="p-4">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {question.content}
                  </ReactMarkdown>
                </div>
                {question.image_url && (
                  <div className="mt-4">
                    <img
                      src={question.image_url}
                      alt="Question illustration"
                      className="max-w-full h-auto rounded-lg border shadow-sm"
                      style={{ maxHeight: "400px", objectFit: "contain" }}
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Hint */}
            {question.hint && (
              <div>
                <h3 className="text-sm font-medium mb-2">Hint:</h3>
                <Card className="p-4 bg-blue-50">
                  <p className="text-sm">{question.hint}</p>
                </Card>
              </div>
            )}

            {/* Question Type Specific Content */}
            <div>
              <h3 className="text-sm font-medium mb-2">Answer Options:</h3>
              {renderQuestionContent()}
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <h3 className="text-sm font-medium mb-2">Explanation:</h3>
                <Card className="p-4 bg-amber-50">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {question.explanation}
                    </ReactMarkdown>
                  </div>
                </Card>
              </div>
            )}

            {/* Feedback */}
            {(question.correct_feedback || question.incorrect_feedback) && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium mb-2">Feedback:</h3>
                {question.correct_feedback && (
                  <Card className="p-3 bg-green-50 border-green-200">
                    <p className="text-sm">
                      <span className="font-medium text-green-700">
                        Correct:{" "}
                      </span>
                      {question.correct_feedback}
                    </p>
                  </Card>
                )}
                {question.incorrect_feedback && (
                  <Card className="p-3 bg-red-50 border-red-200">
                    <p className="text-sm">
                      <span className="font-medium text-red-700">
                        Incorrect:{" "}
                      </span>
                      {question.incorrect_feedback}
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">
                Additional Information:
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time Limit: </span>
                  {question.time_limit
                    ? `${question.time_limit} seconds`
                    : "No limit"}
                </div>
                <div>
                  <span className="text-muted-foreground">Public: </span>
                  {question.is_public ? "Yes" : "No"}
                </div>
                {question.tags && question.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Tags: </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {question.tags.map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
