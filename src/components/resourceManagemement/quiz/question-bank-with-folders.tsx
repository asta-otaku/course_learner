"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Loader2,
  FileUp,
} from "lucide-react";
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
  initialQuestions?: DBQuestion[]; // Add initial questions prop for SSR
}

export function QuestionBankWithFolders({
  onAddQuestions,
  addedQuestionIds = [],
  className,
  onQuestionsImported,
  refreshTrigger,
  initialQuestions = [],
}: QuestionBankWithFoldersProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Pagination state - set limit to 1000 to show all questions
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000, // Increased to show all questions without pagination
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Transform filters for API call - use backend filtering
  const queryOptions = useMemo(() => {
    const options: Record<string, string | number> = {
      page: pagination.page,
      limit: pagination.limit,
    };

    // Only include non-empty/non-default values
    if (searchQuery.trim()) options.search = searchQuery;
    if (selectedType && selectedType !== "all") options.type = selectedType;
    if (selectedFolderId) options.folderId = selectedFolderId;

    return options;
  }, [
    searchQuery,
    selectedType,
    selectedFolderId,
    pagination.page,
    pagination.limit,
  ]);

  // Use React Query hooks with computed query options
  // Fix 1: Make the query argument explicit to avoid ambiguous ternary
  const shouldUseBackendQuery =
    !selectedFolderId && initialQuestions.length === 0;
  const questionsHookArg = shouldUseBackendQuery ? queryOptions : undefined;

  const {
    data: questionsResponse,
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useGetQuestions(questionsHookArg);

  // Fix 2: Pass undefined/null safely into folder hook
  const {
    data: foldersResponse,
    isLoading: folderLoading,
    refetch: refetchFolder,
  } = useGetFolderById(selectedFolderId || "");

  const { data: allFoldersResponse, isLoading: allFoldersLoading } =
    useGetFolders();

  // Fix 4: Compute initial pagination synchronously (safe for SSR)
  const initialTotal = useMemo(() => {
    if (selectedFolderId && foldersResponse?.data?.questions) {
      return foldersResponse.data.questions.length;
    } else if (initialQuestions.length > 0) {
      return initialQuestions.length;
    } else if (questionsResponse?.pagination?.totalCount) {
      return questionsResponse.pagination.totalCount;
    }
    return 0;
  }, [selectedFolderId, foldersResponse, initialQuestions, questionsResponse]);

  // Refetch data when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // Force refetch of current data
      const refetchData = async () => {
        if (selectedFolderId) {
          await refetchFolder();
        } else if (!initialQuestions.length) {
          // Only refetch if not using SSR
          await refetchQuestions();
        }
      };
      refetchData();
    }
  }, [
    refreshTrigger,
    selectedFolderId,
    refetchFolder,
    refetchQuestions,
    initialQuestions.length,
  ]);

  // Update pagination when data changes - using computed initialTotal
  useEffect(() => {
    setPagination((prev) => {
      const totalPages = Math.max(1, Math.ceil(initialTotal / prev.limit));
      return {
        ...prev,
        total: initialTotal,
        totalPages: totalPages,
        hasNextPage: prev.page < totalPages,
        hasPreviousPage: prev.page > 1,
      };
    });
  }, [initialTotal]);

  // Reset pagination when search or type changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, selectedType, selectedFolderId]);

  // Determine which data to use - use backend pagination
  const questionsData = useMemo(() => {
    if (selectedFolderId && foldersResponse?.data?.questions) {
      // Use folder questions when a folder is selected - apply client-side pagination for folders
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
    } else if (initialQuestions.length > 0) {
      // Use SSR questions when available - apply client-side pagination
      const allQuestions = initialQuestions;
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedQuestions = allQuestions.slice(startIndex, endIndex);

      return {
        questions: paginatedQuestions,
        total: allQuestions.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(allQuestions.length / pagination.limit),
      };
    } else if (questionsResponse?.questions) {
      // Use backend paginated questions when no folder is selected

      return {
        questions: questionsResponse.questions || [],
        total: questionsResponse.pagination?.totalCount || 0,
        page: questionsResponse.pagination?.page || 1,
        limit: questionsResponse.pagination?.limit || pagination.limit,
        totalPages: questionsResponse.pagination?.totalPages || 1,
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
  }, [
    questionsResponse,
    foldersResponse,
    selectedFolderId,
    pagination.page,
    pagination.limit,
    initialQuestions,
  ]);

  // Loading state
  const isLoading =
    (selectedFolderId && folderLoading) ||
    (!selectedFolderId && !initialQuestions.length && questionsLoading) ||
    allFoldersLoading;

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedQuestions([]);
  }, []);

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    // The query will automatically refetch with the new page due to queryOptions dependency
  }, []);

  const toggleQuestionSelection = useCallback((questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const toggleQuestionExpansion = useCallback((questionId: string) => {
    setExpandedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const selectAllVisible = useCallback(() => {
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
  }, [questionsData.questions, addedQuestionIds]);

  const deselectAll = useCallback(() => {
    setSelectedQuestions([]);
  }, []);

  const handleAddSelectedQuestions = useCallback(() => {
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
  }, [selectedQuestions, questionsData.questions, onAddQuestions]);

  const availableSelectedCount = selectedQuestions.filter(
    (id) => !addedQuestionIds.includes(id)
  ).length;

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
      <div className="w-80 border-r bg-muted/30 flex flex-col h-full">
        <h3 className="text-sm font-semibold p-4 pb-2 flex-shrink-0">Folders</h3>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 scrollbar-visible">
          <FolderTree
            folders={allFoldersResponse?.data || []}
            selectedFolderId={selectedFolderId}
            onFolderSelect={handleFolderSelect}
            questionCounts={{}}
            totalQuestions={questionsData.total}
          />
        </div>
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
            <span
              className="text-sm text-muted-foreground"
              suppressHydrationWarning
            >
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
                  <span
                    className="flex items-center text-sm text-muted-foreground px-3"
                    suppressHydrationWarning
                  >
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
          } else if (!initialQuestions.length) {
            // Only refetch if not using SSR
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
