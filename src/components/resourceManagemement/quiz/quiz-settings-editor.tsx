"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "react-toastify";
import { usePutQuiz } from "@/lib/api/mutations";
import { Save } from "lucide-react";

interface QuizSettings {
  timeLimit?: number;
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  maxAttempts: number;
  passingScore: number;
  showFeedback: boolean;
  allowRetakes: boolean;
  allowReview: boolean;
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
  const [settings, setSettings] = useState<QuizSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const putQuizMutation = usePutQuiz(quizId);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await putQuizMutation.mutateAsync({
        settings: {
          timeLimit: settings.timeLimit || undefined,
          randomizeQuestions: settings.randomizeQuestions,
          showCorrectAnswers: settings.showCorrectAnswers,
          maxAttempts: settings.maxAttempts,
          passingScore: settings.passingScore,
          showFeedback: settings.showFeedback,
          allowRetakes: settings.allowRetakes,
          allowReview: settings.allowReview,
          availableFrom: settings.availableFrom || undefined,
          availableUntil: settings.availableUntil || undefined,
        } as any,
      });

      if (result.data) {
        toast.success("Quiz settings have been updated successfully");
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
              placeholder="No time limit"
              min="1"
              max="180"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty for no time limit
            </p>
          </div>

          {/* Max Attempts */}
          <div className="space-y-2">
            <Label htmlFor="maxAttempts">Max Attempts</Label>
            <Input
              id="maxAttempts"
              type="number"
              value={settings.maxAttempts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxAttempts: parseInt(e.target.value) || 1,
                })
              }
              placeholder="1"
              min="1"
              max="10"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of attempts allowed per student
            </p>
          </div>

          {/* Passing Score */}
          <div className="space-y-2">
            <Label htmlFor="passingScore">
              Passing Score: {settings.passingScore}%
            </Label>
            <Slider
              id="passingScore"
              value={[settings.passingScore]}
              onValueChange={([value]) =>
                setSettings({
                  ...settings,
                  passingScore: value,
                })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Minimum score required to pass the quiz
            </p>
          </div>

          {/* Randomize Questions */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="randomize">Randomize Questions</Label>
              <p className="text-sm text-muted-foreground">
                Show questions in random order for each attempt
              </p>
            </div>
            <Switch
              id="randomize"
              checked={settings.randomizeQuestions}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  randomizeQuestions: checked,
                })
              }
            />
          </div>

          {/* Show Correct Answers */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="showAnswers">Show Correct Answers</Label>
              <p className="text-sm text-muted-foreground">
                Display correct answers after quiz submission
              </p>
            </div>
            <Switch
              id="showAnswers"
              checked={settings.showCorrectAnswers}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  showCorrectAnswers: checked,
                })
              }
            />
          </div>

          {/* Show Feedback */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="showFeedback">Show Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Display feedback after each question
              </p>
            </div>
            <Switch
              id="showFeedback"
              checked={settings.showFeedback}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  showFeedback: checked,
                })
              }
            />
          </div>

          {/* Allow Retakes */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="allowRetakes">Allow Retakes</Label>
              <p className="text-sm text-muted-foreground">
                Allow students to retake the quiz after completion
              </p>
            </div>
            <Switch
              id="allowRetakes"
              checked={settings.allowRetakes}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  allowRetakes: checked,
                })
              }
            />
          </div>

          {/* Allow Review */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="allowReview">Allow Review</Label>
              <p className="text-sm text-muted-foreground">
                Allow students to review their answers after submission
              </p>
            </div>
            <Switch
              id="allowReview"
              checked={settings.allowReview}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  allowReview: checked,
                })
              }
            />
          </div>

          {/* Available From */}
          <div className="space-y-2">
            <Label htmlFor="availableFrom">Available From</Label>
            <Input
              id="availableFrom"
              type="date"
              value={
                settings.availableFrom
                  ? settings.availableFrom.split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  availableFrom: e.target.value
                    ? `${e.target.value}T00:00:00.000Z`
                    : undefined,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              When the quiz becomes available to students
            </p>
          </div>

          {/* Available Until */}
          <div className="space-y-2">
            <Label htmlFor="availableUntil">Available Until</Label>
            <Input
              id="availableUntil"
              type="date"
              value={
                settings.availableUntil
                  ? settings.availableUntil.split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  availableUntil: e.target.value
                    ? `${e.target.value}T23:59:59.999Z`
                    : undefined,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              When the quiz becomes unavailable to students
            </p>
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
