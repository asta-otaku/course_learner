"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { QuestionsWithFolders } from "@/components/resourceManagemement/questions/questions-with-folders";
import { QuestionsFilter } from "@/components/resourceManagemement/questions/questions-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useGetFolderById, useGetQuestions } from "@/lib/api/queries";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];

export default function QuestionsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Filter state management
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    difficultyMin: "",
    difficultyMax: "",
    dateFrom: "",
    dateTo: "",
    folderId: "",
    sortBy: "",
    sortOrder: "",
  });

  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Pagination state management
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 200,
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
    if (filters.type !== "all") options.type = filters.type;
    if (filters.difficultyMin)
      options.difficultyMin = Number(filters.difficultyMin);
    if (filters.difficultyMax)
      options.difficultyMax = Number(filters.difficultyMax);
    if (filters.dateFrom) options.dateFrom = filters.dateFrom;
    if (filters.dateTo) options.dateTo = filters.dateTo;
    // Only include folderId in query options if we're not using folder-specific data
    if (selectedFolderId) options.folderId = selectedFolderId;
    if (filters.sortBy) options.sortBy = filters.sortBy;
    if (filters.sortOrder) options.sortOrder = filters.sortOrder;

    return options;
  }, [filters, pagination.page, pagination.limit, selectedFolderId]);

  // Use React Query hook with computed query options
  // Disable questions query when viewing a specific folder
  const {
    data: questionsResponse,
    error: questionsError,
    isLoading: questionsLoading,
  } = useGetQuestions(selectedFolderId ? undefined : queryOptions);
  const {
    data: foldersResponse,
    error: folderError,
    isLoading: folderLoading,
  } = useGetFolderById(selectedFolderId || "");

  // Update pagination when data changes
  useEffect(() => {
    if (selectedFolderId && foldersResponse?.data?.questions) {
      // When viewing a specific folder, use folder questions
      const folderQuestions = foldersResponse.data.questions;
      setPagination((prev) => ({
        ...prev,
        total: folderQuestions.length,
        totalPages: Math.ceil(folderQuestions.length / prev.limit),
        hasNextPage: prev.page < Math.ceil(folderQuestions.length / prev.limit),
        hasPreviousPage: prev.page > 1,
      }));
    } else if (questionsResponse?.pagination) {
      // When viewing all questions, use regular pagination
      setPagination((prev) => ({
        ...prev,
        total: questionsResponse.pagination.totalCount || 0,
        totalPages: questionsResponse.pagination.totalPages || 1,
        hasNextPage: questionsResponse.pagination.hasNextPage || false,
        hasPreviousPage: questionsResponse.pagination.hasPreviousPage || false,
      }));
    }
  }, [questionsResponse, foldersResponse, selectedFolderId]);

  // Filter change handler
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    // If folderId is being changed, also update selectedFolderId
    if (key === "folderId") {
      setSelectedFolderId(value || null);
    }

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
      type: "all",
      difficultyMin: "",
      difficultyMax: "",
      dateFrom: "",
      dateTo: "",
      folderId: "",
      sortBy: "",
      sortOrder: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Folder selection handler
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    // Also update the filters state to keep them in sync
    setFilters((prev) => ({ ...prev, folderId: folderId || "" }));
    // Reset to first page when folder changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        try {
          const userData = JSON.parse(localStorage.getItem("admin") || "{}");
          if (!userData || !userData.data) {
            router.push("/admin/sign-in");
            return;
          }

          const userRole = userData.data.userRole;
          if (userRole !== "teacher" && userRole !== "admin") {
            router.push("/admin/sign-in");
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error("Error:", error);
          router.push("/admin/sign-in");
          return;
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  // Show loading state
  if (
    (selectedFolderId && folderLoading) ||
    (!selectedFolderId && questionsLoading)
  ) {
    return <LoadingSkeleton />;
  }

  // Handle errors
  if (questionsError && !selectedFolderId) {
    return (
      <div className="mx-auto py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading questions:{" "}
            {questionsError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (folderError && selectedFolderId) {
    return (
      <div className="mx-auto py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading folder: {folderError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Determine which data to use
  let questionsData;

  if (selectedFolderId && foldersResponse?.data?.questions) {
    // Use folder questions when a folder is selected
    const folderQuestions = foldersResponse.data.questions;
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedQuestions = folderQuestions.slice(startIndex, endIndex);

    questionsData = {
      questions: paginatedQuestions,
      total: folderQuestions.length,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(folderQuestions.length / pagination.limit),
    };
  } else if (questionsResponse?.questions) {
    // Use regular questions when no folder is selected
    questionsData = {
      questions: (questionsResponse.questions as any[]) || [],
      total: questionsResponse.pagination.totalCount || 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: questionsResponse.pagination.totalPages || 1,
    };
  } else {
    // No data available
    return (
      <div className="mx-auto py-10">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">No questions data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto py-6">
      {/* Filter Button */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Questions</h1>
        <QuestionsFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Questions Display */}
      <div>
        <Suspense fallback={<LoadingSkeleton />}>
          <QuestionsWithFolders
            initialQuestions={questionsData.questions}
            totalPages={questionsData.totalPages}
            currentPage={questionsData.page}
            pageSize={questionsData.limit}
            totalItems={questionsData.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handleLimitChange}
            selectedFolderId={selectedFolderId}
            onFolderSelect={handleFolderSelect}
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

export function LoadingSkeleton() {
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

export function TableSkeleton() {
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
