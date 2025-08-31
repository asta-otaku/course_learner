'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import dynamic from 'next/dynamic'

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface Lesson {
  id: string
  title: string
  description?: string
  content?: string
  order_index: number
  section_id: string
  duration_minutes?: number
  quiz_ids?: string[]
}

interface LessonEditorProps {
  lesson: Lesson
  onSave: (lesson: Lesson) => void
  onCancel: () => void
}

export function LessonEditor({ lesson, onSave, onCancel }: LessonEditorProps) {
  const [formData, setFormData] = useState({
    title: lesson.title || '',
    description: lesson.description || '',
    content: lesson.content || '',
    duration_minutes: lesson.duration_minutes || 30,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSave = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.duration_minutes < 1) {
      newErrors.duration = 'Duration must be at least 1 minute'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave({
      ...lesson,
      title: formData.title.trim(),
      description: formData.description.trim(),
      content: formData.content.trim(),
      duration_minutes: formData.duration_minutes,
    })
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {lesson.id.startsWith('temp-') ? 'Add Lesson' : 'Edit Lesson'}
          </DialogTitle>
          <DialogDescription>
            Create engaging lesson content for your students
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (errors.title) {
                    setErrors({ ...errors, title: '' })
                  }
                }}
                placeholder="e.g., Introduction to Variables"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the lesson objectives..."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => {
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })
                  if (errors.duration) {
                    setErrors({ ...errors, duration: '' })
                  }
                }}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration}</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="flex-1 overflow-hidden">
            <div className="h-full" data-color-mode="light">
              <MDEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value || '' })}
                preview="live"
                height="100%"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {lesson.id.startsWith('temp-') ? 'Add' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}