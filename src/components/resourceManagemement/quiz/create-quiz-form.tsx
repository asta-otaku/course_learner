"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuizSchema, type CreateQuizInput } from "@/lib/validations/quiz";
import { usePostQuiz } from "@/lib/api/mutations";
import { useGetQuestions } from "@/lib/api/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
interface CreateQuizFormProps {}

export function CreateQuizForm({}: CreateQuizFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Use the React Query mutation
  const createQuizMutation = usePostQuiz();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      description: "",
      instructions: "",
      tags: [],
      settings: {
        timeLimit: 30,
        randomizeQuestions: false,
        showCorrectAnswers: true,
        maxAttempts: 3,
        passingScore: 70,
        showFeedback: true,
        allowRetakes: true,
        allowReview: true,
        availableFrom: "",
        availableUntil: "",
      },
      questions: [],
    },
  });

  const onSubmit = async (data: CreateQuizInput) => {
    setError(null);

    try {
      // Filter out empty fields and only include filled values
      const filteredData: any = {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        settings: {
          timeLimit: data.settings.timeLimit,
          randomizeQuestions: data.settings.randomizeQuestions,
          showCorrectAnswers: data.settings.showCorrectAnswers,
          maxAttempts: data.settings.maxAttempts,
          passingScore: data.settings.passingScore,
          showFeedback: data.settings.showFeedback,
          allowRetakes: data.settings.allowRetakes,
          allowReview: data.settings.allowReview,
        },
      };

      // Only include tags if they exist and are not empty
      if (data.tags && data.tags.length > 0) {
        filteredData.tags = data.tags;
      }

      // Only include date fields if they are filled
      if (
        data.settings.availableFrom &&
        data.settings.availableFrom.trim() !== ""
      ) {
        filteredData.settings.availableFrom = data.settings.availableFrom;
      }
      if (
        data.settings.availableUntil &&
        data.settings.availableUntil.trim() !== ""
      ) {
        filteredData.settings.availableUntil = data.settings.availableUntil;
      }

      const result = await createQuizMutation.mutateAsync(filteredData);

      if (result.status === 200 || result.status === 201) {
        toast.success(result.data.message);
        router.push(`/admin/quizzes/${result.data?.data?.id}/edit`);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      setError("An unexpected error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details for your quiz. You'll add questions in
            the next step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter quiz title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe what this quiz covers"
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="instructions">Instructions *</Label>
            <Textarea
              id="instructions"
              {...register("instructions")}
              placeholder="Provide instructions for students taking this quiz"
              rows={3}
              className={errors.instructions ? "border-destructive" : ""}
            />
            {errors.instructions && (
              <p className="text-sm text-destructive mt-1">
                {errors.instructions.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>Configure how the quiz will behave</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes) *</Label>
            <Input
              id="timeLimit"
              type="number"
              {...register("settings.timeLimit", { valueAsNumber: true })}
              placeholder="Enter time limit in minutes"
              min={0}
              max={180}
              className={errors.settings?.timeLimit ? "border-destructive" : ""}
            />
            {errors.settings?.timeLimit && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.timeLimit.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="maxAttempts">Max Attempts *</Label>
            <Input
              id="maxAttempts"
              type="number"
              {...register("settings.maxAttempts", { valueAsNumber: true })}
              min={1}
              className={
                errors.settings?.maxAttempts ? "border-destructive" : ""
              }
            />
            {errors.settings?.maxAttempts && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.maxAttempts.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="passingScore">Passing Score (%) *</Label>
            <Input
              id="passingScore"
              type="number"
              {...register("settings.passingScore", { valueAsNumber: true })}
              min={0}
              max={100}
              className={
                errors.settings?.passingScore ? "border-destructive" : ""
              }
            />
            {errors.settings?.passingScore && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.passingScore.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="availableFrom">Available From</Label>
            <Input
              id="availableFrom"
              type="date"
              {...register("settings.availableFrom")}
              className={
                errors.settings?.availableFrom ? "border-destructive" : ""
              }
            />
            {errors.settings?.availableFrom && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.availableFrom.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="availableUntil">Available Until</Label>
            <Input
              id="availableUntil"
              type="date"
              {...register("settings.availableUntil")}
              className={
                errors.settings?.availableUntil ? "border-destructive" : ""
              }
            />
            {errors.settings?.availableUntil && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.availableUntil.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                {...register("settings.randomizeQuestions")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="randomizeQuestions" className="font-normal">
                Randomize question order for each attempt
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                {...register("settings.showCorrectAnswers")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="showCorrectAnswers" className="font-normal">
                Show correct answers after submission
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showFeedback"
                {...register("settings.showFeedback")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="showFeedback" className="font-normal">
                Show feedback to students
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowRetakes"
                {...register("settings.allowRetakes")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="allowRetakes" className="font-normal">
                Allow students to retake the quiz
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowReview"
                {...register("settings.allowReview")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="allowReview" className="font-normal">
                Allow students to review their answers
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={createQuizMutation.isPending}>
          {createQuizMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Quiz
        </Button>
      </div>
    </form>
  );
}
