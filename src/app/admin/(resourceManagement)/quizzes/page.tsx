"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { QuizPageClient } from "./quiz-page-client";
import QuizControls from "@/components/resourceManagemement/quiz/quiz-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetQuizzes } from "@/lib/api/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function QuizzesPage() {
  // Filter state management
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    categoryId: "",
    gradeId: "",
  });

  // Pagination state management
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Transform filters for API call - only include non-default values
  const queryOptions = useMemo(() => {
    const options: any = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filters.search) options.search = filters.search;
    if (filters.status !== "all") options.status = filters.status;
    if (filters.categoryId) options.categoryId = filters.categoryId;
    if (filters.gradeId) options.gradeId = filters.gradeId;

    return options;
  }, [filters, pagination.page, pagination.limit]);

  // Use React Query hook with computed query options
  const {
    data: quizzesResponse,
    isLoading: quizzesLoading,
    error: quizzesError,
    refetch: refetchQuizzes,
  } = useGetQuizzes(queryOptions);

  // Update pagination when data changes
  useEffect(() => {
    if (quizzesResponse?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: quizzesResponse.pagination.totalCount || 0,
        totalPages: quizzesResponse.pagination.totalPages || 1,
        hasNextPage: quizzesResponse.pagination.hasNextPage || false,
        hasPreviousPage: quizzesResponse.pagination.hasPreviousPage || false,
      }));
    }
  }, [quizzesResponse]);

  // Filter change handler
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Limit change handler
  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      categoryId: "",
      gradeId: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Refresh handler for bulk actions
  const handleRefresh = () => {
    refetchQuizzes();
  };

  // Show loading state
  if (quizzesLoading) {
    return <LoadingSkeleton />;
  }

  // Handle errors
  if (quizzesError) {
    return (
      <div className="mx-auto py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading quizzes: {quizzesError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Determine which data to use
  let quizzesData;

  if (quizzesResponse?.quizzes) {
    quizzesData = {
      quizzes: (quizzesResponse.quizzes as any[]) || [],
      total: quizzesResponse.pagination.totalCount || 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: quizzesResponse.pagination.totalPages || 1,
    };
  } else {
    // No data available - show empty state message
    return (
      <Card className="w-full h-screen flex items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center py-12 h-fit">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">No quizzes yet</p>
            <p className="text-sm text-muted-foreground">
              No quizzes are available at the moment
            </p>
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage quizzes for your students
            </p>
          </div>
          <div className="flex items-center gap-2">
            <QuizControls
              filters={filters}
              pagination={pagination}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onClearFilters={handleClearFilters}
              categories={[]}
              grades={[]}
            />
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Link>
            </Button>
          </div>
        </div>

        {/* Quiz Count */}
        <div className="text-sm text-muted-foreground">
          {quizzesData.total} quiz{quizzesData.total !== 1 ? "es" : ""} found
        </div>
      </div>

      {/* Quizzes Display */}
      <div>
        <Suspense fallback={<LoadingSkeleton />}>
          <QuizPageClient
            quizzes={quizzesData.quizzes}
            onPageChange={handlePageChange}
            onPageSizeChange={handleLimitChange}
            canEdit={true}
            onRefresh={handleRefresh}
          />
        </Suspense>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t mt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => handleLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">entries</span>
          </div>

          <span className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-gray-700 px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-muted/30 p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <TableSkeleton />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="ml-auto h-8 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <div className="h-[500px] p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
