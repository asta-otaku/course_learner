"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "@/app/admin/(resourceManagement)/quizzes/columns";
import { Quiz } from "@/lib/types";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";

interface QuizDataTableProps {
  quizzes: Quiz[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  hidePagination?: boolean;
  canEdit?: boolean;
  onRefresh?: () => void;
}

export function QuizDataTable({
  quizzes,
  onPageChange,
  onPageSizeChange,
  hidePagination = false,
  canEdit = true,
  onRefresh,
}: QuizDataTableProps) {
  const [rowSelection, setRowSelection] = useState({});

  // Ensure we have valid data
  const validQuizzes = Array.isArray(quizzes) ? quizzes : [];

  // Create columns with the canEdit parameter
  const quizColumns = createColumns(canEdit);

  // Helper functions for bulk actions
  const getSelectedQuizIds = () => {
    return Object.keys(rowSelection).filter(
      (id) => rowSelection[id as keyof typeof rowSelection]
    );
  };

  const handleClearSelection = () => {
    setRowSelection({});
  };

  const handleBulkActionsComplete = () => {
    // Refresh the data if callback is provided
    if (onRefresh) {
      onRefresh();
    }
    setRowSelection({});
  };

  return (
    <div className="w-full">
      <DataTable
        columns={quizColumns}
        data={validQuizzes}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        hidePagination={hidePagination}
        enableRowSelection={canEdit}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

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
