import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

interface QuestionControlsProps {
  filters: {
    search: string;
    type: string;
    difficultyMin: string;
    difficultyMax: string;
    dateFrom: string;
    dateTo: string;
    folderId: string;
    sortBy: string;
    sortOrder: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onFilterChange: (key: string, value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onClearFilters: () => void;
}

const QUESTION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "fill_in_the_gap", label: "Fill in the Gap" },
  { value: "matching_pairs", label: "Matching Pairs" },
  { value: "free_text", label: "Free Text" },
];

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "1", label: "Very Easy" },
  { value: "2", label: "Easy" },
  { value: "3", label: "Medium" },
  { value: "4", label: "Hard" },
  { value: "5", label: "Very Hard" },
];

const SORT_BY_OPTIONS = [
  { value: "created_at", label: "Created Date" },
  { value: "updated_at", label: "Updated Date" },
  { value: "content", label: "Content" },
  { value: "type", label: "Type" },
  { value: "difficulty", label: "Difficulty" },
];

const SORT_ORDER_OPTIONS = [
  { value: "ASC", label: "Ascending" },
  { value: "DESC", label: "Descending" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function QuestionControls({
  filters,
  pagination,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onClearFilters,
}: QuestionControlsProps) {
  const hasActiveFilters =
    filters.search ||
    filters.type !== "all" ||
    filters.difficultyMin ||
    filters.difficultyMax ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.folderId;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Question Filters
          </h3>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Search Input */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Questions
          </label>
          <Input
            type="text"
            placeholder="Search by question content, feedback, or tags..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Question Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <Select
            value={filters.type}
            onValueChange={(value) => onFilterChange("type", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Min Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Difficulty
          </label>
          <Select
            value={filters.difficultyMin}
            onValueChange={(value) => onFilterChange("difficultyMin", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Min difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Max Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Difficulty
          </label>
          <Select
            value={filters.difficultyMax}
            onValueChange={(value) => onFilterChange("difficultyMax", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Max difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Date
          </label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Date To Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Date
          </label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange("dateTo", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Folder Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder
          </label>
          <Input
            type="text"
            placeholder="Folder ID (optional)"
            value={filters.folderId}
            onChange={(e) => onFilterChange("folderId", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Sort By Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange("sortBy", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select sort field" />
            </SelectTrigger>
            <SelectContent>
              {SORT_BY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort Order
          </label>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => onFilterChange("sortOrder", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select sort order" />
            </SelectTrigger>
            <SelectContent>
              {SORT_ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">entries</span>
          </div>

          <span className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-gray-700 px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
