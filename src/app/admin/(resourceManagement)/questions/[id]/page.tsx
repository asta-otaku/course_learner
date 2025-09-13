"use client";

import { useGetQuestionById } from "@/lib/api/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Edit, Hash } from "lucide-react";
import Link from "next/link";
import { QuestionPreview } from "@/components/resourceManagemement/questions";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

const typeColors: Record<string, string> = {
  multiple_choice: "bg-blue-100 text-blue-800",
  true_false: "bg-purple-100 text-purple-800",
  short_answer: "bg-green-100 text-green-800",
  long_answer: "bg-yellow-100 text-yellow-800",
  coding: "bg-orange-100 text-orange-800",
  free_text: "bg-indigo-100 text-indigo-800",
  matching: "bg-pink-100 text-pink-800",
  matching_pairs: "bg-pink-100 text-pink-800",
  fill_in_the_gap: "bg-teal-100 text-teal-800",
};

const typeLabels: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True/False",
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  coding: "Coding",
  free_text: "Free Text",
  matching: "Matching",
  matching_pairs: "Matching Pairs",
  fill_in_the_gap: "Fill in the Gap",
};

export default function QuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const { data: result, isLoading, error } = useGetQuestionById(id);

  // Show loading state
  if (isLoading) {
    return (
      <div className="mx-auto py-10 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !result?.data) {
    return (
      <div className="mx-auto py-10 max-w-4xl w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Question Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            The question you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/questions">Back to Questions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const question = result.data;
  const answers = question.answers || [];

  // Transform answers based on question type - preserve all original fields including image_url
  const questionData: any = { ...question };

  if (question.type === "multiple_choice" || question.type === "true_false") {
    questionData.answers = answers.map((a: any) => ({
      content: a.content,
      isCorrect: a.isCorrect,
      explanation: a.explanation,
      orderIndex: a.orderIndex,
    }));
  } else if (question.type === "matching_pairs") {
    // For matching_pairs, prioritize metadata.matchingPairs over answers[0].matchingPairs
    let matchingPairs = null;
    if (question.metadata?.matchingPairs) {
      matchingPairs = question.metadata.matchingPairs;
    } else if (answers.length > 0 && answers[0].matchingPairs) {
      matchingPairs = answers[0].matchingPairs;
    }

    if (matchingPairs) {
      // Transform to use the interactive MatchingQuestion component format
      questionData.type = "matching"; // Change type to "matching" for the interactive component
      questionData.matching_pairs = matchingPairs.map(
        (pair: any, index: number) => ({
          id: pair.left + index, // Create a unique ID for each pair
          left: pair.left,
          right: pair.right,
        })
      );
    }
  } else if (question.type === "free_text") {
    // Free text questions may have multiple accepted answers
    questionData.acceptedAnswers = answers.map((a: any) => ({
      content: a.content,
      gradingCriteria: a.gradingCriteria,
    }));
  } else if (question.type === "matching" && question.metadata) {
    // Legacy matching questions store pairs in metadata
    const metadata = question.metadata as any;
    questionData.matching_pairs = metadata.matching_pairs || [];
  }

  return (
    <div className="mx-auto py-10 max-w-4xl w-full">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/admin/questions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>
        <Button asChild>
          <Link href={`/admin/questions/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Question
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{question.content}</CardTitle>
              <CardDescription>
                Created on {new Date(question.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge className={typeColors[question.type]} variant="secondary">
              {typeLabels[question.type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Image */}
          {question.image && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Question Image
              </p>
              <div className="flex justify-center">
                <img
                  src={question.image}
                  alt="Question image"
                  className="max-w-full max-h-96 object-contain rounded-lg border"
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <div className="flex items-center gap-1">
                {question.difficultyLevel ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i < question.difficultyLevel!
                          ? "bg-primaryBlue"
                          : "bg-muted"
                      }`}
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Time Limit</p>
              <p className="font-medium">
                {question.timeLimit ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {question.timeLimit}s
                  </span>
                ) : (
                  <span className="text-muted-foreground">No limit</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Visibility</p>
              <Badge variant={question.isPublic ? "default" : "secondary"}>
                {question.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Hint */}
          {question.hint && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hint</p>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">{question.hint}</p>
              </Card>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Explanation</p>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">{question.explanation}</p>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Question Preview</CardTitle>
          <CardDescription>
            This is how the question will appear to students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionPreview question={questionData} />
        </CardContent>
      </Card>
    </div>
  );
}
