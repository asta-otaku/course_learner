"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuizSchema, type CreateQuizInput } from "@/lib/validations/quiz";
import { usePostQuiz } from "@/lib/api/mutations";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    control,
    formState: { errors },
  } = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      settings: {
        timeLimit: 0,
        randomizeQuestions: false,
        passingScore: 80,
        feedbackMode: "immediate",
        availableFrom: "",
        availableUntil: "",
      },
    },
  });

  const onSubmit = async (data: CreateQuizInput) => {
    setError(null);

    try {
      // Build the payload conforming to QuizUpdateData
      const payload: any = {
        title: data.title,
        description: data.description,
      };

      // Add tags if provided
      if (data.tags && data.tags.length > 0) {
        payload.tags = data.tags;
      }

      // Add settings if any are provided
      if (data.settings) {
        const settings: any = {};

        if (data.settings.timeLimit !== undefined) {
          settings.timeLimit = data.settings.timeLimit;
        }
        if (data.settings.randomizeQuestions !== undefined) {
          settings.randomizeQuestions = data.settings.randomizeQuestions;
        }
        if (data.settings.passingScore !== undefined) {
          settings.passingScore = data.settings.passingScore;
        }
        if (data.settings.feedbackMode) {
          settings.feedbackMode = data.settings.feedbackMode;
        }
        if (data.settings.availableFrom?.trim()) {
          settings.availableFrom = data.settings.availableFrom;
        }
        if (data.settings.availableUntil?.trim()) {
          settings.availableUntil = data.settings.availableUntil;
        }

        // Only include settings if at least one setting is defined
        if (Object.keys(settings).length > 0) {
          payload.settings = settings;
        }
      }

      const result = await createQuizMutation.mutateAsync(payload);

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>Configure how the quiz will behave</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              {...register("settings.timeLimit", { valueAsNumber: true })}
              placeholder="0"
              min={0}
              max={180}
              className={errors.settings?.timeLimit ? "border-destructive" : ""}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave as 0 for no time limit
            </p>
            {errors.settings?.timeLimit && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.timeLimit.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="passingScore">Passing Score (%)</Label>
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

          <div className="space-y-3">
            <div>
              <Label className="text-base">Feedback Mode</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose when and how students receive feedback on their answers
              </p>
            </div>

            <Controller
              name="settings.feedbackMode"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem
                      value="immediate"
                      id="immediate"
                      className="mt-1"
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="immediate"
                        className="font-medium cursor-pointer"
                      >
                        Immediate Feedback
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Students see correct answers immediately after answering
                        each question
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem
                      value="after_completion"
                      id="after_completion"
                      className="mt-1"
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="after_completion"
                        className="font-medium cursor-pointer"
                      >
                        After Completion
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Students see all feedback only after completing the
                        entire quiz
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem
                      value="delayed_random"
                      id="delayed_random"
                      className="mt-1"
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="delayed_random"
                        className="font-medium cursor-pointer"
                      >
                        Delayed Random Feedback
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Feedback is delivered at a random time between the
                        specified hours after completion
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem
                      value="manual_tutor_review"
                      id="manual_tutor_review"
                      className="mt-1"
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="manual_tutor_review"
                        className="font-medium cursor-pointer"
                      >
                        Manual Tutor Review
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Quiz is sent to assigned tutor for review and
                        personalized feedback
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.settings?.feedbackMode && (
              <p className="text-sm text-destructive mt-1">
                {errors.settings.feedbackMode.message}
              </p>
            )}
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
