'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search } from 'lucide-react'

interface QuizFilterProps {
  categories?: Array<{ id: string; name: string }>
  grades?: Array<{ id: string; name: string }>
}

export function QuizFilter({ categories = [], grades = [] }: QuizFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || 'all')
  const [gradeId, setGradeId] = useState(searchParams.get('grade') || 'all')

  const activeFiltersCount = [
    search,
    status !== 'all',
    categoryId !== 'all',
    gradeId !== 'all',
  ].filter(Boolean).length

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Search
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    
    // Status
    if (status && status !== 'all') {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    
    // Category
    if (categoryId && categoryId !== 'all') {
      params.set('category', categoryId)
    } else {
      params.delete('category')
    }
    
    // Grade
    if (gradeId && gradeId !== 'all') {
      params.set('grade', gradeId)
    } else {
      params.delete('grade')
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/quizzes?${params.toString()}`)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setCategoryId('all')
    setGradeId('all')
    router.push('/quizzes')
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyFilters()
              }
            }}
            className="pl-10 w-[300px]"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Grade Filter */}
            {grades.length > 0 && (
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={gradeId} onValueChange={setGradeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}