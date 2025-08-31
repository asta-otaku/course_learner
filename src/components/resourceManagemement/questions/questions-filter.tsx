'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'free_text', label: 'Free Text' },
  { value: 'matching', label: 'Matching' },
]

const sortOptions = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Date Updated' },
  { value: 'content', label: 'Content' },
]

export function QuestionsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  // Parse current filters from URL
  const currentFilters = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type')?.split(',') || [],
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  }

  const [filters, setFilters] = useState(currentFilters)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  )

  const activeFilterCount = [
    filters.search,
    filters.type.length > 0,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length

  const handleTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.type.length > 0) params.set('type', filters.type.join(','))
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    if (dateFrom) params.set('dateFrom', format(dateFrom, 'yyyy-MM-dd'))
    if (dateTo) params.set('dateTo', format(dateTo, 'yyyy-MM-dd'))
    
    // Reset to page 1 when filters change
    params.set('page', '1')
    
    // Preserve page size
    const pageSize = searchParams.get('pageSize')
    if (pageSize) params.set('pageSize', pageSize)
    
    router.push(`/questions?${params.toString()}`)
    setIsOpen(false)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    // Preserve page size
    const pageSize = searchParams.get('pageSize')
    if (pageSize) params.set('pageSize', pageSize)
    
    router.push(`/questions?${params.toString()}`)
    setFilters({
      search: '',
      type: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      dateFrom: '',
      dateTo: '',
    })
    setDateFrom(undefined)
    setDateTo(undefined)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Questions</SheetTitle>
          <SheetDescription>
            Use these filters to find specific questions in your bank
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by content..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Question Types */}
          <div>
            <Label>Question Types</Label>
            <div className="mt-2 space-y-2">
              {questionTypes.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.value}
                    checked={filters.type.includes(type.value)}
                    onCheckedChange={() => handleTypeToggle(type.value)}
                  />
                  <Label
                    htmlFor={type.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Date Range</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                  From
                </Label>
                <DatePicker
                  date={dateFrom}
                  onSelect={setDateFrom}
                  placeholder="Start date"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                  To
                </Label>
                <DatePicker
                  date={dateTo}
                  onSelect={setDateTo}
                  placeholder="End date"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <Label>Sort By</Label>
            <div className="mt-2 space-y-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => setFilters({ ...filters, sortOrder: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}