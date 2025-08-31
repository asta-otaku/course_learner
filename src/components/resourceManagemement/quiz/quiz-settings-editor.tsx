'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'
import { updateQuiz } from '@/app/actions/quizzes'
import { Save } from 'lucide-react'

interface QuizSettings {
  timeLimit?: number
  randomizeQuestions: boolean
  showCorrectAnswers: boolean
  passingScore: number
  examMode?: boolean
  preventSkipping?: boolean
}

interface QuizSettingsEditorProps {
  quizId: string
  settings: QuizSettings
}

export function QuizSettingsEditor({ quizId, settings: initialSettings }: QuizSettingsEditorProps) {
  const [settings, setSettings] = useState<QuizSettings>(initialSettings)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateQuiz(quizId, { settings })
      
      if (result.success) {
        toast({
          title: 'Settings saved',
          description: 'Quiz settings have been updated successfully',
        })
      } else {
        toast({
          title: 'Failed to save settings',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>
            Configure how your quiz behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Limit */}
          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={settings.timeLimit || ''}
              onChange={(e) => setSettings({
                ...settings,
                timeLimit: e.target.value ? parseInt(e.target.value) : undefined
              })}
              placeholder="No time limit"
              min="1"
              max="180"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty for no time limit
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
              onValueChange={([value]) => setSettings({
                ...settings,
                passingScore: value
              })}
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
              onCheckedChange={(checked) => setSettings({
                ...settings,
                randomizeQuestions: checked
              })}
            />
          </div>

          {/* Show Correct Answers */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="showAnswers">Show Correct Answers</Label>
              <p className="text-sm text-muted-foreground">
                Display correct answers after quiz submission. If unchecked, students will see feedback after each question. If checked, answers are shown only after completing the entire quiz.
              </p>
            </div>
            <Switch
              id="showAnswers"
              checked={settings.showCorrectAnswers}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                showCorrectAnswers: checked
              })}
            />
          </div>

          {/* Prevent Skipping */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="preventSkipping">Prevent Skipping Questions</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, students must answer each question before moving to the next
              </p>
            </div>
            <Switch
              id="preventSkipping"
              checked={settings.preventSkipping || false}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                preventSkipping: checked
              })}
            />
          </div>

          {/* Exam Mode */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="examMode">Exam Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enforce time limits, prevent going back to previous questions, and disable review until after submission
              </p>
            </div>
            <Switch
              id="examMode"
              checked={settings.examMode || false}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                examMode: checked
              })}
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}