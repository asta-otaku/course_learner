'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getQuestions } from '@/app/actions/quizzes'
import { duplicateQuestion } from '@/app/actions/questions'
import { getQuestionsByIds } from '@/app/actions/questions/get-by-ids'
import { Search, Plus, Filter, Check, Copy, Upload, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { BulkUploadDialog } from '@/components/questions/bulk-upload-dialog'
import { QuestionEditDialog } from '@/components/questions/question-edit-dialog'

interface Question {
  id: string
  content: string
  type: string
}

interface QuestionBankProps {
  onAddQuestion: (question: Question) => void
  addedQuestionIds: string[]
  currentQuizId?: string
  refreshTrigger?: number
}

export function QuestionBank({ onAddQuestion, addedQuestionIds, currentQuizId, refreshTrigger }: QuestionBankProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [refreshTrigger])

  useEffect(() => {
    filterQuestions()
  }, [search, difficultyFilter, selectedTags, questions])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const data = await getQuestions()
      setQuestions(data)
      
      // Tags removed from schema
      setAllTags([])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (q) =>
          q.content.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Difficulty and tags removed from schema

    setFilteredQuestions(filtered)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'hard':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice'
      case 'short_answer':
        return 'Short Answer'
      case 'true_false':
        return 'True/False'
      case 'essay':
        return 'Essay'
      default:
        return type
    }
  }

  const handleBulkAddToQuiz = async (questionIds: string[]) => {
    // Fetch the full question data for the newly created questions
    const result = await getQuestionsByIds(questionIds)
    
    if (result.success && result.data) {
      // Add each question to the quiz immediately
      result.data.forEach(question => {
        if (!addedQuestionIds.includes(question.id)) {
          onAddQuestion(question as any)
        }
      })
      
      // Show success message
      toast({
        title: 'Questions added to quiz',
        description: `Added ${result.data.length} questions to the quiz`,
      })
    }
    
    // Refresh the questions list to show updated status
    await loadQuestions()
  }

  const handleDuplicateQuestion = async (questionId: string) => {
    setDuplicating(questionId)
    try {
      const result = await duplicateQuestion(questionId)
      if (result.success) {
        toast({
          title: 'Question duplicated',
          description: 'The question has been duplicated successfully',
        })
        loadQuestions() // Reload to show the new question
      } else {
        toast({
          title: 'Failed to duplicate question',
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
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Question Bank</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkUploadOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/questions/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Question
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Difficulty</label>
            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
              data-testid="difficulty-filter"
            >
              <SelectTrigger>
                <SelectValue placeholder="All difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <div
              className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] cursor-pointer"
              data-testid="tag-filter"
            >
              {allTags.length > 0 ? (
                allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading questions...
          </div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{question.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {question.content}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(question.type)}
                      </Badge>
                      <Badge
                        className={cn(
                          'text-xs',
                          getDifficultyColor(question.difficulty)
                        )}
                      >
                        {question.difficulty}
                      </Badge>
                      {question.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingQuestionId(question.id)}
                      title="Edit question"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicateQuestion(question.id)}
                      disabled={duplicating === question.id}
                      title="Duplicate question"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {addedQuestionIds.includes(question.id) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="cursor-not-allowed"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onAddQuestion(question)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No questions found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        currentQuizId={currentQuizId}
        onComplete={loadQuestions}
        onAddToQuiz={handleBulkAddToQuiz}
      />
      
      {editingQuestionId && (
        <QuestionEditDialog
          questionId={editingQuestionId}
          open={!!editingQuestionId}
          onOpenChange={(open) => {
            if (!open) setEditingQuestionId(null)
          }}
          onSuccess={() => {
            setEditingQuestionId(null)
            loadQuestions()
          }}
        />
      )}
    </div>
  )
}