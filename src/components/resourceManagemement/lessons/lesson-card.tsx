'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { updateLessonPublishStatus } from '@/app/actions/lessons'
import { 
  BookOpen, 
  Clock, 
  Users, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  EyeOff,
  Globe,
  EyeOffIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type LessonRow = Database['public']['Tables']['lessons']['Row']

interface LessonCardProps {
  lesson: LessonRow
  quizCount?: number
  className?: string
  onEdit?: (lesson: LessonRow) => void
  onDelete?: (lesson: LessonRow) => void
  onView?: (lesson: LessonRow) => void
  onAddQuiz?: (lesson: LessonRow) => void
  onPublishStatusChange?: (lesson: LessonRow) => void
  showActions?: boolean
  canEdit?: boolean
}

export function LessonCard({
  lesson,
  quizCount = 0,
  className,
  onEdit,
  onDelete,
  onView,
  onAddQuiz,
  onPublishStatusChange,
  showActions = true,
  canEdit = false,
}: LessonCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishLoading, setIsPublishLoading] = useState(false)

  const handleAction = async (action: () => void) => {
    setIsLoading(true)
    try {
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishToggle = async () => {
    setIsPublishLoading(true)
    try {
      const newStatus = !lesson.is_published
      const result = await updateLessonPublishStatus(lesson.id, newStatus)
      
      if (!result.success) {
        toast({
          title: 'Failed to update lesson',
          description: (result as any).error,
          variant: 'destructive',
        })
        return
      }
      
      toast({
        title: `Lesson ${newStatus ? 'published' : 'unpublished'}`,
        description: `"${lesson.title}" is now ${newStatus ? 'visible to students' : 'hidden from students'}.`,
      })
      
      // Call the callback to refresh the lesson data
      if (onPublishStatusChange) {
        onPublishStatusChange(result.data)
      }
    } catch (error) {
      toast({
        title: 'Failed to update lesson',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsPublishLoading(false)
    }
  }

  const getDifficultyColor = (level: number | null) => {
    if (!level) return 'bg-gray-100 text-gray-800'
    if (level <= 2) return 'bg-green-100 text-green-800'
    if (level <= 3) return 'bg-yellow-100 text-yellow-800'
    if (level <= 4) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getDifficultyLabel = (level: number | null) => {
    if (!level) return 'Not Set'
    if (level <= 2) return 'Easy'
    if (level <= 3) return 'Medium'
    if (level <= 4) return 'Hard'
    return 'Expert'
  }

  return (
    <Card className={cn(
      'group hover:shadow-md transition-shadow relative overflow-hidden',
      !lesson.is_published && "border-yellow-200 bg-yellow-50/50",
      className
    )}>
      {!lesson.is_published && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
              {lesson.title}
            </CardTitle>
            {lesson.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {lesson.description}
              </CardDescription>
            )}
            {!lesson.is_published && (
              <div className="flex items-center gap-1 mt-2">
                <EyeOff className="h-3 w-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-600">Not visible to students</span>
              </div>
            )}
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isLoading}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onView && (
                  <DropdownMenuItem onClick={() => handleAction(() => onView(lesson))}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Lesson
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => handleAction(() => onEdit(lesson))}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Lesson
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem 
                    onClick={handlePublishToggle}
                    disabled={isPublishLoading}
                  >
                    {lesson.is_published ? (
                      <>
                        <EyeOffIcon className="h-4 w-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onAddQuiz && (
                  <DropdownMenuItem onClick={() => handleAction(() => onAddQuiz(lesson))}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Quiz
                  </DropdownMenuItem>
                )}
                {(onEdit || onAddQuiz || canEdit) && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => handleAction(() => onDelete(lesson))}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Lesson
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Lesson Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {lesson.duration_minutes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{lesson.duration_minutes} min</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{quizCount} quiz{quizCount !== 1 ? 'es' : ''}</span>
              </div>
            </div>
            
            {lesson.difficulty_level && (
              <Badge className={getDifficultyColor(lesson.difficulty_level)}>
                {getDifficultyLabel(lesson.difficulty_level)}
              </Badge>
            )}
          </div>

          {/* Learning Objectives */}
          {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Learning Objectives</h4>
              <ul className="space-y-1">
                {lesson.learning_objectives.slice(0, 3).map((objective, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="line-clamp-1">{objective}</span>
                  </li>
                ))}
                {lesson.learning_objectives.length > 3 && (
                  <li className="text-sm text-muted-foreground">
                    +{lesson.learning_objectives.length - 3} more objectives
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {lesson.prerequisites && lesson.prerequisites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Prerequisites</h4>
              <div className="flex flex-wrap gap-1">
                {lesson.prerequisites.slice(0, 3).map((prereq, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {prereq}
                  </Badge>
                ))}
                {lesson.prerequisites.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{lesson.prerequisites.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Badge 
              variant={lesson.is_published ? "default" : "secondary"} 
              className={cn(
                "text-xs",
                lesson.is_published 
                  ? "bg-green-500/10 text-green-700 border-green-200" 
                  : "bg-yellow-500/10 text-yellow-700 border-yellow-200"
              )}
            >
              {lesson.is_published ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Published
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Order: {lesson.order_index + 1}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}