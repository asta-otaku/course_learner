"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { MatchingQuestion } from "../quiz/matching-question";
import { MathPreview } from "../editor";
import { QuestionImage } from "@/components/ui/question-image";
import type { Database } from "@/lib/database.types";

type Question = Database["public"]["Tables"]["questions"]["Row"] & {
  answers?: any[];
  matching_pairs?: any[];
  acceptedAnswers?: any[];
  gradingCriteria?: any;
  testCases?: any[];
  starterCode?: string;
  language?: string;
  sampleSolution?: string;
};

interface QuestionPreviewProps {
  question: Partial<Question>;
  showAnswers?: boolean;
  onAnswer?: (answer: any) => void;
}

export function QuestionPreview({
  question,
  showAnswers = true,
  onAnswer,
}: QuestionPreviewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");
  const [codeAnswer, setCodeAnswer] = useState(
    (question as any).starterCode || ""
  );
  const [matchingAnswers, setMatchingAnswers] = useState<
    Record<string, string>
  >({});

  const handleSubmit = () => {
    if (onAnswer) {
      if (
        question.type === "multiple_choice" ||
        question.type === "true_false"
      ) {
        onAnswer(selectedAnswer);
      } else if (
        (question as any).type === "short_answer" ||
        (question as any).type === "long_answer" ||
        question.type === "free_text"
      ) {
        onAnswer(textAnswer);
      } else if ((question as any).type === "coding") {
        onAnswer(codeAnswer);
      } else if (
        (question as any).type === "matching" ||
        (question as any).type === "matching_pairs"
      ) {
        onAnswer(matchingAnswers);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {/* Question type badge moved to replace title */}
            {question.time_limit && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {question.time_limit}s
              </div>
            )}
          </div>
          <Badge variant="outline" className="capitalize">
            {question.type?.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Question Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Question Text */}
              <div className="prose prose-sm max-w-none">
                {question.content ? (
                  <MathPreview
                    content={question.content}
                    renderMarkdown={true}
                    className="text-base"
                  />
                ) : (
                  <p className="text-muted-foreground italic">
                    No question content provided
                  </p>
                )}
              </div>

              {/* Question Image */}
              {((question as any).image || question.image_url) && (
                <QuestionImage
                  src={(question as any).image || question.image_url || ""}
                  metadata={
                    (question as any).imageSettings ||
                    (question as any).image_settings
                      ? {
                          image_settings:
                            (question as any).imageSettings ||
                            (question as any).image_settings,
                        }
                      : (question.metadata as any)
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hint */}
        {question.hint && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Hint</p>
                  <div className="text-sm text-blue-800">
                    <MathPreview
                      content={question.hint}
                      renderMarkdown={true}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Answer Section */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>Your Answer</span>
            {/* Points removed from schema */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multiple Choice */}
          {question.type === "multiple_choice" && question.answers && (
            <RadioGroup
              value={selectedAnswer}
              onValueChange={setSelectedAnswer}
            >
              <div className="space-y-3">
                {question.answers.map((answer, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={index.toString()}
                      id={`answer-${index}`}
                    />
                    <Label
                      htmlFor={`answer-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedAnswer === index.toString()
                            ? "border-primary bg-primary/5"
                            : showAnswers &&
                                (answer.isCorrect || answer.is_correct)
                              ? "border-green-200 bg-green-50"
                              : showAnswers &&
                                  !(answer.isCorrect || answer.is_correct)
                                ? "border-red-100 bg-red-50/50"
                                : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <MathPreview
                              content={answer.content}
                              renderMarkdown={true}
                            />
                          </div>
                          {showAnswers && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {answer.isCorrect || answer.is_correct ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Correct
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-red-600 text-red-600"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Incorrect
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* True/False */}
          {question.type === "true_false" && question.answers && (
            <RadioGroup
              value={selectedAnswer}
              onValueChange={setSelectedAnswer}
            >
              <div className="grid grid-cols-2 gap-4">
                {question.answers.map((answer, index) => (
                  <div key={index}>
                    <RadioGroupItem
                      value={index.toString()}
                      id={`answer-${index}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`answer-${index}`}
                      className="cursor-pointer"
                    >
                      <div
                        className={`p-4 rounded-lg border text-center transition-colors ${
                          selectedAnswer === index.toString()
                            ? "border-primary bg-primary/5"
                            : showAnswers &&
                                (answer.isCorrect || answer.is_correct)
                              ? "border-green-200 bg-green-50"
                              : showAnswers &&
                                  !(answer.isCorrect || answer.is_correct)
                                ? "border-red-100 bg-red-50/50"
                                : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium">
                          <MathPreview
                            content={answer.content}
                            renderMarkdown={true}
                          />
                        </div>
                        {showAnswers && (
                          <div className="mt-2 flex items-center justify-center">
                            {answer.isCorrect || answer.is_correct ? (
                              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-red-600 text-red-600"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Incorrect
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Short Answer */}
          {(question as any).type === "short_answer" && (
            <div className="space-y-2">
              <Label htmlFor="short-answer">Your answer</Label>
              <Textarea
                id="short-answer"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Enter your answer here..."
                rows={3}
              />
              {showAnswers && (question as any).acceptedAnswers && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">
                      Accepted Answers:
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {(question as any).acceptedAnswers.map(
                      (answer: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white p-2 rounded border border-green-100"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 text-sm">
                            <MathPreview
                              content={answer.content}
                              renderMarkdown={true}
                              className="inline font-medium"
                            />
                            {answer.grading_criteria && (
                              <div className="text-muted-foreground text-xs mt-1">
                                Criteria: {answer.grading_criteria}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Long Answer */}
          {(question as any).type === "long_answer" && (
            <div className="space-y-2">
              <Label htmlFor="long-answer">Your answer</Label>
              <Textarea
                id="long-answer"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Write your detailed answer here..."
                rows={8}
              />
              {showAnswers && (question as any).gradingCriteria && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Grading Criteria:</h4>
                    <div className="text-sm whitespace-pre-wrap">
                      <MathPreview
                        content={
                          (question as any).gradingCriteria.grading_criteria
                        }
                        renderMarkdown={true}
                      />
                    </div>
                  </div>
                  {(question as any).gradingCriteria.sample_answer && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Sample Answer:</h4>
                      <div className="text-sm whitespace-pre-wrap">
                        <MathPreview
                          content={
                            (question as any).gradingCriteria.sample_answer
                          }
                          renderMarkdown={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free Text */}
          {question.type === "free_text" && (
            <div className="space-y-2">
              <Label htmlFor="free-text-answer">Your answer</Label>
              <Textarea
                id="free-text-answer"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Enter your answer here..."
                rows={5}
              />
              {showAnswers && (question as any).acceptedAnswers && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">
                      Accepted Answers:
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {(question as any).acceptedAnswers.map(
                      (answer: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white p-2 rounded border border-green-100"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 text-sm">
                            <MathPreview
                              content={answer.content}
                              renderMarkdown={true}
                              className="inline font-medium"
                            />
                            {answer.grading_criteria && (
                              <div className="text-muted-foreground text-xs mt-1">
                                Criteria: {answer.grading_criteria}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Matching */}
          {question.type === "matching" && question.matching_pairs && (
            <div className="space-y-4">
              <MatchingQuestion
                questionId={(question as any).id || "preview"}
                pairs={question.matching_pairs as any}
                value={matchingAnswers}
                onChange={setMatchingAnswers}
                disabled={false}
              />
              {showAnswers && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Correct Matches:</h4>
                  <div className="space-y-2">
                    {(question as any).matching_pairs.map((pair: any) => (
                      <div
                        key={pair.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="font-medium">
                          <MathPreview
                            content={pair.left}
                            renderMarkdown={true}
                            className="inline"
                          />
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div>
                          <MathPreview
                            content={pair.right}
                            renderMarkdown={true}
                            className="inline"
                          />
                        </div>
                        {matchingAnswers[pair.id] === pair.id && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coding */}
          {(question as any).type === "coding" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="code-answer">
                  Your code ({(question as any).language})
                </Label>
                <Textarea
                  id="code-answer"
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  placeholder="Write your code here..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              {showAnswers &&
                (question as any).testCases &&
                (question as any).testCases.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Test Cases:</h4>
                    {(question as any).testCases
                      .filter((tc: any) => !tc.isHidden || showAnswers)
                      .map((testCase: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Test Case {index + 1}
                              </span>
                              {testCase.isHidden && (
                                <Badge variant="secondary" className="text-xs">
                                  Hidden
                                </Badge>
                              )}
                              {testCase.description && (
                                <span className="text-sm text-muted-foreground">
                                  - {testCase.description}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Input:</p>
                                <pre className="bg-muted p-2 rounded text-xs">
                                  {testCase.input}
                                </pre>
                              </div>
                              <div>
                                <p className="font-medium">Expected Output:</p>
                                <pre className="bg-muted p-2 rounded text-xs">
                                  {testCase.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                    {(question as any).sampleSolution && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Sample Solution:</h4>
                        <pre className="text-sm overflow-auto">
                          {(question as any).sampleSolution}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Feedback */}
          {showAnswers &&
            (question.correct_feedback || question.incorrect_feedback) && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {question.correct_feedback && (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Correct Answer Feedback
                          </p>
                          <div className="text-sm text-green-800">
                            <MathPreview
                              content={question.correct_feedback}
                              renderMarkdown={true}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {question.incorrect_feedback && (
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Incorrect Answer Feedback
                          </p>
                          <div className="text-sm text-red-800">
                            <MathPreview
                              content={question.incorrect_feedback}
                              renderMarkdown={true}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Submit Button */}
          {onAnswer && (
            <div className="pt-4">
              <Button onClick={handleSubmit} className="w-full">
                Submit Answer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
