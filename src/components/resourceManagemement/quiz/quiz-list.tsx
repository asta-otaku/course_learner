"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "@/app/admin/(resourceManagement)/quizzes/columns";
import {
  Plus,
  Clock,
  Users,
  BarChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Archive,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { QuizActions } from "./quiz-actions";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  settings?: any;
  availableFrom?: string | null;
  availableUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  grade?: {
    id: string;
    name: string;
  } | null;
  quiz_questions?: any[];
}

interface QuizListProps {
  quizzes: Quiz[];
  canEdit?: boolean;
}

export function QuizList({ quizzes, canEdit = false }: QuizListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedQuizIds, setSelectedQuizIds] = useState<
    Record<string, boolean>
  >({});

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("quiz-view-mode");
    if (savedView === "list" || savedView === "cards") {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: "cards" | "list") => {
    setViewMode(mode);
    localStorage.setItem("quiz-view-mode", mode);
    // Clear selection when switching views
    setSelectedQuizIds({});
  };

  const getSelectedQuizIds = () => {
    return Object.keys(selectedQuizIds).filter((id) => selectedQuizIds[id]);
  };

  const handleClearSelection = () => {
    setSelectedQuizIds({});
  };

  const handleBulkActionsComplete = () => {
    // Refresh the page to get updated quiz list
    router.refresh();
    setSelectedQuizIds({});
  };

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">No quizzes yet</p>
            <p className="text-sm text-muted-foreground">
              {canEdit
                ? "Create your first quiz to get started"
                : "No quizzes are available at the moment"}
            </p>
            {canEdit && (
              <Button asChild>
                <Link href="/quizzes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} found
        </p>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("cards")}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const statusConfig = {
              published: {
                variant: "default" as const,
                icon: CheckCircle,
                className: "bg-green-500/10 text-green-700 border-green-200",
              },
              draft: {
                variant: "secondary" as const,
                icon: AlertTriangle,
                className: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
              },
              archived: {
                variant: "outline" as const,
                icon: Archive,
                className: "bg-gray-500/10 text-gray-700 border-gray-200",
              },
            };
            const status =
              statusConfig[quiz.status as keyof typeof statusConfig] ||
              statusConfig.draft;
            const StatusIcon = status.icon;

            return (
              <Card
                key={quiz.id}
                className={cn(
                  "hover:shadow-lg transition-shadow relative overflow-hidden",
                  quiz.status !== "published" &&
                    "border-yellow-200 bg-yellow-50/50"
                )}
              >
                {quiz.status !== "published" && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">
                        {quiz.title}
                      </CardTitle>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={status.variant}
                        className={status.className}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {quiz.status}
                      </Badge>
                      {canEdit && (
                        <QuizActions quizId={quiz.id} canEdit={canEdit} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Quiz Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart className="h-4 w-4" />
                        <span>
                          {quiz.quiz_questions?.length || 0} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {quiz.settings?.timeLimit || "No"} time limit
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {quiz.settings?.maxAttempts || "Unlimited"} attempts
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart className="h-4 w-4" />
                        <span>
                          {quiz.settings?.passingScore || 70}% to pass
                        </span>
                      </div>
                    </div>

                    {/* Category and Grade */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {quiz.category && (
                        <Badge variant="outline" className="text-xs">
                          {quiz.category.name}
                        </Badge>
                      )}
                      {quiz.grade && (
                        <Badge variant="outline" className="text-xs">
                          {quiz.grade.name}
                        </Badge>
                      )}
                    </div>

                    {/* Schedule Info */}
                    {(quiz.availableFrom || quiz.availableUntil) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {quiz.availableFrom && (
                          <span>
                            From{" "}
                            {new Date(quiz.availableFrom).toLocaleDateString()}
                          </span>
                        )}
                        {quiz.availableUntil && (
                          <span>
                            To{" "}
                            {new Date(quiz.availableUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(quiz.createdAt))}{" "}
                        ago
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/quizzes/${quiz.id}`}>View</Link>
                        </Button>
                        {canEdit && (
                          <Button size="sm" asChild>
                            <Link href={`/quizzes/${quiz.id}/edit`}>Edit</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={createColumns(canEdit)}
          data={quizzes}
          pageCount={1}
          page={1}
          pageSize={quizzes.length}
          totalItems={quizzes.length}
          enableRowSelection={canEdit}
          rowSelection={selectedQuizIds}
          onRowSelectionChange={setSelectedQuizIds}
        />
      )}

      {/* Bulk Actions Toolbar */}
      {canEdit && (
        <BulkActionsToolbar
          selectedIds={getSelectedQuizIds()}
          onClearSelection={handleClearSelection}
          onComplete={handleBulkActionsComplete}
        />
      )}
    </div>
  );
}
