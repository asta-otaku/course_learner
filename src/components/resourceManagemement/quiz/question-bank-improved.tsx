'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Plus, Copy, Edit, Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Question, Difficulty, QuestionType } from '@/types/quiz'
import { getTypeLabel, getDifficultyColor } from '@/lib/quiz-utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from '@/components/ui/scroll-area'

// Mock function to simulate fetching questions
const fetchQuestions = async (): Promise<Question[]> => {
  // This would be replaced with actual Supabase query
  return []
}

interface QuestionBankImprovedProps {
  onAddQuestions: (questions: Question[]) => void
  onEditQuestion?: (questionId: string) => void
  onDuplicateQuestion?: (questionId: string) => void
  addedQuestionIds: string[]
  className?: string
}

export function QuestionBankImproved({
  onAddQuestions,
  onEditQuestion,
  onDuplicateQuestion,
  addedQuestionIds = [],
  className
}: QuestionBankImprovedProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  
  // Tag search state
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [visibleTagCount, setVisibleTagCount] = useState(5)
  const TAGS_PER_PAGE = 15

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      try {
        const data = await fetchQuestions()
        setQuestions(data)
      } catch (error) {
        console.error('Error loading questions:', error)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [])

  // Extract all unique tags from questions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    questions.forEach(q => {
      q.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [questions])

  // Filtered tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return allTags
    return allTags.filter(tag => 
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    )
  }, [allTags, tagSearchQuery])

  // Filter questions based on search and filters
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          question.title.toLowerCase().includes(query) ||
          question.content.toLowerCase().includes(query) ||
          question.tags?.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Difficulty and tags removed from schema

      return true
    })
  }, [questions, searchQuery, selectedDifficulty, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const selectAllVisible = () => {
    const visibleIds = filteredQuestions
      .filter(q => !addedQuestionIds.includes(q.id))
      .map(q => q.id)
    setSelectedQuestions(visibleIds)
  }

  const deselectAll = () => {
    setSelectedQuestions([])
  }

  const handleAddSelectedQuestions = () => {
    const questionsToAdd = questions.filter(q => selectedQuestions.includes(q.id))
    onAddQuestions(questionsToAdd)
    setSelectedQuestions([])
  }

  const handleDuplicateQuestion = async (questionId: string) => {
    if (!onDuplicateQuestion) return
    setDuplicating(questionId)
    try {
      await onDuplicateQuestion(questionId)
    } finally {
      setDuplicating(null)
    }
  }

  const availableSelectedCount = selectedQuestions.filter(
    id => !addedQuestionIds.includes(id)
  ).length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllVisible}
            disabled={filteredQuestions.every(q => addedQuestionIds.includes(q.id))}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={selectedQuestions.length === 0}
          >
            Deselect All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Difficulty</label>
            <Select value={selectedDifficulty} onValueChange={(value: any) => setSelectedDifficulty(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {selectedTags.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedTags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {selectedTags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{selectedTags.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select tags...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search tags..."
                    value={tagSearchQuery}
                    onValueChange={setTagSearchQuery}
                  />
                  <ScrollArea className="h-[300px]">
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup>
                      {filteredTags.slice(0, visibleTagCount).map((tag) => (
                        <CommandItem
                          key={tag}
                          onSelect={() => toggleTag(tag)}
                          className="cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedTags.includes(tag)}
                            className="mr-2"
                          />
                          {tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {filteredTags.length > visibleTagCount && (
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setVisibleTagCount(prev => prev + TAGS_PER_PAGE)}
                        >
                          Load more ({filteredTags.length - visibleTagCount} remaining)
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedQuestions.length > 0 && (
        <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">
            {availableSelectedCount} question{availableSelectedCount !== 1 ? 's' : ''} selected
            {selectedQuestions.length !== availableSelectedCount && 
              ` (${selectedQuestions.length - availableSelectedCount} already added)`
            }
          </span>
          <Button
            size="sm"
            onClick={handleAddSelectedQuestions}
            disabled={availableSelectedCount === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Selected to Quiz
          </Button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading questions...
          </div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => {
            const isExpanded = expandedQuestions.includes(question.id)
            const isSelected = selectedQuestions.includes(question.id)
            const isAdded = addedQuestionIds.includes(question.id)
            
            return (
              <Card 
                key={question.id} 
                className={cn(
                  "hover:shadow-md transition-shadow",
                  isSelected && !isAdded && "ring-2 ring-primary",
                  isAdded && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleQuestionSelection(question.id)}
                      disabled={isAdded}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{question.title}</h4>
                          <div className={cn(
                            "text-sm text-muted-foreground",
                            !isExpanded && "line-clamp-2"
                          )}>
                            {question.content}
                          </div>
                          {question.content.length > 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleQuestionExpansion(question.id)}
                              className="mt-1 h-auto p-0 text-xs"
                            >
                              {isExpanded ? (
                                <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                              ) : (
                                <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
                              )}
                            </Button>
                          )}
                          
                          {/* Question Structure Preview */}
                          {isExpanded && question.type !== 'open_ended' && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm">
                              <p className="font-medium mb-2">Answer Structure:</p>
                              {question.type === 'multiple_choice' && question.options && (
                                <ul className="space-y-1">
                                  {question.options.map((option, idx) => (
                                    <li key={idx} className={cn(
                                      "flex items-center gap-2",
                                      question.correctAnswer === option && "text-green-600 font-medium"
                                    )}>
                                      <span className="w-6">{String.fromCharCode(65 + idx)}.</span>
                                      {option}
                                      {question.correctAnswer === option && (
                                        <Badge variant="outline" className="text-xs ml-2">Correct</Badge>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {question.type === 'true_false' && (
                                <p>Correct Answer: <strong>{question.correctAnswer}</strong></p>
                              )}
                              {question.type === 'short_answer' && (
                                <p>Expected Answer: <strong>{question.correctAnswer}</strong></p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap mt-2">
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
                            {question.points && (
                              <Badge variant="outline" className="text-xs">
                                {question.points} pts
                              </Badge>
                            )}
                            {question.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {question.tags && question.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{question.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditQuestion?.(question.id)}
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
                          {isAdded ? (
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
                              onClick={() => onAddQuestions([question])}
                              variant={isSelected ? "secondary" : "default"}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No questions found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}