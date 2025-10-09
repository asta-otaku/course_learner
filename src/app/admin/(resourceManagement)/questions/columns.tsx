"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Pencil, Trash, Eye } from "lucide-react";
import Link from "next/link";
import { useDeleteQuestion } from "@/lib/api/mutations";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import type { Question } from "@/lib/types";
import { duplicateQuestion } from "@/app/actions/questions";
import { QuestionPreviewModal } from "@/components/resourceManagemement/questions";
import { MathPreview } from "@/components/resourceManagemement/editor";

const typeColors = {
  multiple_choice: "bg-blue-100 text-blue-800 whitespace-nowrap",
  true_false: "bg-purple-100 text-purple-800 whitespace-nowrap",
  short_answer: "bg-green-100 text-green-800 whitespace-nowrap",
  long_answer: "bg-yellow-100 text-yellow-800 whitespace-nowrap",
  coding: "bg-orange-100 text-orange-800 whitespace-nowrap",
  free_text: "bg-green-100 text-green-800 whitespace-nowrap",
  matching: "bg-yellow-100 text-yellow-800 whitespace-nowrap",
  matching_pairs: "bg-yellow-100 text-yellow-800 whitespace-nowrap",
};

const typeLabels = {
  multiple_choice: "Multiple Choice",
  true_false: "True/False",
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  coding: "Coding",
  free_text: "Free Text",
  matching: "Matching",
  matching_pairs: "Matching",
};

export const columns: ColumnDef<Question>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
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
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => {
      const content = row.getValue("content") as string;
      const truncated =
        content.length > 100 ? content.substring(0, 100) + "..." : content;
      return (
        <div className="font-medium max-w-sm">
          <MathPreview
            content={truncated}
            renderMarkdown={true}
            className="text-sm"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image") as string | null;
      if (!imageUrl) return null;
      return (
        <div className="flex items-center justify-center">
          <div className="relative w-10 h-10 rounded overflow-hidden border bg-muted">
            <img
              src={imageUrl}
              alt="Question thumbnail"
              className="object-cover w-full h-full"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement?.classList.add(
                  "flex",
                  "items-center",
                  "justify-center"
                );
                const icon = document.createElement("div");
                icon.innerHTML =
                  '<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                target.parentElement?.appendChild(icon);
              }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as keyof typeof typeLabels;
      return (
        <Badge className={typeColors[type]} variant="secondary">
          {typeLabels[type]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString()}
        </span>
      );
    },
  },
  {
    id: "preview",
    header: "",
    cell: ({ row }) => {
      const question = row.original;
      return <PreviewButton question={question} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const question = row.original;
      return <QuestionActions question={question} />;
    },
  },
];

function PreviewButton({ question }: { question: Question }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowPreview(true);
        }}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Preview question</span>
      </Button>

      <QuestionPreviewModal
        question={question}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </>
  );
}

function QuestionActions({ question }: { question: Question }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const deleteQuestionMutation = useDeleteQuestion(question.id);

  const handleDelete = async () => {
    try {
      const result = await deleteQuestionMutation.mutateAsync();
      if (result.status === 200) {
        toast.success(result.data.message);
      }
    } catch (error) {
      toast.error("Failed to delete question");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateQuestion(question.id);
      if (!result.success) {
        toast.error((result as any).error);
        return;
      }
      toast.success("Question duplicated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to duplicate question");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/questions/${question.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/questions/${question.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteQuestionMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
