"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Copy,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Question, Difficulty, QuestionType } from "@/types/quiz";
import { getTypeLabel, getDifficultyColor } from "@/lib/quiz-utils";
import { getQuestions, getCategories } from "@/app/actions/questions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  question_count: number;
  children?: Category[];
}

interface QuestionBankPaginatedProps {
  onAddQuestions: (questions: Question[]) => void;
  onEditQuestion?: (questionId: string) => void;
  onDuplicateQuestion?: (questionId: string) => void;
  addedQuestionIds: string[];
  className?: string;
}

export function QuestionBankPaginated({
  onAddQuestions,
  onEditQuestion,
  onDuplicateQuestion,
  addedQuestionIds = [],
  className,
}: QuestionBankPaginatedProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | "all"
  >("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "folder">("folder");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  // Tag search state
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [visibleTagCount, setVisibleTagCount] = useState(5);
  const TAGS_PER_PAGE = 15;

  useEffect(() => {
    loadQuestions();
  }, [currentPage, selectedCategory]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Fetch questions and categories in parallel
      const [questionsResponse, fetchedCategories] = await Promise.all([
        getQuestions({
          page: currentPage,
          limit: pageSize,
          folder_id: selectedCategory || undefined,
        }),
        getCategories(),
      ]);

      if (questionsResponse.success) {
        const { questions, total, totalPages } = questionsResponse.data;
        setQuestions(questions);
        setTotalCount(total);
        setTotalPages(totalPages);
      } else {
        console.error("Failed to load questions:", questionsResponse.error);
        setQuestions([]);
        setTotalCount(0);
        setTotalPages(0);
      }

      // Transform categories to add question count and match interface
      const categoriesWithCount = fetchedCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id,
        question_count: 0, // TODO: Get actual count from server
      }));

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("Error loading questions:", error);
      setQuestions([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category structure
  const categoryTree = useMemo(() => {
    const buildTree = (parentId?: string): Category[] => {
      return categories
        .filter((cat) => cat.parent_id === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };
    return buildTree();
  }, [categories]);

  // Extract all unique tags from questions
  const allTags = useMemo(() => {
    // Tags removed from schema
    return [];
  }, [questions]);

  // Filtered tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return allTags;
    return allTags.filter((tag) =>
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [allTags, tagSearchQuery]);

  // Filter questions based on search and filters
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          question.title.toLowerCase().includes(query) ||
          question.content.toLowerCase().includes(query) ||
          question.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Difficulty filter
      if (
        selectedDifficulty !== "all" &&
        question.difficulty !== selectedDifficulty
      ) {
        return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = question.tags?.some((tag) =>
          selectedTags.includes(tag)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  }, [questions, searchQuery, selectedDifficulty, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredQuestions
      .filter((q) => !addedQuestionIds.includes(q.id))
      .map((q) => q.id);
    setSelectedQuestions(visibleIds);
  };

  const deselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleAddSelectedQuestions = () => {
    const questionsToAdd = questions.filter((q) =>
      selectedQuestions.includes(q.id)
    );
    onAddQuestions(questionsToAdd);
    setSelectedQuestions([]);
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    if (!onDuplicateQuestion) return;
    setDuplicating(questionId);
    try {
      await onDuplicateQuestion(questionId);
    } finally {
      setDuplicating(null);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const availableSelectedCount = selectedQuestions.filter(
    (id) => !addedQuestionIds.includes(id)
  ).length;

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map((category) => {
      const isExpanded = expandedCategories.includes(category.id);
      const isSelected = selectedCategory === category.id;
      const hasChildren = category.children && category.children.length > 0;

      return (
        <div key={category.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted",
              isSelected && "bg-primaryBlue/10 text-primaryBlue",
              level > 0 && "ml-4"
            )}
            onClick={() => handleCategoryClick(category.id)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleCategoryExpansion(category.id);
              }}
              disabled={!hasChildren}
            >
              {hasChildren && (
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              )}
            </Button>
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm">{category.name}</span>
            <Badge variant="secondary" className="text-xs">
              {category.question_count}
            </Badge>
          </div>
          {isExpanded && hasChildren && (
            <div className="mt-1">
              {renderCategoryTree(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderQuestionCard = (question: any) => {
    const isExpanded = expandedQuestions.includes(question.id);
    const isSelected = selectedQuestions.includes(question.id);
    const isAdded = addedQuestionIds.includes(question.id);

    // Map difficulty level to difficulty string
    const getDifficultyString = (level: number): Difficulty => {
      if (level <= 3) return "easy";
      if (level <= 7) return "medium";
      return "hard";
    };

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
                  <div
                    className={cn(
                      "text-sm text-muted-foreground",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
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
                        <>
                          Show less <ChevronUp className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Question Structure Preview */}
                  {isExpanded &&
                    question.type !== "open_ended" &&
                    question.explanation && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm">
                        <p className="font-medium mb-2">Explanation:</p>
                        <p>{question.explanation}</p>
                      </div>
                    )}

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(question.type as QuestionType)}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-xs",
                        getDifficultyColor(
                          getDifficultyString(question.difficulty_level || 3)
                        )
                      )}
                    >
                      {getDifficultyString(question.difficulty_level || 3)}
                    </Badge>
                    {question.points && (
                      <Badge variant="outline" className="text-xs">
                        {question.points} pts
                      </Badge>
                    )}
                    {question.tags?.slice(0, 3).map((tag: string) => (
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
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Question Bank</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalCount} questions total
          </span>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "list" | "folder")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="folder" className="text-xs">
                <Folder className="h-3 w-3 mr-1" />
                Folders
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs">
                <FileQuestion className="h-3 w-3 mr-1" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllVisible}
            disabled={filteredQuestions.every((q) =>
              addedQuestionIds.includes(q.id)
            )}
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
            <Select
              value={selectedDifficulty}
              onValueChange={(value: any) => setSelectedDifficulty(value)}
            >
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
                      {selectedTags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
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
                    <span className="text-muted-foreground">
                      Select tags...
                    </span>
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
                          onClick={() =>
                            setVisibleTagCount((prev) => prev + TAGS_PER_PAGE)
                          }
                        >
                          Load more ({filteredTags.length - visibleTagCount}{" "}
                          remaining)
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
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
              </div>
            )}
          </div>
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

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Category Sidebar (Folder View) */}
        {viewMode === "folder" && (
          <div className="w-1/3 border-r pr-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">Categories</h4>
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCurrentPage(1);
                  }}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted",
                    !selectedCategory && "bg-primary/10 text-primary"
                  )}
                  onClick={() => {
                    setSelectedCategory(null);
                    setCurrentPage(1);
                  }}
                >
                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">All Questions</span>
                  <Badge variant="secondary" className="text-xs">
                    {totalCount}
                  </Badge>
                </div>
                {renderCategoryTree(categoryTree)}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Questions List */}
        <div
          className={cn(
            "space-y-3",
            viewMode === "folder" ? "flex-1" : "w-full"
          )}
        >
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading questions...
              </div>
            ) : filteredQuestions.length > 0 ? (
              <div className="space-y-3 pr-4">
                {filteredQuestions.map(renderQuestionCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No questions found matching your criteria
              </div>
            )}
          </ScrollArea>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
