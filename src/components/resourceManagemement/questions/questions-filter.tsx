"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useGetFolders } from "@/lib/api/queries";
import type { Database } from "@/lib/database.types";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];

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

interface QuestionsFilterProps {
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  filters?: {
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
}

export function QuestionsFilter({
  onFilterChange,
  onClearFilters,
  filters,
}: QuestionsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const { data: foldersResult } = useGetFolders();
  const folders = foldersResult?.data || [];

  // Provide default filters if not provided
  const defaultFilters = {
    search: "",
    type: "all",
    difficultyMin: "",
    difficultyMax: "",
    dateFrom: "",
    dateTo: "",
    folderId: "",
    sortBy: "",
    sortOrder: "",
  };

  const safeFilters = filters || defaultFilters;

  // Helper function to get parent ID that handles both field names
  const getParentId = (folder: any): string | null => {
    return folder.parentFolderId || folder.parent_id || null;
  };

  // Build folder hierarchy - use the flattened structure from the API response
  const rootFolders = folders.filter((f) => !getParentId(f));

  // Function to render folder options recursively
  const renderFolderOptions = (folderList: QuestionFolder[], level = 0) => {
    return folderList.map((folder) => {
      const childFolders = folders.filter((f) => getParentId(f) === folder.id);
      const indent = "—".repeat(level);

      return (
        <div key={folder.id}>
          <SelectItem value={folder.id}>
            {indent} {folder.name}
          </SelectItem>
          {childFolders.length > 0 &&
            renderFolderOptions(childFolders, level + 1)}
        </div>
      );
    });
  };

  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    safeFilters.dateFrom ? new Date(safeFilters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    safeFilters.dateTo ? new Date(safeFilters.dateTo) : undefined
  );

  const activeFilterCount = [
    safeFilters.search,
    safeFilters.type !== "all",
    safeFilters.difficultyMin,
    safeFilters.difficultyMax,
    safeFilters.dateFrom,
    safeFilters.dateTo,
    safeFilters.folderId,
  ].filter(Boolean).length;

  const applyFilters = () => {
    // Update date filters
    if (dateFrom) {
      onFilterChange("dateFrom", format(dateFrom, "yyyy-MM-dd"));
    }
    if (dateTo) {
      onFilterChange("dateTo", format(dateTo, "yyyy-MM-dd"));
    }
    setIsOpen(false);
  };

  const clearFilters = () => {
    onClearFilters();
    setDateFrom(undefined);
    setDateTo(undefined);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
            >
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
            <Label htmlFor="search">Search Questions</Label>
            <Input
              id="search"
              placeholder="Search by question content, feedback, or tags..."
              value={safeFilters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
            />
          </div>

          {/* Question Type Filter */}
          <div>
            <Label>Question Type</Label>
            <Select
              value={safeFilters.type}
              onValueChange={(value) => onFilterChange("type", value)}
            >
              <SelectTrigger>
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
            <Label>Min Difficulty</Label>
            <Select
              value={safeFilters.difficultyMin}
              onValueChange={(value) => onFilterChange("difficultyMin", value)}
            >
              <SelectTrigger>
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
            <Label>Max Difficulty</Label>
            <Select
              value={safeFilters.difficultyMax}
              onValueChange={(value) => onFilterChange("difficultyMax", value)}
            >
              <SelectTrigger>
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

          {/* Date Range */}
          <div>
            <Label>Date Range</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="dateFrom"
                  className="text-xs text-muted-foreground"
                >
                  From
                </Label>
                <DatePicker
                  date={dateFrom}
                  onSelect={setDateFrom}
                  placeholder="Start date"
                />
              </div>
              <div>
                <Label
                  htmlFor="dateTo"
                  className="text-xs text-muted-foreground"
                >
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

          {/* Folder Filter */}
          <div>
            <Label>Folder</Label>
            <Select
              value={safeFilters.folderId || "all"}
              onValueChange={(value) =>
                onFilterChange("folderId", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {renderFolderOptions(rootFolders)}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Filter */}
          <div>
            <Label>Sort By</Label>
            <Select
              value={safeFilters.sortBy}
              onValueChange={(value) => onFilterChange("sortBy", value)}
            >
              <SelectTrigger>
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
            <Label>Sort Order</Label>
            <Select
              value={safeFilters.sortOrder}
              onValueChange={(value) => onFilterChange("sortOrder", value)}
            >
              <SelectTrigger>
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

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
