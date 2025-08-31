'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createQuizSchema, type CreateQuizInput } from '@/lib/validations/quiz'
import { createQuiz } from '@/app/actions/quizzes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CreateQuizFormProps {}

export function CreateQuizForm({}: CreateQuizFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: '',
      description: '',
      settings: {
        timeLimit: 30,
        randomizeQuestions: false,
        showCorrectAnswers: true,
        passingScore: 70,
        preventSkipping: false,
      },
    },
  })

  const onSubmit = async (data: CreateQuizInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Submitting quiz data:', data)
      const result = await createQuiz(data)

      if (result.success) {
        toast({
          title: 'Quiz created successfully',
          description: 'You can now add questions to your quiz.',
        })
        router.push(`/quizzes/${result.data?.id}/edit`)
      } else {
        setError(result.error || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details for your quiz. You'll add questions in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter quiz title"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this quiz covers"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>
            Configure how the quiz will behave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timeLimit">
              Time Limit (minutes)
            </Label>
            <Input
              id="timeLimit"
              type="number"
              {...register('settings.timeLimit', { valueAsNumber: true })}
              placeholder="0 for no limit"
              min={0}
              max={180}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave as 0 for no time limit
            </p>
          </div>

          <div>
            <Label htmlFor="passingScore">
              Passing Score (%)
            </Label>
            <Input
              id="passingScore"
              type="number"
              {...register('settings.passingScore', { valueAsNumber: true })}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                {...register('settings.randomizeQuestions')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="randomizeQuestions" className="font-normal">
                Randomize question order for each attempt
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                {...register('settings.showCorrectAnswers')}
                className="rounded border-gray-300 mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="showCorrectAnswers" className="font-normal">
                    Show correct answers after submission
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>When enabled: Students complete the entire quiz before seeing any answers or feedback.</p>
                        <p className="mt-1">When disabled: Students see feedback immediately after answering each question.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls when students see the correct answers and feedback
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="preventSkipping"
                {...register('settings.preventSkipping')}
                className="rounded border-gray-300 mt-1"
              />
              <div>
                <Label htmlFor="preventSkipping" className="font-normal">
                  Prevent skipping questions
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  When enabled, students must answer each question before moving to the next
                </p>
              </div>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Quiz
        </Button>
      </div>
    </form>
  )
}