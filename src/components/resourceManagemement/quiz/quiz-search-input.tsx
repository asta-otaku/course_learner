"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetQuizzes } from "@/lib/api/queries";
import type { Quiz } from "@/lib/types";

interface QuizSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function QuizSearchInput({
  value,
  onChange,
  disabled,
  placeholder = "Search quizzes...",
}: QuizSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Fetch all quizzes using React Query
  const { data: quizzesResponse, isLoading } = useGetQuizzes({
    search: searchTerm.length >= 2 ? searchTerm : undefined,
    limit: 50, // Reasonable limit for search results
  });

  const quizzes = quizzesResponse?.quizzes || [];

  useEffect(() => {
    // Load selected quiz details if value is provided
    if (value && !selectedQuiz && quizzes.length > 0) {
      const foundQuiz = quizzes.find((quiz) => quiz.id === value);
      if (foundQuiz) {
        setSelectedQuiz(foundQuiz);
      }
    }
  }, [value, selectedQuiz, quizzes]);

  const handleSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    onChange(quiz.id || "");
    setOpen(false);
    setSearchTerm("");
  };

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
                {selectedQuiz.quiz_questions?.length ||
                  selectedQuiz.questionsCount ||
                  0}{" "}
                questions
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
            {isLoading ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : quizzes.length === 0 ? (
              <CommandEmpty>
                {searchTerm.length < 2
                  ? "Type at least 2 characters to search"
                  : "No quizzes found"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelect(quiz)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === quiz.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{quiz.title}</span>
                        <Badge
                          variant={
                            quiz.status === "published"
                              ? "default"
                              : "secondary"
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
                          {quiz.quiz_questions?.length ||
                            quiz.questionsCount ||
                            0}{" "}
                          questions
                        </span>
                        {quiz.created_by_name && (
                          <span className="text-xs text-muted-foreground">
                            • By {quiz.created_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
