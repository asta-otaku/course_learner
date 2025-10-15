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
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CurriculumActions } from "@/components/resourceManagemement/curriculum/curriculum-actions";

export const createColumns = (canReorder?: boolean): ColumnDef<any>[] => [
  ...(canReorder
    ? [
        {
          id: "drag-handle",
          header: "",
          cell: () => (
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded drag-handle">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          ),
          size: 40,
          enableSorting: false,
          enableHiding: false,
        },
      ]
    : []),
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
    id: "lessons",
    header: "Lessons",
    cell: ({ row }) => {
      const curriculum = row.original;
      const lessonCount = curriculum.lessonsCount || 0;
      return (
        <div className="text-sm text-muted-foreground">
          {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
        </div>
      );
    },
  },
  {
    id: "offerType",
    header: "Offer Type",
    cell: ({ row }) => {
      const curriculum = row.original;
      return (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{curriculum.offerType}</span>
        </div>
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
          <CurriculumActions
            curriculumId={curriculum.id}
            canEdit={true}
            isPublic={curriculum.visibility === "PUBLIC"}
            curriculum={curriculum}
          />
        </div>
      );
    },
  },
];
