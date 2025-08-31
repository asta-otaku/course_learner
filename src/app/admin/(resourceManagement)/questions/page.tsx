"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { QuestionsWithFolders } from "@/components/resourceManagemement/questions/questions-with-folders";
import QuestionControls from "@/components/resourceManagemement/questions/question-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useGetQuestions } from "@/lib/api/queries";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

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
    if (filters.type !== "all") options.type = filters.type;
    if (filters.difficultyMin)
      options.difficultyMin = Number(filters.difficultyMin);
    if (filters.difficultyMax)
      options.difficultyMax = Number(filters.difficultyMax);
    if (filters.dateFrom) options.dateFrom = filters.dateFrom;
    if (filters.dateTo) options.dateTo = filters.dateTo;
    if (filters.folderId) options.folderId = filters.folderId;
    if (filters.sortBy) options.sortBy = filters.sortBy;
    if (filters.sortOrder) options.sortOrder = filters.sortOrder;

    return options;
  }, [filters, pagination.page, pagination.limit]);

  // Use React Query hook with computed query options
  const { data: questionsResponse, error: questionsError } =
    useGetQuestions(queryOptions);

  // Update pagination when data changes
  useEffect(() => {
    if (questionsResponse?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: questionsResponse.pagination.totalCount || 0,
        totalPages: questionsResponse.pagination.totalPages || 1,
        hasNextPage: questionsResponse.pagination.hasNextPage || false,
        hasPreviousPage: questionsResponse.pagination.hasPreviousPage || false,
      }));
    }
  }, [questionsResponse]);

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

  if (questionsError) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading questions:{" "}
            {questionsError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!questionsResponse || !questionsResponse.questions) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">No questions data available</p>
        </div>
      </div>
    );
  }

  // Transform the data to match what QuestionsWithFolders expects
  const questionsData = {
    questions: (questionsResponse.questions as any[]) || [],
    total: questionsResponse.pagination.totalCount || 0,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: questionsResponse.pagination.totalPages || 1,
  };

  return (
    <div className="container mx-auto py-6">
      {/* Question Controls */}
      <QuestionControls
        filters={filters}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onClearFilters={handleClearFilters}
      />

      {/* Questions Display */}
      <div className="h-[calc(100vh-16rem)]">
        <Suspense fallback={<LoadingSkeleton />}>
          <QuestionsWithFolders
            initialQuestions={questionsData.questions}
            totalPages={questionsData.totalPages}
            currentPage={questionsData.page}
            pageSize={questionsData.limit}
            totalItems={questionsData.total}
          />
        </Suspense>
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
