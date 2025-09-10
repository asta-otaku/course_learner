"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  BookOpen,
  User,
  Eye,
  Edit,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const columns: ColumnDef<any>[] = [
  {
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
  },
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
      const curriculum = row.original;
      return (
        <div className="space-y-1">
          <Link
            href={`/admin/curricula/${curriculum.id}`}
            className="font-medium hover:underline"
          >
            {curriculum.title}
          </Link>
          {curriculum.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {curriculum.description}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "is_public",
    header: "Visibility",
    cell: ({ row }) => {
      const isPublic = row.getValue("is_public") as boolean;
      return (
        <Badge variant={isPublic ? "default" : "secondary"}>
          {isPublic ? "Public" : "Private"}
        </Badge>
      );
    },
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => {
      const curriculum = row.original;
      if (!curriculum.category_id) {
        return (
          <span className="text-sm text-muted-foreground">Uncategorized</span>
        );
      }
      return (
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span>Category</span>
        </div>
      );
    },
  },
  {
    id: "lessons",
    header: "Lessons",
    cell: ({ row }) => {
      const curriculum = row.original;
      const lessonCount = curriculum.lessons?.length || 0;
      return (
        <div className="text-sm text-muted-foreground">
          {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
        </div>
      );
    },
  },
  {
    id: "created_by",
    header: "Created By",
    cell: ({ row }) => {
      const curriculum = row.original;
      return (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>
            {curriculum.created_by_profile?.full_name ||
              curriculum.created_by_profile?.username ||
              "Unknown"}
          </span>
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
      const curriculum = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/curricula/${curriculum.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/curricula/${curriculum.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
  },
];
