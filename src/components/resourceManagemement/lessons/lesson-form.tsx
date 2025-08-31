'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { TagInput } from '@/components/ui/tag-input'
import { X, Plus, Save, Loader2 } from 'lucide-react'
import { createLessonSchema, updateLessonSchema, type CreateLesson, type UpdateLesson } from '@/lib/validations/lesson'
import { createLesson, updateLesson, getLessonTags } from '@/app/actions/lessons'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type LessonRow = Database['public']['Tables']['lessons']['Row']

interface LessonFormProps {
  lesson?: LessonRow
  curriculumId: string
  onSuccess?: (lesson: LessonRow) => void
  onCancel?: () => void
  className?: string
}

export function LessonForm({
  lesson,
  curriculumId,
  onSuccess,
  onCancel,
  className,
}: LessonFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [objectives, setObjectives] = useState<string[]>(lesson?.learning_objectives || [])
  const [newObjective, setNewObjective] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  
  // Extract tags from metadata if editing
  const existingTags = lesson?.metadata && typeof lesson.metadata === 'object' && 'tags' in lesson.metadata
    ? (lesson.metadata as any).tags || []
    : []

  const isEditing = !!lesson

  const form = useForm<any>({
    resolver: isEditing ? zodResolver(updateLessonSchema) : zodResolver(createLessonSchema),
    defaultValues: {
      title: lesson?.title || '',
      curriculum_id: curriculumId,
      learning_objectives: lesson?.learning_objectives || [],
      tags: existingTags,
      ...(isEditing && { id: lesson.id }),
    },
  })

  // Update form when objectives change
  useEffect(() => {
    form.setValue('learning_objectives', objectives)
  }, [objectives, form])

  // Load tag suggestions on mount
  useEffect(() => {
    const loadTags = async () => {
      const result = await getLessonTags()
      if (result.success) {
        setTagSuggestions(result.data)
      }
    }
    loadTags()
  }, [])

  const addObjective = () => {
    if (newObjective.trim() && !objectives.includes(newObjective.trim())) {
      setObjectives([...objectives, newObjective.trim()])
      setNewObjective('')
    }
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CreateLesson | UpdateLesson) => {
    try {
      setIsSubmitting(true)
      
      const result = isEditing 
        ? await updateLesson(data as UpdateLesson)
        : await createLesson(data as CreateLesson)

      if (!result.success) {
        toast({
          title: `Error ${isEditing ? 'updating' : 'creating'} lesson`,
          description: (result as any).error,
          variant: 'destructive',
        })
        return
      }
      
      toast({
        title: isEditing ? 'Lesson updated' : 'Lesson created',
        description: `"${data.title}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
      })
      
      // Call onSuccess callback first
      onSuccess?.(result.data)
      
      // If creating a new lesson, navigate to it
      if (!isEditing && result.data) {
        router.push(`/lessons/${result.data.id}`)
      }
    } catch (error) {
      toast({
        title: `Error ${isEditing ? 'updating' : 'creating'} lesson`,
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h2 className="text-2xl font-bold">
          {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
        </h2>
        <p className="text-muted-foreground">
          {isEditing 
            ? 'Update the lesson details below.' 
            : 'Fill in the details to create a new lesson for this curriculum.'
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lesson title..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Learning Objectives */}
          <div className="space-y-3">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a learning objective..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
              />
              <Button type="button" onClick={addObjective} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {objectives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {objectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {objective}
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Order Index - Hidden from user, auto-calculated */}

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    suggestions={tagSuggestions}
                    placeholder="Add tags to categorize this lesson..."
                  />
                </FormControl>
                <FormDescription>
                  Add tags to help organize and find lessons
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}