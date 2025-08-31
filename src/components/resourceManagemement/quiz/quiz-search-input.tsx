'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchQuizzes } from '@/app/actions/quizzes'

interface QuizSearchInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function QuizSearchInput({
  value,
  onChange,
  disabled,
  placeholder = 'Search quizzes...',
}: QuizSearchInputProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)

  useEffect(() => {
    const searchForQuizzes = async () => {
      if (searchTerm.length < 2) {
        setQuizzes([])
        return
      }

      setLoading(true)
      try {
        const result = await searchQuizzes(searchTerm)
        if (result.success) {
          setQuizzes(result.data)
        }
      } catch (error) {
        console.error('Error searching quizzes:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchForQuizzes, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  useEffect(() => {
    // Load selected quiz details if value is provided
    if (value && !selectedQuiz) {
      searchQuizzes('', value).then((result) => {
        if (result.success && result.data.length > 0) {
          setSelectedQuiz(result.data[0])
        }
      })
    }
  }, [value, selectedQuiz])

  const handleSelect = (quiz: any) => {
    setSelectedQuiz(quiz)
    onChange(quiz.id)
    setOpen(false)
    setSearchTerm('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedQuiz ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedQuiz.title}</span>
              <Badge variant="secondary" className="ml-auto">
                {selectedQuiz.quiz_questions?.length || 0} questions
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search quizzes..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : quizzes.length === 0 ? (
              <CommandEmpty>
                {searchTerm.length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No quizzes found'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {quizzes.map((quiz) => (
                  <CommandItem
                    key={quiz.id}
                    value={quiz.id}
                    onSelect={() => handleSelect(quiz)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === quiz.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{quiz.title}</span>
                        <Badge
                          variant={
                            quiz.status === 'published' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {quiz.status}
                        </Badge>
                      </div>
                      {quiz.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {quiz.quiz_questions?.length || 0} questions
                        </span>
                        {quiz.created_by_name && (
                          <span className="text-xs text-muted-foreground">
                            • By {quiz.created_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}