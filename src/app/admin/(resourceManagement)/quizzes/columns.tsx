"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
  Archive,
  Clock,
  Users,
  BarChart,
  Calendar,
  Eye,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { QuizActions } from "@/components/resourceManagemement/quiz/quiz-actions";

export const createColumns = (canEdit: boolean = false): ColumnDef<any>[] => {
  const columns: ColumnDef<any>[] = [];

  // Only add select column if user can edit
  if (canEdit) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  columns.push(
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quiz = row.original;
        return (
          <div className="space-y-1">
            <Link
              href={`/quizzes/${quiz.id}`}
              className="font-medium hover:underline"
            >
              {quiz.title}
            </Link>
            {quiz.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {quiz.description}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
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
        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.draft;
        const StatusIcon = config.icon;

        return (
          <Badge variant={config.variant} className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "quiz_questions",
      header: "Questions",
      cell: ({ row }) => {
        const questions = row.getValue("quiz_questions") as any[];
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart className="h-4 w-4" />
            <span>{questions?.length || 0}</span>
          </div>
        );
      },
    },
    {
      id: "settings",
      header: "Settings",
      cell: ({ row }) => {
        const quiz = row.original;
        const settings = quiz.settings || {};

        return (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{settings.timeLimit || "No"} limit</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{settings.maxAttempts || "∞"} attempts</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart className="h-3 w-3" />
              <span>{settings.passingScore || 70}%</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "category_grade",
      header: "Category & Grade",
      cell: ({ row }) => {
        const quiz = row.original;
        return (
          <div className="flex items-center gap-2">
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
        );
      },
    },
    {
      id: "schedule",
      header: "Schedule",
      cell: ({ row }) => {
        const quiz = row.original;
        if (!quiz.available_from && !quiz.available_to) {
          return (
            <span className="text-sm text-muted-foreground">
              Always available
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <div className="space-y-1">
              {quiz.available_from && (
                <div>
                  From: {new Date(quiz.available_from).toLocaleDateString()}
                </div>
              )}
              {quiz.available_to && (
                <div>
                  To: {new Date(quiz.available_to).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const quiz = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/quizzes/${quiz.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/quizzes/${quiz.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <QuizActions quizId={quiz.id} canEdit={canEdit} />
              </>
            )}
          </div>
        );
      },
    }
  );

  return columns;
};

// Export default columns for backward compatibility
export const columns = createColumns(false);
