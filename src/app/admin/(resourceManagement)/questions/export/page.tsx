"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { getQuestions } from "@/app/actions/questions";
import { generateCSV, downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
  { value: "coding", label: "Coding" },
];

export default function ExportQuestionsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    types: [] as string[],
    difficultyMin: 1,
    difficultyMax: 10,
    tags: "",
    publicOnly: false,
    privateOnly: false,
  });

  // Load question count
  useEffect(() => {
    loadQuestionCount();
  }, [filters]);

  const loadQuestionCount = async () => {
    try {
      const result = await getQuestions({
        page: 1,
        sortBy: "created_at",
        sortOrder: "desc",
        search: filters.search || undefined,
        type: filters.types.length > 0 ? (filters.types as any) : undefined,
        difficulty_level: {
          min: filters.difficultyMin,
          max: filters.difficultyMax,
        },
        tags: filters.tags
          ? filters.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        is_public: filters.publicOnly
          ? true
          : filters.privateOnly
            ? false
            : undefined,
        limit: 1, // Just to get count
      });

      if (result.success) {
        setQuestionCount(result.data.total);
      }
    } catch (error) {
      console.error("Failed to load question count:", error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all questions that match the filters
      const result = await getQuestions({
        page: 1,
        sortBy: "created_at",
        sortOrder: "desc",
        search: filters.search || undefined,
        type: filters.types.length > 0 ? (filters.types as any) : undefined,
        difficulty_level: {
          min: filters.difficultyMin,
          max: filters.difficultyMax,
        },
        tags: filters.tags
          ? filters.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        is_public: filters.publicOnly
          ? true
          : filters.privateOnly
            ? false
            : undefined,
        limit: 1000, // Large limit to get all questions
      });

      if (!result.success) {
        toast.error((result as any).error);
        return;
      }

      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        result.data.questions.map(async (question) => {
          try {
            const { getQuestionById } = await import("@/app/actions/questions");
            const questionResult = await getQuestionById(question.id);
            return {
              question,
              answers: questionResult.success
                ? questionResult.data.answers
                : [],
            };
          } catch {
            return { question, answers: [] };
          }
        })
      );

      // Group answers by question ID
      const answersMap: Record<string, any[]> = {};
      questionsWithAnswers.forEach(({ question, answers }) => {
        answersMap[question.id] = answers;
      });

      // Generate CSV
      const csvContent = generateCSV(result.data.questions, answersMap);

      // Download file
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `questions-export-${timestamp}.csv`;
      downloadCSV(filename, csvContent);

      toast.success(`Exported ${result.data.questions.length} questions`);
    } catch (error) {
      toast.error("Failed to export questions");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      types: checked
        ? [...prev.types, type]
        : prev.types.filter((t) => t !== type),
    }));
  };

  return (
    <div className="mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/questions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Export Questions</h1>
          <p className="text-muted-foreground">
            Export your questions to a CSV file
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Export Filters</CardTitle>
            <CardDescription>
              Configure which questions to include in the export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search question titles..."
              />
            </div>

            <div>
              <Label>Question Types</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {questionTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={filters.types.includes(type.value)}
                      onCheckedChange={(checked) =>
                        handleTypeChange(type.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={type.value}>{type.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Difficulty Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="diff-min" className="text-sm">
                    Minimum
                  </Label>
                  <Select
                    value={filters.difficultyMin.toString()}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        difficultyMin: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger id="diff-min">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="diff-max" className="text-sm">
                    Maximum
                  </Label>
                  <Select
                    value={filters.difficultyMax.toString()}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        difficultyMax: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger id="diff-max">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={filters.tags}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="Comma-separated tags (e.g., math, basic)"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-only"
                  checked={filters.publicOnly}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      publicOnly: checked,
                      privateOnly: checked ? false : prev.privateOnly,
                    }))
                  }
                />
                <Label htmlFor="public-only">Public questions only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private-only"
                  checked={filters.privateOnly}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      privateOnly: checked,
                      publicOnly: checked ? false : prev.publicOnly,
                    }))
                  }
                />
                <Label htmlFor="private-only">Private questions only</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Export Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <div className="text-3xl font-bold text-primaryBlue mb-2">
                {questionCount}
              </div>
              <div className="text-muted-foreground">
                questions will be exported
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting || questionCount === 0}
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Questions
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
