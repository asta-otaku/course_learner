"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Copy,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Loader2,
  FileUp,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getTypeLabel, getDifficultyColor } from "@/lib/quiz-utils";
import { getQuestions, getAllQuestionIds } from "@/app/actions/questions";
import { toast } from "@/components/ui/use-toast";
import {
  getFolderTree,
  getFolderContents,
  getFolderQuestionCounts,
} from "@/app/actions/question-folders";
import { FolderTree } from "../questions";
import type { Database } from "@/lib/database.types";
import { BulkUploadDialog } from "../questions/bulk-upload-dialog";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];
type DBQuestion = Database["public"]["Tables"]["questions"]["Row"];

interface QuestionBankWithFoldersProps {
  onAddQuestions: (questions: DBQuestion[]) => void;
  onEditQuestion?: (questionId: string) => void;
  onDuplicateQuestion?: (questionId: string) => void;
  addedQuestionIds: string[];
  className?: string;
  onQuestionsImported?: () => void;
}

export function QuestionBankWithFolders({
  onAddQuestions,
  onEditQuestion,
  onDuplicateQuestion,
  addedQuestionIds = [],
  className,
  onQuestionsImported,
}: QuestionBankWithFoldersProps) {
  // State
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>(
    {}
  );
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const pageSize = 20;

  // Load folders and question counts on mount
  useEffect(() => {
    loadFolders();
    loadQuestionCounts();
  }, []);

  // Load questions when folder or filters change (reset to first page)
  useEffect(() => {
    setCurrentPage(1);
    setQuestions([]); // Clear existing questions when filters change
    loadQuestions(true);
  }, [
    selectedFolderId,
    searchQuery,
    selectedDifficulty,
    selectedType,
    selectedTags,
  ]);

  // Load more questions when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadQuestions(false); // Append to existing questions
    }
  }, [currentPage]);

  const loadFolders = async () => {
    try {
      const result = await getFolderTree();
      if (result && result.success) {
        setFolders(result.data);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const loadQuestionCounts = async () => {
    try {
      const result = await getFolderQuestionCounts();
      if (result && result.success) {
        setQuestionCounts(result.data.folderCounts);
        setTotalQuestions(result.data.totalQuestions);
      }
    } catch (error) {
      console.error("Error loading question counts:", error);
    }
  };

  const getQuestionFilters = () => {
    const filters: any = {
      folder_id: selectedFolderId,
      search: searchQuery || undefined,
      sortBy: "created_at",
      sortOrder: "desc",
    };

    // Add difficulty filter
    if (selectedDifficulty !== "all") {
      const difficultyMap: Record<string, { min: number; max: number }> = {
        easy: { min: 1, max: 3 },
        medium: { min: 4, max: 7 },
        hard: { min: 8, max: 10 },
      };
      if (difficultyMap[selectedDifficulty]) {
        filters.difficulty_level = difficultyMap[selectedDifficulty];
      }
    }

    // Add type filter
    if (selectedType !== "all") {
      filters.type = [selectedType];
    }

    // Add tags filter
    if (selectedTags.length > 0) {
      filters.tags = selectedTags;
    }

    return filters;
  };

  const loadQuestions = async (replace: boolean = true) => {
    setLoading(true);
    try {
      const filters = getQuestionFilters();
      const result = await getQuestions({
        ...filters,
        page: currentPage,
        limit: pageSize,
      });

      if (result.success) {
        if (replace) {
          setQuestions(result.data.questions);
        } else {
          // Append to existing questions
          setQuestions((prev) => [...prev, ...result.data.questions]);
        }
        setTotalCount(result.data.total);
        setTotalPages(result.data.totalPages);
      } else {
        console.error("Failed to load questions:", result.error);
        if (replace) {
          setQuestions([]);
        }
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      if (replace) {
        setQuestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAllQuestions = async () => {
    if (totalCount > 500) {
      toast({
        title: "Too many questions",
        description: `Loading ${totalCount} questions may be slow. Consider using filters to narrow your search.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAll(true);
    try {
      const filters = getQuestionFilters();
      // Load all questions without pagination
      const result = await getQuestions({
        ...filters,
        page: 1,
        limit: Math.min(totalCount, 2000), // Cap at 2000 for performance
      });

      if (result.success) {
        setQuestions(result.data.questions);
        // Reset pagination to show all loaded questions
        setCurrentPage(1);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error loading all questions:", error);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setCurrentPage(1);
    setSelectedQuestions([]);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAllVisible = async () => {
    try {
      // Get current filters
      const filters = getQuestionFilters();

      // Get all question IDs matching current filters
      const result = await getAllQuestionIds(filters);
      if (result.success) {
        // Filter out already added questions
        const availableIds = result.data.filter(
          (id) => !addedQuestionIds.includes(id)
        );

        // Warn if selecting a large number
        if (availableIds.length > 500) {
          const proceed = confirm(
            `You are about to select ${availableIds.length} questions. This may be slow. Continue?`
          );
          if (!proceed) return;
        }

        setSelectedQuestions(availableIds);

        // Only load all questions if user specifically wants to see them and count is reasonable
        if (
          availableIds.length > questions.length &&
          availableIds.length <= 500
        ) {
          // Load all questions to display them
          await loadAllQuestions();
        }

        toast({
          title: "Questions selected",
          description: `Selected ${availableIds.length} question${availableIds.length !== 1 ? "s" : ""}. ${
            availableIds.length > questions.length
              ? "Click 'Load All Questions' to view all selected questions."
              : ""
          }`,
        });
      }
    } catch (error) {
      console.error("Error selecting all questions:", error);
      toast({
        title: "Error",
        description: "Failed to select all questions",
        variant: "destructive",
      });
    }
  };

  const increasePageSize = async () => {
    setIsLoadingAll(true);
    try {
      const newPageSize = Math.min(pageSize * 5, 100); // Increase to 100 questions per page
      const filters = getQuestionFilters();
      const result = await getQuestions({
        ...filters,
        page: 1,
        limit: newPageSize,
      });

      if (result.success) {
        setQuestions(result.data.questions);
        setCurrentPage(1);
        setTotalPages(Math.ceil(result.data.total / newPageSize));

        toast({
          title: "Page size increased",
          description: `Now showing up to ${newPageSize} questions per page`,
        });
      }
    } catch (error) {
      console.error("Error increasing page size:", error);
      toast({
        title: "Error",
        description: "Failed to increase page size",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAll(false);
    }
  };

  const deselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleAddSelectedQuestions = async () => {
    if (selectedQuestions.length === 0) return;

    // If we have more selected than loaded, fetch them in chunks
    if (selectedQuestions.length > questions.length) {
      setIsLoadingAll(true);
      try {
        // For large selections, fetch in smaller chunks
        const chunkSize = 100;
        const allQuestions: DBQuestion[] = [];

        for (let i = 0; i < selectedQuestions.length; i += chunkSize) {
          const chunk = selectedQuestions.slice(i, i + chunkSize);
          const filters = {
            ...getQuestionFilters(),
            question_ids: chunk, // Pass specific IDs if supported by backend
          };

          const result = await getQuestions({
            ...filters,
            page: 1,
            limit: chunkSize,
          });

          if (result.success) {
            const chunkQuestions = result.data.questions.filter((q) =>
              chunk.includes(q.id)
            );
            allQuestions.push(...chunkQuestions);
          }
        }

        onAddQuestions(allQuestions);
        setSelectedQuestions([]);

        toast({
          title: "Questions added",
          description: `Successfully added ${allQuestions.length} question${allQuestions.length !== 1 ? "s" : ""}`,
        });

        // Reload current page view
        await loadQuestions();
      } catch (error) {
        console.error("Error adding selected questions:", error);
        toast({
          title: "Error",
          description: "Failed to add selected questions",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAll(false);
      }
    } else {
      // All selected questions are already loaded
      const questionsToAdd = questions.filter((q) =>
        selectedQuestions.includes(q.id)
      );
      onAddQuestions(questionsToAdd);
      setSelectedQuestions([]);

      toast({
        title: "Questions added",
        description: `Successfully added ${questionsToAdd.length} question${questionsToAdd.length !== 1 ? "s" : ""}`,
      });
    }
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    if (!onDuplicateQuestion) return;
    setDuplicating(questionId);
    try {
      await onDuplicateQuestion(questionId);
      // Reload questions after duplication
      await loadQuestions();
    } finally {
      setDuplicating(null);
    }
  };

  const availableSelectedCount = selectedQuestions.filter(
    (id) => !addedQuestionIds.includes(id)
  ).length;

  // Map difficulty level to difficulty string
  const getDifficultyString = (level: number): any => {
    if (level <= 3) return "easy";
    if (level <= 7) return "medium";
    return "hard";
  };

  // State for all available tags
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState<string>("");

  // Load all unique tags when component mounts or folder changes
  useEffect(() => {
    loadAllTags();
  }, [selectedFolderId]);

  const loadAllTags = async () => {
    try {
      // Get all questions to extract tags (without pagination)
      const result = await getQuestions({
        page: 1,
        limit: 1000, // Get a large number to get all tags
        folder_id: selectedFolderId,
      });

      if (result.success) {
        const tagSet = new Set<string>();
        result.data.questions.forEach((q: any) => {
          q.tags?.forEach((tag: any) => tagSet.add(tag));
        });
        setAllTags(Array.from(tagSet).sort());
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const renderQuestionCard = (question: any) => {
    const isExpanded = expandedQuestions.includes(question.id);
    const isSelected = selectedQuestions.includes(question.id);
    const isAdded = addedQuestionIds.includes(question.id);

    return (
      <div
        key={question.id}
        className={cn(
          "border rounded-lg p-3 hover:shadow-sm transition-shadow",
          isSelected && !isAdded && "ring-2 ring-primary",
          isAdded && "opacity-60 bg-muted/30"
        )}
      >
        <div className="flex items-start gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleQuestionSelection(question.id)}
            disabled={isAdded}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight">
                  {question.title}
                </h4>
                <p
                  className={cn(
                    "text-xs text-muted-foreground mt-0.5",
                    !isExpanded && "line-clamp-1"
                  )}
                >
                  {question.content}
                </p>

                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                    {getTypeLabel(question.type as any)}
                  </Badge>
                  {/* Difficulty, points and tags removed from schema */}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {question.content.length > 100 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleQuestionExpansion(question.id)}
                    className="h-7 w-7 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                )}
                {isAdded ? (
                  <div className="flex items-center text-xs text-muted-foreground px-2">
                    <Check className="h-3 w-3 mr-1" />
                    Added
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onAddQuestions([question])}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {question.content}
                </p>
                {(question.correct_feedback || question.incorrect_feedback) && (
                  <div className="p-2 bg-muted/50 rounded text-xs space-y-2">
                    {question.correct_feedback && (
                      <div>
                        <p className="font-medium text-green-600 mb-1">
                          Correct Feedback:
                        </p>
                        <p className="text-muted-foreground">
                          {question.correct_feedback}
                        </p>
                      </div>
                    )}
                    {question.incorrect_feedback && (
                      <div>
                        <p className="font-medium text-red-600 mb-1">
                          Incorrect Feedback:
                        </p>
                        <p className="text-muted-foreground">
                          {question.incorrect_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Left Panel - Folder Tree */}
      <div className="w-64 border-r bg-muted/30 p-4">
        <h3 className="text-sm font-semibold mb-3">Folders</h3>
        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onFolderSelect={handleFolderSelect}
          questionCounts={questionCounts}
          totalQuestions={totalQuestions}
          className="h-[calc(100%-2rem)]"
        />
      </div>

      {/* Right Panel - Questions */}
      <div className="flex-1 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Question Bank</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2"
            >
              <FileUp className="h-3 w-3" />
              Bulk Upload
            </Button>
            <span className="text-sm text-muted-foreground">
              {totalCount} questions
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllVisible}
              disabled={
                isLoadingAll ||
                totalCount === 0 ||
                totalCount === addedQuestionIds.length
              }
              title={`Select all ${totalCount} questions matching current filters`}
            >
              {isLoadingAll ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Select All ({totalCount})</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={selectedQuestions.length === 0}
            >
              Deselect All
            </Button>
            {questions.length < totalCount && totalCount > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increasePageSize}
                  disabled={isLoadingAll || pageSize >= 100}
                  title="Show more questions per page"
                >
                  Show More
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAllQuestions}
                  disabled={isLoadingAll || totalCount > 2000}
                  title={
                    totalCount > 2000
                      ? "Too many questions to load at once. Use filters to narrow your search."
                      : "Load all questions to view complete list"
                  }
                >
                  {isLoadingAll ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Loading All...
                    </>
                  ) : (
                    <>Load All ({totalCount})</>
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="short_answer">Short Answer</SelectItem>
                <SelectItem value="long_answer">Long Answer</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="free_text">Free Text</SelectItem>
                <SelectItem value="matching">Matching</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedDifficulty}
              onValueChange={(value) => {
                setSelectedDifficulty(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Popover
              open={tagSearchOpen}
              onOpenChange={(open) => {
                setTagSearchOpen(open);
                if (!open) setTagSearch("");
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-3 justify-start">
                  <Tag className="h-4 w-4 mr-2" />
                  {selectedTags.length > 0 ? (
                    <span className="text-sm">
                      {selectedTags.length} tag
                      {selectedTags.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Filter by tags
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3" align="start">
                <div className="space-y-2">
                  <Input
                    placeholder="Search tags..."
                    className="h-8"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                  />
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {(() => {
                        const filteredTags = allTags.filter((tag) =>
                          tag.toLowerCase().includes(tagSearch.toLowerCase())
                        );

                        if (allTags.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No tags available
                            </p>
                          );
                        }

                        if (filteredTags.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No tags match "{tagSearch}"
                            </p>
                          );
                        }

                        return filteredTags.map((tag) => (
                          <label
                            key={tag}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedTags.includes(tag)}
                              onCheckedChange={() => toggleTag(tag)}
                              className="data-[state=checked]:bg-primaryBlue data-[state=checked]:border-primaryBlue"
                            />
                            <span className="text-sm flex-1">{tag}</span>
                          </label>
                        ));
                      })()}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            {selectedTags.length > 0 && (
              <div className="flex items-center gap-1">
                {selectedTags.map((tag) => (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedQuestions.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">
              {availableSelectedCount} question
              {availableSelectedCount !== 1 ? "s" : ""} selected
              {selectedQuestions.length !== availableSelectedCount &&
                ` (${selectedQuestions.length - availableSelectedCount} already added)`}
            </span>
            <Button
              size="sm"
              onClick={handleAddSelectedQuestions}
              disabled={availableSelectedCount === 0 || isLoadingAll}
            >
              {isLoadingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Selected to Quiz
                </>
              )}
            </Button>
          </div>
        )}

        {/* Questions List */}
        <ScrollArea className="h-[calc(100vh-20rem)]">
          {loading && questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading questions...
            </div>
          ) : questions.length > 0 ? (
            <>
              <div className="space-y-2 pr-4">
                {questions.map(renderQuestionCard)}
              </div>
              {/* Show loading indicator when loading more */}
              {loading && questions.length > 0 && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading more questions...
                  </p>
                </div>
              )}
              {/* Show Load More button when there are more questions */}
              {!loading && questions.length < totalCount && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Increment current page to trigger loading more questions
                      setCurrentPage((prev) => prev + 1);
                    }}
                  >
                    Load More ({questions.length} of {totalCount})
                  </Button>
                </div>
              )}
              {/* Show message when all questions are loaded */}
              {!loading &&
                questions.length === totalCount &&
                totalCount > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    All questions loaded ({totalCount} total)
                  </div>
                )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No questions found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Pagination - hidden when using load more approach */}
      </div>

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onComplete={() => {
          setShowBulkUpload(false);
          loadQuestions(true);
          loadQuestionCounts();
          if (onQuestionsImported) {
            onQuestionsImported();
          }
          toast({
            title: "Import complete",
            description:
              "Questions have been imported successfully. Select them from the list to add to your quiz.",
          });
        }}
        initialFolderId={selectedFolderId}
      />
    </div>
  );
}
