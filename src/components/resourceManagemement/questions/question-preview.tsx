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
import type { Question } from "@/lib/validations/question";

interface QuestionPreviewProps {
  question: Partial<Question> & { [key: string]: any };
  showAnswers?: boolean;
  onAnswer?: (answer: any) => void;
}

export function QuestionPreview({
  question,
  showAnswers = false,
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
              {question.image_url && (
                <div className="mt-4">
                  <img
                    src={question.image_url}
                    alt="Question illustration"
                    className="max-w-full h-auto rounded-lg border shadow-sm"
                    style={{ maxHeight: "400px", objectFit: "contain" }}
                    onError={(e) => {
                      console.error(
                        "Failed to load question image:",
                        question.image_url
                      );
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
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
                  <p className="text-sm text-blue-800">{question.hint}</p>
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
                            ? "border-primaryBlue bg-primaryBlue/5"
                            : "border-border hover:border-primaryBlue/50"
                        }`}
                      >
                        <MathPreview
                          content={answer.content}
                          renderMarkdown={true}
                        />
                        {showAnswers && (
                          <div className="mt-2 flex items-center gap-2">
                            {answer.is_correct ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
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
                            ? "border-primaryBlue bg-primaryBlue/5"
                            : "border-border hover:border-primaryBlue/50"
                        }`}
                      >
                        <span className="font-medium">{answer.content}</span>
                        {showAnswers && answer.is_correct && (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-2" />
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
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Accepted Answers:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {(question as any).acceptedAnswers.map(
                      (answer: any, index: number) => (
                        <li key={index} className="text-sm">
                          {answer.content}
                          {answer.grading_criteria && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({answer.grading_criteria})
                            </span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
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
                    <p className="text-sm whitespace-pre-wrap">
                      {(question as any).gradingCriteria.grading_criteria}
                    </p>
                  </div>
                  {(question as any).gradingCriteria.sample_answer && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Sample Answer:</h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {(question as any).gradingCriteria.sample_answer}
                      </p>
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
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Accepted Answers:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {(question as any).acceptedAnswers.map(
                      (answer: any, index: number) => (
                        <li key={index} className="text-sm">
                          {answer.content}
                          {answer.grading_criteria && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({answer.grading_criteria})
                            </span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Matching */}
          {(question as any).type === "matching" &&
            (question as any).matching_pairs && (
              <div className="space-y-4">
                <MatchingQuestion
                  questionId={(question as any).id || "preview"}
                  pairs={(question as any).matching_pairs}
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
                          <span className="font-medium">{pair.left}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{pair.right}</span>
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

          {/* Matching Pairs */}
          {question.type === "matching_pairs" &&
            ((question as any).metadata?.matchingPairs ||
              (question as any).answers?.[0]?.matchingPairs) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-sm">Terms</h4>
                    <div className="space-y-2">
                      {(
                        (question as any).metadata?.matchingPairs ||
                        (question as any).answers[0].matchingPairs
                      ).map((pair: any, index: number) => (
                        <div
                          key={`left-${index}`}
                          className="p-3 border rounded-lg bg-blue-50 border-blue-200"
                        >
                          <span className="text-sm font-medium">
                            {pair.left}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-sm">Definitions</h4>
                    <div className="space-y-2">
                      {(
                        (question as any).metadata?.matchingPairs ||
                        (question as any).answers[0].matchingPairs
                      ).map((pair: any, index: number) => (
                        <div
                          key={`right-${index}`}
                          className="p-3 border rounded-lg bg-green-50 border-green-200"
                        >
                          <span className="text-sm">{pair.right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {showAnswers && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Correct Pairs:</h4>
                    <div className="space-y-2">
                      {(
                        (question as any).metadata?.matchingPairs ||
                        (question as any).answers[0].matchingPairs
                      ).map((pair: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="font-medium text-blue-700">
                            {pair.left}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-green-700">{pair.right}</span>
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
                          <p className="text-sm text-green-800">
                            {question.correct_feedback}
                          </p>
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
                          <p className="text-sm text-red-800">
                            {question.incorrect_feedback}
                          </p>
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
