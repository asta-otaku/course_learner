'use client'

import { useRouter } from 'next/navigation'
import { LessonForm } from './lesson-form'
import type { Lesson } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type LessonRow = Database['public']['Tables']['lessons']['Row']

interface LessonFormWrapperProps {
  lesson?: LessonRow
  curriculumId: string
  redirectPath?: string
}

export function LessonFormWrapper({
  lesson,
  curriculumId,
  redirectPath
}: LessonFormWrapperProps) {
  const router = useRouter()
  
  const handleSuccess = () => {
    if (redirectPath) {
      router.push(redirectPath)
    } else if (lesson) {
      router.push(`/lessons/${lesson.id}`)
    }
  }
  
  const handleCancel = () => {
    if (redirectPath) {
      router.push(redirectPath)
    } else if (lesson) {
      router.push(`/lessons/${lesson.id}`)
    } else {
      router.back()
    }
  }
  
  return (
    <LessonForm
      lesson={lesson as Lesson | undefined}
      curriculumId={curriculumId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}