"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { getTypeLabel } from "@/lib/quiz-utils";
import { toast } from "@/components/ui/use-toast";
import { FolderTree } from "../questions";
import type { Database } from "@/lib/database.types";
import { BulkUploadDialog } from "../questions/bulk-upload-dialog";
import {
  useGetQuestions,
  useGetFolderById,
  useGetFolders,
} from "@/lib/api/queries";

type DBQuestion = Database["public"]["Tables"]["questions"]["Row"];

interface QuestionBankWithFoldersProps {
  onAddQuestions: (questions: DBQuestion[]) => void;
  addedQuestionIds: string[];
  className?: string;
  onQuestionsImported?: () => void;
  refreshTrigger?: number;
}

export function QuestionBankWithFolders({
  onAddQuestions,
  addedQuestionIds = [],
  className,
  onQuestionsImported,
  refreshTrigger,
}: QuestionBankWithFoldersProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    difficultyMin: "",
    difficultyMax: "",
    folderId: "",
    sortBy: "",
    sortOrder: "",
  });

  // Transform filters for API call - only include non-default values
  const queryOptions = useMemo(() => {
    const options: Record<string, string | number> = {
      page: pagination.page,
      limit: pagination.limit,
    };

    // Only include non-empty/non-default values
    if (filters.search.trim()) options.search = filters.search;
    if (filters.type && filters.type !== "all") options.type = filters.type;
    if (filters.difficultyMin && filters.difficultyMin !== "")
      options.difficultyMin = Number(filters.difficultyMin);
    if (filters.difficultyMax && filters.difficultyMax !== "")
      options.difficultyMax = Number(filters.difficultyMax);
    // Only include folderId in query options if we're not using folder-specific data
    if (selectedFolderId) options.folderId = selectedFolderId;
    if (filters.sortBy && filters.sortBy !== "")
      options.sortBy = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== "")
      options.sortOrder = filters.sortOrder;

    return options;
  }, [filters, pagination.page, pagination.limit, selectedFolderId]);

  // Use React Query hooks with computed query options
  // Disable questions query when viewing a specific folder
  const {
    data: questionsResponse,
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useGetQuestions(selectedFolderId ? undefined : queryOptions);

  const {
    data: foldersResponse,
    isLoading: folderLoading,
    refetch: refetchFolder,
  } = useGetFolderById(selectedFolderId || "");

  const { data: allFoldersResponse, isLoading: allFoldersLoading } =
    useGetFolders();

  // Refetch data when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // Force refetch of current data
      const refetchData = async () => {
        if (selectedFolderId) {
          await refetchFolder();
        } else {
          await refetchQuestions();
        }
      };
      refetchData();
    }
  }, [refreshTrigger, selectedFolderId, refetchFolder, refetchQuestions]);

  // Update pagination when data changes
  useEffect(() => {
    if (selectedFolderId && foldersResponse?.data?.questions) {
      // When viewing a specific folder, use folder questions
      const folderQuestions = foldersResponse.data.questions;
      setPagination((prev) => ({
        ...prev,
        total: folderQuestions.length,
        totalPages: Math.ceil(folderQuestions.length / prev.limit),
        hasNextPage: prev.page < Math.ceil(folderQuestions.length / prev.limit),
        hasPreviousPage: prev.page > 1,
      }));
    } else if (questionsResponse?.pagination) {
      // When viewing all questions, use regular pagination
      setPagination((prev) => ({
        ...prev,
        total: questionsResponse.pagination.totalCount || 0,
        totalPages: questionsResponse.pagination.totalPages || 1,
        hasNextPage: questionsResponse.pagination.hasNextPage || false,
        hasPreviousPage: questionsResponse.pagination.hasPreviousPage || false,
      }));
    }
  }, [questionsResponse, foldersResponse, selectedFolderId]);

  // Update filters when local state changes
  useEffect(() => {
    const newFilters = {
      search: searchQuery,
      type: selectedType,
      difficultyMin:
        selectedDifficulty === "easy"
          ? "1"
          : selectedDifficulty === "medium"
            ? "4"
            : selectedDifficulty === "hard"
              ? "8"
              : "",
      difficultyMax:
        selectedDifficulty === "easy"
          ? "3"
          : selectedDifficulty === "medium"
            ? "7"
            : selectedDifficulty === "hard"
              ? "10"
              : "",
      folderId: selectedFolderId || "",
      sortBy: "",
      sortOrder: "",
    };
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [
    selectedFolderId,
    searchQuery,
    selectedDifficulty,
    selectedType,
    selectedTags,
  ]);

  // Determine which data to use - similar to page.tsx logic
  const questionsData = useMemo(() => {
    if (selectedFolderId && foldersResponse?.data?.questions) {
      // Use folder questions when a folder is selected
      const folderQuestions = foldersResponse.data.questions;
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedQuestions = folderQuestions.slice(startIndex, endIndex);

      return {
        questions: paginatedQuestions,
        total: folderQuestions.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(folderQuestions.length / pagination.limit),
      };
    } else if (questionsResponse?.questions) {
      // Use regular questions when no folder is selected
      return {
        questions: questionsResponse.questions || [],
        total: questionsResponse.pagination.totalCount || 0,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: questionsResponse.pagination.totalPages || 1,
      };
    } else {
      // No data available
      return {
        questions: [],
        total: 0,
        page: 1,
        limit: pagination.limit,
        totalPages: 1,
      };
    }
  }, [questionsResponse, foldersResponse, selectedFolderId, pagination]);

  // Loading state
  const isLoading =
    (selectedFolderId && folderLoading) ||
    (!selectedFolderId && questionsLoading) ||
    allFoldersLoading;

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedQuestions([]);
  };

  // Page change handler
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
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

  const selectAllVisible = () => {
    // Get all visible question IDs
    const visibleQuestionIds = questionsData.questions.map(
      (q: DBQuestion) => q.id
    );

    // Filter out already added questions
    const availableIds = visibleQuestionIds.filter(
      (id: string) => !addedQuestionIds.includes(id)
    );

    setSelectedQuestions(availableIds);

    toast({
      title: "Questions selected",
      description: `Selected ${availableIds.length} question${availableIds.length !== 1 ? "s" : ""} from current page.`,
    });
  };

  const deselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleAddSelectedQuestions = () => {
    if (selectedQuestions.length === 0) return;

    // Filter selected questions from current loaded data
    const questionsToAdd = questionsData.questions.filter((q: DBQuestion) =>
      selectedQuestions.includes(q.id)
    );

    onAddQuestions(questionsToAdd);
    setSelectedQuestions([]);

    toast({
      title: "Questions added",
      description: `Successfully added ${questionsToAdd.length} question${questionsToAdd.length !== 1 ? "s" : ""}`,
    });
  };

  const availableSelectedCount = selectedQuestions.filter(
    (id) => !addedQuestionIds.includes(id)
  ).length;

  // State for all available tags
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState<string>("");

  // Extract tags from current questions data
  useEffect(() => {
    const tagSet = new Set<string>();
    questionsData.questions.forEach((q: DBQuestion) => {
      (q as any).tags?.forEach((tag: string) => tagSet.add(tag));
    });
    setAllTags(Array.from(tagSet).sort());
  }, [questionsData.questions]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const renderQuestionCard = (question: DBQuestion) => {
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
                  {(question as any).title || "Untitled Question"}
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
                    {getTypeLabel(question.type)}
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
      <div className="w-80 border-r bg-muted/30 p-4">
        <h3 className="text-sm font-semibold mb-3">Folders</h3>
        <FolderTree
          folders={allFoldersResponse?.data || []}
          selectedFolderId={selectedFolderId}
          onFolderSelect={handleFolderSelect}
          questionCounts={{}}
          totalQuestions={questionsData.total}
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
              {questionsData.total} questions
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
                }}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllVisible}
              disabled={
                isLoading ||
                questionsData.total === 0 ||
                questionsData.questions.length === 0
              }
              title={`Select all ${questionsData.questions.length} visible questions`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Select All ({questionsData.questions.length})</>
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
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="fill_in_the_blank">
                  Fill in the Blank
                </SelectItem>
                <SelectItem value="matching_pairs">Matching Pairs</SelectItem>
                <SelectItem value="free_text">Free Text</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedDifficulty}
              onValueChange={(value) => {
                setSelectedDifficulty(value);
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
              disabled={availableSelectedCount === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Selected to Quiz
            </Button>
          </div>
        )}

        {/* Questions List */}
        <ScrollArea className="h-[calc(100vh-20rem)]">
          {isLoading && questionsData.questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading questions...
            </div>
          ) : questionsData.questions.length > 0 ? (
            <>
              <div className="space-y-2 pr-4">
                {questionsData.questions.map(renderQuestionCard)}
              </div>
              {/* Pagination controls */}
              {questionsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground px-3">
                    Page {pagination.page} of {questionsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
          // Refetch questions after import
          if (selectedFolderId) {
            refetchFolder();
          } else {
            refetchQuestions();
          }
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
