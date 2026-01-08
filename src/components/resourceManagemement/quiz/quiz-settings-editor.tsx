"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "react-toastify";
import { usePutQuiz } from "@/lib/api/mutations";
import { Save } from "lucide-react";

interface QuizSettings {
  title?: string;
  description?: string;
  timeLimit?: number;
  randomizeQuestions: boolean;
  showCorrectAnswers?: boolean;
  maxAttempts?: number;
  passingScore: number;
  showFeedback?: boolean;
  allowRetakes?: boolean;
  allowReview?: boolean;
  feedbackMode:
    | "immediate"
    | "after_completion"
    | "delayed_random"
    | "manual_tutor_review";
  availableFrom?: string;
  availableUntil?: string;
}

interface QuizSettingsEditorProps {
  quizId: string;
  settings: QuizSettings;
}

export function QuizSettingsEditor({
  quizId,
  settings: initialSettings,
}: QuizSettingsEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<QuizSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const putQuizMutation = usePutQuiz(quizId);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await putQuizMutation.mutateAsync({
        title: settings.title || undefined,
        description: settings.description || undefined,
        settings: {
          timeLimit: settings.timeLimit || undefined,
          randomizeQuestions: settings.randomizeQuestions,
          passingScore: settings.passingScore,
          feedbackMode: settings.feedbackMode,
          availableFrom: settings.availableFrom || undefined,
          availableUntil: settings.availableUntil || undefined,
        } as any,
      });

      if (result.data) {
        toast.success(
          "Quiz information and settings have been updated successfully"
        );

        // Navigate back if tab parameter exists in URL
        const hasTabParam = searchParams.has("tab");
        if (hasTabParam) {
          setTimeout(() => {
            router.back();
          }, 1000);
        }
      } else {
        toast.error("Failed to save settings. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update the quiz title and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quiz Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              value={settings.title || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  title: e.target.value,
                })
              }
              placeholder="Enter quiz title"
            />
          </div>

          {/* Quiz Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.description || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  description: e.target.value,
                })
              }
              placeholder="Describe what this quiz covers"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>Configure how your quiz behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Limit */}
          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={settings.timeLimit || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  timeLimit: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder="0"
              min="0"
              max="180"
            />
            <p className="text-sm text-muted-foreground">
              Leave as 0 for no time limit
            </p>
          </div>

          {/* Passing Score */}
          <div className="space-y-2">
            <Label htmlFor="passingScore">Passing Score (%)</Label>
            <Input
              id="passingScore"
              type="number"
              value={settings.passingScore}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  passingScore: parseInt(e.target.value) || 0,
                })
              }
              min="0"
              max="100"
            />
            <p className="text-sm text-muted-foreground">
              Minimum score required to pass the quiz
            </p>
          </div>

          {/* Randomize Questions */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="randomizeQuestions"
              checked={settings.randomizeQuestions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  randomizeQuestions: e.target.checked,
                })
              }
              className="rounded border-gray-300"
            />
            <Label
              htmlFor="randomizeQuestions"
              className="font-normal cursor-pointer"
            >
              Randomize question order for each attempt
            </Label>
          </div>

          {/* Feedback Mode */}
          <div className="space-y-3">
            <div>
              <Label className="text-base">Feedback Mode</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose when and how students receive feedback on their answers
              </p>
            </div>

            <RadioGroup
              value={settings.feedbackMode}
              onValueChange={(value: any) =>
                setSettings({
                  ...settings,
                  feedbackMode: value,
                })
              }
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
                    Students see all feedback only after completing the entire
                    quiz
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
                    Feedback is delivered at a random time between the specified
                    hours after completion
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
                    Quiz is sent to assigned tutor for review and personalized
                    feedback
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
